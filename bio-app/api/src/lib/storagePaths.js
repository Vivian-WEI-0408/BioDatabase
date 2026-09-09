const path = require('path');

const API_ROOT = path.resolve(__dirname, '../..');

function resolveDataRoot() {
  return path.resolve(process.env.BIOAPP_DATA_DIR || path.join(API_ROOT, 'res'));
}

function resolveTempRoot() {
  return path.resolve(process.env.BIOAPP_TEMP_DIR || path.join(API_ROOT, 'tmp'));
}

function resolveDataPath(...segments) {
  return path.join(resolveDataRoot(), ...segments);
}

function resolveTempPath(...segments) {
  return path.join(resolveTempRoot(), ...segments);
}

module.exports = { resolveDataPath, resolveDataRoot, resolveTempPath, resolveTempRoot };
