const fs = require('fs/promises');
const path = require('path');
const { resolveUploadTmpRoot } = require('../middleware/uploadMulter');

function getFileExtension(filename) {
  return path.extname(String(filename || '')).toLowerCase();
}

function taskUploadDir(taskId) {
  return path.join(resolveUploadTmpRoot(), String(taskId));
}

async function moveUploadedFile(sourcePath, destinationPath) {
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });

  try {
    await fs.rename(sourcePath, destinationPath);
  } catch (err) {
    if (err.code !== 'EXDEV') {
      throw err;
    }
    await fs.copyFile(sourcePath, destinationPath);
    await fs.unlink(sourcePath);
  }
}

async function cleanupMulterStagingFiles(uploadedFiles) {
  const files = Array.isArray(uploadedFiles)
    ? uploadedFiles
    : uploadedFiles
      ? [uploadedFiles]
      : [];

  for (const file of files) {
    if (!file?.path) {
      continue;
    }

    try {
      await fs.rm(file.path, { force: true });
    } catch {
      // Best-effort cleanup; ignore missing paths or races after persist.
    }
  }
}

async function persistUploadedFiles(taskId, uploadedFiles) {
  const destinationDir = taskUploadDir(taskId);
  await fs.mkdir(destinationDir, { recursive: true });

  const persisted = [];

  for (let index = 0; index < uploadedFiles.length; index += 1) {
    const file = uploadedFiles[index];
    const ext = getFileExtension(file.originalname || file.filename);
    const originalName = path.basename(
      file.originalname || file.filename || `upload${ext}`,
    );
    const storedName = `${index + 1}_${originalName}`;
    const destinationPath = path.join(destinationDir, storedName);

    await moveUploadedFile(file.path, destinationPath);

    persisted.push({
      originalName,
      name: storedName,
      path: destinationPath,
      size: file.size,
      ext,
    });
  }

  return persisted;
}

async function cleanupUploadFiles(taskId) {
  const numericId = Number(taskId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return;
  }

  const dir = taskUploadDir(numericId);
  await fs.rm(dir, { recursive: true, force: true });
}

module.exports = {
  cleanupMulterStagingFiles,
  cleanupUploadFiles,
  getFileExtension,
  persistUploadedFiles,
  taskUploadDir,
};
