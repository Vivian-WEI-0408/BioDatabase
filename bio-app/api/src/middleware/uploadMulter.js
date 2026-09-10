const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { resolveTempPath } = require('../lib/storagePaths');

const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;

function resolveMaxMapFiles() {
  const configured = Number(process.env.DATASET_UPLOAD_MAX_FILES);
  return Number.isSafeInteger(configured) && configured > 0 ? configured : 50;
}

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

// A separate files limit reports LIMIT_FILE_COUNT instead of the misleading
// LIMIT_UNEXPECTED_FILE emitted by array('files', maxCount).
function uploadMapMiddleware(req, res, next) {
  const maxFiles = resolveMaxMapFiles();
  multer({ storage, limits: { fileSize: resolveMaxFileSize(), files: maxFiles } })
    .array('files')(req, res, (error) => {
      if (error?.code === 'LIMIT_FILE_COUNT') {
        error.message = `一次最多上传 ${maxFiles} 个图谱文件，请分批上传，或调整 DATASET_UPLOAD_MAX_FILES 后重启 API。`;
      } else if (error?.code === 'LIMIT_UNEXPECTED_FILE') {
        error.message = `图谱上传字段错误：收到 ${error.field || '(未知字段)'}，文件字段必须为 files。`;
      }
      next(error);
    });
}
const uploadBatchMiddleware = upload.single('file');

module.exports = {
  ensureUploadTmpRoot,
  resolveMaxFileSize,
  resolveMaxMapFiles,
  resolveUploadTmpRoot,
  uploadBatchMiddleware,
  uploadMapMiddleware,
};
