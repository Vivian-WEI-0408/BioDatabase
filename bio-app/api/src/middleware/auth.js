const { output } = require('../lib/response');
const { findUserByToken, touchTokenExpiry } = require('../services/userStore');
const { ensureUserData } = require('../services/initData');

function getToken(req) {
  return req.headers.token || req.headers.Token;
}

async function requireUser(req, res) {
  const user = await findUserByToken(getToken(req));

  if (!user) {
    res.json(output(null, 2));
    return null;
  }

  if (user.status !== 1) {
    res.json(output(null, 4));
    return null;
  }

  await ensureUserData(user.id);

  try {
    const nextExpiresAt = await touchTokenExpiry(user.id, user.token_expires_at);
    user.token_expires_at = nextExpiresAt instanceof Date
      ? nextExpiresAt
      : user.token_expires_at;
  } catch (err) {
    console.warn('[auth] touchTokenExpiry failed:', err.message);
  }

  return user;
}

async function requireAdmin(req, res) {
  const user = await requireUser(req, res);

  if (!user) {
    return null;
  }

  if (Number(user.role) < 9) {
    res.json(output(null, 0, '暂无后台管理权限'));
    return null;
  }

  return user;
}

module.exports = {
  getToken,
  requireAdmin,
  requireUser,
};
