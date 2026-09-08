const express = require('express');
const { output } = require('../lib/response');
const {
  assignToken,
  clearToken,
  findUserByEmail,
  findUserByToken,
  hashPassword,
  sanitizeUser,
  touchTokenExpiry,
  updateUser,
  verifyPassword,
} = require('../services/userStore');
const { prisma } = require('../services/db');
const vcodeStore = require('../services/vcodeStore');
const mailService = require('../services/mailService');

const router = express.Router();

function getToken(req) {
  return req.headers.token || req.headers.Token;
}

router.post('/login', async (req, res) => {
  const token = getToken(req);

  if (token) {
    const tokenUser = await findUserByToken(token);

    if (tokenUser && tokenUser.status === 1) {
      await touchTokenExpiry(tokenUser.id, tokenUser.token_expires_at);
      const refreshed = await findUserByToken(token);
      res.json(output({ user: sanitizeUser(refreshed || tokenUser) }, 1));
      return;
    }
  }

  const account = (
    req.body.account
    || req.body.username
    || req.body.email
    || ''
  ).toString().trim();
  const password = req.body.password || '';
  const user = await findUserByEmail(account);

  if (!user) {
    res.json(output(null, 2));
    return;
  }

  if (user.status !== 1) {
    res.json(output(null, 4));
    return;
  }

  if (!verifyPassword(password, user.password)) {
    res.json(output(null, 3));
    return;
  }

  assignToken(user);
  user.last_login_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const updatedUser = await updateUser(user);

  res.json(output({ user: sanitizeUser(updatedUser) }, 1));
});

router.post('/register', async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim();
  const password = req.body.password || '';
  const organization = (req.body.organization || '').trim();

  if (!name || !email || !password) {
    res.json(output(null, 4));
    return;
  }

  if (!organization) {
    res.json(output(null, 4));
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.json(output(null, 5));
    return;
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    res.json(output(null, 6));
    return;
  }

  const tokenFields = assignToken({});
  const user = await prisma.user.create({
    data: {
      name,
      email,
      organization,
      password: hashPassword(password),
      token: tokenFields.token,
      token_expires_at: tokenFields.token_expires_at,
    },
  });

  res.json(output({ user: sanitizeUser(user) }, 1));
});

router.post('/logout', async (req, res) => {
  const user = await findUserByToken(getToken(req));

  if (user) {
    clearToken(user);
    await updateUser(user);
  }

  res.json(output(null, 1));
});

router.post('/refreshProfile', async (req, res) => {
  const user = await findUserByToken(getToken(req));

  if (!user) {
    res.json(output(null, 2));
    return;
  }

  if (user.status !== 1) {
    res.json(output(null, 4));
    return;
  }

  await touchTokenExpiry(user.id, user.token_expires_at);
  const refreshed = await findUserByToken(getToken(req));

  res.json(output({ user: sanitizeUser(refreshed || user) }, 1));
});

function resolveEmail(body) {
  return (body.tel || body.email || '').toString().trim();
}

router.post('/sendVCode', async (req, res) => {
  const email = resolveEmail(req.body || {});

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.json(output(null, 3));
    return;
  }

  const user = await findUserByEmail(email);

  if (!user) {
    res.json(output(null, 2));
    return;
  }

  try {
    const code = vcodeStore.create(email);
    await mailService.sendVerificationCode(email, code);
    res.json(output(null, 1));
  } catch (err) {
    console.error('[account/sendVCode]', err);
    res.json(output(null, 3));
  }
});

router.post('/resetPassword', async (req, res) => {
  const email = resolveEmail(req.body || {});
  const vcode = (req.body.vcode || '').toString().trim();
  const password = req.body.password || '';

  if (!email || !vcode || !password) {
    res.json(output(null, 3));
    return;
  }

  const user = await findUserByEmail(email);

  if (!user) {
    res.json(output(null, 2));
    return;
  }

  if (!vcodeStore.verify(email, vcode)) {
    res.json(output(null, 3));
    return;
  }

  user.password = hashPassword(password);
  assignToken(user);
  await updateUser(user);

  res.json(output(null, 1));
});

module.exports = router;
