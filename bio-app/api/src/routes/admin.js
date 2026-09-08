const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { output } = require('../lib/response');
const { requireAdmin } = require('../middleware/auth');
const { prisma } = require('../services/db');
const { resolveAbsolutePath } = require('../services/userFileStore');
const {
  ROLE_ADMIN,
  ROLE_DATA_ADMIN,
  parseRole,
  canManageDatasetRows,
} = require('../constants/roles');
const {
  extractSummaryFromHtml,
  normalizeLegacyContentHtml,
  parseDocumentContentHtml,
} = require('../utils/documentContent');

const router = express.Router();
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const BYTES_PER_MB = 1024 * 1024;
const PERMISSION_ACTION = 'edit';
const EDITABLE_TABLES = [
  'parttable',
  'plasmidneedtable',
  'backbonetable',
];
const TASK_STATUSES = new Set(['pending', 'running', 'completed', 'failed']);
const APP_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const DOCUMENT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const SETTING_KEY_PATTERN = /^[A-Za-z0-9._:-]+$/;
const SENSITIVE_SETTING_KEY_PATTERN = /(password|secret|token|private[_-]?key)/i;
const JSON_PREVIEW_STRING_LENGTH = 500;
const JSON_PREVIEW_ARRAY_ITEMS = 10;
const JSON_PREVIEW_OBJECT_KEYS = 20;

function parsePositiveInt(value, fallback) {
  const normalized = value === undefined || value === null ? '' : value.toString().trim();

  if (!/^\d+$/.test(normalized)) {
    return fallback;
  }

  const parsed = Number.parseInt(normalized, 10);
  return parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInt(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = value.toString().trim();

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  return Number.parseInt(normalized, 10);
}

function parseUserId(value) {
  return parsePositiveInt(value, null);
}

function parseTaskId(value) {
  return parsePositiveInt(value, null);
}

function parsePagination(query) {
  const currentPage = parsePositiveInt(query.page, 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE));

  return {
    currentPage,
    pageSize,
    skip: (currentPage - 1) * pageSize,
  };
}

function toStorageInfo(storage) {
  return {
    used_mb: storage?.used_mb || 0,
    total_mb: storage?.total_mb || 1024,
  };
}

function toAdminInfo(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    title: user.title,
    avatar: user.avatar,
  };
}

function getAdminSummary(user) {
  return {
    admin: toAdminInfo(user),
    summary: {
      users: { ready: true },
      tasks: { ready: true },
      files: { ready: true },
      apps: { ready: false },
      documents: { ready: true },
      settings: { ready: true },
    },
  };
}

function toSafeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.email,
    status: user.status,
    role: user.role,
    title: user.title,
    organization: user.organization,
    phone: user.phone,
    gender: user.gender,
    avatar: user.avatar,
    last_login_time: user.last_login_time,
    created_at: user.created_at,
    updated_at: user.updated_at,
    storage: toStorageInfo(user.storage),
    task_count: user._count?.tasks || 0,
    file_count: user._count?.files || 0,
  };
}

function toTaskUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    role: user.role,
    title: user.title,
    avatar: user.avatar,
  };
}

function toTaskApp(app) {
  if (!app) {
    return null;
  }

  return {
    id: app.id,
    title: app.title,
    icon: app.icon,
    route: app.route,
    app_color: app.app_color,
    status: app.status,
  };
}

function toAdminApp(app) {
  return {
    id: app.id,
    title: app.title,
    description: app.description,
    icon: app.icon,
    route: app.route,
    author: app.author,
    app_color: app.app_color,
    sort_order: app.sort_order,
    status: app.status,
    created_at: app.created_at,
    favorites_count: app._count?.favorites || 0,
    task_count: app._count?.tasks || 0,
  };
}

function parseOptionalBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = value.toString().trim().toLowerCase();

  if (['true', '1', 'yes'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no'].includes(normalized)) {
    return false;
  }

  return null;
}

function toAdminDocumentPage(page, { includeContent = true } = {}) {
  return {
    id: page.id,
    section_id: page.section_id,
    title: page.title,
    intro: page.intro,
    hero_image: page.hero_image || '',
    content_html: includeContent ? normalizeLegacyContentHtml(page.content_html) : undefined,
    content_summary: includeContent
      ? extractSummaryFromHtml(normalizeLegacyContentHtml(page.content_html))
      : undefined,
    sort_order: page.sort_order,
  };
}

function toAdminDocumentSection(section) {
  return {
    id: section.id,
    title: section.title,
    sort_order: section.sort_order,
    expanded_default: section.expanded_default,
    pages: (section.pages || []).map((page) => toAdminDocumentPage(page)),
  };
}

function normalizeDocumentSectionPayload(body = {}, { creating = false } = {}) {
  const id = (body.id || '').toString().trim();
  const hasSortOrder = Object.prototype.hasOwnProperty.call(body, 'sort_order');
  const sortOrder = parseSortOrder(body.sort_order, creating ? 0 : undefined);
  const hasExpandedDefault = Object.prototype.hasOwnProperty.call(body, 'expanded_default');
  const expandedDefault = parseOptionalBoolean(body.expanded_default, creating ? false : undefined);

  if (creating) {
    if (!id) {
      throw new Error('章节 ID 不能为空');
    }

    if (!DOCUMENT_ID_PATTERN.test(id)) {
      throw new Error('章节 ID 只能包含字母、数字、下划线和短横线');
    }
  } else if (Object.prototype.hasOwnProperty.call(body, 'id')) {
    throw new Error('不允许修改章节 ID');
  }

  if ((creating || Object.prototype.hasOwnProperty.call(body, 'title'))
    && !(body.title || '').toString().trim()) {
    throw new Error('章节标题不能为空');
  }

  if ((creating || hasSortOrder) && sortOrder === null) {
    throw new Error('排序值不合法');
  }

  if ((creating || hasExpandedDefault) && expandedDefault === null) {
    throw new Error('默认展开参数不合法');
  }

  const data = {};

  if (creating || Object.prototype.hasOwnProperty.call(body, 'title')) {
    data.title = (body.title || '').toString().trim();
  }

  if (creating || hasSortOrder) {
    data.sort_order = sortOrder;
  }

  if (creating || hasExpandedDefault) {
    data.expanded_default = expandedDefault;
  }

  return creating ? { id, ...data } : data;
}

function normalizeDocumentPagePayload(body = {}, { creating = false } = {}) {
  const id = (body.id || '').toString().trim();
  const sectionId = (body.section_id || '').toString().trim();
  const hasSortOrder = Object.prototype.hasOwnProperty.call(body, 'sort_order');
  const sortOrder = parseSortOrder(body.sort_order, creating ? 0 : undefined);
  const hasContentHtml = Object.prototype.hasOwnProperty.call(body, 'content_html');
  const contentHtml = parseDocumentContentHtml(body.content_html, {
    required: false,
  });

  if (creating) {
    if (!id) {
      throw new Error('页面 ID 不能为空');
    }

    if (!DOCUMENT_ID_PATTERN.test(id)) {
      throw new Error('页面 ID 只能包含字母、数字、下划线和短横线');
    }

    if (!sectionId) {
      throw new Error('所属章节不能为空');
    }

    if (!DOCUMENT_ID_PATTERN.test(sectionId)) {
      throw new Error('所属章节 ID 不合法');
    }
  } else if (Object.prototype.hasOwnProperty.call(body, 'id')) {
    throw new Error('不允许修改页面 ID');
  }

  if (!creating && Object.prototype.hasOwnProperty.call(body, 'section_id')) {
    if (!sectionId) {
      throw new Error('所属章节不能为空');
    }

    if (!DOCUMENT_ID_PATTERN.test(sectionId)) {
      throw new Error('所属章节 ID 不合法');
    }
  }

  if ((creating || Object.prototype.hasOwnProperty.call(body, 'title'))
    && !(body.title || '').toString().trim()) {
    throw new Error('页面标题不能为空');
  }

  if ((creating || hasSortOrder) && sortOrder === null) {
    throw new Error('排序值不合法');
  }

  const data = {};

  if (creating || Object.prototype.hasOwnProperty.call(body, 'section_id')) {
    data.section_id = sectionId;
  }

  if (creating || Object.prototype.hasOwnProperty.call(body, 'title')) {
    data.title = (body.title || '').toString().trim();
  }

  for (const field of ['intro', 'hero_image']) {
    if (creating || Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = body[field] === null || body[field] === undefined
        ? ''
        : body[field].toString();
    }
  }

  if (creating || hasContentHtml) {
    data.content_html = contentHtml ?? '';
  }

  if (creating || hasSortOrder) {
    data.sort_order = sortOrder;
  }

  return creating ? { id, ...data } : data;
}

function toAdminSetting(setting) {
  return {
    key: setting.key,
    value: setting.value,
    type: setting.type,
    group: setting.setting_group,
    description: setting.description,
    updated_at: setting.updated_at,
  };
}

function normalizeSettingKey(value) {
  const key = (value || '').toString().trim();

  if (!key) {
    throw new Error('设置 key 不能为空');
  }

  if (key.length > 128) {
    throw new Error('设置 key 不能超过 128 个字符');
  }

  if (!SETTING_KEY_PATTERN.test(key)) {
    throw new Error('设置 key 只能包含字母、数字、点、下划线、短横线和冒号');
  }

  if (SENSITIVE_SETTING_KEY_PATTERN.test(key)) {
    throw new Error('不允许通过接口保存敏感设置 key');
  }

  return key;
}

function normalizeSettingValue(value) {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    throw new Error('设置值无法序列化');
  }
}

function normalizeSettingPayload(body = {}) {
  return {
    value: normalizeSettingValue(body.value),
    type: (body.type || 'string').toString().trim().slice(0, 32) || 'string',
    setting_group: (body.group || body.setting_group || 'default').toString().trim().slice(0, 64) || 'default',
    description: (body.description || '').toString().slice(0, 512),
  };
}

function getAdminAppInclude() {
  return {
    _count: {
      select: {
        favorites: true,
        tasks: true,
      },
    },
  };
}

function parseAppStatus(value, fallback = null) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const status = parseNonNegativeInt(value);
  return status === 0 || status === 1 ? status : null;
}

function parseSortOrder(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = value.toString().trim();

  if (!/^-?\d+$/.test(normalized)) {
    return null;
  }

  return Number.parseInt(normalized, 10);
}

function buildAdminAppWhere(query = {}) {
  const where = {};
  const keyword = (query.keyword || '').toString().trim();
  const hasStatus = query.status !== undefined && query.status !== null && query.status !== '';
  const status = parseAppStatus(query.status);

  if (hasStatus && status === null) {
    throw new Error('App 状态不合法');
  }

  if (keyword) {
    where.OR = [
      { id: { contains: keyword } },
      { title: { contains: keyword } },
      { description: { contains: keyword } },
      { route: { contains: keyword } },
      { author: { contains: keyword } },
    ];
  }

  if (hasStatus) {
    where.status = status;
  }

  return where;
}

function normalizeAppPayload(body = {}, { creating = false } = {}) {
  const id = (body.id || '').toString().trim();
  const hasRoute = Object.prototype.hasOwnProperty.call(body, 'route');
  const route = hasRoute ? (body.route || '').toString().trim() : '';
  const hasStatus = Object.prototype.hasOwnProperty.call(body, 'status');
  const status = parseAppStatus(body.status, creating ? 1 : undefined);
  const hasSortOrder = Object.prototype.hasOwnProperty.call(body, 'sort_order');
  const sortOrder = parseSortOrder(body.sort_order);

  if (creating) {
    if (!id) {
      throw new Error('App ID 不能为空');
    }

    if (!APP_ID_PATTERN.test(id)) {
      throw new Error('App ID 只能包含字母、数字、下划线和短横线');
    }
  } else if (Object.prototype.hasOwnProperty.call(body, 'id')) {
    throw new Error('不允许修改 App ID');
  }

  if ((creating || hasRoute) && !route) {
    throw new Error('App 路由不能为空');
  }

  if ((creating || hasStatus) && status !== 0 && status !== 1) {
    throw new Error('App 状态不合法');
  }

  if ((creating || hasSortOrder) && sortOrder === null) {
    throw new Error('排序值不合法');
  }

  const data = {};

  for (const field of ['title', 'icon', 'author', 'app_color']) {
    if (creating || Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = (body[field] || '').toString().trim();
    }
  }

  if (creating || Object.prototype.hasOwnProperty.call(body, 'description')) {
    data.description = (body.description || '').toString();
  }

  if (creating || hasRoute) {
    data.route = route;
  }

  if (creating || hasSortOrder) {
    data.sort_order = sortOrder;
  }

  if (creating || hasStatus) {
    data.status = status;
  }

  return creating ? { id, ...data } : data;
}

function truncateString(value, maxLength = JSON_PREVIEW_STRING_LENGTH) {
  if (typeof value !== 'string' || value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function summarizeJsonValue(value, depth = 0) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (depth >= 2) {
    if (Array.isArray(value)) {
      return { type: 'array', length: value.length };
    }

    return { type: 'object', keys: Object.keys(value).length };
  }

  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length,
      items: value
        .slice(0, JSON_PREVIEW_ARRAY_ITEMS)
        .map((item) => summarizeJsonValue(item, depth + 1)),
      truncated: value.length > JSON_PREVIEW_ARRAY_ITEMS,
    };
  }

  const entries = Object.entries(value);
  const preview = {};

  for (const [key, entryValue] of entries.slice(0, JSON_PREVIEW_OBJECT_KEYS)) {
    preview[key] = summarizeJsonValue(entryValue, depth + 1);
  }

  return {
    ...preview,
    ...(entries.length > JSON_PREVIEW_OBJECT_KEYS
      ? { _truncated: true, _totalKeys: entries.length }
      : {}),
  };
}

function parseJsonField(value, { summarize = false, includeRawOnError = false } = {}) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return {
      value: summarize ? summarizeJsonValue(parsed) : parsed,
      parseError: false,
    };
  } catch (error) {
    return {
      value: includeRawOnError ? truncateString(value) : null,
      parseError: true,
    };
  }
}

function toAdminTaskBase(task, { detail = false } = {}) {
  return {
    id: task.id,
    user_id: task.user_id,
    app_id: task.app_id,
    name: task.name,
    status: task.status,
    scope: task.scope,
    operation: task.operation || '',
    error_msg: task.error_msg || '',
    created_at: task.created_at,
    user: toTaskUser(task.user),
    app: toTaskApp(task.app),
    share_count: task._count?.shares || 0,
    params: parseJsonField(task.params_json, {
      summarize: !detail,
      includeRawOnError: detail,
    }),
    result: parseJsonField(task.result_json, {
      summarize: !detail,
      includeRawOnError: detail,
    }),
  };
}

function toAdminTaskListItem(task) {
  return toAdminTaskBase(task);
}

function toAdminTaskDetail(task) {
  return {
    ...toAdminTaskBase(task, { detail: true }),
    shares: (task.shares || []).map((share) => ({
      id: share.id,
      task_id: share.task_id,
      owner_user_id: share.owner_user_id,
      target_user_id: share.target_user_id,
      permission: share.permission,
      created_at: share.created_at,
      owner: toTaskUser(share.owner),
      target: toTaskUser(share.target),
    })),
  };
}

function buildAdminTaskWhere(query = {}) {
  const where = {};
  const hasUserId = query.userId !== undefined && query.userId !== null && query.userId !== '';
  const userId = parseUserId(query.userId);
  const appId = (query.appId || '').toString().trim();
  const status = (query.status || '').toString().trim();
  const keyword = (query.keyword || '').toString().trim();

  if (hasUserId && !userId) {
    throw new Error('用户 ID 不合法');
  }

  if (userId) {
    where.user_id = userId;
  }

  if (appId) {
    where.app_id = appId;
  }

  if (status) {
    if (!TASK_STATUSES.has(status)) {
      throw new Error('任务状态不合法');
    }

    where.status = status;
  }

  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { operation: { contains: keyword } },
      { error_msg: { contains: keyword } },
      { user: { is: { name: { contains: keyword } } } },
      { user: { is: { email: { contains: keyword } } } },
      { app: { is: { title: { contains: keyword } } } },
    ];
  }

  return where;
}

function getAdminTaskInclude({ detail = false } = {}) {
  const baseInclude = {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: true,
        title: true,
        avatar: true,
      },
    },
    app: {
      select: {
        id: true,
        title: true,
        icon: true,
        route: true,
        app_color: true,
        status: true,
      },
    },
    _count: {
      select: { shares: true },
    },
  };

  if (!detail) {
    return baseInclude;
  }

  return {
    ...baseInclude,
    shares: {
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            role: true,
            title: true,
            avatar: true,
          },
        },
        target: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            role: true,
            title: true,
            avatar: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    },
  };
}

function toBigInt(value) {
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.max(0, Math.trunc(value)));
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return BigInt(value);
  }

  return 0n;
}

function toJsonSafeInteger(value) {
  const bigint = toBigInt(value);

  if (bigint <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(bigint);
  }

  return bigint.toString();
}

function bytesToMbNumber(bytes) {
  return Number((Number(toBigInt(bytes)) / BYTES_PER_MB).toFixed(2));
}

function bytesToUsedMb(bytes) {
  const totalBytes = toBigInt(bytes);

  if (totalBytes <= 0n) {
    return 0;
  }

  return Math.ceil(Number(totalBytes) / BYTES_PER_MB);
}

function sumFileBytes(records) {
  return records.reduce((sum, record) => sum + toBigInt(record.size_bytes), 0n);
}

function parseFileIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(
    value
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isInteger(id) && id > 0),
  ));
}

function normalizeExtension(value) {
  const normalized = (value || '').toString().trim().toLowerCase();

  if (!normalized) {
    return '';
  }

  return normalized.startsWith('.') ? normalized : `.${normalized}`;
}

function parseBeforeDate(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date;
}

function buildAdminFileWhere(input = {}, options = {}) {
  const where = {};
  const criteria = {};
  const fileIds = parseFileIds(input.fileIds);

  if (fileIds.length > 0) {
    where.id = { in: fileIds };
    criteria.fileIds = fileIds;
    return { where, criteria };
  }

  const hasUserId = input.userId !== undefined && input.userId !== null && input.userId !== '';
  const userId = parseUserId(input.userId);

  if (options.requireScope && !hasUserId) {
    throw new Error('清理范围必须提供 fileIds 或 userId');
  }

  if (hasUserId && !userId) {
    throw new Error('用户 ID 不合法');
  }

  if (userId) {
    where.user_id = userId;
    criteria.userId = userId;
  }

  const keyword = (input.keyword || '').toString().trim();
  if (keyword) {
    where.original_name = { contains: keyword };
    criteria.keyword = keyword;
  }

  const category = (input.category || '').toString().trim();
  if (category) {
    where.category = category;
    criteria.category = category;
  }

  const extension = normalizeExtension(input.extension);
  if (extension) {
    where.extension = extension;
    criteria.extension = extension;
  }

  const beforeDate = parseBeforeDate(input.beforeDate);
  if (beforeDate === false) {
    throw new Error('beforeDate 不合法');
  }

  if (beforeDate) {
    where.created_at = { lt: beforeDate };
    criteria.beforeDate = beforeDate.toISOString();
  }

  return { where, criteria };
}

function toAdminFile(record) {
  const sizeBytes = toJsonSafeInteger(record.size_bytes);

  return {
    id: record.id,
    user_id: record.user_id,
    original_name: record.original_name,
    stored_name: record.stored_name,
    relative_path: record.relative_path,
    size_bytes: sizeBytes,
    size_mb: bytesToMbNumber(record.size_bytes),
    mime_type: record.mime_type,
    extension: record.extension,
    category: record.category,
    created_at: record.created_at,
    user: record.user
      ? {
        id: record.user.id,
        name: record.user.name,
        email: record.user.email,
      }
      : null,
  };
}

function summarizeAdminFileRecords(records) {
  const totalSizeBytes = sumFileBytes(records);

  return {
    count: records.length,
    totalSizeBytes: toJsonSafeInteger(totalSizeBytes),
    totalSizeMb: bytesToMbNumber(totalSizeBytes),
    sampleFiles: records.slice(0, 10).map(toAdminFile),
  };
}

function resolveSafeResFilePath(relativePath) {
  const absolutePath = resolveAbsolutePath(relativePath);
  const resRoot = path.resolve(__dirname, '../../res');
  const resRootWithSeparator = resRoot.endsWith(path.sep) ? resRoot : `${resRoot}${path.sep}`;

  if (absolutePath !== resRoot && !absolutePath.startsWith(resRootWithSeparator)) {
    throw new Error('File path is outside api/res');
  }

  return absolutePath;
}

async function removeAdminFileFromDisk(record) {
  try {
    await fs.rm(resolveSafeResFilePath(record.relative_path));
    return null;
  } catch (error) {
    const file = {
      id: record.id,
      relative_path: record.relative_path,
      reason: error.message,
    };

    if (error.code === 'ENOENT') {
      return { type: 'missing', file };
    }

    return { type: 'failed', file };
  }
}

async function recomputeUserStorageUsage(userIds, tx) {
  for (const userId of userIds) {
    const remainingFiles = await tx.userFile.findMany({
      where: { user_id: userId },
      select: { size_bytes: true },
    });
    const usedMb = bytesToUsedMb(sumFileBytes(remainingFiles));

    await tx.userStorage.upsert({
      where: { user_id: userId },
      update: { used_mb: usedMb },
      create: {
        user_id: userId,
        used_mb: usedMb,
        total_mb: 1024,
      },
    });
  }
}

function buildPermissionMatrix(permissions = []) {
  const enabledSet = new Set(
    permissions
      .filter((permission) => permission.action === PERMISSION_ACTION)
      .map((permission) => permission.resource),
  );

  return EDITABLE_TABLES.map((resource) => ({
    resource,
    action: PERMISSION_ACTION,
    enabled: enabledSet.has(resource),
  }));
}

function getEditableTables(permissions = []) {
  return buildPermissionMatrix(permissions)
    .filter((permission) => permission.enabled)
    .map((permission) => permission.resource);
}

function getEditableTablesForUser(user, permissions = []) {
  if (canManageDatasetRows(user?.role)) {
    return [...EDITABLE_TABLES];
  }

  return getEditableTables(permissions);
}

async function syncDataAdminPermissions(userId, role, tx) {
  await tx.userPermission.deleteMany({
    where: {
      user_id: userId,
      action: PERMISSION_ACTION,
      resource: { in: EDITABLE_TABLES },
    },
  });

  if (Number(role) === ROLE_DATA_ADMIN) {
    await tx.userPermission.createMany({
      data: EDITABLE_TABLES.map((resource) => ({
        user_id: userId,
        resource,
        action: PERMISSION_ACTION,
      })),
    });
  }
}

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.ip || '')
    .toString()
    .split(',')[0]
    .trim();
}

function writeAdminAuditLog(admin, req, {
  action,
  resource,
  resourceId,
  detail,
}, tx = prisma) {
  return tx.adminAuditLog.create({
    data: {
      admin_user_id: admin.id,
      action,
      resource,
      resource_id: resourceId ? resourceId.toString() : '',
      detail_json: detail ? JSON.stringify(detail) : null,
      ip: getClientIp(req),
    },
  });
}

async function requireExistingUser(userId, res, options = {}) {
  if (!userId) {
    res.json(output(null, 3, '用户 ID 不合法'));
    return null;
  }

  const include = {
    storage: true,
    _count: {
      select: {
        tasks: true,
        files: true,
      },
    },
  };

  if (options.permissions) {
    include.permissions = true;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include,
  });

  if (!user) {
    res.json(output(null, 3, '用户不存在'));
    return null;
  }

  return user;
}

async function handleSummary(req, res) {
  const user = await requireAdmin(req, res);

  if (!user) {
    return;
  }

  res.json(output(getAdminSummary(user), 1));
}

router.get('/apps', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  let where;
  try {
    where = buildAdminAppWhere(req.query || {});
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  const { currentPage, pageSize, skip } = parsePagination(req.query || {});

  try {
    const [totalCount, apps] = await Promise.all([
      prisma.app.count({ where }),
      prisma.app.findMany({
        where,
        include: getAdminAppInclude(),
        orderBy: [
          { sort_order: 'asc' },
          { created_at: 'desc' },
        ],
        skip,
        take: pageSize,
      }),
    ]);

    res.json(output({
      apps: apps.map(toAdminApp),
      pagination: {
        currentPage,
        pageSize,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      },
    }, 1));
  } catch (error) {
    console.error('admin/apps failed:', error);
    res.json(output(null, 0, 'App 列表加载失败'));
  }
});

router.get('/apps/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const appId = (req.params.id || '').toString().trim();

  if (!appId) {
    res.json(output(null, 3, 'App ID 不能为空'));
    return;
  }

  try {
    const app = await prisma.app.findUnique({
      where: { id: appId },
      include: getAdminAppInclude(),
    });

    if (!app) {
      res.json(output(null, 3, 'App 不存在'));
      return;
    }

    res.json(output({ app: toAdminApp(app) }, 1));
  } catch (error) {
    console.error('admin/apps/detail failed:', error);
    res.json(output(null, 0, 'App 详情加载失败'));
  }
});

router.post('/apps', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  let data;
  try {
    data = normalizeAppPayload(req.body || {}, { creating: true });
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  try {
    const createdApp = await prisma.$transaction(async (tx) => {
      const existing = await tx.app.findUnique({
        where: { id: data.id },
        select: { id: true },
      });

      if (existing) {
        return null;
      }

      const created = await tx.app.create({
        data,
        include: getAdminAppInclude(),
      });

      await writeAdminAuditLog(admin, req, {
        action: 'create_app',
        resource: 'apps',
        resourceId: created.id,
        detail: { app: toAdminApp(created) },
      }, tx);

      return created;
    });

    if (!createdApp) {
      res.json(output(null, 3, 'App ID 已存在'));
      return;
    }

    res.json(output({ app: toAdminApp(createdApp) }, 1));
  } catch (error) {
    console.error('admin/apps/create failed:', error);
    res.json(output(null, 0, 'App 创建失败'));
  }
});

router.put('/apps/sort', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const items = Array.isArray(req.body?.items) ? req.body.items : null;

  if (!items || items.length === 0) {
    res.json(output(null, 3, '排序参数不合法'));
    return;
  }

  const normalizedItems = [];

  for (const item of items) {
    const id = (item?.id || '').toString().trim();
    const sortOrder = parseSortOrder(item?.sort_order);

    if (!id || sortOrder === null) {
      res.json(output(null, 3, '排序参数不合法'));
      return;
    }

    normalizedItems.push({ id, sort_order: sortOrder });
  }

  try {
    const updatedApps = await prisma.$transaction(async (tx) => {
      const ids = normalizedItems.map((item) => item.id);
      const existingApps = await tx.app.findMany({
        where: { id: { in: ids } },
        include: getAdminAppInclude(),
      });

      if (existingApps.length !== new Set(ids).size) {
        return null;
      }

      const beforeMap = new Map(existingApps.map((app) => [app.id, toAdminApp(app)]));

      for (const item of normalizedItems) {
        await tx.app.update({
          where: { id: item.id },
          data: { sort_order: item.sort_order },
        });
      }

      const updated = await tx.app.findMany({
        where: { id: { in: ids } },
        include: getAdminAppInclude(),
        orderBy: [
          { sort_order: 'asc' },
          { created_at: 'desc' },
        ],
      });

      await writeAdminAuditLog(admin, req, {
        action: 'sort_apps',
        resource: 'apps',
        resourceId: '',
        detail: {
          before: normalizedItems.map((item) => ({
            id: item.id,
            sort_order: beforeMap.get(item.id)?.sort_order,
          })),
          after: normalizedItems,
        },
      }, tx);

      return updated;
    });

    if (!updatedApps) {
      res.json(output(null, 3, '部分 App 不存在'));
      return;
    }

    res.json(output({ apps: updatedApps.map(toAdminApp) }, 1));
  } catch (error) {
    console.error('admin/apps/sort failed:', error);
    res.json(output(null, 0, 'App 排序更新失败'));
  }
});

router.put('/apps/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const appId = (req.params.id || '').toString().trim();

  if (!appId) {
    res.json(output(null, 3, 'App ID 不能为空'));
    return;
  }

  let data;
  try {
    data = normalizeAppPayload(req.body || {});
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  try {
    const updatedApp = await prisma.$transaction(async (tx) => {
      const existing = await tx.app.findUnique({
        where: { id: appId },
        include: getAdminAppInclude(),
      });

      if (!existing) {
        return null;
      }

      const updated = await tx.app.update({
        where: { id: appId },
        data,
        include: getAdminAppInclude(),
      });

      await writeAdminAuditLog(admin, req, {
        action: 'update_app',
        resource: 'apps',
        resourceId: appId,
        detail: {
          before: toAdminApp(existing),
          after: toAdminApp(updated),
        },
      }, tx);

      return updated;
    });

    if (!updatedApp) {
      res.json(output(null, 3, 'App 不存在'));
      return;
    }

    res.json(output({ app: toAdminApp(updatedApp) }, 1));
  } catch (error) {
    console.error('admin/apps/update failed:', error);
    res.json(output(null, 0, 'App 更新失败'));
  }
});

router.put('/apps/:id/status', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const appId = (req.params.id || '').toString().trim();
  const status = parseAppStatus(req.body?.status);

  if (!appId) {
    res.json(output(null, 3, 'App ID 不能为空'));
    return;
  }

  if (status !== 0 && status !== 1) {
    res.json(output(null, 3, 'App 状态不合法'));
    return;
  }

  try {
    const updatedApp = await prisma.$transaction(async (tx) => {
      const existing = await tx.app.findUnique({
        where: { id: appId },
        include: getAdminAppInclude(),
      });

      if (!existing) {
        return null;
      }

      const updated = await tx.app.update({
        where: { id: appId },
        data: { status },
        include: getAdminAppInclude(),
      });

      await writeAdminAuditLog(admin, req, {
        action: 'update_app_status',
        resource: 'apps',
        resourceId: appId,
        detail: {
          before: { status: existing.status },
          after: { status },
        },
      }, tx);

      return updated;
    });

    if (!updatedApp) {
      res.json(output(null, 3, 'App 不存在'));
      return;
    }

    res.json(output({ app: toAdminApp(updatedApp) }, 1));
  } catch (error) {
    console.error('admin/apps/status failed:', error);
    res.json(output(null, 0, 'App 状态更新失败'));
  }
});

router.get('/tasks', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  let where;
  try {
    where = buildAdminTaskWhere(req.query || {});
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  const { currentPage, pageSize, skip } = parsePagination(req.query || {});

  try {
    const [totalCount, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: getAdminTaskInclude(),
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    res.json(output({
      tasks: tasks.map(toAdminTaskListItem),
      pagination: {
        currentPage,
        pageSize,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      },
    }, 1));
  } catch (error) {
    console.error('admin/tasks failed:', error);
    res.json(output(null, 0, '任务列表加载失败'));
  }
});

router.get('/tasks/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const taskId = parseTaskId(req.params.id);

  if (!taskId) {
    res.json(output(null, 3, '任务 ID 不合法'));
    return;
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: getAdminTaskInclude({ detail: true }),
    });

    if (!task) {
      res.json(output(null, 3, '任务不存在'));
      return;
    }

    res.json(output({ task: toAdminTaskDetail(task) }, 1));
  } catch (error) {
    console.error('admin/tasks/detail failed:', error);
    res.json(output(null, 0, '任务详情加载失败'));
  }
});

router.put('/tasks/:id/status', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const taskId = parseTaskId(req.params.id);
  const status = (req.body?.status || '').toString().trim();

  if (!taskId) {
    res.json(output(null, 3, '任务 ID 不合法'));
    return;
  }

  if (!TASK_STATUSES.has(status)) {
    res.json(output(null, 3, '任务状态不合法'));
    return;
  }

  const data = { status };

  if (Object.prototype.hasOwnProperty.call(req.body || {}, 'error_msg')) {
    const errorMsg = req.body.error_msg;
    data.error_msg = errorMsg === null || errorMsg === undefined
      ? null
      : errorMsg.toString().slice(0, 512);
  }

  try {
    const updatedTask = await prisma.$transaction(async (tx) => {
      const existing = await tx.task.findUnique({
        where: { id: taskId },
        include: getAdminTaskInclude(),
      });

      if (!existing) {
        return null;
      }

      const updated = await tx.task.update({
        where: { id: taskId },
        data,
        include: getAdminTaskInclude(),
      });

      await writeAdminAuditLog(admin, req, {
        action: 'update_task_status',
        resource: 'tasks',
        resourceId: taskId,
        detail: {
          task: {
            id: existing.id,
            user_id: existing.user_id,
            app_id: existing.app_id,
            name: existing.name,
          },
          before: {
            status: existing.status,
            error_msg: existing.error_msg || '',
          },
          after: {
            status: updated.status,
            error_msg: updated.error_msg || '',
          },
        },
      }, tx);

      return updated;
    });

    if (!updatedTask) {
      res.json(output(null, 3, '任务不存在'));
      return;
    }

    res.json(output({ task: toAdminTaskListItem(updatedTask) }, 1));
  } catch (error) {
    console.error('admin/tasks/status failed:', error);
    res.json(output(null, 0, '任务状态更新失败'));
  }
});

router.delete('/tasks/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const taskId = parseTaskId(req.params.id);

  if (!taskId) {
    res.json(output(null, 3, '任务 ID 不合法'));
    return;
  }

  try {
    const deletedTask = await prisma.$transaction(async (tx) => {
      const existing = await tx.task.findUnique({
        where: { id: taskId },
        include: getAdminTaskInclude(),
      });

      if (!existing) {
        return null;
      }

      await tx.task.delete({
        where: { id: taskId },
      });

      await writeAdminAuditLog(admin, req, {
        action: 'delete_task',
        resource: 'tasks',
        resourceId: taskId,
        detail: {
          task: {
            id: existing.id,
            user_id: existing.user_id,
            app_id: existing.app_id,
            name: existing.name,
            status: existing.status,
            share_count: existing._count?.shares || 0,
            user: toTaskUser(existing.user),
            app: toTaskApp(existing.app),
          },
        },
      }, tx);

      return existing;
    });

    if (!deletedTask) {
      res.json(output(null, 3, '任务不存在'));
      return;
    }

    res.json(output({
      deleted: true,
      task: toAdminTaskListItem(deletedTask),
    }, 1));
  } catch (error) {
    console.error('admin/tasks/delete failed:', error);
    res.json(output(null, 0, '任务删除失败'));
  }
});

router.get('/files', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  let filter;
  try {
    filter = buildAdminFileWhere(req.query || {});
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  const { currentPage, pageSize, skip } = parsePagination(req.query || {});

  try {
    const [totalCount, files] = await Promise.all([
      prisma.userFile.count({ where: filter.where }),
      prisma.userFile.findMany({
        where: filter.where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    res.json(output({
      files: files.map(toAdminFile),
      pagination: {
        currentPage,
        pageSize,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      },
    }, 1));
  } catch (error) {
    console.error('admin/files failed:', error);
    res.json(output(null, 0, '文件列表加载失败'));
  }
});

router.post('/files/cleanup/preview', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  let filter;
  try {
    filter = buildAdminFileWhere(req.body || {}, { requireScope: true });
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  try {
    const files = await prisma.userFile.findMany({
      where: filter.where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json(output({
      criteria: filter.criteria,
      ...summarizeAdminFileRecords(files),
    }, 1));
  } catch (error) {
    console.error('admin/files/cleanup/preview failed:', error);
    res.json(output(null, 0, '文件清理预览失败'));
  }
});

router.post('/files/cleanup', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  if (req.body?.confirm !== true) {
    res.json(output(null, 3, '请确认清理操作'));
    return;
  }

  let filter;
  try {
    filter = buildAdminFileWhere(req.body || {}, { requireScope: true });
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  try {
    const files = await prisma.userFile.findMany({
      where: filter.where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    const summary = summarizeAdminFileRecords(files);
    const deletedIds = files.map((file) => file.id);
    const affectedUserIds = Array.from(new Set(files.map((file) => file.user_id)));

    if (deletedIds.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.userFile.deleteMany({
          where: { id: { in: deletedIds } },
        });

        await recomputeUserStorageUsage(affectedUserIds, tx);
      });
    }

    const diskResults = await Promise.all(files.map(removeAdminFileFromDisk));
    const missingFiles = diskResults
      .filter((result) => result?.type === 'missing')
      .map((result) => result.file);
    const failedFiles = diskResults
      .filter((result) => result?.type === 'failed')
      .map((result) => result.file);

    await writeAdminAuditLog(admin, req, {
      action: 'cleanup_user_files',
      resource: 'user_files',
      resourceId: filter.criteria.userId || '',
      detail: {
        criteria: filter.criteria,
        deletedCount: summary.count,
        totalSizeBytes: summary.totalSizeBytes,
        totalSizeMb: summary.totalSizeMb,
        affectedUserIds,
        missingCount: missingFiles.length,
        failedCount: failedFiles.length,
      },
    });

    res.json(output({
      criteria: filter.criteria,
      deletedCount: summary.count,
      count: summary.count,
      totalSizeBytes: summary.totalSizeBytes,
      totalSizeMb: summary.totalSizeMb,
      affectedUserIds,
      missingFiles,
      failedFiles,
      sampleFiles: summary.sampleFiles,
    }, 1));
  } catch (error) {
    console.error('admin/files/cleanup failed:', error);
    res.json(output(null, 0, '文件清理失败'));
  }
});

router.get('/documents', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  try {
    const sections = await prisma.documentSection.findMany({
      include: {
        pages: {
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { sort_order: 'asc' },
    });

    res.json(output({ sections: sections.map(toAdminDocumentSection) }, 1));
  } catch (error) {
    console.error('admin/documents failed:', error);
    res.json(output(null, 0, '帮助文档加载失败'));
  }
});

router.post('/documents/sections', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  let data;
  try {
    data = normalizeDocumentSectionPayload(req.body || {}, { creating: true });
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  try {
    const createdSection = await prisma.$transaction(async (tx) => {
      const existing = await tx.documentSection.findUnique({
        where: { id: data.id },
        select: { id: true },
      });

      if (existing) {
        return null;
      }

      const created = await tx.documentSection.create({
        data,
        include: { pages: true },
      });

      await writeAdminAuditLog(admin, req, {
        action: 'create_document_section',
        resource: 'document_sections',
        resourceId: created.id,
        detail: { section: toAdminDocumentSection(created) },
      }, tx);

      return created;
    });

    if (!createdSection) {
      res.json(output(null, 3, '章节 ID 已存在'));
      return;
    }

    res.json(output({ section: toAdminDocumentSection(createdSection) }, 1));
  } catch (error) {
    console.error('admin/documents/sections/create failed:', error);
    res.json(output(null, 0, '章节创建失败'));
  }
});

router.put('/documents/sections/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const sectionId = (req.params.id || '').toString().trim();

  if (!sectionId) {
    res.json(output(null, 3, '章节 ID 不能为空'));
    return;
  }

  let data;
  try {
    data = normalizeDocumentSectionPayload(req.body || {});
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  try {
    const updatedSection = await prisma.$transaction(async (tx) => {
      const existing = await tx.documentSection.findUnique({
        where: { id: sectionId },
        include: { pages: { orderBy: { sort_order: 'asc' } } },
      });

      if (!existing) {
        return null;
      }

      const updated = await tx.documentSection.update({
        where: { id: sectionId },
        data,
        include: { pages: { orderBy: { sort_order: 'asc' } } },
      });

      await writeAdminAuditLog(admin, req, {
        action: 'update_document_section',
        resource: 'document_sections',
        resourceId: sectionId,
        detail: {
          before: toAdminDocumentSection(existing),
          after: toAdminDocumentSection(updated),
        },
      }, tx);

      return updated;
    });

    if (!updatedSection) {
      res.json(output(null, 3, '章节不存在'));
      return;
    }

    res.json(output({ section: toAdminDocumentSection(updatedSection) }, 1));
  } catch (error) {
    console.error('admin/documents/sections/update failed:', error);
    res.json(output(null, 0, '章节更新失败'));
  }
});

router.delete('/documents/sections/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const sectionId = (req.params.id || '').toString().trim();

  if (!sectionId) {
    res.json(output(null, 3, '章节 ID 不能为空'));
    return;
  }

  try {
    const deletedSection = await prisma.$transaction(async (tx) => {
      const existing = await tx.documentSection.findUnique({
        where: { id: sectionId },
        include: { pages: { orderBy: { sort_order: 'asc' } } },
      });

      if (!existing) {
        return { status: 'missing' };
      }

      if (existing.pages.length > 0) {
        return { status: 'has_pages', pageCount: existing.pages.length };
      }

      await tx.documentSection.delete({
        where: { id: sectionId },
      });

      await writeAdminAuditLog(admin, req, {
        action: 'delete_document_section',
        resource: 'document_sections',
        resourceId: sectionId,
        detail: { section: toAdminDocumentSection(existing) },
      }, tx);

      return { status: 'deleted', section: existing };
    });

    if (deletedSection.status === 'missing') {
      res.json(output(null, 3, '章节不存在'));
      return;
    }

    if (deletedSection.status === 'has_pages') {
      res.json(output(null, 3, '章节下还有页面，请先删除页面'));
      return;
    }

    res.json(output({
      deleted: true,
      section: toAdminDocumentSection(deletedSection.section),
    }, 1));
  } catch (error) {
    console.error('admin/documents/sections/delete failed:', error);
    res.json(output(null, 0, '章节删除失败'));
  }
});

router.post('/documents/pages', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  let data;
  try {
    data = normalizeDocumentPagePayload(req.body || {}, { creating: true });
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  try {
    const createdPage = await prisma.$transaction(async (tx) => {
      const [existingPage, existingSection] = await Promise.all([
        tx.documentPage.findUnique({
          where: { id: data.id },
          select: { id: true },
        }),
        tx.documentSection.findUnique({
          where: { id: data.section_id },
          select: { id: true },
        }),
      ]);

      if (existingPage) {
        return { status: 'duplicate' };
      }

      if (!existingSection) {
        return { status: 'missing_section' };
      }

      const created = await tx.documentPage.create({ data });

      await writeAdminAuditLog(admin, req, {
        action: 'create_document_page',
        resource: 'document_pages',
        resourceId: created.id,
        detail: { page: toAdminDocumentPage(created) },
      }, tx);

      return { status: 'created', page: created };
    });

    if (createdPage.status === 'duplicate') {
      res.json(output(null, 3, '页面 ID 已存在'));
      return;
    }

    if (createdPage.status === 'missing_section') {
      res.json(output(null, 3, '所属章节不存在'));
      return;
    }

    res.json(output({ page: toAdminDocumentPage(createdPage.page) }, 1));
  } catch (error) {
    console.error('admin/documents/pages/create failed:', error);
    res.json(output(null, 0, '页面创建失败'));
  }
});

router.put('/documents/pages/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const pageId = (req.params.id || '').toString().trim();

  if (!pageId) {
    res.json(output(null, 3, '页面 ID 不能为空'));
    return;
  }

  let data;
  try {
    data = normalizeDocumentPagePayload(req.body || {});
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  try {
    const updatedPage = await prisma.$transaction(async (tx) => {
      const existing = await tx.documentPage.findUnique({
        where: { id: pageId },
      });

      if (!existing) {
        return { status: 'missing' };
      }

      if (data.section_id && data.section_id !== existing.section_id) {
        const section = await tx.documentSection.findUnique({
          where: { id: data.section_id },
          select: { id: true },
        });

        if (!section) {
          return { status: 'missing_section' };
        }
      }

      const updated = await tx.documentPage.update({
        where: { id: pageId },
        data,
      });

      await writeAdminAuditLog(admin, req, {
        action: 'update_document_page',
        resource: 'document_pages',
        resourceId: pageId,
        detail: {
          before: toAdminDocumentPage(existing),
          after: toAdminDocumentPage(updated),
        },
      }, tx);

      return { status: 'updated', page: updated };
    });

    if (updatedPage.status === 'missing') {
      res.json(output(null, 3, '页面不存在'));
      return;
    }

    if (updatedPage.status === 'missing_section') {
      res.json(output(null, 3, '所属章节不存在'));
      return;
    }

    res.json(output({ page: toAdminDocumentPage(updatedPage.page) }, 1));
  } catch (error) {
    console.error('admin/documents/pages/update failed:', error);
    res.json(output(null, 0, '页面更新失败'));
  }
});

router.delete('/documents/pages/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const pageId = (req.params.id || '').toString().trim();

  if (!pageId) {
    res.json(output(null, 3, '页面 ID 不能为空'));
    return;
  }

  try {
    const deletedPage = await prisma.$transaction(async (tx) => {
      const existing = await tx.documentPage.findUnique({
        where: { id: pageId },
      });

      if (!existing) {
        return null;
      }

      await tx.documentPage.delete({
        where: { id: pageId },
      });

      await writeAdminAuditLog(admin, req, {
        action: 'delete_document_page',
        resource: 'document_pages',
        resourceId: pageId,
        detail: { page: toAdminDocumentPage(existing) },
      }, tx);

      return existing;
    });

    if (!deletedPage) {
      res.json(output(null, 3, '页面不存在'));
      return;
    }

    res.json(output({
      deleted: true,
      page: toAdminDocumentPage(deletedPage),
    }, 1));
  } catch (error) {
    console.error('admin/documents/pages/delete failed:', error);
    res.json(output(null, 0, '页面删除失败'));
  }
});

router.get('/settings', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const group = (req.query.group || '').toString().trim();

  try {
    const settings = await prisma.systemSetting.findMany({
      where: group ? { setting_group: group } : undefined,
      orderBy: [
        { setting_group: 'asc' },
        { key: 'asc' },
      ],
    });

    res.json(output({ settings: settings.map(toAdminSetting) }, 1));
  } catch (error) {
    console.error('admin/settings failed:', error);
    res.json(output(null, 0, '系统设置加载失败'));
  }
});

router.put('/settings/:key', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  let key;
  let data;
  try {
    key = normalizeSettingKey(req.params.key);
    data = normalizeSettingPayload(req.body || {});
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  try {
    const setting = await prisma.$transaction(async (tx) => {
      const existing = await tx.systemSetting.findUnique({
        where: { key },
      });
      const updated = await tx.systemSetting.upsert({
        where: { key },
        update: data,
        create: { key, ...data },
      });

      await writeAdminAuditLog(admin, req, {
        action: existing ? 'update_system_setting' : 'create_system_setting',
        resource: 'system_settings',
        resourceId: key,
        detail: {
          before: existing ? toAdminSetting(existing) : null,
          after: toAdminSetting(updated),
        },
      }, tx);

      return updated;
    });

    res.json(output({ setting: toAdminSetting(setting) }, 1));
  } catch (error) {
    console.error('admin/settings/upsert failed:', error);
    res.json(output(null, 0, '系统设置保存失败'));
  }
});

router.delete('/settings/:key', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  let key;
  try {
    key = normalizeSettingKey(req.params.key);
  } catch (error) {
    res.json(output(null, 3, error.message));
    return;
  }

  try {
    const deletedSetting = await prisma.$transaction(async (tx) => {
      const existing = await tx.systemSetting.findUnique({
        where: { key },
      });

      if (!existing) {
        return null;
      }

      await tx.systemSetting.delete({
        where: { key },
      });

      await writeAdminAuditLog(admin, req, {
        action: 'delete_system_setting',
        resource: 'system_settings',
        resourceId: key,
        detail: { setting: toAdminSetting(existing) },
      }, tx);

      return existing;
    });

    if (!deletedSetting) {
      res.json(output(null, 3, '设置不存在'));
      return;
    }

    res.json(output({
      deleted: true,
      setting: toAdminSetting(deletedSetting),
    }, 1));
  } catch (error) {
    console.error('admin/settings/delete failed:', error);
    res.json(output(null, 0, '系统设置删除失败'));
  }
});

router.get('/users', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const { currentPage, pageSize, skip } = parsePagination(req.query || {});
  const keyword = (req.query.keyword || '').toString().trim();
  const status = req.query.status === undefined || req.query.status === ''
    ? null
    : parseNonNegativeInt(req.query.status);
  const role = req.query.role === undefined || req.query.role === ''
    ? null
    : parseNonNegativeInt(req.query.role);

  if ((req.query.status !== undefined && req.query.status !== '' && status === null)
    || (req.query.role !== undefined && req.query.role !== '' && role === null)) {
    res.json(output(null, 3, '筛选参数不合法'));
    return;
  }

  const where = {};

  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { email: { contains: keyword } },
      { title: { contains: keyword } },
    ];
  }

  if (status !== null) {
    where.status = status;
  }

  if (role !== null) {
    where.role = role;
  }

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: {
        storage: true,
        _count: {
          select: {
            tasks: true,
            files: true,
          },
        },
      },
      orderBy: { id: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  res.json(output({
    users: users.map(toSafeUser),
    pagination: {
      currentPage,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  }, 1));
});

router.get('/users/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const user = await requireExistingUser(parseUserId(req.params.id), res, { permissions: true });

  if (!user) {
    return;
  }

  res.json(output({
    user: toSafeUser(user),
    permissions: buildPermissionMatrix(user.permissions),
    editableTables: getEditableTablesForUser(user, user.permissions),
  }, 1));
});

router.put('/users/:id/status', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const userId = parseUserId(req.params.id);
  const status = parseNonNegativeInt(req.body?.status);

  if (status !== 0 && status !== 1) {
    res.json(output(null, 3, '状态参数不合法'));
    return;
  }

  if (userId === admin.id && status === 0) {
    res.json(output(null, 3, '管理员不能禁用自己'));
    return;
  }

  const user = await requireExistingUser(userId, res);

  if (!user) {
    return;
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { status },
      include: {
        storage: true,
        _count: {
          select: {
            tasks: true,
            files: true,
          },
        },
      },
    });

    await writeAdminAuditLog(admin, req, {
      action: 'update_user_status',
      resource: 'users',
      resourceId: userId,
      detail: {
        before: { status: user.status },
        after: { status },
      },
    }, tx);

    return updated;
  });

  res.json(output({ user: toSafeUser(updatedUser) }, 1));
});

router.put('/users/:id/role', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const userId = parseUserId(req.params.id);
  const role = parseRole(req.body?.role);

  if (role === null) {
    res.json(output(null, 3, '角色参数不合法，仅支持普通用户、数据管理员、管理员'));
    return;
  }

  if (userId === admin.id && role < ROLE_ADMIN) {
    res.json(output(null, 3, '管理员不能将自己降级'));
    return;
  }

  const user = await requireExistingUser(userId, res);

  if (!user) {
    return;
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { role },
      include: {
        storage: true,
        _count: {
          select: {
            tasks: true,
            files: true,
          },
        },
      },
    });

    await syncDataAdminPermissions(userId, role, tx);

    await writeAdminAuditLog(admin, req, {
      action: 'update_user_role',
      resource: 'users',
      resourceId: userId,
      detail: {
        before: { role: user.role },
        after: { role },
      },
    }, tx);

    return updated;
  });

  res.json(output({ user: toSafeUser(updatedUser) }, 1));
});

router.put('/users/:id/storage', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const userId = parseUserId(req.params.id);
  const totalMb = parseNonNegativeInt(req.body?.total_mb ?? req.body?.totalMb);

  if (!userId || totalMb === null || totalMb < 1) {
    res.json(output(null, 3, '存储空间参数不合法，请输入大于 0 的 MB 数值'));
    return;
  }

  const user = await requireExistingUser(userId, res);

  if (!user) {
    return;
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    await tx.userStorage.upsert({
      where: { user_id: userId },
      update: { total_mb: totalMb },
      create: {
        user_id: userId,
        used_mb: user.storage?.used_mb || 0,
        total_mb: totalMb,
      },
    });

    const updated = await tx.user.findUnique({
      where: { id: userId },
      include: {
        storage: true,
        _count: {
          select: {
            tasks: true,
            files: true,
          },
        },
      },
    });

    await writeAdminAuditLog(admin, req, {
      action: 'update_user_storage',
      resource: 'user_storage',
      resourceId: userId,
      detail: {
        before: toStorageInfo(user.storage),
        after: toStorageInfo(updated.storage),
      },
    }, tx);

    return updated;
  });

  res.json(output({ user: toSafeUser(updatedUser) }, 1));
});

router.get('/users/:id/permissions', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const user = await requireExistingUser(parseUserId(req.params.id), res, { permissions: true });

  if (!user) {
    return;
  }

  res.json(output({
    action: PERMISSION_ACTION,
    resources: EDITABLE_TABLES,
    permissions: buildPermissionMatrix(user.permissions),
    editableTables: getEditableTablesForUser(user, user.permissions),
  }, 1));
});

router.put('/users/:id/permissions', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const userId = parseUserId(req.params.id);
  const user = await requireExistingUser(userId, res, { permissions: true });

  if (!user) {
    return;
  }

  if (canManageDatasetRows(user.role)) {
    res.json(output({
      action: PERMISSION_ACTION,
      resources: EDITABLE_TABLES,
      permissions: buildPermissionMatrix(user.permissions),
      editableTables: getEditableTablesForUser(user, user.permissions),
    }, 1));
    return;
  }

  const editableTables = Array.isArray(req.body?.editableTables)
    ? [...new Set(req.body.editableTables.map((resource) => resource?.toString().trim()))]
    : null;

  if (!editableTables) {
    res.json(output(null, 3, '权限参数不合法'));
    return;
  }

  const invalidResources = editableTables.filter((resource) => !EDITABLE_TABLES.includes(resource));

  if (invalidResources.length > 0) {
    res.json(output(null, 3, '只能设置固定三表的编辑权限'));
    return;
  }

  const permissions = await prisma.$transaction(async (tx) => {
    await tx.userPermission.deleteMany({
      where: {
        user_id: userId,
        action: PERMISSION_ACTION,
        resource: { in: EDITABLE_TABLES },
      },
    });

    if (editableTables.length > 0) {
      await tx.userPermission.createMany({
        data: editableTables.map((resource) => ({
          user_id: userId,
          resource,
          action: PERMISSION_ACTION,
        })),
      });
    }

    await writeAdminAuditLog(admin, req, {
      action: 'update_user_permissions',
      resource: 'user_permissions',
      resourceId: userId,
      detail: {
        before: { editableTables: getEditableTables(user.permissions) },
        after: { editableTables },
      },
    }, tx);

    return tx.userPermission.findMany({
      where: {
        user_id: userId,
        action: PERMISSION_ACTION,
        resource: { in: EDITABLE_TABLES },
      },
    });
  });

  res.json(output({
    action: PERMISSION_ACTION,
    resources: EDITABLE_TABLES,
    permissions: buildPermissionMatrix(permissions),
    editableTables: getEditableTablesForUser({ role: user.role }, permissions),
  }, 1));
});

router.get('/health', handleSummary);
router.get('/summary', handleSummary);

const {
  listFeedbacks,
  getFeedbackById,
  updateFeedbackStatus,
} = require('../services/feedbackStore');

const FEEDBACK_TYPES = new Set(['bug', 'feature', 'other']);
const FEEDBACK_STATUSES = new Set(['pending', 'completed']);

router.get('/feedback', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const { currentPage, pageSize, skip } = parsePagination(req.query || {});
  const status = String(req.query?.status || '').trim();
  const type = String(req.query?.type || '').trim();
  const keyword = String(req.query?.keyword || '').trim();

  if (status && !FEEDBACK_STATUSES.has(status)) {
    res.json(output(null, 3, 'Invalid feedback status filter'));
    return;
  }

  if (type && !FEEDBACK_TYPES.has(type)) {
    res.json(output(null, 3, 'Invalid feedback type filter'));
    return;
  }

  try {
    const payload = await listFeedbacks({
      page: currentPage,
      pageSize,
      skip,
      status,
      type,
      keyword,
    });
    res.json(output(payload, 1));
  } catch (error) {
    console.error('admin/feedback list failed:', error);
    res.json(output(null, 0, 'Failed to load feedback list'));
  }
});

router.get('/feedback/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const feedbackId = parsePositiveInt(req.params.id, null);
  if (!feedbackId) {
    res.json(output(null, 3, 'Invalid feedback id'));
    return;
  }

  try {
    const feedback = await getFeedbackById(feedbackId);
    if (!feedback) {
      res.json(output(null, 0, 'Feedback not found'));
      return;
    }
    res.json(output({ feedback }, 1));
  } catch (error) {
    console.error('admin/feedback detail failed:', error);
    res.json(output(null, 0, 'Failed to load feedback detail'));
  }
});

router.put('/feedback/:id/status', async (req, res) => {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const feedbackId = parsePositiveInt(req.params.id, null);
  if (!feedbackId) {
    res.json(output(null, 3, 'Invalid feedback id'));
    return;
  }

  const status = String(req.body?.status || '').trim();
  if (!FEEDBACK_STATUSES.has(status)) {
    res.json(output(null, 3, 'Invalid feedback status'));
    return;
  }

  try {
    const feedback = await updateFeedbackStatus(feedbackId, status);
    if (!feedback) {
      res.json(output(null, 0, 'Feedback not found'));
      return;
    }

    await writeAdminAuditLog(admin, req, {
      action: 'feedback.update_status',
      resource: 'feedback',
      resourceId: String(feedbackId),
      detail: { status },
    });

    res.json(output({ feedback }, 1, 'Feedback status updated'));
  } catch (error) {
    console.error('admin/feedback status failed:', error);
    res.json(output(null, 0, error.message || 'Failed to update feedback status'));
  }
});

module.exports = router;
