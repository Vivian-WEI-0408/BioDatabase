const fs = require('fs/promises');
const path = require('path');
const { resolveTempPath } = require('../../lib/storagePaths');
const { prisma } = require('../db');
const { createUserFiles } = require('../userFileStore');
const { ENZYMES, cutEvents, simulateGoldenGate } = require('./goldenGate');
const { normalizeSequence, reverseComplement } = require('./sequence');
const { safeName, writeReports } = require('./artifacts');
const { PART_TYPE_BY_ID } = require('../datasetBrowseStore');
const { processPartSequence } = require('./partSequence');
const { determineTargetEnzyme, locateCcdb } = require('./targetEnzyme');

const PART_TYPES = Object.fromEntries(Object.entries(PART_TYPE_BY_ID).map(([id, label]) => [id, label.toLowerCase()]));

function numericIds(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(Number).filter(Number.isInteger))];
}

function names(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((item) => String(item).trim()).filter(Boolean))];
}

function missingReferences(values, rows, idField) {
  return (Array.isArray(values) ? values : []).filter((value) => {
    const text = String(value).trim();
    const numeric = Number(text);
    return !rows.some((row) =>
      (Number.isInteger(numeric) && row[idField] === numeric) || row.name === text);
  });
}

function wrapPart(sequence, enzyme, left, right) {
  if (cutEvents(sequence, enzyme).length >= 2) return sequence;
  if (!left || !right) throw new Error(`Part lacks ${enzyme} sites and requires both start and end scars`);
  const config = ENZYMES[enzyme];
  if (left.length !== config.bottom - config.top || right.length !== config.bottom - config.top) {
    throw new Error(`${enzyme} scars must contain ${config.bottom - config.top} bases`);
  }
  const spacer = 'A'.repeat(Math.max(1, config.top - config.site.length));
  return config.site + spacer + left.toUpperCase() + sequence + right.toUpperCase() + spacer + reverseComplement(config.site);
}

function containsEnzymeRecognitionSite(sequence, enzyme) {
  const config = ENZYMES[enzyme];
  if (!config) throw new Error(`Unsupported Type IIS enzyme: ${enzyme}`);
  const normalized = normalizeSequence(sequence);
  return normalized.includes(config.site) || normalized.includes(reverseComplement(config.site));
}

async function loadInputs(spec, enzymeHint) {
  const partIds = numericIds(spec.parts);
  const partNames = names(spec.parts).filter((item) => !/^\d+$/.test(item));
  const backboneIds = numericIds(spec.backbones);
  const backboneNames = names(spec.backbones).filter((item) => !/^\d+$/.test(item));
  const plasmidIds = numericIds(spec.plasmids);
  const plasmidNames = names(spec.plasmids).filter((item) => !/^\d+$/.test(item));
  const [parts, backbones, plasmids] = await Promise.all([
    prisma.partTable.findMany({ where: { deletedAt: null, OR: [{ partId: { in: partIds } }, { name: { in: partNames } }] }, include: { features: true } }),
    prisma.backboneTable.findMany({ where: { deletedAt: null, OR: [{ id: { in: backboneIds } }, { name: { in: backboneNames } }] }, include: { features: true } }),
    prisma.plasmidNeed.findMany({
      where: { deletedAt: null, OR: [{ plasmidId: { in: plasmidIds } }, { name: { in: plasmidNames } }] },
      include: { features: true },
    }),
  ]);
  const missingParts = missingReferences(spec.parts, parts, 'partId');
  const missingBackbones = missingReferences(spec.backbones, backbones, 'id');
  const missingPlasmids = missingReferences(spec.plasmids, plasmids, 'plasmidId');
  if (missingParts.length) throw new Error(`Parts do not exist: ${missingParts.join(', ')}`);
  if (missingBackbones.length) throw new Error(`Backbones do not exist: ${missingBackbones.join(', ')}`);
  if (missingPlasmids.length) throw new Error(`Plasmids do not exist: ${missingPlasmids.join(', ')}`);
  if (backbones.length > 1) throw new Error(`Assembly requires exactly one backbone; received ${backbones.length}: ${backbones.map((row) => row.name).join(', ')}`);
  if (backbones.length !== 1) throw new Error('Assembly requires exactly one backbone');

  const orderRows = (values, rows, idField) => (Array.isArray(values) ? values : []).map((value) => {
    const numeric = Number(value);
    return rows.find((row) => (Number.isInteger(numeric) && row[idField] === numeric) || row.name === String(value).trim());
  }).filter(Boolean);
  const orderedParts = orderRows(spec.parts, parts, 'partId');
  const orderedBackbones = orderRows(spec.backbones, backbones, 'id');
  const orderedPlasmids = orderRows(spec.plasmids, plasmids, 'plasmidId');
  const records = [
    ...orderedBackbones.map((row) => ({ id: `backbone:${row.id}`, entityId: row.id, name: row.name, kind: 'backbone', sequence: normalizeSequence(row.sequence), features: row.features })),
    ...orderedParts.map((row, index) => ({
      id: `part:${row.partId}`, entityId: row.partId, name: row.name, kind: 'part', partType: PART_TYPES[row.type] || String(row.type),
      sequence: normalizeSequence(row.level0Sequence), originalSequence: normalizeSequence(row.level0Sequence), features: row.features, source: row.sourceOrganism,
      startScar: String(spec.part_start_scar?.[index] || spec.scar?.[index]?.[0] || ''),
      endScar: String(spec.part_end_scar?.[index] || spec.scar?.[index]?.[1] || ''),
    })),
    ...orderedPlasmids.map((row) => ({
      id: `plasmid:${row.plasmidId}`, entityId: row.plasmidId, name: row.name, kind: 'plasmid',
      sequence: normalizeSequence(row.sequenceConfirm), features: row.features,
    })),
  ];
  const enzymeSelection = determineTargetEnzyme(orderedBackbones[0].sequence);
  const requested = enzymeHint && enzymeHint !== 'auto' ? enzymeHint : null;
  if (requested && requested.toLowerCase() !== enzymeSelection.enzyme.toLowerCase()) {
    throw new Error(`Requested enzyme ${requested} conflicts with backbone-selected enzyme ${enzymeSelection.enzyme}`);
  }
  const enzyme = enzymeSelection.enzyme;
  records[0].ccdb = enzymeSelection.ccdb;
  records.forEach((record) => { record.assemblyEnzyme = enzyme; });
  records.forEach((record) => {
    if (record.kind === 'part' && cutEvents(record.sequence, enzyme).length < 2) {
      // The legacy service only synthesizes adapters for BbsI/BsaI. Other
      // enzymes must already be present in the stored Level-0 sequence.
      if (['BbsI', 'BsaI'].includes(enzyme)) {
        const processed = processPartSequence({ sequence: record.sequence, type: record.partType, enzyme,
          source: record.source, alias: orderedParts.find((row) => row.partId === record.entityId)?.alias,
          name: record.name, startScar: record.startScar, endScar: record.endScar });
        record.featureCoordinateOffset = processed.indexOf(record.originalSequence);
        record.sequence = processed;
      }
    }
  });
  spec.parts = orderedParts.map((row) => row.partId);
  spec.backbones = orderedBackbones.map((row) => row.id);
  spec.plasmids = orderedPlasmids.map((row) => row.plasmidId);
  return { records, parts: orderedParts, backbones: orderedBackbones, plasmids: orderedPlasmids, enzyme, enzymeSelection };
}

function selectAssemblyFragments(record, fragments) {
  if (record.kind === 'backbone') {
    const dropout = fragments.filter((fragment) => fragment.sequence.includes(record.ccdb.sequence));
    const main = fragments.filter((fragment) => !fragment.sequence.includes(record.ccdb.sequence));
    if (dropout.length !== 1 || main.length !== 1) {
      const error = new Error(`${record.name} backbone main/dropout classification is ambiguous`);
      error.details = { dropout: dropout.map((item) => item.sequence.length), main: main.map((item) => item.sequence.length) };
      throw error;
    }
    main[0].role = 'backbone-main';
    dropout[0].role = 'backbone-dropout';
    return main;
  }
  if (record.kind === 'part' || record.kind === 'plasmid') {
    const main = fragments.filter((fragment) =>
      !containsEnzymeRecognitionSite(fragment.sequence, record.assemblyEnzyme));
    const nonMain = fragments.filter((fragment) =>
      containsEnzymeRecognitionSite(fragment.sequence, record.assemblyEnzyme));
    if (main.length !== 1) {
      const error = new Error(`${record.name} does not yield exactly one main fragment without ${record.assemblyEnzyme} recognition sites`);
      error.details = {
        record: record.name, kind: record.kind, enzyme: record.assemblyEnzyme,
        recognitionSite: ENZYMES[record.assemblyEnzyme]?.site,
        main: main.map((item) => item.sequence.length),
        nonMain: nonMain.map((item) => item.sequence.length),
      };
      throw error;
    }
    main[0].role = record.kind === 'part' ? 'part-main' : 'plasmid-main';
    nonMain.forEach((fragment) => { fragment.role = `${record.kind}-non-main`; });
    return main;
  }
  return [];
}

function scarCounts(sequence) {
  return Object.fromEntries(Object.keys(ENZYMES).map((enzyme) => [enzyme, cutEvents(sequence, enzyme).length]));
}

function circularSegments(start, length, totalLength) {
  const normalizedStart = ((start % totalLength) + totalLength) % totalLength;
  const firstLength = Math.min(length, totalLength - normalizedStart);
  const segments = [{ sourceStart: normalizedStart, sourceEnd: normalizedStart + firstLength, localStart: 0 }];
  if (length > firstLength) segments.push({ sourceStart: 0, sourceEnd: length - firstLength, localStart: firstLength });
  return segments;
}

function projectFeature(feature, fragment) {
  const sourceLength = normalizeSequence(fragment.source.sequence).length;
  if (!sourceLength) return [];
  const coordinateOffset = Number.isInteger(fragment.source.featureCoordinateOffset)
    ? fragment.source.featureCoordinateOffset : 0;
  let featureStart = Number(feature.featureStart) + coordinateOffset;
  let featureEnd = Number(feature.featureEnd) + coordinateOffset;
  if (!Number.isFinite(featureStart) || !Number.isFinite(featureEnd) || featureEnd <= featureStart) return [];
  featureStart = Math.max(0, Math.trunc(featureStart));
  featureEnd = Math.min(sourceLength, Math.trunc(featureEnd));
  if (featureEnd <= featureStart) return [];

  return circularSegments(fragment.start, fragment.sequence.length, sourceLength).flatMap((segment) => {
    const start = Math.max(featureStart, segment.sourceStart);
    const end = Math.min(featureEnd, segment.sourceEnd);
    if (end <= start) return [];
    return [{
      start: segment.localStart + start - segment.sourceStart,
      end: segment.localStart + end - segment.sourceStart,
    }];
  });
}

function buildAssemblyFeatures(fragments) {
  const result = [];
  let assemblyOffset = 0;
  for (const fragment of fragments) {
    // Backbone contributes its internal annotations only. Parts and plasmids
    // additionally receive one annotation spanning their complete main fragment.
    if (fragment.kind === 'part' || fragment.kind === 'plasmid') {
      result.push({
        start: assemblyOffset,
        end: assemblyOffset + fragment.sequence.length,
        type: 'misc_feature',
        label: fragment.recordName,
        color: '',
        apeInfo: '',
        sourceKind: fragment.kind,
        scope: 'record',
      });
    }
    for (const feature of fragment.source.features || []) {
      for (const projected of projectFeature(feature, fragment)) {
        result.push({
          start: assemblyOffset + projected.start,
          end: assemblyOffset + projected.end,
          type: feature.featureType || 'misc_feature',
          label: feature.featureLabel || '',
          color: feature.featureColor || '',
          apeInfo: feature.featureApeinfo || feature.featureColor || '',
          sourceKind: fragment.kind,
          scope: 'internal',
        });
      }
    }
    assemblyOffset += fragment.sequence.length;
  }
  return result;
}

async function persistPlasmid(userId, name, metadata, result) {
  const shortName = safeName(name).slice(0, 20);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.plasmidNeed.findFirst({ where: { name: shortName, deletedAt: null } });
    if (existing) throw new Error(`Plasmid name already exists: ${shortName}`);
    const plasmid = await tx.plasmidNeed.create({ data: {
      name: shortName, alias: String(metadata.alias || '').slice(0, 500), level: String(metadata.level || 3),
      length: result.sequence.length, sequenceConfirm: result.sequence, state: 1,
      user: String(userId), note: String(metadata.note || '').slice(0, 500),
      customParentInformation: JSON.stringify({ parts: metadata.parts, backbones: metadata.backbones, plasmids: metadata.plasmids }),
    } });
    const scars = scarCounts(result.sequence);
    await tx.plasmidScarTable.create({ data: {
      plasmidId: plasmid.plasmidId, bsmbi: String(scars.BsmBI), bsai: String(scars.BsaI),
      bbsi: String(scars.BbsI), aari: String(scars.AarI), sapi: String(scars.SapI),
    } });
    const partIds = numericIds(metadata.parts);
    const backboneIds = numericIds(metadata.backbones);
    const parentPlasmidIds = numericIds(metadata.plasmids);
    if (partIds.length) await tx.parentPartTable.createMany({ data: partIds.map((parentPartId) => ({ parentPartId, sonPlasmidId: plasmid.plasmidId })) });
    if (backboneIds.length) await tx.parentBackboneTable.createMany({ data: backboneIds.map((parentBackboneId) => ({ parentBackboneId, sonPlasmidId: plasmid.plasmidId })) });
    if (parentPlasmidIds.length) await tx.parentPlasmidTable.createMany({ data: parentPlasmidIds.map((parentPlasmidId) => ({ parentPlasmidId, sonPlasmidId: plasmid.plasmidId })) });
    if (result.features?.length) {
      await tx.plasmidFeatureTable.createMany({ data: result.features.map((feature) => ({
        plasmidId: plasmid.plasmidId,
        featureStart: feature.start,
        featureEnd: feature.end,
        featureType: String(feature.type || 'misc_feature').slice(0, 50),
        featureLabel: String(feature.label || '').slice(0, 50),
        featureColor: String(feature.color || '').slice(0, 50),
        featureApeinfo: String(feature.apeInfo || feature.color || '').slice(0, 50),
      })) });
    }
    return plasmid;
  });
}

async function runAssembly(userId, taskId, spec) {
  const name = String(spec.name || spec.uuid || `assembly-${taskId}`).trim();
  const loaded = await loadInputs(spec, spec.enzyme || 'auto');
  const result = simulateGoldenGate(loaded.records, loaded.enzyme, { selectFragments: selectAssemblyFragments });
  result.features = buildAssemblyFeatures(result.fragments);
  if (locateCcdb(result.sequence)) throw new Error('Assembly validation failed: ccdB dropout remains in the product');
  const remainingSites = cutEvents(result.sequence, loaded.enzyme).length;
  if (remainingSites) throw new Error(`Assembly validation failed: product still contains ${remainingSites} ${loaded.enzyme} cut site(s)`);
  const tempRoot = resolveTempPath('assembly', String(taskId));
  const outputDir = path.join(tempRoot, safeName(name));
  const files = await writeReports(outputDir, name, result);
  const plasmid = await persistPlasmid(userId, name, spec, result);
  const uploadItems = [];
  for (const filePath of Object.values(files)) {
    const stat = await fs.stat(filePath);
    uploadItems.push({ path: filePath, originalname: path.basename(filePath), filename: path.basename(filePath), size: stat.size, mimetype: filePath.endsWith('.pdf') ? 'application/pdf' : filePath.endsWith('.zip') ? 'application/zip' : 'application/octet-stream' });
  }
  const stored = await createUserFiles(userId, uploadItems);
  await fs.rm(tempRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(() => {});
  return {
    success: true, enzyme: result.enzyme, length: result.sequence.length,
    plasmidId: plasmid.plasmidId, plasmidName: plasmid.name,
    files: stored.files,
    downloadFileId: stored.files.find((file) => file.extension === '.gb')?.id,
    archiveFileId: stored.files.find((file) => file.extension === '.zip')?.id,
  };
}

module.exports = { buildAssemblyFeatures, containsEnzymeRecognitionSite, loadInputs, persistPlasmid, projectFeature, runAssembly, scarCounts, selectAssemblyFragments, wrapPart };
