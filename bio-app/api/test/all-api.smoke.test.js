const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const API_ROOT = path.resolve(__dirname, '../src');
const ROUTES_ROOT = path.join(API_ROOT, 'routes');
const BASE_URL = String(process.env.BIO_API_BASE_URL || 'http://127.0.0.1:9092').replace(/\/+$/, '');
const TOKEN = String(process.env.BIO_API_TOKEN || '').trim();
const TIMEOUT_MS = Number(process.env.BIO_API_TEST_TIMEOUT_MS) || 15000;

function discoverMounts() {
  const server = fs.readFileSync(path.join(API_ROOT, 'server.js'), 'utf8');
  const imports = new Map();
  for (const match of server.matchAll(/const\s+(\w+)\s*=\s*require\(['"]\.\/routes\/([^'"]+)['"]\)/g)) {
    imports.set(match[1], match[2]);
  }
  const mounts = [];
  for (const match of server.matchAll(/app\.use\(['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g)) {
    const routeFile = imports.get(match[2]);
    if (routeFile) mounts.push({ prefix: match[1], routeFile });
  }
  return mounts;
}

function joinPath(prefix, routePath) {
  const joined = `${prefix}/${routePath}`.replace(/\/{2,}/g, '/');
  return joined.length > 1 ? joined.replace(/\/$/, '') : joined;
}

function concretePath(routePath) {
  return routePath.replace(/:([A-Za-z0-9_]+)/g, (_, name) =>
    /id/i.test(name) ? '0' : `smoke-${name.toLowerCase()}`);
}

function discoverEndpoints() {
  const endpoints = [{ method: 'GET', path: '/health', source: 'src/server.js' }];
  for (const mount of discoverMounts()) {
    const filename = path.join(ROUTES_ROOT, `${mount.routeFile}.js`);
    const source = fs.readFileSync(filename, 'utf8');
    for (const match of source.matchAll(/router\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g)) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: joinPath(mount.prefix, match[2]),
        source: path.relative(path.resolve(__dirname, '..'), filename).replace(/\\/g, '/'),
      });
    }
  }
  return endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

async function request(method, requestPath) {
  const headers = { Accept: 'application/json' };
  if (TOKEN) headers.token = TOKEN;
  const options = { method, headers, signal: AbortSignal.timeout(TIMEOUT_MS) };
  if (!['GET', 'HEAD'].includes(method)) {
    headers['Content-Type'] = 'application/json';
    options.body = '{}';
  }
  const response = await fetch(`${BASE_URL}${requestPath}`, options);
  return { status: response.status, body: await response.text() };
}

test('every Express API route is registered and responds without an unhandled server error', async (t) => {
  const endpoints = discoverEndpoints();
  assert.ok(endpoints.length >= 100, `Only ${endpoints.length} endpoints were discovered`);

  const duplicateKeys = endpoints.map((item) => `${item.method} ${item.path}`)
    .filter((key, index, all) => all.indexOf(key) !== index);
  assert.deepEqual(duplicateKeys, [], `Duplicate routes: ${duplicateKeys.join(', ')}`);

  const missingResponse = await request('GET', '/__all_api_smoke_missing_route__');
  assert.equal(missingResponse.status, 404, 'The unknown-route probe should return HTTP 404');

  const failures = [];
  for (const endpoint of endpoints) {
    await t.test(`${endpoint.method} ${endpoint.path}`, async () => {
      try {
        const response = await request(endpoint.method, concretePath(endpoint.path));
        const isGlobalNotFound = response.status === missingResponse.status
          && response.body === missingResponse.body;
        assert.equal(isGlobalNotFound, false, `Route fell through to the global 404 handler (${endpoint.source})`);
        assert.ok(response.status < 500, `HTTP ${response.status}: ${response.body.slice(0, 500)}`);
      } catch (error) {
        failures.push(`${endpoint.method} ${endpoint.path}: ${error.message}`);
        throw error;
      }
    });
  }
  assert.deepEqual(failures, []);
});

