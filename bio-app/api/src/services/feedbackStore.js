const fs = require('fs/promises');
const path = require('path');
const { prisma } = require('./db');
const { resolveDataPath } = require('../lib/storagePaths');

const MAX_CONTENT_LENGTH = 2000;
const MAX_PAGE_URL_LENGTH = 2048;
const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const FEEDBACK_TYPES = new Set(['bug', 'feature', 'other']);
const FEEDBACK_STATUSES = new Set(['pending', 'completed']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

const TYPE_LABELS = {
  bug: 'Bug反馈',
  feature: '功能建议',
  other: '其他',
};

function resolveFeedbackStorageRoot() {
  return path.resolve(process.env.FEEDBACK_STORAGE_DIR || resolveDataPath('feedback'));
}

function getFileExtension(filename) {
  return path.extname(String(filename || '')).toLowerCase();
}

function sanitizeOriginalName(filename) {
  const baseName = path.basename(String(filename || 'image'));
  return baseName.replace(/[^\w.\-()\s\u4e00-\u9fa5]/g, '_').slice(0, 255) || 'image';
}

function buildStoredName(originalName) {
  const extension = getFileExtension(originalName);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${unique}${extension}`;
}

function resolveAbsolutePath(relativePath) {
  const root = resolveFeedbackStorageRoot();
  const absolutePath = path.resolve(root, relativePath);
  const rootWithSeparator = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (absolutePath !== root && !absolutePath.startsWith(rootWithSeparator)) {
    throw new Error('Invalid file path');
  }

  return absolutePath;
}

function normalizeOptionalText(value, maxLength) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().slice(0, maxLength);
}

function isValidEmail(value) {
  if (!value) {
    return true;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  if (!value) {
    return true;
  }
  return /^[\d+\-()\s]{6,32}$/.test(value);
}

function parseImagesJson(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatFeedbackImage(image) {
  const relativePath = String(image?.path || '').replace(/^\/+/, '');
  return {
    path: relativePath,
    url: relativePath ? `/res/feedback/${relativePath.split(path.sep).join('/')}` : '',
    originalName: image?.original_name || image?.originalName || '',
    size: Number(image?.size || 0),
  };
}

function formatFeedback(record, { includeContent = true } = {}) {
  const images = parseImagesJson(record.images_json).map(formatFeedbackImage);
  const content = String(record.content || '');

  return {
    id: record.id,
    user_id: record.user_id,
    type: record.type,
    type_label: TYPE_LABELS[record.type] || record.type,
    content: includeContent ? content : undefined,
    content_preview: content.length > 80 ? `${content.slice(0, 80)}...` : content,
    page_url: record.page_url,
    contact_name: record.contact_name,
    contact_org: record.contact_org,
    contact_phone: record.contact_phone,
    contact_email: record.contact_email,
    images,
    image_count: images.length,
    status: record.status,
    created_at: record.created_at,
    updated_at: record.updated_at,
    completed_at: record.completed_at,
    user: record.user
      ? {
        id: record.user.id,
        name: record.user.name,
        email: record.user.email,
        organization: record.user.organization,
      }
      : undefined,
  };
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

async function cleanupUploadedFiles(uploadedFiles) {
  const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];
  await Promise.all(files.map(async (file) => {
    if (!file?.path) {
      return;
    }
    try {
      await fs.unlink(file.path);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }));
}

function validateFeedbackPayload(payload = {}) {
  const type = String(payload.type || '').trim();
  const content = String(payload.content || '').trim();
  const pageUrl = String(payload.page_url || '').trim().slice(0, MAX_PAGE_URL_LENGTH);
  const contactName = normalizeOptionalText(payload.contact_name, 100);
  const contactOrg = normalizeOptionalText(payload.contact_org, 255);
  const contactPhone = normalizeOptionalText(payload.contact_phone, 32);
  const contactEmail = normalizeOptionalText(payload.contact_email, 255);

  if (!FEEDBACK_TYPES.has(type)) {
    throw new Error('请选择有效的意见类型');
  }

  if (!content) {
    throw new Error('意见文本不能为空');
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`意见文本不能超过 ${MAX_CONTENT_LENGTH} 字`);
  }

  if (!pageUrl) {
    throw new Error('页面地址不能为空');
  }

  if (!isValidEmail(contactEmail)) {
    throw new Error('联系邮箱格式不正确');
  }

  if (!isValidPhone(contactPhone)) {
    throw new Error('联系手机号格式不正确');
  }

  return {
    type,
    content,
    page_url: pageUrl,
    contact_name: contactName,
    contact_org: contactOrg,
    contact_phone: contactPhone,
    contact_email: contactEmail,
  };
}

function validateUploadedImages(uploadedFiles = []) {
  const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];

  if (files.length > MAX_IMAGES) {
    throw new Error(`最多上传 ${MAX_IMAGES} 张图片`);
  }

  files.forEach((file) => {
    const extension = getFileExtension(file.originalname);
    if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
      throw new Error(`不支持的图片格式: ${extension || '(none)'}`);
    }

    const size = Number(file.size || 0);
    if (size <= 0) {
      throw new Error('图片文件无效');
    }

    if (size > MAX_IMAGE_BYTES) {
      throw new Error('单张图片不能超过 5MB');
    }
  });

  return files;
}

async function persistFeedbackImages(feedbackId, uploadedFiles = []) {
  const savedImages = [];

  for (const file of uploadedFiles) {
    const originalName = sanitizeOriginalName(file.originalname);
    const storedName = buildStoredName(originalName);
    const relativePath = path.join(String(feedbackId), storedName);
    const destinationPath = resolveAbsolutePath(relativePath);

    await moveUploadedFile(file.path, destinationPath);

    savedImages.push({
      path: relativePath.split(path.sep).join('/'),
      original_name: originalName,
      size: Number(file.size || 0),
    });
  }

  return savedImages;
}

async function createFeedback(userId, payload, uploadedFiles = []) {
  const normalized = validateFeedbackPayload(payload);
  const files = validateUploadedImages(uploadedFiles);

  const feedback = await prisma.feedback.create({
    data: {
      user_id: userId,
      ...normalized,
      images_json: null,
      status: 'pending',
    },
  });

  try {
    const savedImages = await persistFeedbackImages(feedback.id, files);
    const updated = await prisma.feedback.update({
      where: { id: feedback.id },
      data: {
        images_json: savedImages.length > 0 ? JSON.stringify(savedImages) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true,
          },
        },
      },
    });

    return formatFeedback(updated);
  } catch (error) {
    await prisma.feedback.delete({ where: { id: feedback.id } }).catch(() => {});
    throw error;
  }
}

async function listFeedbacks({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  skip = 0,
  status = '',
  type = '',
  keyword = '',
} = {}) {
  const normalizedPageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));
  const where = {};

  if (status && FEEDBACK_STATUSES.has(status)) {
    where.status = status;
  }

  if (type && FEEDBACK_TYPES.has(type)) {
    where.type = type;
  }

  const normalizedKeyword = String(keyword || '').trim();
  if (normalizedKeyword) {
    where.OR = [
      { content: { contains: normalizedKeyword } },
      { contact_name: { contains: normalizedKeyword } },
      { contact_org: { contains: normalizedKeyword } },
      { contact_email: { contains: normalizedKeyword } },
      { contact_phone: { contains: normalizedKeyword } },
      { page_url: { contains: normalizedKeyword } },
      { user: { name: { contains: normalizedKeyword } } },
      { user: { email: { contains: normalizedKeyword } } },
    ];
  }

  const [totalCount, records] = await Promise.all([
    prisma.feedback.count({ where }),
    prisma.feedback.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: normalizedPageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / normalizedPageSize));

  return {
    feedbacks: records.map((record) => formatFeedback(record)),
    pagination: {
      currentPage: page,
      pageSize: normalizedPageSize,
      totalCount,
      totalPages,
    },
  };
}

async function getFeedbackById(id) {
  const feedbackId = Number(id);
  if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
    return null;
  }

  const record = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          organization: true,
        },
      },
    },
  });

  if (!record) {
    return null;
  }

  return formatFeedback(record);
}

async function updateFeedbackStatus(id, status) {
  const feedbackId = Number(id);
  if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
    throw new Error('Invalid feedback id');
  }

  const normalizedStatus = String(status || '').trim();
  if (!FEEDBACK_STATUSES.has(normalizedStatus)) {
    throw new Error('Invalid feedback status');
  }

  const existing = await prisma.feedback.findUnique({ where: { id: feedbackId } });
  if (!existing) {
    return null;
  }

  const updated = await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      status: normalizedStatus,
      completed_at: normalizedStatus === 'completed' ? new Date() : null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          organization: true,
        },
      },
    },
  });

  return formatFeedback(updated);
}

module.exports = {
  MAX_CONTENT_LENGTH,
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
  cleanupUploadedFiles,
  createFeedback,
  getFeedbackById,
  listFeedbacks,
  updateFeedbackStatus,
};
