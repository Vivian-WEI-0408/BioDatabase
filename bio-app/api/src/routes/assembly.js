const fs = require('fs/promises');
const path = require('path');
const express = require('express');
const { output } = require('../lib/response');
const { prisma } = require('../services/db');
const { requireUser } = require('../middleware/auth');
const { uploadBatchMiddleware } = require('../middleware/uploadMulter');
const { getTaskDetail } = require('../services/taskStore');
const { createAssemblyTask } = require('../services/assembly/assemblyRunner');
const { parseAssemblyWorkbook } = require('../services/assembly/excel');
const { getRepository, listRepositories, saveRepository } = require('../services/assembly/repositoryStore');

const router = express.Router();
const ASSEMBLY_TEMPLATE_PATH = path.resolve(__dirname, '../../templates/AssemblyPlan.xlsx');

router.get('/template', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  try {
    await fs.access(ASSEMBLY_TEMPLATE_PATH);
    res.download(ASSEMBLY_TEMPLATE_PATH, 'AssemblyPlan.xlsx');
  } catch (error) {
    res.status(404).json(output(null, 3, 'Assembly template not found'));
  }
});

router.get('/repositories', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  res.json(output({ repositories: await listRepositories(user.id) }, 1));
});

router.get('/repositories/:id', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const repository = await getRepository(user.id, req.params.id);
  res.json(repository ? output({ repository }, 1) : output(null, 3, 'Repository not found or expired'));
});

router.post('/repositories', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  try { res.json(output({ repository: await saveRepository(user.id, req.body || {}) }, 1)); }
  catch (error) { res.status(400).json(output(null, 3, error.message)); }
});

router.post('/run', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  try {
    const spec = req.body || {};
    const taskName = String(spec.name || spec.uuid || '').trim();
    if (!taskName) return res.status(400).json(output(null, 3, 'Assembly name is required'));
    // TFPlot uses a UUID-based name. Reusing the same request after a lost
    // connection must return the original task rather than create a duplicate.
    const existing = await prisma.task.findFirst({
      where: {
        user_id: user.id, app_id: 'assembly-tool', operation: 'assembly/direct', name: taskName,
        status: { in: ['pending', 'running', 'completed'] },
      },
      orderBy: { id: 'desc' },
    });
    const task = existing || await createAssemblyTask(user.id, 'assembly/direct', taskName, [spec]);
    res.status(202).json(output({ taskId: task.id, status: task.status }, 1));
  } catch (error) { res.status(400).json(output(null, 3, error.message)); }
});

router.post('/repositories/:id/run', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const repository = await getRepository(user.id, req.params.id);
  if (!repository) return res.status(404).json(output(null, 3, 'Repository not found or expired'));
  const spec = { ...repository.data, name: repository.name, alias: repository.alias, note: repository.note, level: repository.level,
    part_start_scar_scalar: repository.part_start_scar, part_end_scar_scalar: repository.part_end_scar,
    enzyme: req.body?.enzyme || 'auto' };
  const task = await createAssemblyTask(user.id, 'assembly/repository', repository.name, [spec]);
  res.status(202).json(output({ taskId: task.id, status: task.status }, 1));
});

router.post('/excel', (req, res, next) => {
  uploadBatchMiddleware(req, res, (error) => error ? next(error) : next());
}, async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  if (!req.file) return res.status(400).json(output(null, 3, 'Excel file is required'));
  try {
    const specs = parseAssemblyWorkbook(req.file.path);
    for (const spec of specs) await saveRepository(user.id, { ...spec, data: spec });
    const task = await createAssemblyTask(user.id, 'assembly/excel', req.body?.title || req.file.originalname, specs);
    res.status(202).json(output({ taskId: task.id, status: task.status, assemblies: specs.map((item) => item.name) }, 1));
  } catch (error) { res.status(400).json(output(null, 3, error.message)); }
  finally { await fs.rm(req.file.path, { force: true }); }
});

router.get('/tasks/:id', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return;
  const task = await getTaskDetail(user.id, req.params.id);
  res.json(task ? output({ task }, 1) : output(null, 3, 'Task not found'));
});

module.exports = router;
