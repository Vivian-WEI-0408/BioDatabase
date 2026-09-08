const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DatasetImportError,
  featureRows,
  importParsedDatasetResults,
} = require('../src/services/datasetImportStore');

function createFakePrisma() {
  const calls = [];
  let nextId = 10;
  const model = (name, idField) => ({
    async findFirst() {
      return null;
    },
    async create({ data }) {
      calls.push({ model: name, action: 'create', data });
      nextId += 1;
      return { ...data, [idField]: nextId };
    },
    async createMany({ data }) {
      calls.push({ model: name, action: 'createMany', data });
      return { count: data.length };
    },
    async upsert({ data }) {
      calls.push({ model: name, action: 'upsert', data });
      nextId += 1;
      return { ...data, [idField]: nextId };
    },
    async update({ data, where }) {
      calls.push({ model: name, action: 'update', data, where });
      return { ...data, ...where };
    },
    async deleteMany({ where }) {
      calls.push({ model: name, action: 'deleteMany', where });
      return { count: 1 };
    },
  });
  const tx = {
    partTable: model('partTable', 'partId'),
    partScarTable: model('partScarTable', 'partScarId'),
    partFeatureTable: model('partFeatureTable', 'pfid'),
    backboneTable: model('backboneTable', 'id'),
    backboneScarTable: model('backboneScarTable', 'backboneScarId'),
    backboneCultureFunction: model('backboneCultureFunction', 'bcfid'),
    backboneFeatureTable: model('backboneFeatureTable', 'bfif'),
    plasmidNeed: model('plasmidNeed', 'plasmidId'),
    plasmidScarTable: model('plasmidScarTable', 'plasmidScarId'),
    plasmidCultureFunction: model('plasmidCultureFunction', 'pcfid'),
    plasmidFeatureTable: model('plasmidFeatureTable', 'pfid'),
  };
  return {
    calls,
    async $transaction(callback) {
      return callback(tx);
    },
  };
}

function parserResult(data) {
  return {
    status: 'completed',
    result: { results: [{ success: true, data }] },
  };
}

test('featureRows maps parser coordinates and truncates legacy varchar fields', () => {
  const rows = featureRows([{
    start_position: 1,
    end_position: 9,
    feature_type: 'CDS',
    label: 'x'.repeat(80),
    color: '#fff',
    ape_info: '#000',
  }], 'partId', 7);
  assert.deepEqual(rows[0], {
    partId: 7,
    featureStart: 1,
    featureEnd: 9,
    featureType: 'CDS',
    featureLabel: 'x'.repeat(50),
    featureColor: '#fff',
    featureApeinfo: '#000',
  });
});

test('imports part main, scar, and feature records in one transaction', async () => {
  const prismaClient = createFakePrisma();
  const imported = await importParsedDatasetResults({
    datasetType: 'part',
    parserResult: parserResult({
      name: 'P1',
      Level0Sequence: 'ATGC',
      type: 'promoter',
      feature: [{ start_position: 0, end_position: 4, feature_type: 'promoter', label: 'P1' }],
    }),
    saveFeature: true,
    user: { name: 'Alice', email: 'alice@example.com' },
    prismaClient,
  });
  assert.equal(imported[0].datasetType, 'part');
  assert.deepEqual(prismaClient.calls.map((call) => call.model), [
    'partTable', 'partScarTable', 'partFeatureTable',
  ]);
  assert.equal(prismaClient.calls[0].data.lengthInLevel0, 4);
  assert.equal(prismaClient.calls[0].data.user, 'Alice');
});

test('imports backbone culture functions and optionally skips features', async () => {
  const prismaClient = createFakePrisma();
  await importParsedDatasetResults({
    datasetType: 'backbone',
    parserResult: parserResult({
      name: 'B1', sequence: 'ATGC', ori: ['ori1'], marker: ['ampR'], feature: [{}],
    }),
    saveFeature: false,
    user: { email: 'owner@example.com' },
    prismaClient,
  });
  assert.deepEqual(prismaClient.calls.map((call) => call.model), [
    'backboneTable', 'backboneScarTable', 'backboneCultureFunction',
  ]);
  assert.equal(prismaClient.calls[2].data.length, 2);
});

test('imports plasmid and reports duplicate names clearly', async () => {
  const prismaClient = createFakePrisma();
  await importParsedDatasetResults({
    datasetType: 'plasmid',
    parserResult: parserResult({ name: 'P1', sequence: 'ATGC' }),
    user: { name: 'Alice' },
    prismaClient,
  });
  assert.equal(prismaClient.calls[0].model, 'plasmidNeed');
  assert.equal(prismaClient.calls[0].data.level, '');

  const duplicateClient = {
    async $transaction() {
      const error = new Error('duplicate');
      error.code = 'P2002';
      throw error;
    },
  };
  await assert.rejects(
    importParsedDatasetResults({
      datasetType: 'plasmid',
      parserResult: parserResult({ name: 'P1', sequence: 'ATGC' }),
      user: { name: 'Alice' },
      prismaClient: duplicateClient,
    }),
    (error) => error instanceof DatasetImportError
      && error.message === 'A record with the same name already exists',
  );
});
