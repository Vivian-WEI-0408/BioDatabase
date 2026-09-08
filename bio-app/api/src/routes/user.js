const express = require('express');
const fs = require('fs');
const path = require('path');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const {
  assignToken,
  findUserByEmail,
  hashPassword,
  sanitizeUser,
  updateUser,
  verifyPassword,
} = require('../services/userStore');
const vcodeStore = require('../services/vcodeStore');
const mailService = require('../services/mailService');
const { resolveDataPath } = require('../lib/storagePaths');

const router = express.Router();
const avatarsDir = path.resolve(process.env.AVATAR_STORAGE_DIR || resolveDataPath('avatars'));

function ensureAvatarsDir() {
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }
}

function parseBase64Image(data) {
  if (!data || typeof data !== 'string') {
    return null;
  }

  const match = data.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i);

  if (match) {
    return {
      mimeType: match[1].toLowerCase(),
      buffer: Buffer.from(match[2], 'base64'),
    };
  }

  return {
    mimeType: 'image/png',
    buffer: Buffer.from(data, 'base64'),
  };
}

function mimeToExt(mimeType) {
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'png';
  }
}

router.post('/refreshProfile', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  res.json(output({ user: sanitizeUser(user) }, 1));
});

router.post('/updateProfile', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const name = (req.body.name || '').trim();
  const title = (req.body.title || '').trim();
  const organization = (req.body.organization || '').trim();
  const phone = (req.body.phone || '').trim();
  const gender = (req.body.gender || '').trim();

  if (!name) {
    res.json(output(null, 3));
    return;
  }

  user.name = name;
  user.title = title;
  user.organization = organization;
  user.phone = phone;
  user.gender = gender;

  const updatedUser = await updateUser(user);
  res.json(output({ user: sanitizeUser(updatedUser) }, 1));
});

router.post('/uploadAvatar', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const parsed = parseBase64Image(req.body.data || req.body.avatar);

  if (!parsed || !parsed.buffer.length) {
    res.json(output(null, 3));
    return;
  }

  if (parsed.buffer.length > 5 * 1024 * 1024) {
    res.json(output(null, 3));
    return;
  }

  ensureAvatarsDir();

  const ext = mimeToExt(parsed.mimeType);
  const filename = `${user.id}.${ext}`;
  const filePath = path.join(avatarsDir, filename);

  fs.writeFileSync(filePath, parsed.buffer);

  user.avatar = `/res/avatars/${filename}`;
  const updatedUser = await updateUser(user);

  res.json(output({ user: sanitizeUser(updatedUser) }, 1));
});

router.post('/changePassword', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const currentPassword = req.body.currentPassword || '';
  const newPassword = req.body.newPassword || '';
  const confirmPassword = req.body.confirmPassword || '';

  if (!currentPassword || !newPassword || !confirmPassword) {
    res.json(output(null, 3));
    return;
  }

  if (newPassword !== confirmPassword) {
    res.json(output(null, 3));
    return;
  }

  if (newPassword.length < 6) {
    res.json(output(null, 3));
    return;
  }

  if (!verifyPassword(currentPassword, user.password)) {
    res.json(output(null, 3));
    return;
  }

  user.password = hashPassword(newPassword);
  assignToken(user);
  const updatedUser = await updateUser(user);

  res.json(output({ user: sanitizeUser(updatedUser) }, 1));
});

router.post('/sendCurrentEmailVCode', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const code = vcodeStore.create(user.email);
    await mailService.sendVerificationCode(user.email, code);
    res.json(output(null, 1));
  } catch (err) {
    console.error('[user/sendCurrentEmailVCode]', err);
    res.json(output(null, 3));
  }
});

router.post('/sendNewEmailVCode', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const email = (req.body.email || req.body.newEmail || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.json(output(null, 5));
    return;
  }

  if (email === user.email) {
    res.json(output(null, 3));
    return;
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    res.json(output(null, 6));
    return;
  }

  try {
    const code = vcodeStore.create(email);
    await mailService.sendVerificationCode(email, code);
    res.json(output(null, 1));
  } catch (err) {
    console.error('[user/sendNewEmailVCode]', err);
    res.json(output(null, 3));
  }
});

router.post('/changeEmail', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const newEmail = (req.body.email || req.body.newEmail || '').trim();
  const currentVcode = (req.body.currentVcode || '').trim();
  const newVcode = (req.body.newVcode || '').trim();

  if (!newEmail || !currentVcode || !newVcode) {
    res.json(output(null, 3));
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    res.json(output(null, 5));
    return;
  }

  if (newEmail === user.email) {
    res.json(output(null, 3));
    return;
  }

  const existing = await findUserByEmail(newEmail);

  if (existing && existing.id !== user.id) {
    res.json(output(null, 6));
    return;
  }

  if (!vcodeStore.verify(user.email, currentVcode)) {
    res.json(output(null, 3));
    return;
  }

  if (!vcodeStore.verify(newEmail, newVcode)) {
    res.json(output(null, 3));
    return;
  }

  user.email = newEmail;
  const updatedUser = await updateUser(user);

  res.json(output({ user: sanitizeUser(updatedUser) }, 1));
});

module.exports = router;
