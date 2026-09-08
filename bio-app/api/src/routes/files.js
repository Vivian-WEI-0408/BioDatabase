const express = require('express');
const { output } = require('../lib/response');
const { requireUser } = require('../middleware/auth');
const { uploadMapMiddleware } = require('../middleware/uploadMulter');
const {
  cleanupUploadedFiles,
  createUserFiles,
  deleteUserFiles,
  getQuota,
  getUserFileForDownload,
  listUserFiles,
  resolveUploadMaxBytes,
} = require('../services/userFileStore');

const router = express.Router();

function runUploadMiddleware(req, res) {
  return new Promise((resolve, reject) => {
    uploadMapMiddleware(req, res, (err) => {
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
    const maxMb = Math.round(resolveUploadMaxBytes() / 1024 / 1024);
    return `File exceeds maximum upload size (${maxMb}MB)`;
  }
  if (error.code === 'LIMIT_FILE_COUNT') {
    return 'Too many files uploaded';
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return 'Unexpected upload field';
  }
  return error.message || 'Upload failed';
}

router.post('/list', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const payload = await listUserFiles(user.id, req.body || {});
    res.json(output(payload, 1));
  } catch (error) {
    console.error('files/list failed:', error);
    res.json(output(null, 0, 'Failed to load files'));
  }
});

router.post('/quota', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const quota = await getQuota(user.id);
    res.json(output({ quota }, 1));
  } catch (error) {
    console.error('files/quota failed:', error);
    res.json(output(null, 0, 'Failed to load storage quota'));
  }
});

router.post('/upload', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
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
    const result = await createUserFiles(user.id, req.files || []);
    res.json(output(result, 1, 'Upload completed'));
  } catch (error) {
    await cleanupUploadedFiles(req.files);
    res.json(output(null, 0, error.message || 'Upload failed'));
  }
});

router.get('/download/:id', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  try {
    const file = await getUserFileForDownload(user.id, req.params.id);
    if (!file) {
      res.status(404).json(output(null, 0, 'File not found'));
      return;
    }

    res.download(file.absolutePath, file.originalName, (error) => {
      if (error && !res.headersSent) {
        res.status(404).json(output(null, 0, 'File not found on disk'));
      }
    });
  } catch (error) {
    console.error('files/download failed:', error);
    if (!res.headersSent) {
      res.status(500).json(output(null, 0, 'Download failed'));
    }
  }
});

router.post('/delete', async (req, res) => {
  const user = await requireUser(req, res);

  if (!user) {
    return;
  }

  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (ids.length === 0) {
    res.json(output(null, 3, 'No files selected'));
    return;
  }

  try {
    const result = await deleteUserFiles(user.id, ids);
    res.json(output(result, 1));
  } catch (error) {
    console.error('files/delete failed:', error);
    res.json(output(null, 0, 'Failed to delete files'));
  }
});

module.exports = router;
