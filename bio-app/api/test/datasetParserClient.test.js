const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs/promises');
const { parseDatasetUploadHttp } = require('../src/services/datasetParserClient');

for (const datasetType of ['part', 'backbone', 'plasmid']) {
  test(`${datasetType} parser receives original filenames, not staging prefixes`, async (t) => {
    const names = ['BIOtmp-7529-fd6d4b73.gbk', 'BIOtmp-7486-509b5b10.gbk', '1_real-name.gbk'];
    const files = names.map((originalName, index) => ({
      originalName,
      name: `${index + 1}_${originalName}`,
      path: `staging/${index + 1}_${originalName}`,
    }));
    const readPaths = [];
    t.mock.method(fs, 'readFile', async (filePath) => {
      readPaths.push(filePath);
      return Buffer.from('test sequence');
    });
    t.mock.method(globalThis, 'fetch', async (_url, options) => {
      assert.equal(options.method, 'POST');
      assert.equal(options.body.get('type'), datasetType);
      assert.equal(options.body.get('save_feature'), 'true');
      const uploaded = options.body.getAll('files');
      assert.deepEqual(uploaded.map(file => file.name), names);
      assert.equal(await uploaded[0].text(), 'test sequence');
      return { ok: true, json: async () => ({ success: true, results: [] }) };
    });
    await parseDatasetUploadHttp({ datasetType, saveFeature: true, files });
    assert.deepEqual(readPaths, files.map(file => file.path));
    assert.equal(globalThis.fetch.mock.callCount(), 1);
  });
}

test('parser retains filename fallback for callers without originalName', async (t) => {
  t.mock.method(fs, 'readFile', async () => Buffer.from('test sequence'));
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.deepEqual(options.body.getAll('files').map(file => file.name), ['explicit.gbk', 'basename.gbk']);
    return { ok: true, json: async () => ({ success: true, results: [] }) };
  });
  await parseDatasetUploadHttp({
    datasetType: 'plasmid',
    files: [{ name: 'explicit.gbk', path: 'staging/file.gbk' }, { path: 'staging/basename.gbk' }],
  });
  assert.equal(globalThis.fetch.mock.callCount(), 1);
});
