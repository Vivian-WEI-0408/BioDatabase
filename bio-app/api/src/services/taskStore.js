const { prisma } = require('./db');
const { formatTaskDate, formatTaskDisplayId } = require('../lib/dates');

function buildTaskWhere(userId, scope) {
  const mineWhere = { user_id: userId };
  const sharingWhere = {
    OR: [
      { shares: { some: { target_user_id: userId } } },
      { shared_with_user_id: userId },
    ],
  };

  if (scope === 'mine') {
    return mineWhere;
  }

  if (scope === 'sharing') {
    return sharingWhere;
  }

  return {
    OR: [
      mineWhere,
      sharingWhere,
    ],
  };
}

function buildTaskInclude(currentUserId) {
  return {
    app: true,
    user: {
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    },
    shares: {
      where: { target_user_id: currentUserId },
      take: 1,
    },
    _count: {
      select: { shares: true },
    },
  };
}

function mapTask(task, currentUserId) {
  const isMine = task.user_id === currentUserId;
  const sharedToMe = !isMine
    && (
      task.shared_with_user_id === currentUserId
      || (Array.isArray(task.shares) && task.shares.length > 0)
    );

  return {
    id: formatTaskDisplayId(task.id),
    app: task.app.title,
    appColor: task.app.app_color,
    name: task.name,
    date: formatTaskDate(task.created_at),
    status: task.status,
    operation: task.operation || '',
    creator: {
      name: isMine ? 'Me' : task.user.name,
      avatar: task.user.avatar || '/images/avatar.png',
    },
    scope: isMine ? 'mine' : 'sharing',
    isMine,
    sharedToMe,
    permission: isMine ? 'owner' : 'read',
    sharedCount: task._count?.shares || 0,
  };
}

const SORT_KEYS = new Set(['id', 'app', 'name', 'date', 'status', 'creator']);

function buildTaskOrderBy(sortKey = 'id', sortDir = 'asc') {
  const direction = sortDir === 'desc' ? 'desc' : 'asc';

  switch (sortKey) {
    case 'app':
      return { app: { title: direction } };
    case 'name':
      return { name: direction };
    case 'date':
      return { created_at: direction };
    case 'status':
      return { status: direction };
    case 'creator':
      return { user: { name: direction } };
    case 'id':
    default:
      return { id: direction };
  }
}

function parseIdList(ids = []) {
  if (!Array.isArray(ids)) {
    return [];
  }

  return [...new Set(ids
    .map(parseTaskId)
    .filter((id) => Number.isInteger(id) && id > 0))];
}

function parseUserIdList(ids = []) {
  if (!Array.isArray(ids)) {
    return [];
  }

  return [...new Set(ids
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0))];
}

async function listTasks(userId, {
  scope = 'all',
  search = '',
  sortKey = 'id',
  sortDir = 'asc',
  sharedByUserId,
  sharedWithUserId,
} = {}) {
  const baseWhere = buildTaskWhere(userId, scope);
  const conditions = [baseWhere];

  if (search) {
    conditions.push({ name: { contains: search } });
  }

  const sharedById = Number(sharedByUserId);
  if (scope === 'sharing' && Number.isInteger(sharedById) && sharedById > 0) {
    conditions.push({ user_id: sharedById });
  }

  const sharedWithId = Number(sharedWithUserId);
  if ((scope === 'mine' || scope === 'all') && Number.isInteger(sharedWithId) && sharedWithId > 0) {
    conditions.push({ shares: { some: { target_user_id: sharedWithId } } });
  }

  const where = search
    ? { AND: conditions }
    : baseWhere;
  const filteredWhere = conditions.length > 1 ? { AND: conditions } : where;

  const normalizedSortKey = SORT_KEYS.has(sortKey) ? sortKey : 'id';

  const tasks = await prisma.task.findMany({
    where: filteredWhere,
    include: buildTaskInclude(userId),
    orderBy: buildTaskOrderBy(normalizedSortKey, sortDir),
  });

  return tasks.map((task) => mapTask(task, userId));
}

function parseTaskId(id) {
  if (typeof id === 'number') {
    return id;
  }

  if (typeof id === 'string' && /^\d+$/.test(id)) {
    return Number(id);
  }

  return NaN;
}

async function deleteTasks(userId, ids = []) {
  const numericIds = parseIdList(ids);

  if (numericIds.length === 0) {
    return 0;
  }

  const result = await prisma.task.deleteMany({
    where: {
      id: { in: numericIds },
      user_id: userId,
    },
  });

  return result.count;
}

async function updateTask(userId, { id, name, status } = {}) {
  const taskId = parseTaskId(id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return null;
  }

  const existing = await prisma.task.findFirst({
    where: {
      id: taskId,
      user_id: userId,
    },
    include: buildTaskInclude(userId),
  });

  if (!existing) {
    return null;
  }

  const data = {};

  if (typeof name === 'string' && name.trim()) {
    data.name = name.trim();
  }

  if (status && ['pending', 'running', 'completed', 'failed', 'cancelled'].includes(status)) {
    data.status = status;
  }

  if (Object.keys(data).length === 0) {
    return mapTask(existing, userId);
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: buildTaskInclude(userId),
  });

  return mapTask(updated, userId);
}

async function createTask(userId, { appId = 't-pro', name, operation, params, displayMeta } = {}) {
  const trimmedName = typeof name === 'string' ? name.trim() : '';

  if (!trimmedName || !operation) {
    return null;
  }

  const paramsPayload = {
    apiParams: params || {},
    ...(displayMeta ? { displayMeta } : {}),
  };

  const task = await prisma.task.create({
    data: {
      user_id: userId,
      app_id: appId,
      name: trimmedName,
      status: 'pending',
      scope: 'mine',
      operation,
      params_json: JSON.stringify(paramsPayload),
    },
    include: buildTaskInclude(userId),
  });

  return mapTask(task, userId);
}

async function getTaskDetail(userId, id) {
  const taskId = parseTaskId(id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return null;
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { user_id: userId },
        { shares: { some: { target_user_id: userId } } },
        { shared_with_user_id: userId },
      ],
    },
    include: buildTaskInclude(userId),
  });

  if (!task) {
    return null;
  }

  const mapped = mapTask(task, userId);
  let params = null;
  let result = null;

  if (task.params_json) {
    try {
      params = JSON.parse(task.params_json);
    } catch (err) {
      params = null;
    }
  }

  if (task.result_json) {
    try {
      result = JSON.parse(task.result_json);
    } catch (err) {
      result = null;
    }
  }

  return {
    ...mapped,
    errorMsg: task.error_msg || '',
    params,
    result,
    createdAt: task.created_at,
  };
}

async function shareTasks(ownerUserId, { taskIds = [], userIds = [], permission = 'read' } = {}) {
  const numericTaskIds = parseIdList(taskIds);
  const numericUserIds = parseUserIdList(userIds).filter((id) => id !== ownerUserId);
  const normalizedPermission = permission === 'read' ? 'read' : 'read';

  if (numericTaskIds.length === 0 || numericUserIds.length === 0) {
    return { shared: 0, tasks: [], users: [] };
  }

  const [tasks, users] = await Promise.all([
    prisma.task.findMany({
      where: {
        id: { in: numericTaskIds },
        user_id: ownerUserId,
      },
      include: buildTaskInclude(ownerUserId),
    }),
    prisma.user.findMany({
      where: {
        id: { in: numericUserIds },
        status: 1,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        title: true,
      },
    }),
  ]);

  if (tasks.length === 0 || users.length === 0) {
    return { shared: 0, tasks, users };
  }

  const operations = [];
  for (const task of tasks) {
    for (const target of users) {
      operations.push(prisma.taskShare.upsert({
        where: {
          task_id_target_user_id: {
            task_id: task.id,
            target_user_id: target.id,
          },
        },
        update: {
          permission: normalizedPermission,
          owner_user_id: ownerUserId,
        },
        create: {
          task_id: task.id,
          owner_user_id: ownerUserId,
          target_user_id: target.id,
          permission: normalizedPermission,
        },
      }));
    }
  }

  await prisma.$transaction(operations);

  return {
    shared: operations.length,
    tasks: tasks.map((task) => mapTask(task, ownerUserId)),
    users,
  };
}

async function unshareTasks(ownerUserId, { taskIds = [], userIds = [] } = {}) {
  const numericTaskIds = parseIdList(taskIds);
  const numericUserIds = parseUserIdList(userIds);
  const where = { owner_user_id: ownerUserId };

  if (numericTaskIds.length > 0) {
    where.task_id = { in: numericTaskIds };
  }

  if (numericUserIds.length > 0) {
    where.target_user_id = { in: numericUserIds };
  }

  if (numericTaskIds.length === 0 && numericUserIds.length === 0) {
    return 0;
  }

  const result = await prisma.taskShare.deleteMany({ where });
  return result.count;
}

async function completeTask(taskId, result) {
  const numericId = parseTaskId(taskId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  const updated = await prisma.task.updateMany({
    where: {
      id: numericId,
      status: 'running',
    },
    data: {
      status: 'completed',
      result_json: JSON.stringify(result),
      error_msg: null,
      finished_at: new Date(),
    },
  });

  if (updated.count === 0) {
    return null;
  }

  return prisma.task.findUnique({ where: { id: numericId } });
}

async function failTask(taskId, errorMsg, result = null) {
  const numericId = parseTaskId(taskId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  const updated = await prisma.task.updateMany({
    where: {
      id: numericId,
      status: { in: ['pending', 'running'] },
    },
    data: {
      status: 'failed',
      error_msg: errorMsg || 'Task failed',
      ...(result ? { result_json: JSON.stringify(result) } : {}),
      finished_at: new Date(),
    },
  });

  if (updated.count === 0) {
    return null;
  }

  return prisma.task.findUnique({ where: { id: numericId } });
}

async function cancelTask(taskId, errorMsg = 'Cancelled by user') {
  const numericId = parseTaskId(taskId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  const updated = await prisma.task.updateMany({
    where: {
      id: numericId,
      status: { in: ['pending', 'running'] },
    },
    data: {
      status: 'cancelled',
      error_msg: errorMsg,
      finished_at: new Date(),
    },
  });

  if (updated.count === 0) {
    return null;
  }

  return prisma.task.findUnique({ where: { id: numericId } });
}

function parseTaskParams(task) {
  if (!task?.params_json) {
    return {
      apiParams: {},
      displayMeta: {},
    };
  }

  try {
    const parsed = JSON.parse(task.params_json);
    return {
      apiParams: parsed.apiParams || parsed || {},
      displayMeta: parsed.displayMeta || {},
    };
  } catch (err) {
    return {
      apiParams: {},
      displayMeta: {},
    };
  }
}

async function updateTaskProgress(taskId, partialResult = {}) {
  const numericId = parseTaskId(taskId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  const existing = await prisma.task.findUnique({
    where: { id: numericId },
  });

  if (!existing) {
    return null;
  }

  let currentResult = {};
  if (existing.result_json) {
    try {
      currentResult = JSON.parse(existing.result_json);
    } catch (err) {
      currentResult = {};
    }
  }

  const mergedResult = {
    ...currentResult,
    ...partialResult,
  };

  return prisma.task.update({
    where: { id: numericId },
    data: {
      status: 'running',
      result_json: JSON.stringify(mergedResult),
    },
  });
}

module.exports = {
  buildTaskWhere,
  cancelTask,
  completeTask,
  createTask,
  deleteTasks,
  failTask,
  getTaskDetail,
  listTasks,
  parseTaskId,
  parseTaskParams,
  shareTasks,
  unshareTasks,
  updateTask,
  updateTaskProgress,
};
