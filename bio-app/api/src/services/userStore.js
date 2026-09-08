const crypto = require('crypto');
const { initDatabase, prisma } = require('./db');
const { initData } = require('./initData');

const DEFAULT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const userFields = [
  'name',
  'email',
  'password',
  'token',
  'token_expires_at',
  'status',
  'role',
  'title',
  'organization',
  'phone',
  'gender',
  'avatar',
  'last_login_time',
];

async function initUserStore() {
  await initDatabase();
  await initData();
}

function getTokenTtlMs() {
  const parsed = Number(process.env.TOKEN_TTL_MS);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_TOKEN_TTL_MS;
}

function formatDateTime(value) {
  if (!(value instanceof Date)) {
    return value;
  }

  const pad = (number) => number.toString().padStart(2, '0');

  return [
    value.getFullYear(),
    pad(value.getMonth() + 1),
    pad(value.getDate()),
  ].join('-') + ' ' + [
    pad(value.getHours()),
    pad(value.getMinutes()),
    pad(value.getSeconds()),
  ].join(':');
}

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  const normalized = { ...user };

  normalized.last_login_time = formatDateTime(normalized.last_login_time);
  normalized.token_expires_at = formatDateTime(normalized.token_expires_at);
  normalized.created_at = formatDateTime(normalized.created_at);
  normalized.updated_at = formatDateTime(normalized.updated_at);
  normalized.username = normalized.email;

  return normalized;
}

function normalizeDateTime(value) {
  if (!value || value instanceof Date) {
    return value || null;
  }

  return new Date(value.toString().replace(' ', 'T'));
}

function toPrismaData(user, fields) {
  return fields.reduce((data, field) => {
    if (field === 'last_login_time' || field === 'token_expires_at') {
      data[field] = normalizeDateTime(user[field]);
      return data;
    }

    data[field] = user[field];
    return data;
  }, {});
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

function verifyPassword(password, storedPassword = '') {
  if (!storedPassword) {
    return false;
  }

  if (!storedPassword.startsWith('pbkdf2:')) {
    return password === storedPassword;
  }

  const parts = storedPassword.split(':');
  const salt = parts[1];
  const hash = parts[2];
  const currentHash = hashPassword(password, salt).split(':')[2];

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(currentHash));
}

function issueToken() {
  return crypto.randomBytes(24).toString('hex');
}

function buildTokenExpiry(from = new Date()) {
  return new Date(from.getTime() + getTokenTtlMs());
}

function assignToken(user) {
  user.token = issueToken();
  user.token_expires_at = buildTokenExpiry();
  return user;
}

function clearToken(user) {
  user.token = '';
  user.token_expires_at = null;
  return user;
}

async function clearExpiredToken(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      token: '',
      token_expires_at: null,
    },
  });
}

async function findUserByToken(token) {
  if (!token) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { token },
  });

  if (!user) {
    return null;
  }

  if (user.token_expires_at && user.token_expires_at.getTime() <= Date.now()) {
    await clearExpiredToken(user.id);
    return null;
  }

  // Legacy tokens without expiry: assign expiry on first validated use
  if (!user.token_expires_at) {
    const expiresAt = buildTokenExpiry();
    await prisma.user.update({
      where: { id: user.id },
      data: { token_expires_at: expiresAt },
    });
    user.token_expires_at = expiresAt;
  }

  return normalizeUser(user);
}

async function touchTokenExpiry(userId, currentExpiresAt) {
  const ttl = getTokenTtlMs();
  const expiresAt = currentExpiresAt instanceof Date
    ? currentExpiresAt
    : (currentExpiresAt ? normalizeDateTime(currentExpiresAt) : null);

  if (expiresAt && expiresAt.getTime() - Date.now() > ttl / 2) {
    return expiresAt;
  }

  const nextExpiresAt = buildTokenExpiry();

  await prisma.user.update({
    where: { id: userId },
    data: { token_expires_at: nextExpiresAt },
  });

  return nextExpiresAt;
}

async function findUserByEmail(email) {
  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toString().trim() },
  });

  return normalizeUser(user);
}

async function updateUser(user) {
  const fields = userFields.filter((field) => Object.prototype.hasOwnProperty.call(user, field));

  if (fields.length === 0) {
    return user;
  }

  const data = toPrismaData(user, fields);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data,
  });

  return normalizeUser(updatedUser);
}

function sanitizeUser(user) {
  const safeUser = normalizeUser(user);
  delete safeUser.password;
  return safeUser;
}

module.exports = {
  assignToken,
  clearToken,
  findUserByEmail,
  findUserByToken,
  getTokenTtlMs,
  hashPassword,
  initUserStore,
  issueToken,
  sanitizeUser,
  touchTokenExpiry,
  updateUser,
  verifyPassword,
};
