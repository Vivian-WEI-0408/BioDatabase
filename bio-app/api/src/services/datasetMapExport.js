const { prisma } = require('./db');

const DATASET_CONFIG = Object.freeze({
  part: {
    model: 'partTable',
    idField: 'partId',
    sequenceField: 'level0Sequence',
    topology: 'linear',
  },
  backbone: {
    model: 'backboneTable',
    idField: 'id',
    sequenceField: 'sequence',
    topology: 'circular',
  },
  plasmid: {
    model: 'plasmidNeed',
    idField: 'plasmidId',
    sequenceField: 'sequenceConfirm',
    topology: 'circular',
  },
});

function escapeQualifier(value) {
  return String(value ?? '').replace(/[\\"]/g, (character) => `\\${character}`).replace(/[\r\n]+/g, ' ');
}

function safeFilename(value, fallback = 'sequence') {
  return String(value || fallback).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 120) || fallback;
}

function genbankDate(date = new Date()) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${String(date.getUTCDate()).padStart(2, '0')}-${months[date.getUTCMonth()]}-${date.getUTCFullYear()}`;
}

function featureLocation(feature, sequenceLength) {
  const rawStart = Number(feature.featureStart);
  const rawEnd = Number(feature.featureEnd);
  // MapProcess stores Biopython's zero-based start and end-exclusive end.
  const start = Math.max(1, Math.min(sequenceLength, (Number.isFinite(rawStart) ? Math.trunc(rawStart) : 0) + 1));
  const end = Math.max(start, Math.min(sequenceLength, Number.isFinite(rawEnd) ? Math.trunc(rawEnd) : start));
  return `${start}..${end}`;
}

function buildGenbank({ name, sequence, features = [], topology = 'linear', datasetType }) {
  const normalizedSequence = String(sequence || '').replace(/\s+/g, '').toUpperCase();
  if (!normalizedSequence) throw new Error('Record has no sequence to download');
  if (!/^[A-Z*.-]+$/.test(normalizedSequence)) throw new Error('Record contains invalid sequence characters');

  const locusName = safeFilename(name).replace(/\s+/g, '_').slice(0, 16).padEnd(16);
  const featureLines = features.map((feature) => {
    const type = String(feature.featureType || 'misc_feature').replace(/\s+/g, '_').slice(0, 15) || 'misc_feature';
    const qualifiers = [];
    if (feature.featureLabel) qualifiers.push(`                     /label="${escapeQualifier(feature.featureLabel)}"`);
    if (feature.featureColor) qualifiers.push(`                     /color="${escapeQualifier(feature.featureColor)}"`);
    if (feature.featureApeinfo) qualifiers.push(`                     /ApEinfo_fwdcolor="${escapeQualifier(feature.featureApeinfo)}"`);
    return `     ${type.padEnd(16)}${featureLocation(feature, normalizedSequence.length)}${qualifiers.length ? `\n${qualifiers.join('\n')}` : ''}`;
  });
  const origin = normalizedSequence.toLowerCase().match(/.{1,60}/g).map((line, index) => (
    `${String(index * 60 + 1).padStart(9)} ${line.match(/.{1,10}/g).join(' ')}`
  )).join('\n');

  return `LOCUS       ${locusName} ${String(normalizedSequence.length).padStart(11)} bp    DNA     ${topology.padEnd(8)} SYN ${genbankDate()}\n`
    + `DEFINITION  ${escapeQualifier(name)} exported from bio-app (${datasetType}).\n`
    + 'ACCESSION   .\nVERSION     .\nKEYWORDS    .\nSOURCE      synthetic DNA construct\n'
    + '  ORGANISM  synthetic DNA construct\nFEATURES             Location/Qualifiers\n'
    + `     source          1..${normalizedSequence.length}\n                     /organism="synthetic DNA construct"\n                     /mol_type="other DNA"\n`
    + `${featureLines.length ? `${featureLines.join('\n')}\n` : ''}ORIGIN\n${origin}\n//\n`;
}

async function getDatasetMap(datasetType, id) {
  const config = DATASET_CONFIG[datasetType];
  const recordId = Number(id);
  if (!config || !Number.isInteger(recordId) || recordId <= 0) return null;
  const row = await prisma[config.model].findFirst({
    where: { [config.idField]: recordId, deletedAt: null },
    include: { features: true },
  });
  if (!row) return null;
  const sequence = row[config.sequenceField];
  return {
    filename: `${safeFilename(row.name, `${datasetType}-${recordId}`)}.gb`,
    content: buildGenbank({ name: row.name || `${datasetType}-${recordId}`, sequence, features: row.features, topology: config.topology, datasetType }),
  };
}

module.exports = { buildGenbank, featureLocation, getDatasetMap, safeFilename };
