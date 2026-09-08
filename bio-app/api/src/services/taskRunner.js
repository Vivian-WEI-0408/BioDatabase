const { prisma } = require('./db');
const { formatTaskDisplayId } = require('../lib/dates');
const {
  callTproApi,
  callTproActivatorRegister,
  enrichResult,
  fetchTproGet,
  getTproRequestTimeoutMs,
  isRetryableOperation,
  isTransientNetworkError,
} = require('./tproService');
const { cancelTask, completeTask, failTask, parseTaskId } = require('./taskStore');
const { createNotification } = require('./notificationStore');

const DEFAULT_MAX_CONCURRENCY = 2;
const controllers = new Map();
let activeCount = 0;
let pumpScheduled = false;

function getMaxConcurrency() {
  const parsed = Number(process.env.TPRO_MAX_CONCURRENCY);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return DEFAULT_MAX_CONCURRENCY;
}

function schedulePump() {
  if (pumpScheduled) {
    return;
  }

  pumpScheduled = true;
  setImmediate(() => {
    pumpScheduled = false;
    pumpQueue().catch((err) => {
      console.error('[tproQueue] pump failed:', err);
    });
  });
}

function enqueueTproTask(taskId) {
  const numericId = parseTaskId(taskId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return;
  }
  schedulePump();
}

async function claimNextPendingTask() {
  const pending = await prisma.task.findFirst({
    where: { app_id: 't-pro', status: 'pending' },
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  if (!pending) {
    return null;
  }

  const claimed = await prisma.task.updateMany({
    where: {
      id: pending.id,
      status: 'pending',
    },
    data: {
      status: 'running',
      started_at: new Date(),
      error_msg: null,
    },
  });

  if (claimed.count === 0) {
    return null;
  }

  return pending.id;
}

async function pumpQueue() {
  while (activeCount < getMaxConcurrency()) {
    const taskId = await claimNextPendingTask();

    if (!taskId) {
      break;
    }

    activeCount += 1;
    runTproTask(taskId)
      .catch((err) => {
        console.error(`Failed to run task #${taskId}:`, err);
      })
      .finally(() => {
        activeCount = Math.max(0, activeCount - 1);
        controllers.delete(taskId);
        schedulePump();
      });
  }
}

async function runTproTask(taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      app: true,
    },
  });

  if (!task || !task.operation) {
    return;
  }

  if (task.status === 'cancelled') {
    return;
  }

  const controller = new AbortController();
  controllers.set(taskId, controller);

  let storedParams = {};

  try {
    storedParams = task.params_json ? JSON.parse(task.params_json) : {};
  } catch (err) {
    await failTask(taskId, 'Invalid task parameters');
    await notifyTaskFinished(task, 'failed');
    return;
  }

  const apiParams = storedParams.apiParams || storedParams;
  const displayMeta = storedParams.displayMeta || {};

  try {
    const rawResult = await executeWithRetry(task, apiParams, controller.signal);

    const latest = await prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });

    if (!latest || latest.status === 'cancelled') {
      return;
    }

    const result = enrichResult(task.operation, rawResult, displayMeta);
    await completeTask(taskId, result);
    await notifyTaskFinished(task, 'completed');
  } catch (err) {
    const latest = await prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });

    if (!latest || latest.status === 'cancelled') {
      return;
    }

    const message = err.message || 'Task execution failed';
    if (/cancelled/i.test(message)) {
      await cancelTask(taskId, 'Cancelled by user');
      await notifyTaskFinished(task, 'cancelled', 'Cancelled by user');
      return;
    }

    await failTask(taskId, message.slice(0, 512));
    await notifyTaskFinished(task, 'failed', message);
  }
}

async function executeWithRetry(task, apiParams, signal) {
  const maxAttempts = isRetryableOperation(task.operation) ? 2 : 1;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (signal.aborted) {
      throw new Error('T-Pro request cancelled');
    }

    try {
      return await invokeTpro(task.operation, apiParams, signal);
    } catch (err) {
      lastError = err;

      if (signal.aborted || /cancelled|timeout/i.test(err.message || '')) {
        throw err;
      }

      if (attempt < maxAttempts && isTransientNetworkError(err)) {
        console.warn(`[tproQueue] retry task #${task.id} after transient error:`, err.message);
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error('Task execution failed');
}

async function invokeTpro(operation, apiParams, signal) {
  if (operation === 'activator/register') {
    const rawResult = await callTproActivatorRegister(apiParams, { signal });
    if (rawResult?.activatorID > 0) {
      try {
        const summary = await fetchTproGet(`activator/summary/${rawResult.activatorID}`, { signal });
        rawResult.logoBase64List = summary.logoBase64List || [];
        rawResult.summaryName = summary.name;
      } catch (summaryErr) {
        if (/cancelled|timeout/i.test(summaryErr.message || '')) {
          throw summaryErr;
        }
        console.warn('Failed to fetch activator summary:', summaryErr.message);
      }
    }
    return rawResult;
  }

  return callTproApi(operation, apiParams, { signal });
}

async function notifyTaskFinished(task, status, errorMessage = '') {
  const displayId = formatTaskDisplayId(task.id);
  const tag = task.app?.title || 'T-Pro';
  const tagColor = task.app?.app_color || '#26c0e2';
  let message = 'Your T-Pro task has been completed.';

  if (status === 'failed') {
    message = errorMessage || 'Your T-Pro task has failed.';
  } else if (status === 'cancelled') {
    message = errorMessage || 'Your T-Pro task was cancelled.';
  }

  await createNotification(task.user_id, {
    tag,
    tagColor,
    message,
    taskId: displayId,
  });
}

async function requestCancelTask(taskId) {
  const numericId = parseTaskId(taskId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return { ok: false, reason: 'invalid' };
  }

  const task = await prisma.task.findUnique({
    where: { id: numericId },
    select: { id: true, status: true },
  });

  if (!task) {
    return { ok: false, reason: 'not_found' };
  }

  if (['completed', 'failed', 'cancelled'].includes(task.status)) {
    return { ok: false, reason: 'not_cancellable', status: task.status };
  }

  if (task.status === 'pending') {
    await cancelTask(numericId, 'Cancelled by user');
    return { ok: true, status: 'cancelled' };
  }

  const controller = controllers.get(numericId);
  if (controller) {
    controller.abort(new Error('T-Pro request cancelled'));
  }

  await cancelTask(numericId, 'Cancelled by user');
  return { ok: true, status: 'cancelled' };
}

async function reclaimOrphanTasks() {
  const timeoutMs = getTproRequestTimeoutMs();
  const staleBefore = new Date(Date.now() - (timeoutMs * 2));

  const staleResult = await prisma.task.updateMany({
    where: {
      app_id: 't-pro',
      status: 'running',
      started_at: {
        lt: staleBefore,
      },
    },
    data: {
      status: 'failed',
      error_msg: 'Task expired after process restart (stale running)',
      finished_at: new Date(),
    },
  });

  const reclaimResult = await prisma.task.updateMany({
    where: {
      app_id: 't-pro',
      status: 'running',
    },
    data: {
      status: 'pending',
      started_at: null,
      error_msg: null,
    },
  });

  if (staleResult.count > 0 || reclaimResult.count > 0) {
    console.log(
      `[tproQueue] reclaim: staleFailed=${staleResult.count}, requeued=${reclaimResult.count}`,
    );
  }

  schedulePump();

  return {
    staleFailed: staleResult.count,
    requeued: reclaimResult.count,
  };
}

module.exports = {
  enqueueTproTask,
  reclaimOrphanTasks,
  requestCancelTask,
  runTproTask,
};
