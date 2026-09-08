const { prisma } = require('../db');
const { completeTask, failTask, updateTaskProgress } = require('../taskStore');
const { createNotification } = require('../notificationStore');
const { runAssembly } = require('./assemblyService');

const DEFAULT_CONCURRENCY = 1;
let active = 0;
let scheduled = false;

function concurrency() {
  const value = Number(process.env.ASSEMBLY_MAX_CONCURRENCY);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_CONCURRENCY;
}

function enqueueAssemblyTask() {
  if (scheduled) return;
  scheduled = true;
  setImmediate(() => {
    scheduled = false;
    pump().catch((error) => console.error('[assemblyQueue]', error));
  });
}

async function claim() {
  const item = await prisma.task.findFirst({
    where: { app_id: { in: ['assembly-tool', 'tplot'] }, status: 'pending', operation: { startsWith: 'assembly/' } },
    orderBy: { id: 'asc' }, select: { id: true },
  });
  if (!item) return null;
  const updated = await prisma.task.updateMany({
    where: { id: item.id, status: 'pending' },
    data: { status: 'running', started_at: new Date(), error_msg: null },
  });
  return updated.count ? item.id : null;
}

async function pump() {
  while (active < concurrency()) {
    const taskId = await claim();
    if (!taskId) return;
    active += 1;
    execute(taskId).catch((error) => console.error(`[assemblyQueue] task ${taskId}`, error)).finally(() => {
      active -= 1; enqueueAssemblyTask();
    });
  }
}

async function execute(taskId) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;
  try {
    const stored = JSON.parse(task.params_json || '{}');
    const specs = stored.apiParams?.assemblies || stored.apiParams?.specs || [];
    if (!Array.isArray(specs) || !specs.length) throw new Error('Assembly task contains no assembly plans');
    const results = [];
    for (let index = 0; index < specs.length; index += 1) {
      const current = await prisma.task.findUnique({ where: { id: taskId }, select: { status: true } });
      if (!current || current.status === 'cancelled') return;
      await updateTaskProgress(taskId, { progress: Math.round(index / specs.length * 100), current: specs[index].name, completed: results });
      results.push(await runAssembly(task.user_id, taskId, { ...specs[index] }));
    }
    await completeTask(taskId, { success: true, progress: 100, assemblies: results });
    await createNotification(task.user_id, { tag: 'Assembly Tool', tagColor: '#605bff', taskId: String(taskId), message: 'Assembly task completed.' });
  } catch (error) {
    const message = String(error.message || error).slice(0, 512);
    await failTask(taskId, message, { success: false, message, details: error.details || null });
    await createNotification(task.user_id, { tag: 'Assembly Tool', tagColor: '#605bff', taskId: String(taskId), message: `Assembly failed: ${error.message || error}` });
  }
}

async function createAssemblyTask(userId, operation, name, specs) {
  const task = await prisma.task.create({ data: {
    user_id: userId, app_id: 'assembly-tool', name: String(name || 'Assembly').slice(0, 255),
    status: 'pending', scope: 'mine', operation,
    params_json: JSON.stringify({ apiParams: { assemblies: specs } }),
  } });
  enqueueAssemblyTask();
  return task;
}

async function reclaimAssemblyTasks() {
  await prisma.task.updateMany({
    where: { app_id: { in: ['assembly-tool', 'tplot'] }, operation: { startsWith: 'assembly/' }, status: 'running' },
    data: { status: 'pending', started_at: null, error_msg: null },
  });
  enqueueAssemblyTask();
}

module.exports = { createAssemblyTask, enqueueAssemblyTask, reclaimAssemblyTasks };
