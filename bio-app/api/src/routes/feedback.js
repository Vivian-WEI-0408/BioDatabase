const express = require('express');
const multer = require('multer');
const path = require('path');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const { ROLE_ADMIN } = require('../constants/roles');
const { ensureUploadTmpRoot } = require('../middleware/uploadMulter');
const {
  cleanupUploadedFiles,
  createFeedback,
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
} = require('../services/feedbackStore');

const router = express.Router();

const feedbackUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      try {
        cb(null, ensureUploadTmpRoot());
      } catch (err) {
        cb(err);
      }
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      cb(null, `${unique}${ext}`);
    },
  }),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: MAX_IMAGES,
  },
});

const feedbackUploadMiddleware = feedbackUpload.array('files', MAX_IMAGES);

function runUploadMiddleware(req, res) {
  return new Promise((resolve, reject) => {
    feedbackUploadMiddleware(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function formatMulterError(error) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return '单张图片不能超过 5MB';
  }
  if (error.code === 'LIMIT_FILE_COUNT') {
    return `最多上传 ${MAX_IMAGES} 张图片`;
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return 'Unexpected upload field';
  }
  return error.message || 'Upload failed';
}

router.post('/submit', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  if (Number(user.role) >= ROLE_ADMIN) {
    res.json(output(null, 0, '管理员账户无需提交意见反馈'));
    return;
  }

  try {
    await runUploadMiddleware(req, res);
  } catch (error) {
    await cleanupUploadedFiles(req.files);
    res.json(output(null, 0, formatMulterError(error)));
    return;
  }

  try {
    const feedback = await createFeedback(user.id, req.body || {}, req.files || []);
    res.json(output({ feedback }, 1, '意见反馈已提交'));
  } catch (error) {
    await cleanupUploadedFiles(req.files);
    console.error('feedback/submit failed:', error);
    res.json(output(null, 0, error.message || '提交失败'));
  }
});

module.exports = router;
