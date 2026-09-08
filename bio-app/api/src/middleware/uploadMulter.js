const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { resolveTempPath } = require('../lib/storagePaths');

const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;

function resolveUploadTmpRoot() {
  return process.env.DATASET_UPLOAD_TMP_DIR
    || resolveTempPath('uploads');
}

function resolveMaxFileSize() {
  const configured = Number(process.env.DATASET_UPLOAD_MAX_BYTES);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }
  return DEFAULT_MAX_BYTES;
}

function ensureUploadTmpRoot() {
  const root = resolveUploadTmpRoot();
  fs.mkdirSync(root, { recursive: true });
  return root;
}

const storage = multer.diskStorage({
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
});

const upload = multer({
  storage,
  limits: {
    fileSize: resolveMaxFileSize(),
  },
});

const uploadMapMiddleware = upload.array('files', 50);
const uploadBatchMiddleware = upload.single('file');

module.exports = {
  ensureUploadTmpRoot,
  resolveMaxFileSize,
  resolveUploadTmpRoot,
  uploadBatchMiddleware,
  uploadMapMiddleware,
};
