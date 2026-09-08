const express = require('express');
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  quiet: true,
});

const accountRouter = require('./routes/account');
const userRouter = require('./routes/user');
const baseDataRouter = require('./routes/baseData');
const appsRouter = require('./routes/apps');
const tasksRouter = require('./routes/tasks');
const sharingRouter = require('./routes/sharing');
const notificationsRouter = require('./routes/notifications');
const documentsRouter = require('./routes/documents');
const dashboardRouter = require('./routes/dashboard');
const todosRouter = require('./routes/todos');
const datasetsRouter = require('./routes/datasets');
const tproRouter = require('./routes/tpro');
const filesRouter = require('./routes/files');
const searchRouter = require('./routes/search');
const feedbackRouter = require('./routes/feedback');
const adminRouter = require('./routes/admin');
const webDatabaseRouter = require('./routes/webDatabase');
const assemblyRouter = require('./routes/assembly');
const { initUserStore } = require('./services/userStore');
const { reclaimOrphanTasks } = require('./services/taskRunner');
const { reclaimAssemblyTasks } = require('./services/assembly/assemblyRunner');
const { reclaimDatasetUploadTasks } = require('./services/datasetUploadRunner');
const { output } = require('./lib/response');
const { resolveDataRoot } = require('./lib/storagePaths');

const app = express();
const port = Number(process.env.PORT || 9092);
const resourcesDir = resolveDataRoot();

function validateConfiguration() {
  const errors = [];
  if (!process.env.DATABASE_URL) errors.push('DATABASE_URL 未设置（MySQL/MariaDB 连接地址）');
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push(`PORT 无效：${process.env.PORT}`);
  const parserMode = String(process.env.DATASET_PARSER_MODE || 'http').trim().toLowerCase();
  if (!['http', 'cli', 'disabled'].includes(parserMode)) errors.push('DATASET_PARSER_MODE 只能是 http、cli 或 disabled');
  if (parserMode === 'http' && !process.env.DATASET_PARSER_URL) errors.push('DATASET_PARSER_MODE=http 时必须设置 DATASET_PARSER_URL');
  if (parserMode === 'cli' && !process.env.DATASET_PARSER_COMMAND) errors.push('DATASET_PARSER_MODE=cli 时必须设置 DATASET_PARSER_COMMAND');
  if (errors.length) {
    throw new Error(`配置检查失败：\n- ${errors.join('\n- ')}\n请复制 api/.env.example 为 api/.env 并填写配置。`);
  }
}

validateConfiguration();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, token, Token, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use('/res', express.static(resourcesDir, { fallthrough: true }));

app.get('/health', (req, res) => {
  res.json(output({
    service: 'bio-app-api',
    time: new Date().toISOString(),
  }, 1));
});

app.use('/account', accountRouter);
app.use('/user', userRouter);
app.use('/baseData', baseDataRouter);
app.use('/apps', appsRouter);
app.use('/tasks', tasksRouter);
app.use('/sharing', sharingRouter);
app.use('/notifications', notificationsRouter);
app.use('/documents', documentsRouter);
app.use('/dashboard', dashboardRouter);
app.use('/todos', todosRouter);
app.use('/datasets', datasetsRouter);
app.use('/tpro', tproRouter);
app.use('/files', filesRouter);
app.use('/search', searchRouter);
app.use('/feedback', feedbackRouter);
app.use('/admin', adminRouter);
app.use('/WebDatabase', webDatabaseRouter);
app.use('/assembly', assemblyRouter);

app.use((req, res) => {
  res.status(404).json(output(null, 0, '接口不存在'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json(output(null, 0, '服务器内部错误'));
});

initUserStore()
  .then(() => Promise.all([reclaimOrphanTasks(), reclaimAssemblyTasks(), reclaimDatasetUploadTasks()]))
  .then(() => {
    app.listen(port, () => {
      console.log(`Bio App API listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize Bio App API:', err);
    process.exit(1);
  });
