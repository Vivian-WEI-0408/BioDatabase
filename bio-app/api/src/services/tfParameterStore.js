const { prisma } = require('./db');

function numberValue(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} must be a finite number`);
  }
  return parsed;
}

function stringValue(value, field) {
  const parsed = String(value ?? '').trim();
  if (!parsed) {
    throw new Error(`${field} is required`);
  }
  if (parsed.length > 20) {
    throw new Error(`${field} must not exceed 20 characters`);
  }
  return parsed;
}

function dbdData(body = {}) {
  return {
    name: stringValue(body.name ?? body.Name, 'Name'),
    i0: numberValue(body.i0 ?? body.I0, 'I0'),
    kd: numberValue(body.kd ?? body.Kd, 'kd'),
  };
}

function lbdDimerData(body = {}) {
  return {
    name: stringValue(body.name ?? body.Name, 'Name'),
    k1: numberValue(body.k1, 'k1'),
    k2: numberValue(body.k2, 'k2'),
    k3: numberValue(body.k3, 'k3'),
    i: numberValue(body.i ?? body.I, 'I'),
  };
}

function lbdNrData(body = {}) {
  return {
    name: stringValue(body.name ?? body.Name, 'Name'),
    k1: numberValue(body.k1, 'k1'),
    k2: numberValue(body.k2, 'k2'),
    k3: numberValue(body.k3, 'k3'),
    kx1: numberValue(body.kx1, 'kx1'),
    kx2: numberValue(body.kx2, 'kx2'),
  };
}

async function replaceByName(delegate, data) {
  return prisma.$transaction(async (tx) => {
    await tx[delegate].deleteMany({ where: { name: data.name } });
    return tx[delegate].create({ data });
  });
}

module.exports = {
  dbdData,
  lbdDimerData,
  lbdNrData,
  replaceByName,
};
