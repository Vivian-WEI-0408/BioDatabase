# 标准元件库 Online（Bio App）

面向合成生物学元件库管理的 Web 应用，包含用户体系、数据集浏览、T-Pro 工具集成、任务与文件管理、后台管理等功能。

| 文档 | 说明 |
|------|------|
| [项目交接说明](readmes/delivery.md) | 交接范围、功能清单、前端 API 清单（§11）、版本信息 |
| [前端接口示例](readmes/api-examples.md) | 前端实际调用的全部接口请求与响应示例 |
| [Nginx / Apache 部署指南](readmes/deploy-webserver.md) | 生产环境 Web 服务器配置 |
| [签收确认书](readmes/acceptance.md) | 甲方验收与签收模板 |
| [Batch Upload 更新说明](readmes/Batch-Upload更新说明.md) | Excel 批量导入本地解析与落库 |
| [Upload Map 更新说明](readmes/Upload-Map更新说明.md) | Upload Map 改走 LabDatabase 网关 |

---

## 环境要求

开始之前，请确认本机已安装以下软件：

| 软件 | 版本要求 | 验证命令 |
|------|----------|----------|
| Node.js | ≥ 18（推荐 20 / 22 LTS） | `node -v` |
| npm | 随 Node 自带（≥ 9） | `npm -v` |
| MySQL 或 MariaDB | MySQL 5.7+ / MariaDB 10.x | `mysql --version` |
| Git | 任意较新版本 | `git --version` |

> 本项目前后端各有一套 `package.json`，需分别在根目录和 `api/` 目录执行 `npm install`。

---

## 一、获取代码

```bash
git clone git@github.com:berserker001/bio-app.git
cd bio-app
```

如使用 HTTPS：

```bash
git clone https://github.com/berserker001/bio-app.git
cd bio-app
```

---

## 二、准备数据库

### 2.1 创建数据库

登录 MySQL，新建一个空数据库（名称可自定义，下文以 `bio_app` 为例）：

```sql
CREATE DATABASE bio_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.2 两种使用场景

**场景 A：全新部署（推荐首次本地启动）**

- 使用新建的空数据库 `bio_app`
- 执行下文「同步数据库结构」后，Prisma 会自动创建全部平台表
- 遗留元件库表（`parttable`、`backbonetable` 等）也会一并创建，初始为空

**场景 B：对接已有元件库数据**

- 若甲方已有历史数据库（如 `labdnadata`），将 `DATABASE_URL` 指向该库即可
- 需确保数据库中已存在 Prisma Schema 定义的表结构；若缺少平台表，仍需执行 `prisma db push` 补全

---

## 三、配置后端环境

### 3.1 安装依赖

```bash
cd api
npm install
```

### 3.2 运行依赖服务

#bokeh 服务
```bash
cd TFPlot\GUI
bokeh serve --show Plot.py --allow-websocket-origin=*
```

#T-Plot 服务
```bash
cd TFPlot
python app.py
```



### 3.2 创建环境变量文件

复制模板并编辑：

```bash
cp .env.example .env
```

用文本编辑器打开 `api/.env`，至少修改以下必填项：

```env
# 数据库连接（按实际修改用户名、密码、库名）
DATABASE_URL="mysql://root:your_password@127.0.0.1:3306/bio_app"

# API 端口（默认 9092，一般无需修改）
PORT=9092

# T-Pro 计算服务地址（本地开发可先指向本地或测试环境）
TPRO_API_URL="http://127.0.0.1:8004/"

#T-Plot 计算服务地址
#Bokeh serve 地址
VITE_TPLOT_PLOT_URL=http://10.30.76.2:5006/Plot
#T-Plot 地址
VITE_TPLOT_API_PROXY_TARGET=http://10.30.76.2:8101/


# 可选：Token 有效期（默认 7 天）、T-Pro 超时与并发
# TOKEN_TTL_MS=604800000
# TPRO_REQUEST_TIMEOUT_MS=600000
# TPRO_MAX_CONCURRENCY=2
```

邮件相关配置（注册验证码、找回密码）为**可选项**，本地开发阶段可暂不填写；需要测试邮件功能时再补充：

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT=465
SMTP_USER="your_email@example.com"
SMTP_PASS="your_smtp_auth_code"
SMTP_FROM_NAME="Bio App"
```

> `.env` 文件包含敏感信息，**不要提交到 Git**。仓库已通过 `api/.gitignore` 忽略该文件。

### 3.3 同步数据库结构

在 `api/` 目录执行：

```bash
npm run prisma:db:push
npm run prisma:generate
```

说明：

- `prisma:db:push`：根据 `prisma/schema.prisma` 将表结构同步到数据库
- `prisma:generate`：生成 Prisma Client，后端运行所必需

若命令报错，请优先检查 `DATABASE_URL` 是否正确、MySQL 服务是否已启动、对应用户是否有建表权限。

### 3.4 创建运行时目录（首次建议手动创建）

```bash
mkdir -p res/avatars res/user-files
```

后端启动后也会尝试自动创建，但手动创建可避免部分环境下的权限问题。

### 3.5 启动后端

```bash
npm run dev
```

看到以下输出表示启动成功：

```
Bio App API listening on http://localhost:9092
```

保持此终端窗口运行。后端支持文件变更热重载（`node --watch`）。

### 3.6 验证后端

另开一个终端，执行：

```bash
curl http://127.0.0.1:9092/health
```

正常应返回 JSON，其中包含 `"service":"bio-app-api"`。

---

## 四、配置并启动前端

另开一个终端，回到项目根目录：

```bash
cd ..          # 若当前在 api/ 目录
npm install
npm run dev
```

看到类似输出表示前端已就绪：

```
  VITE v2.x.x  ready in xxx ms
  ➜  Local:   http://localhost:8090/
```

在浏览器访问：**http://localhost:8090**

> 本项目使用 **Hash 路由**，页面地址形如 `http://localhost:8090/#/dashboard`，属正常现象。

### 4.1 开发环境代理说明

前端 `vite.config.js` 已配置开发代理，无需额外修改：

| 前端请求路径 | 代理目标 | 用途 |
|--------------|----------|------|
| `/api/*` | `http://127.0.0.1:9092` | 本地后端 API |
| `/t-pro-api/*` | `http://127.0.0.1:8004`（可通过 `.env.development.local` 覆盖） | T-Pro 物种与资源接口 |
| `/LabDatabase/*` | `http://127.0.0.1:8000`（可通过 `VITE_LABDB_PROXY_TARGET` 覆盖） | LabDatabase：Download Map 与 Upload Map（`POST /LabDatabase/upload/`）共用 |
| `/res/*` | `http://127.0.0.1:9092` | 用户上传文件 |

因此前端代码中统一使用 `/api/` 作为接口前缀（见 `src/App.vue`）。

---

## 五、首次使用

### 5.1 注册与登录

1. 浏览器打开 http://localhost:8090/#/signup
2. 填写姓名、邮箱、密码、单位（`organization` 为必填项）
3. 注册成功后自动登录，跳转至 Dashboard

也可访问 http://localhost:8090/#/signin 使用已有账号登录。

### 5.2 设置管理员账号（可选）

系统**不会**自动创建管理员。如需访问后台 `/admin`，需先将某用户提升为管理员：

```sql
-- 在 MySQL 中执行，将邮箱替换为实际注册邮箱
UPDATE users SET role = 9 WHERE email = 'your_email@example.com';
```

角色说明：

| role 值 | 角色 | 权限 |
|---------|------|------|
| 0 | 普通用户 | 基础功能 |
| 1 | 数据管理员 | 可编辑元件库行数据 |
| 9 | 管理员 | 可进入 Admin 后台 |

修改后，该用户需**重新登录**方可生效。

### 5.3 建议验证的功能路径

| 步骤 | 地址 | 预期结果 |
|------|------|----------|
| 1 | `/#/dashboard` | 显示应用卡片、通知、待办等 |
| 2 | `/#/datasets-categories` | 显示元件分类，可点击进入浏览页 |
| 3 | `/#/files` | 可上传、查看文件 |
| 4 | `/#/admin`（管理员） | 显示 Users / Files / Tasks 等后台 Tab |

---

## 六、常用命令速查

### 前端（项目根目录）

```bash
npm run dev      # 启动开发服务器（端口 8090）
npm run build    # 构建生产静态资源到 dist/
npm run serve    # 预览构建结果
```

### 后端（api/ 目录）

```bash
npm run dev                  # 启动开发服务器（端口 9092）
npm start                    # 生产模式启动
npm run prisma:db:push       # 同步 Schema 到数据库
npm run prisma:generate      # 生成 Prisma Client
npm run prisma:migrate:status # 查看迁移状态
```

---

## 七、可选配置

以下功能不影响基础本地启动，按需开启。

### 7.1 T-Pro 计算任务

- 后端通过 `TPRO_API_URL` 调用外部 T-Pro 服务
- 前端物种列表通过 `/t-pro-api/` 代理访问同一服务
- 若外部服务不可达，页面仍可打开，但创建 T-Pro 任务会失败

### 7.2 邮件验证码

- 配置 `SMTP_*` 环境变量后，可使用找回密码、邮箱变更验证码功能
- 使用邮箱服务商的**授权码**，不是登录密码

---

## 八、常见问题

### Q1：`npm install` 失败或速度很慢

可切换 npm 镜像后重试：

```bash
npm config set registry https://registry.npmmirror.com
```

### Q2：后端启动报错 `Failed to initialize Bio App API`

**原因**：数据库连接失败或 Prisma Client 未生成。

**处理**：

1. 确认 MySQL 已启动：`mysql -u root -p -e "SELECT 1"`
2. 检查 `api/.env` 中 `DATABASE_URL` 用户名、密码、库名
3. 重新执行 `npm run prisma:generate`

### Q3：`prisma db push` 提示权限不足

确保 `DATABASE_URL` 中的数据库用户对目标库拥有 `CREATE`、`ALTER` 权限。

### Q4：前端页面能打开，但接口全部失败

**原因**：后端未启动，或端口不是 9092。

**处理**：

1. 确认 `api/` 目录下 `npm run dev` 正在运行
2. 访问 http://127.0.0.1:9092/health 检查后端
3. 确认 `vite.config.js` 中 `/api` 代理目标为 `http://127.0.0.1:9092/`

### Q5：登录后立刻跳回登录页

**原因**：Token 未写入或后端返回鉴权失败。

**处理**：

1. 浏览器开发者工具 → Network，检查 `/api/account/login` 响应是否 `status: 1`
2. 清除浏览器 `localStorage` 后重新登录

### Q6：数据集浏览页无数据

**原因**：所连数据库中遗留元件表（`parttable` 等）为空。

**说明**：这是数据问题，不是启动问题。可对接含历史数据的数据库，或通过上传功能导入。

### Q7：端口被占用

```bash
# 查看占用 8090 / 9092 端口的进程（macOS / Linux）
lsof -i :8090
lsof -i :9092
```

可结束对应进程，或在 `api/.env` 修改 `PORT`、在 `vite.config.js` 修改 `server.port`。

---

## 九、项目结构

```
bio-app/
├── src/                  # 前端 Vue 源码
├── public/               # 前端静态资源（图片、字体、模板）
├── index.html            # 前端入口 HTML
├── vite.config.js        # Vite 配置（含开发代理）
├── package.json          # 前端依赖
├── api/
│   ├── src/              # 后端 Express 源码
│   ├── prisma/
│   │   └── schema.prisma # 数据库模型
│   ├── scripts/          # 数据迁移脚本
│   ├── res/              # 运行时上传目录（Git 忽略）
│   ├── .env.example      # 环境变量模板
│   └── package.json      # 后端依赖
└── readmes/
    ├── delivery.md       # 交接范围说明
    └── acceptance.md     # 签收确认书
```

---

## 十、生产构建（补充）

本地开发只需上文第三、四步。若需构建前端静态资源：

```bash
# 项目根目录
npm run build
```

产物输出至 `dist/`，可交由 Nginx / Apache 托管；API 仍需单独运行 `api/` 后端服务。完整生产部署步骤见 [deploy-webserver.md](readmes/deploy-webserver.md)。

---

如有疑问，请先对照 [delivery.md](readmes/delivery.md) 中的「已知限制」与「交接检查清单」排查。
