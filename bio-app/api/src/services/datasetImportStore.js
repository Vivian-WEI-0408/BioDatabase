const { prisma } = require('./db');

const PART_TYPE_IDS = Object.freeze({
  promoter: 1,
  cds: 2,
  terminator: 3,
  rbs: 4,
  'p+r': 5,
});

class DatasetImportError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatasetImportError';
  }
}

function requiredString(value, fieldName) {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    throw new DatasetImportError(`Parsed record is missing ${fieldName}`);
  }
  return normalized;
}

function limitedString(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function scarData(data) {
  return {
    bsmbi: String(data.bsmbi ?? ''),
    bsai: String(data.bsai ?? ''),
    bbsi: String(data.bbsi ?? ''),
    aari: String(data.aari ?? ''),
    sapi: String(data.sapi ?? ''),
  };
}

function featureRows(features, parentField, parentId) {
  if (!Array.isArray(features)) {
    return [];
  }

  return features.map((feature) => ({
    [parentField]: parentId,
    featureStart: Number.parseInt(feature.start_position, 10) || 0,
    featureEnd: Number.parseInt(feature.end_position, 10) || 0,
    featureType: limitedString(feature.feature_type, 50),
    featureLabel: limitedString(feature.label, 50),
    featureColor: limitedString(feature.color, 50),
    featureApeinfo: limitedString(feature.ape_info ?? feature.color, 50),
  }));
}

function cultureRows(values, parentField, parentId) {
  const rows = [];
  for (const [functionType, items] of [['ori', values.ori], ['marker', values.marker]]) {
    const uniqueItems = [...new Set(
      (Array.isArray(items) ? items : [])
        .map((item) => String(item ?? '').trim())
        .filter(Boolean),
    )];
    for (const functionContent of uniqueItems) {
      rows.push({
        [parentField]: parentId,
        functionType,
        functionContent,
      });
    }
  }
  return rows;
}

async function importPart(tx, data, context) {
  const sequence = requiredString(data.Level0Sequence ?? data.level0Sequence, 'Level0Sequence');
  const typeLabel = String(data.type ?? 'promoter').trim().toLowerCase();
  const type = PART_TYPE_IDS[typeLabel];
  if (!type) {
    throw new DatasetImportError(`Unsupported part type: ${data.type}`);
  }
  const name = limitedString(requiredString(data.name, 'name'), 100);
  const existing = await tx.partTable.findFirst({ where: { name } });
  if (existing && context.conflictPolicy === 'skip') return { id: existing.partId, name, datasetType: 'part', action: 'skipped' };
  if (existing && context.conflictPolicy !== 'update') throw new DatasetImportError('A record with the same name already exists');

  const record = existing ? await tx.partTable.update({ where: { partId: existing.partId }, data: {
    lengthInLevel0: sequence.length, level0Sequence: sequence, confirmedSequence: sequence, type,
    alias: limitedString(data.alias, 100) || null, sourceOrganism: limitedString(data.sourceOrganism ?? data.species, 65535) || null,
    note: limitedString(data.note, 65535) || null, updateDate: context.now, deletedAt: null, syncStatus: 'active',
  } }) : await tx.partTable.create({
    data: {
      name,
      lengthInLevel0: sequence.length,
      level0Sequence: sequence,
      confirmedSequence: sequence,
      type,
      alias: limitedString(data.alias, 100) || null,
      sourceOrganism: limitedString(data.sourceOrganism ?? data.species, 65535) || null,
      note: limitedString(data.note, 65535) || null,
      user: limitedString(context.userLabel, 50),
      uploadDate: context.now,
      updateDate: context.now,
    },
  });

  await tx.partScarTable.upsert({
    where: { partId: record.partId }, update: scarData(data), create: { ...scarData(data), partId: record.partId },
  });

  const features = context.saveFeature
    ? featureRows(data.feature, 'partId', record.partId)
    : [];
  if (features.length > 0) {
    if (existing) await tx.partFeatureTable.deleteMany({ where: { partId: record.partId } });
    await tx.partFeatureTable.createMany({ data: features });
  }

  return { id: record.partId, name: record.name, datasetType: 'part', action: existing ? 'updated' : 'created' };
}

async function importBackbone(tx, data, context) {
  const sequence = requiredString(data.sequence, 'sequence');
  const name = limitedString(requiredString(data.name, 'name'), 20);
  const existing = await tx.backboneTable.findFirst({ where: { name } });
  if (existing && context.conflictPolicy === 'skip') return { id: existing.id, name, datasetType: 'backbone', action: 'skipped' };
  if (existing && context.conflictPolicy !== 'update') throw new DatasetImportError('A record with the same name already exists');
  const record = existing ? await tx.backboneTable.update({ where: { id: existing.id }, data: {
    length: sequence.length, sequence, species: limitedString(data.species ?? data.sourceOrganism, 50) || null,
    notes: limitedString(data.notes ?? data.note, 65535) || null, alias: limitedString(data.alias, 500) || null, updateDate: context.now, deletedAt: null, syncStatus: 'active',
  } }) : await tx.backboneTable.create({
    data: {
      name,
      length: sequence.length,
      sequence,
      species: limitedString(data.species ?? data.sourceOrganism, 50) || null,
      notes: limitedString(data.notes ?? data.note, 65535) || null,
      alias: limitedString(data.alias, 500) || null,
      user: limitedString(context.userLabel, 50),
      uploadDate: context.now,
      updateDate: context.now,
    },
  });

  await tx.backboneScarTable.upsert({
    where: { backboneId: record.id }, update: scarData(data), create: { ...scarData(data), backboneId: record.id },
  });

  const cultures = cultureRows(data, 'backboneId', record.id);
  if (cultures.length > 0) {
    if (existing) await tx.backboneCultureFunction.deleteMany({ where: { backboneId: record.id } });
    await tx.backboneCultureFunction.createMany({ data: cultures });
  }
  const features = context.saveFeature
    ? featureRows(data.feature, 'backboneId', record.id)
    : [];
  if (features.length > 0) {
    if (existing) await tx.backboneFeatureTable.deleteMany({ where: { backboneId: record.id } });
    await tx.backboneFeatureTable.createMany({ data: features });
  }

  return { id: record.id, name: record.name, datasetType: 'backbone', action: existing ? 'updated' : 'created' };
}

async function importPlasmid(tx, data, context) {
  const sequence = requiredString(data.sequence, 'sequence');
  const name = limitedString(requiredString(data.name, 'name'), 20);
  const existing = await tx.plasmidNeed.findFirst({ where: { name } });
  if (existing && context.conflictPolicy === 'skip') return { id: existing.plasmidId, name, datasetType: 'plasmid', action: 'skipped' };
  if (existing && context.conflictPolicy !== 'update') throw new DatasetImportError('A record with the same name already exists');
  const record = existing ? await tx.plasmidNeed.update({ where: { plasmidId: existing.plasmidId }, data: {
    level: limitedString(data.level, 10), length: sequence.length, sequenceConfirm: sequence,
    note: limitedString(data.note, 500) || null, alias: limitedString(data.alias, 500) || null,
    customParentInformation: limitedString(data.customParentInformation, 65535) || null, updateDate: context.now, deletedAt: null, syncStatus: 'active',
  } }) : await tx.plasmidNeed.create({
    data: {
      name,
      level: limitedString(data.level, 10),
      length: sequence.length,
      sequenceConfirm: sequence,
      note: limitedString(data.note, 500) || null,
      alias: limitedString(data.alias, 500) || null,
      customParentInformation: limitedString(data.customParentInformation, 65535) || null,
      user: limitedString(context.userLabel, 100),
      uploadDate: context.now,
      updateDate: context.now,
    },
  });

  await tx.plasmidScarTable.upsert({
    where: { plasmidId: record.plasmidId }, update: scarData(data), create: { ...scarData(data), plasmidId: record.plasmidId },
  });

  const cultures = cultureRows(data, 'plasmidId', record.plasmidId);
  if (cultures.length > 0) {
    if (existing) await tx.plasmidCultureFunction.deleteMany({ where: { plasmidId: record.plasmidId } });
    await tx.plasmidCultureFunction.createMany({ data: cultures });
  }
  const features = context.saveFeature
    ? featureRows(data.feature, 'plasmidId', record.plasmidId)
    : [];
  if (features.length > 0) {
    if (existing) await tx.plasmidFeatureTable.deleteMany({ where: { plasmidId: record.plasmidId } });
    await tx.plasmidFeatureTable.createMany({ data: features });
  }

  return { id: record.plasmidId, name: record.name, datasetType: 'plasmid', action: existing ? 'updated' : 'created' };
}

async function importParsedDatasetResults({
  datasetType,
  parserResult,
  saveFeature = false,
  conflictPolicy = '',
  user,
  prismaClient = prisma,
}) {
  const results = parserResult?.result?.results;
  if (!Array.isArray(results) || results.length === 0) {
    throw new DatasetImportError('Parser returned no records to import');
  }

  const parsedRecords = results.map((item) => {
    if (!item || item.success !== true || !item.data || typeof item.data !== 'object') {
      throw new DatasetImportError(item?.message || 'Parser returned an invalid record');
    }
    return item.data;
  });

  const importRecord = {
    part: importPart,
    backbone: importBackbone,
    plasmid: importPlasmid,
  }[datasetType];
  if (!importRecord) {
    throw new DatasetImportError(`Unsupported dataset type: ${datasetType}`);
  }

  const userLabel = String(user?.name || user?.email || `user-${user?.id || 'unknown'}`).trim();
  const context = { userLabel, saveFeature: Boolean(saveFeature), conflictPolicy, now: new Date() };

  try {
    return await prismaClient.$transaction(async (tx) => {
      const imported = [];
      for (const data of parsedRecords) {
        imported.push(await importRecord(tx, data, context));
      }
      return imported;
    }, { maxWait: 10000, timeout: 300000 });
  } catch (error) {
    if (error instanceof DatasetImportError) {
      throw error;
    }
    if (error?.code === 'P2002') {
      throw new DatasetImportError('A record with the same name already exists');
    }
    throw error;
  }
}

module.exports = {
  DatasetImportError,
  featureRows,
  importParsedDatasetResults,
};
