const fs = require('fs/promises');
const path = require('path');
const { prisma } = require('./db');
const { resolveMaxFileSize } = require('../middleware/uploadMulter');
const { resolveDataPath } = require('../lib/storagePaths');

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const FILE_CATEGORIES = Object.freeze({
  image: new Set(['.png', '.jpg', '.jpeg', '.webp']),
  document: new Set(['.pdf', '.doc', '.docx', '.txt', '.md']),
  spreadsheet: new Set(['.csv', '.tsv', '.xls', '.xlsx']),
  'bio-data': new Set(['.fa', '.fasta', '.gb', '.gbk']),
  data: new Set(['.json']),
  archive: new Set(['.zip']),
});

const ALLOWED_EXTENSIONS = new Set(
  Object.values(FILE_CATEGORIES).flatMap((extensions) => Array.from(extensions)),
);

const SORT_FIELDS = Object.freeze({
  name: 'original_name',
  originalName: 'original_name',
  size: 'size_bytes',
  sizeBytes: 'size_bytes',
  category: 'category',
  createdAt: 'created_at',
  created_at: 'created_at',
});

function resolveStorageRoot() {
  const root = process.env.USER_FILE_STORAGE_DIR
    || resolveDataPath('user-files');
  return path.resolve(root);
}

function resolveUploadMaxBytes() {
  const configured = Number(process.env.USER_FILE_MAX_BYTES);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }
  return resolveMaxFileSize();
}

function getFileExtension(filename) {
  return path.extname(String(filename || '')).toLowerCase();
}

function getFileCategory(extension) {
  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if (extensions.has(extension)) {
      return category;
    }
  }
  return 'other';
}

function sanitizeOriginalName(filename) {
  const baseName = path.basename(String(filename || 'upload'));
  return baseName.replace(/[^\w.\-()\s\u4e00-\u9fa5]/g, '_').slice(0, 255) || 'upload';
}

function buildStoredName(originalName) {
  const extension = getFileExtension(originalName);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${unique}${extension}`;
}

function fileBytesToAllocatedMb(bytes) {
  const numericBytes = Number(bytes) || 0;
  if (numericBytes <= 0) {
    return 0;
  }
  return Math.ceil(numericBytes / BYTES_PER_MB);
}

function formatUserFile(record) {
  const sizeBytes = Number(record.size_bytes || 0);
  return {
    id: record.id,
    originalName: record.original_name,
    storedName: record.stored_name,
    sizeBytes,
    sizeMB: Number((sizeBytes / BYTES_PER_MB).toFixed(2)),
    mimeType: record.mime_type,
    extension: record.extension,
    category: record.category,
    createdAt: record.created_at,
  };
}

function buildRelativePath(userId, storedName) {
  return path.join(String(userId), storedName).split(path.sep).join('/');
}

function resolveAbsolutePath(relativePath) {
  const root = resolveStorageRoot();
  const absolutePath = path.resolve(root, relativePath);
  const rootWithSeparator = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (absolutePath !== root && !absolutePath.startsWith(rootWithSeparator)) {
    throw new Error('Invalid file path');
  }

  return absolutePath;
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

async function cleanupFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    await fs.rm(filePath, { force: true });
  } catch {
    // Best-effort cleanup; stale disk files should not block API responses.
  }
}

async function cleanupUploadedFiles(uploadedFiles) {
  const files = Array.isArray(uploadedFiles)
    ? uploadedFiles
    : uploadedFiles
      ? [uploadedFiles]
      : [];

  await Promise.all(files.map((file) => cleanupFile(file?.path)));
}

async function getQuota(userId) {
  const storage = await prisma.userStorage.upsert({
    where: { user_id: userId },
    update: {},
    create: {
      user_id: userId,
      used_mb: 0,
      total_mb: 1024,
    },
  });

  return {
    usedMB: storage.used_mb,
    totalMB: storage.total_mb,
    availableMB: Math.max(0, storage.total_mb - storage.used_mb),
    usedPercent: storage.total_mb > 0
      ? Math.min(100, Math.round((storage.used_mb / storage.total_mb) * 100))
      : 0,
  };
}

async function assertUploadAllowed(userId, files) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('At least one file is required');
  }

  const maxBytes = resolveUploadMaxBytes();
  let allocatedMb = 0;

  for (const file of files) {
    const originalName = sanitizeOriginalName(file.originalname || file.filename);
    const extension = getFileExtension(originalName);

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new Error(`Unsupported file type: ${extension || '(none)'}`);
    }

    if (!file.size || file.size <= 0) {
      throw new Error(`File is empty: ${originalName}`);
    }

    if (file.size > maxBytes) {
      throw new Error(`File exceeds maximum upload size: ${originalName}`);
    }

    allocatedMb += fileBytesToAllocatedMb(file.size);
  }

  const quota = await getQuota(userId);
  if (quota.usedMB + allocatedMb > quota.totalMB) {
    throw new Error('Insufficient storage space');
  }

  return { allocatedMb, quota };
}

async function listUserFiles(userId, {
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  keyword = '',
  type = 'all',
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = {}) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safePageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(pageSize, 10) || DEFAULT_PAGE_SIZE),
  );
  const where = { user_id: userId };
  const normalizedKeyword = String(keyword || '').trim();
  const normalizedType = String(type || 'all').trim();

  if (normalizedKeyword) {
    where.original_name = { contains: normalizedKeyword };
  }

  if (normalizedType && normalizedType !== 'all') {
    where.category = normalizedType;
  }

  const orderByField = SORT_FIELDS[sortBy] || SORT_FIELDS.createdAt;
  const orderDir = String(sortOrder || '').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const [totalCount, rows, quota] = await Promise.all([
    prisma.userFile.count({ where }),
    prisma.userFile.findMany({
      where,
      orderBy: { [orderByField]: orderDir },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    getQuota(userId),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));

  return {
    files: rows.map(formatUserFile),
    pagination: {
      currentPage: safePage,
      pageSize: safePageSize,
      totalCount,
      totalPages,
    },
    quota,
    categories: Object.keys(FILE_CATEGORIES),
  };
}

async function createUserFiles(userId, uploadedFiles) {
  const files = Array.isArray(uploadedFiles)
    ? uploadedFiles
    : uploadedFiles
      ? [uploadedFiles]
      : [];
  const { allocatedMb } = await assertUploadAllowed(userId, files);
  const movedFiles = [];

  try {
    for (const file of files) {
      const originalName = sanitizeOriginalName(file.originalname || file.filename);
      const extension = getFileExtension(originalName);
      const storedName = buildStoredName(originalName);
      const relativePath = buildRelativePath(userId, storedName);
      const absolutePath = resolveAbsolutePath(relativePath);

      await moveUploadedFile(file.path, absolutePath);

      movedFiles.push({
        originalName,
        storedName,
        relativePath,
        absolutePath,
        sizeBytes: BigInt(file.size || 0),
        mimeType: file.mimetype || '',
        extension,
        category: getFileCategory(extension),
      });
    }

    const created = await prisma.$transaction(async (tx) => {
      const records = [];

      for (const file of movedFiles) {
        const record = await tx.userFile.create({
          data: {
            user_id: userId,
            original_name: file.originalName,
            stored_name: file.storedName,
            relative_path: file.relativePath,
            size_bytes: file.sizeBytes,
            mime_type: file.mimeType,
            extension: file.extension,
            category: file.category,
          },
        });
        records.push(record);
      }

      await tx.userStorage.upsert({
        where: { user_id: userId },
        update: {
          used_mb: { increment: allocatedMb },
        },
        create: {
          user_id: userId,
          used_mb: allocatedMb,
          total_mb: 1024,
        },
      });

      return records;
    });

    return {
      files: created.map(formatUserFile),
      quota: await getQuota(userId),
    };
  } catch (error) {
    await Promise.all(movedFiles.map((file) => cleanupFile(file.absolutePath)));
    throw error;
  }
}

async function getUserFileForDownload(userId, id) {
  const fileId = Number.parseInt(id, 10);
  if (!Number.isInteger(fileId) || fileId <= 0) {
    return null;
  }

  const record = await prisma.userFile.findFirst({
    where: {
      id: fileId,
      user_id: userId,
    },
  });

  if (!record) {
    return null;
  }

  return {
    ...formatUserFile(record),
    absolutePath: resolveAbsolutePath(record.relative_path),
  };
}

async function deleteUserFiles(userId, ids) {
  const fileIds = Array.from(new Set(
    (Array.isArray(ids) ? ids : [])
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isInteger(id) && id > 0),
  ));

  if (fileIds.length === 0) {
    return { deleted: 0, quota: await getQuota(userId) };
  }

  const records = await prisma.userFile.findMany({
    where: {
      user_id: userId,
      id: { in: fileIds },
    },
  });

  if (records.length === 0) {
    return { deleted: 0, quota: await getQuota(userId) };
  }

  const releaseMb = records.reduce(
    (sum, record) => sum + fileBytesToAllocatedMb(record.size_bytes),
    0,
  );

  await prisma.$transaction(async (tx) => {
    await tx.userFile.deleteMany({
      where: {
        user_id: userId,
        id: { in: records.map((record) => record.id) },
      },
    });

    const storage = await tx.userStorage.upsert({
      where: { user_id: userId },
      update: {},
      create: {
        user_id: userId,
        used_mb: 0,
        total_mb: 1024,
      },
    });

    await tx.userStorage.update({
      where: { user_id: userId },
      data: {
        used_mb: Math.max(0, storage.used_mb - releaseMb),
      },
    });
  });

  await Promise.all(records.map((record) => cleanupFile(resolveAbsolutePath(record.relative_path))));

  return {
    deleted: records.length,
    quota: await getQuota(userId),
  };
}

module.exports = {
  FILE_CATEGORIES,
  cleanupUploadedFiles,
  createUserFiles,
  deleteUserFiles,
  getQuota,
  getUserFileForDownload,
  listUserFiles,
  resolveAbsolutePath,
  resolveUploadMaxBytes,
};
