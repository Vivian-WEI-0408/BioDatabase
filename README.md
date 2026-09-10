# BioDatabase

BioDatabase 是一个面向合成生物学数据管理和设计的多服务项目，包含数据管理前端、数据库 API、图谱解析、TFPlot 分析以及 Golden Gate Assembly 工具。

## 项目组成

| 目录 | 技术 | 默认端口 | 作用 |
| --- | --- | ---: | --- |
| `bio-app/` | Vue 3 + Vite | 8090 | 用户界面，包括数据集、任务、TFPlot 和 Assembly Tool |
| `bio-app/api/` | Node.js + Express + Prisma | 9092 | 用户验证、数据库访问、文件管理、任务和组装 API |
| `MapProcess/` | Python + Django | 8000 | 解析 GB/GBK/FASTA/APE/DNA 等图谱文件，不使用独立数据库 |
| `TFPlot/` | Flask + Bokeh | 8101 / 5006 | TF 参数计算、拟合、绘图及 TFPlot 组装调用 |
| `StaticFiles/templates/` | Excel 文件 | — | Part、Backbone、Plasmid、Strain 等批量导入模板 |

## 环境要求

- Node.js 20 或更高版本，npm 10 或更高版本
- Python 3.10 或更高版本
- MySQL 8 或 MariaDB 10.6 及以上版本
- Windows PowerShell、Linux shell 或其他能够分别启动多个服务的终端

建议为 `MapProcess` 和 `TFPlot` 分别创建 Python 虚拟环境，避免两套依赖互相影响。所有命令均从仓库根目录开始执行。

## 首次配置

### 1. 获取代码

```powershell
git clone https://github.com/Vivian-WEI-0408/BioDatabase.git
cd BioDatabase
```

### 2. 创建配置文件

项目不会提交真实 `.env`。复制示例文件后再填写本机或服务器配置：

```powershell
Copy-Item bio-app/.env.example bio-app/.env
Copy-Item bio-app/api/.env.example bio-app/api/.env
Copy-Item MapProcess/.env.example MapProcess/.env
Copy-Item TFPlot/.env.example TFPlot/.env
```

Linux/macOS 对应命令：

```bash
cp bio-app/.env.example bio-app/.env
cp bio-app/api/.env.example bio-app/api/.env
cp MapProcess/.env.example MapProcess/.env
cp TFPlot/.env.example TFPlot/.env
```

不要把数据库密码、SMTP 授权码或 Token 写入 `.env.example`，也不要提交真实 `.env`。

## bio-app API 配置

编辑 `bio-app/api/.env`：

```dotenv
DATABASE_URL="mysql://app_user:your_password@127.0.0.1:3306/bio_app"
PORT=9092

DATASET_PARSER_MODE=http
DATASET_PARSER_URL=http://127.0.0.1:8000
DATASET_PARSER_TIMEOUT_MS=300000

BIOAPP_DATA_DIR=C:/bio-app-data
BIOAPP_TEMP_DIR=C:/bio-app-temp

TPRO_API_URL=http://127.0.0.1:8004/
TPRO_REQUEST_TIMEOUT_MS=600000
TPRO_MAX_CONCURRENCY=2
```

主要配置说明：

| 变量 | 必需 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | Prisma 使用的 MySQL/MariaDB 连接字符串 |
| `PORT` | 否 | API 端口，默认 `9092` |
| `TOKEN_TTL_MS` | 否 | 登录 Token 有效期，默认 7 天并支持滑动续期 |
| `DATASET_PARSER_MODE` | 是 | `http`、`cli` 或 `disabled`；正常部署使用 `http` |
| `DATASET_PARSER_URL` | HTTP 模式必需 | MapProcess 地址，例如 `http://127.0.0.1:8000` |
| `BIOAPP_DATA_DIR` | 推荐 | 用户文件、头像和反馈附件的持久化根目录 |
| `BIOAPP_TEMP_DIR` | 推荐 | 上传缓存和组装中间文件目录，可定期清理 |
| `USER_FILE_STORAGE_DIR` | 否 | 单独覆盖用户文件目录 |
| `AVATAR_STORAGE_DIR` | 否 | 单独覆盖头像目录 |
| `FEEDBACK_STORAGE_DIR` | 否 | 单独覆盖反馈附件目录 |
| `DATASET_UPLOAD_TMP_DIR` | 否 | 单独覆盖上传临时目录 |
| `DATASET_UPLOAD_MAX_BYTES` | 否 | 单个数据上传文件的最大字节数 |
| `USER_FILE_MAX_BYTES` | 否 | 用户文件的最大字节数 |
| `TPRO_API_URL` | 使用 T-Pro 时 | 外部 T-Pro 服务地址 |
| `SMTP_HOST` 等 | 使用邮件时 | 找回密码及邮箱验证码所需 SMTP 配置 |

生产环境应将 `BIOAPP_DATA_DIR` 放在持久化磁盘或挂载卷上。`BIOAPP_TEMP_DIR` 可以使用临时磁盘，但服务运行期间必须具有读写权限。

### 初始化数据库

先在 MySQL/MariaDB 中创建空数据库和应用账号，并授予该账号对数据库的权限。然后执行：

```powershell
cd bio-app/api
npm install
npm run prisma:db:push
npm run prisma:generate
cd ../..
```

当前仓库以 `schema.prisma` 为准且没有完整迁移历史，因此首次安装使用 `prisma:db:push`。已有生产数据库升级前应先备份数据库，并使用迁移脚本或审查 Prisma 生成的差异，避免直接覆盖数据。

API 启动时会检查 `DATABASE_URL`、端口和 MapProcess 配置；配置不完整时会直接显示缺少的变量。

## MapProcess 配置与启动

MapProcess 是无状态图谱解析服务，不携带 SQLite，也不需要配置数据库。开发环境可使用：

```dotenv
DJANGO_SECRET_KEY=local-development-secret-change-me
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_SESSION_COOKIE_SECURE=false
DJANGO_CSRF_COOKIE_SECURE=false
```

安装并启动：

```powershell
cd MapProcess
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py check
python manage.py runserver 0.0.0.0:8000
```

Linux/macOS 使用 `source .venv/bin/activate`。解析接口为 `POST /upload/`，bio-app API 会通过 `DATASET_PARSER_URL` 调用它。

生产环境必须把 `DJANGO_DEBUG` 改为 `false`，设置足够长的随机 `DJANGO_SECRET_KEY`，并正确填写 `DJANGO_ALLOWED_HOSTS` 和 `DJANGO_CSRF_TRUSTED_ORIGINS`。

## bio-app API 启动

打开新的终端：

```powershell
cd bio-app/api
npm install
npm run prisma:generate
npm run dev
```

生产环境使用：

```powershell
npm start
```

健康检查地址为 `http://127.0.0.1:9092/health`。

## TFPlot 配置与启动

TFPlot 只读取 `TFPlot/.env`，不会读取 `TFPlot/Services/.env` 或 `TFPlot/GUI/.env`。

```dotenv
UPLOAD_File=C:/tfplot-data/uploads
template_file=C:/path/to/BioDatabase/TFPlot/Template.csv
Plot_Bokeh=http://127.0.0.1:5006/Plot

BIOAPP_API_URL=http://127.0.0.1:9092
Level2_Backbone_Name=your-level2-backbone-name
Level3_Backbone_Name=your-level3-backbone-name

result_file=C:/tfplot-data/output/Level3.gb
PORT=8101
FLASK_DEBUG=false
```

| 变量 | 必需 | 说明 |
| --- | --- | --- |
| `UPLOAD_File` | 是 | TFPlot 上传任务目录，进程必须可读写 |
| `template_file` | 是 | TFPlot CSV 模板的绝对路径 |
| `Plot_Bokeh` | 是 | Bokeh `Plot` 应用地址 |
| `BIOAPP_API_URL` | 是 | bio-app API 根地址；也兼容变量名 `WebDatabase_URL` |
| `Level2_Backbone_Name` | 使用 Assembly 时 | 数据库中实际存在的 Level 2 Backbone 名称 |
| `Level3_Backbone_Name` | 使用 Assembly 时 | 数据库中实际存在的 Level 3 Backbone 名称 |
| `BIOAPP_TOKEN` | 特定无请求上下文场景 | bio-app 服务 Token，通常由前端请求透传用户 Token |
| `result_file` | 否 | Assembly 结果文件位置 |
| `PORT` | 否 | Flask 端口，当前代码默认 `8101` |
| `FLASK_DEBUG` | 否 | 设置为 `1` 才启用 Flask debug |

安装依赖：

```powershell
cd TFPlot
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

先启动 Bokeh。以下命令必须在 `TFPlot/GUI` 目录运行：

```powershell
cd GUI
bokeh serve Plot.py --port 5006 --allow-websocket-origin=127.0.0.1:8101
cd ..
```

如果浏览器通过服务器 IP 或域名访问 Flask，应把对应来源也加入参数，例如：

```powershell
bokeh serve Plot.py --port 5006 --allow-websocket-origin=10.30.76.2:8101
```

再打开另一个已激活同一虚拟环境的终端启动 Flask：

```powershell
cd TFPlot
python app.py
```

TFPlot Flask 默认地址为 `http://127.0.0.1:8101`，Bokeh 默认地址为 `http://127.0.0.1:5006/Plot`。

## 前端配置与启动

编辑 `bio-app/.env`。本机使用默认端口时可保持：

```dotenv
VITE_API_PROXY_TARGET=http://127.0.0.1:9092/
VITE_WEBDB_PROXY_TARGET=http://127.0.0.1:9092/
VITE_STATIC_PROXY_TARGET=http://127.0.0.1:9092/
VITE_TPLOT_API_PROXY_TARGET=http://127.0.0.1:8101/
VITE_TPRO_API_PROXY_TARGET=http://127.0.0.1:8004/
```

启动前端：

```powershell
cd bio-app
npm install
npm run dev
```

访问 `http://127.0.0.1:8090`。

前端开发服务器使用下列代理关系：

| 浏览器路径 | 目标服务 |
| --- | --- |
| `/api/*`、`/WebDatabase/*`、`/res/*` | bio-app API `9092` |
| `/tplot-api/*` | TFPlot Flask `8101` |
| `/t-pro-api/*`、`/t-pro/*` | 外部 T-Pro 服务，默认 `8004` |

## 推荐启动顺序

每个服务占用一个终端：

1. 启动 MySQL/MariaDB。
2. 启动 MapProcess：`python manage.py runserver 0.0.0.0:8000`。
3. 启动 bio-app API：`npm run dev`，端口 `9092`。
4. 在 `TFPlot/GUI` 启动 Bokeh，端口 `5006`。
5. 在 `TFPlot` 启动 Flask：`python app.py`，端口 `8101`。
6. 在 `bio-app` 启动 Vue：`npm run dev`，端口 `8090`。
7. 如果使用 T-Pro，再确保对应服务运行于配置的 `TPRO_API_URL`。

只使用数据管理和 Assembly Tool 时，TFPlot、Bokeh 和 T-Pro 可以不启动；上传图谱需要 MapProcess。

## 测试与构建

bio-app API 单元测试：

```powershell
cd bio-app/api
npm test
```

全部 API 冒烟测试要求测试数据库及 API 配置可用：

```powershell
npm run test:api:all
```

MapProcess 检查：

```powershell
cd MapProcess
python manage.py check
```

TFPlot 测试：

```powershell
cd TFPlot
python -m unittest discover -s tests -v
```

前端生产构建：

```powershell
cd bio-app
npm run build
```

构建结果位于 `bio-app/dist/`。生产环境应由 Nginx 等 Web 服务器托管该目录，并把 API、TFPlot 和 Bokeh 路径转发到对应服务。

## 常见问题

### API 提示配置检查失败

确认已创建 `bio-app/api/.env`，且 `DATABASE_URL`、`DATASET_PARSER_MODE` 及该模式要求的地址或命令已填写。环境变量优先于 `.env`。

### 图谱上传一直处于 pending

确认 MapProcess 正在监听 `8000`，`DATASET_PARSER_URL` 可从 bio-app API 所在机器访问，并确保 `BIOAPP_TEMP_DIR` 具有读写权限。不能把容器内的 `127.0.0.1` 当作另一个容器的地址。

### Bokeh 页面无法连接或出现 ConnectionResetError

确认 `Plot_Bokeh` 与 Bokeh 实际地址一致，并将用户访问 TFPlot Flask 时使用的主机和端口加入 `--allow-websocket-origin`。

### Assembly 报 Backbone 或质粒不存在

`Level2_Backbone_Name`、`Level3_Backbone_Name` 以及组装输入名称必须与 bio-app 数据库中的名称完全一致。每次组装只能有一个 Backbone，且 Backbone 必须包含可识别的 ccdB dropout。

### 端口冲突

默认端口为前端 `8090`、MapProcess `8000`、API `9092`、TFPlot Flask `8101`、Bokeh `5006`。修改端口后必须同步更新所有引用该服务的 `.env` 和 Bokeh websocket origin。
