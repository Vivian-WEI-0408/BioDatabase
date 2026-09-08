const assert = require('node:assert/strict');
const path = require('path');
const test = require('node:test');

const { parseBatchExcelUpload } = require('../src/services/datasetBatchExcelStore');

const templatesDir = path.resolve(__dirname, '../../..', 'StaticFiles/templates');

test('reports empty template files clearly', async () => {
  await assert.rejects(
    parseBatchExcelUpload({
      path: path.join(templatesDir, 'part_template.xlsx'),
      name: 'part_template.xlsx',
    }),
    /Excel template contains no data rows/,
  );
});

test('rejects legacy .xls files with an actionable message', async () => {
  await assert.rejects(
    parseBatchExcelUpload({
      path: path.join(templatesDir, 'part_template.xlsx'),
      name: 'part_template.xls',
    }),
    /only supports \.xlsx/,
  );
});
