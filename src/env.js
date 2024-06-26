/**
 * Canvas Server *single-user* env bootstrap
 */

// Utils
const path = require('path');
const fs = require('fs');
const os = require('os');
const pkg = require('./package.json');
const device = require('./managers/device').getCurrentDevice();


/**
 * System directories
 *
 * SERVER_ROOT
 * ├── src
 * ├── home     || ~/.canvas        || Canvas/Server
 * ├── data     || ~/.canvas/data   || Canvas/Server/data
 * ├── config   || ~/.canvas/config || Canvas/Server/config
 * ├── var      || ~/.canvas/var    || Canvas/Server/var
 * |   ├── log
 * |   ├── run
 */

const SERVER_ROOT = path.dirname(path.resolve(__dirname));
const SERVER_SRC = path.join(SERVER_ROOT, 'src');
var SERVER_CONFIG = process.env['CANVAS_SERVER_CONFIG'] || path.join(SERVER_ROOT, 'config');
var SERVER_HOME = process.env['CANVAS_SERVER_HOME'] || path.join(SERVER_ROOT, 'user');
var SERVER_DATA = process.env['CANVAS_SERVER_DATA'] || path.join(SERVER_ROOT, 'data');
var SERVER_VAR = process.env['CANVAS_SERVER_VAR'] || path.join(SERVER_ROOT, 'var');

// Hack for seamless local development
if (fs.existsSync(path.join(SERVER_HOME, '.ignore'))) {
    SERVER_HOME = path.join(os.homedir(), '.canvas');
    SERVER_CONFIG = path.join(SERVER_HOME, 'config');
    SERVER_DATA = path.join(SERVER_HOME, 'data');
    SERVER_VAR = path.join(SERVER_HOME, 'var');
}

// Collect all ENV constants
const env = {
    FILE: path.join(SERVER_ROOT, '.env'),

    SERVER: {
        appName: (pkg.productName) ? pkg.productName : pkg.name,
        version: pkg.version,
        description: pkg.description,
        license: pkg.license,
        paths: {
            root: SERVER_ROOT,
            src: SERVER_SRC,
            config: SERVER_CONFIG,
            home: SERVER_HOME,
            data: SERVER_DATA,
            var: SERVER_VAR,
        },
    },

    DEVICE: {
        id: device.id,
        endianness: device.endianness,
        type: device.type,
        os: device.os,
        network: device.network,
    },

    PID: path.join(SERVER_VAR, 'run', 'canvas-server.pid'),
    IPC: (process.platform === 'win32') ?
        path.join('\\\\?\\pipe', process.cwd(), pkg.name) :
        path.join(SERVER_VAR, 'run', 'canvas-server.sock'),

};

// Generate a .env ini file
const INI = {
    // Server
    CANVAS_SERVER_APP_NAME: env.SERVER.name,
    CANVAS_SERVER_APP_VERSION: env.SERVER.version,
    CANVAS_SERVER_APP_DESCRIPTION: env.SERVER.description,
    CANVAS_SERVER_APP_LICENSE: env.SERVER.license,

    CANVAS_SERVER_ROOT: env.SERVER.paths.root,
    CANVAS_SERVER_SRC: env.SERVER.paths.src,
    CANVAS_SERVER_CONFIG: env.SERVER.paths.config,
    CANVAS_SERVER_HOME: env.SERVER.paths.home,
    CANVAS_SERVER_DATA: env.SERVER.paths.data,
    CANVAS_SERVER_VAR: env.SERVER.paths.var,

    // Server runtime
    CANVAS_SERVER_PID: env.PID,
    CANVAS_SERVER_IPC: env.IPC,

    // Developer settings
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
};

// Update .env to-be read by external server roles
generateDotenvFile(INI, env.FILE);

// Update process env vars
// We could just run require('dotenv').config() at this point
process.title = `${pkg.productName} | v${pkg.version}`;
Object.assign(process.env, {...INI});


/**
 * Exports
 */

module.exports = env;


/**
 * Utils
 */

function generateDotenvFile(iniVars, filePath) {
    let iniContent = '';
    Object.keys(iniVars).forEach((key) => {
        let value = iniVars[key];
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        iniContent += `${key}="${value}"\n`;
    });
    fs.writeFileSync(filePath, iniContent);
}
