const crypto = require('crypto');
const { prisma } = require('../db');

function emptyData(data = {}) {
  const parts = Array.isArray(data.parts) ? data.parts : [];
  const plasmids = Array.isArray(data.plasmids) ? data.plasmids : [];
  const backbones = Array.isArray(data.backbones) ? data.backbones : [];
  const starts = Array.isArray(data.part_start_scar) ? data.part_start_scar : [];
  const ends = Array.isArray(data.part_end_scar) ? data.part_end_scar : [];
  return {
    ...data,
    parts,
    plasmids,
    backbones,
    total_parts: parts.length,
    total_plasmids: plasmids.length,
    total_backbones: backbones.length,
    part_start_scar: parts.map((_, index) => String(starts[index] || '')),
    part_end_scar: parts.map((_, index) => String(ends[index] || '')),
    part_before_scar: Array.isArray(data.part_before_scar) ? data.part_before_scar : [],
  };
}

function repositoryPayload(repository) {
  return {
    id: repository.id,
    name: repository.name,
    alias: repository.alias,
    note: repository.note,
    level: repository.level,
    part_start_scar: repository.part_start_scar,
    part_end_scar: repository.part_end_scar,
    data: emptyData(repository.data || {}),
    createdAt: repository.repository_create_time,
    updatedAt: repository.repository_update_time,
    expiresAt: repository.repository_expire_time,
  };
}

async function saveRepository(userId, input = {}) {
  const name = String(input.name || input.Name || '').trim();
  if (!name) throw new Error('Repository name is required');
  const now = new Date();
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const data = emptyData(input.data || input);
  const existing = await prisma.temporaryRepository.findFirst({ where: { user_id: userId, name } });
  const repository = existing
    ? await prisma.temporaryRepository.update({ where: { id: existing.id }, data: {
      data, alias: input.alias ?? existing.alias, note: input.note ?? input.Note ?? existing.note,
      level: input.level ?? input.Level ?? existing.level, repository_update_time: now,
      part_start_scar: input.part_start_scar_scalar ?? (typeof input.part_start_scar === 'string' ? input.part_start_scar : existing.part_start_scar),
      part_end_scar: input.part_end_scar_scalar ?? (typeof input.part_end_scar === 'string' ? input.part_end_scar : existing.part_end_scar),
      repository_expire_time: expiresAt,
    } })
    : await prisma.temporaryRepository.create({ data: {
      id: crypto.randomUUID(), user_id: userId, name, data,
      alias: input.alias || null, note: input.note ?? input.Note ?? null,
      level: input.level ?? input.Level ?? null, repository_create_time: now,
      part_start_scar: input.part_start_scar_scalar ?? (typeof input.part_start_scar === 'string' ? input.part_start_scar : null),
      part_end_scar: input.part_end_scar_scalar ?? (typeof input.part_end_scar === 'string' ? input.part_end_scar : null),
      repository_update_time: now, repository_expire_time: expiresAt,
    } });
  return repositoryPayload(repository);
}

async function getRepository(userId, identifier) {
  const value = String(identifier || '').trim();
  const row = await prisma.temporaryRepository.findFirst({ where: {
    user_id: userId, OR: [{ id: value }, { name: value }],
  } });
  if (!row || (row.repository_expire_time && row.repository_expire_time <= new Date())) return null;
  return repositoryPayload(row);
}

async function listRepositories(userId) {
  const rows = await prisma.temporaryRepository.findMany({
    where: { user_id: userId, OR: [{ repository_expire_time: null }, { repository_expire_time: { gt: new Date() } }] },
    orderBy: { repository_update_time: 'desc' },
  });
  return rows.map(repositoryPayload);
}

module.exports = { emptyData, getRepository, listRepositories, saveRepository };
