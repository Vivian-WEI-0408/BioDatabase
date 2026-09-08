const express = require('express');
const { prisma } = require('../services/db');
const { requireUser } = require('../middleware/auth');
const {
  dbdData,
  lbdDimerData,
  lbdNrData,
  replaceByName,
} = require('../services/tfParameterStore');

const router = express.Router();

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
}

function getName(req) {
  return String(req.params.name ?? req.query.name ?? '').trim();
}

function legacyPart(row) {
  return {
    name: row.name,
    level0sequence: row.level0Sequence ?? '',
    alias: row.alias ?? '',
    confirmedsequence: row.confirmedSequence ?? '',
    insertsequence: row.insertSequence ?? '',
    sourceorganism: row.sourceOrganism ?? '',
    reference: row.reference ?? '',
    note: row.note ?? '',
  };
}

router.get('/PartID', asyncRoute(async (req, res) => {
  const row = await prisma.partTable.findFirst({ where: { name: getName(req), deletedAt: null }, select: { partId: true } });
  if (!row) return res.status(404).json({ success: false });
  res.json({ PartID: row.partId });
}));

router.get('/PartName', asyncRoute(async (req, res) => {
  const row = await prisma.partTable.findFirst({ where: { name: getName(req), deletedAt: null } });
  if (!row) return res.status(404).json({ success: false });
  res.json({ success: true, data: legacyPart(row) });
}));

router.get('/PartType', asyncRoute(async (req, res) => {
  const typeMap = { promoter: 1, cds: 2, terminator: 3, rbs: 4, 'p+r': 5 };
  const type = typeMap[String(req.query.type || '').trim().toLowerCase()];
  if (!type) return res.status(400).json({ success: false, message: 'Unsupported Part type' });
  const rows = await prisma.partTable.findMany({ where: { type, deletedAt: null }, orderBy: { partId: 'asc' } });
  res.json(rows.map((row) => ({ partid: row.partId, ...legacyPart(row) })));
}));

router.get('/SearchRPU', asyncRoute(async (req, res) => {
  const partId = Number(req.query.partID);
  if (!Number.isInteger(partId)) return res.status(400).json([]);
  const rows = await prisma.partRpuTable.findMany({ where: { partId }, orderBy: { prid: 'asc' } });
  res.json(rows.map((row) => ({ partid: row.partId, rpu: row.rpu, teststrain: row.testStrain, note: row.note })));
}));

function dbdRow(row) {
  return { ID: row.id, Name: row.name, I0: row.i0, kd: row.kd };
}

function completeDbdRow(parameter, part) {
  const source = part ? legacyPart(part) : { name: parameter.name };
  return {
    ID: parameter.id,
    Name: parameter.name,
    Level0Sequence: source.level0sequence ?? '',
    Alias: source.alias ?? '',
    ConfirmedSequence: source.confirmedsequence ?? '',
    InsertSequence: source.insertsequence ?? '',
    SourceOrganism: source.sourceorganism ?? '',
    Reference: source.reference ?? '',
    Note: source.note ?? '',
    I0: parameter.i0,
    kd: parameter.kd,
  };
}

async function partsByName(names) {
  const parts = await prisma.partTable.findMany({ where: { name: { in: names }, deletedAt: null } });
  return new Map(parts.map((part) => [part.name, part]));
}

function dimerRow(row) {
  return { ID: row.id, name: row.name, k1: row.k1, k2: row.k2, k3: row.k3, i: row.i };
}

function nrRow(row) {
  return { ID: row.id, name: row.name, k1: row.k1, k2: row.k2, k3: row.k3, kx1: row.kx1, kx2: row.kx2 };
}

router.get('/GetDBDList', asyncRoute(async (_req, res) => {
  const rows = await prisma.dBDTable.findMany({ orderBy: { id: 'asc' } });
  const parts = await partsByName(rows.map((row) => row.name));
  res.json(rows.map((row) => completeDbdRow(row, parts.get(row.name))));
}));

// Preserve the misspelled path used by the legacy TFPlot helper.
router.get('/GerDBDList', asyncRoute(async (_req, res) => {
  const rows = await prisma.dBDTable.findMany({ orderBy: { id: 'asc' } });
  const parts = await partsByName(rows.map((row) => row.name));
  res.json(rows.map((row) => completeDbdRow(row, parts.get(row.name))));
}));

router.get('/GetDBDAllByName', asyncRoute(async (req, res) => {
  const parameter = await prisma.dBDTable.findFirst({ where: { name: getName(req) } });
  if (!parameter) return res.status(404).json([]);
  const part = await prisma.partTable.findFirst({ where: { name: parameter.name, deletedAt: null } });
  res.json([completeDbdRow(parameter, part)]);
}));

router.get('/GetDBDKdI0/:name', asyncRoute(async (req, res) => {
  const row = await prisma.dBDTable.findFirst({ where: { name: getName(req) } });
  if (!row) return res.status(404).json({ success: false });
  res.json({ success: true, Name: row.name, I0: row.i0, Kd: row.kd, kd: row.kd });
}));

router.get('/GetDBDMenu', asyncRoute(async (_req, res) => {
  const rows = await prisma.dBDTable.findMany({ orderBy: { id: 'asc' } });
  res.json(rows.map((row) => ({ name: row.name, i0: row.i0, kd: row.kd })));
}));

router.get('/GetDBDNameList', asyncRoute(async (_req, res) => {
  const rows = await prisma.dBDTable.findMany({ select: { name: true }, orderBy: { id: 'asc' } });
  res.json(rows.map((row) => row.name));
}));

router.get('/GetDBDKdList', asyncRoute(async (_req, res) => {
  const rows = await prisma.dBDTable.findMany({ select: { kd: true }, orderBy: { id: 'asc' } });
  res.json(rows.map((row) => row.kd));
}));

router.get('/GetDBDKd', asyncRoute(async (req, res) => {
  const row = await prisma.dBDTable.findFirst({ where: { name: getName(req) } });
  if (!row) return res.status(404).json({ success: false });
  res.json({ Kd: row.kd, kd: row.kd });
}));

router.post('/AddDBD', asyncRoute(async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const row = await replaceByName('dBDTable', dbdData(req.body));
  res.json({ success: true, data: dbdRow(row) });
}));

router.get('/GetLBDDimer', asyncRoute(async (_req, res) => {
  const rows = await prisma.lBDDimerTable.findMany({ orderBy: { id: 'asc' } });
  const parts = await partsByName(rows.map((row) => row.name));
  res.json(rows.map((row) => ({
    ...(parts.has(row.name) ? legacyPart(parts.get(row.name)) : { name: row.name }),
    ...dimerRow(row),
  })));
}));

router.get('/GetLBDDimerAllByName', asyncRoute(async (req, res) => {
  const parameter = await prisma.lBDDimerTable.findFirst({ where: { name: getName(req) } });
  if (!parameter) return res.status(404).json({});
  const part = await prisma.partTable.findFirst({ where: { name: parameter.name, deletedAt: null } });
  res.json({ ...(part ? legacyPart(part) : { name: parameter.name }), ...dimerRow(parameter) });
}));

router.get('/GetLBDDimerValue/:name', asyncRoute(async (req, res) => {
  const row = await prisma.lBDDimerTable.findFirst({ where: { name: getName(req) } });
  if (!row) return res.status(404).json({ success: false });
  res.json({ success: true, ...dimerRow(row) });
}));

router.get('/GetLBDDimerMenu', asyncRoute(async (_req, res) => {
  const rows = await prisma.lBDDimerTable.findMany({ orderBy: { id: 'asc' } });
  res.json(rows.map(dimerRow));
}));

router.get('/GetLBDDimerNameList', asyncRoute(async (_req, res) => {
  const rows = await prisma.lBDDimerTable.findMany({ select: { name: true }, orderBy: { id: 'asc' } });
  res.json(rows.map((row) => row.name));
}));

router.post('/AddLBDDimer', asyncRoute(async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const body = req.body?.data || req.body;
  const row = await replaceByName('lBDDimerTable', lbdDimerData(body));
  res.json({ success: true, data: dimerRow(row) });
}));

router.get('/GetLBDAllByName', asyncRoute(async (req, res) => {
  const parameter = await prisma.lBDNRTable.findFirst({ where: { name: getName(req) } });
  if (!parameter) return res.status(404).json({});
  const part = await prisma.partTable.findFirst({ where: { name: parameter.name, deletedAt: null } });
  res.json({ ...(part ? legacyPart(part) : { name: parameter.name }), ...nrRow(parameter) });
}));

router.get('/GetLBDNRMenu', asyncRoute(async (_req, res) => {
  const rows = await prisma.lBDNRTable.findMany({ orderBy: { id: 'asc' } });
  res.json(rows.map(nrRow));
}));

router.get('/GetLBDNRNameList', asyncRoute(async (_req, res) => {
  const rows = await prisma.lBDNRTable.findMany({ select: { name: true }, orderBy: { id: 'asc' } });
  res.json(rows.map((row) => row.name));
}));

router.post('/AddLbdnr', asyncRoute(async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const body = req.body?.data || req.body;
  const row = await replaceByName('lBDNRTable', lbdNrData(body));
  res.json({ success: true, data: nrRow(row) });
}));

router.use((error, _req, res, next) => {
  if (/required|finite number|20 characters/.test(error?.message || '')) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }
  next(error);
});

module.exports = router;
