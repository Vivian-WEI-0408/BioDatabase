# 标准元件库 Online — Nginx / Apache 生产部署指南

> 适用版本：Bio App `main` 分支（2026-07-09）  
> 相关文档：[README.md](../README.md)（本地开发）、[delivery.md](./delivery.md)（交接说明）

本文档说明如何在 Linux 服务器上使用 **Nginx** 或 **Apache** 作为 Web 服务器，托管前端静态资源并反向代理后端 API 与 T-Pro 服务。

---

## 1. 部署架构

```
用户浏览器（HTTPS）
        ↓
Nginx / Apache（80 / 443）
        ├── /              → dist/（Vue 前端静态文件）
        ├── /api/          → 127.0.0.1:9092（Express API，去掉 /api 前缀）
        ├── /t-pro-api/    → T-Pro 服务（去掉 /t-pro-api 前缀）
        ├── /t-pro/        → T-Pro 服务（遗留路径，可选）
        ├── /LabDatabase/  → LabDatabase / MapProcess（Django，保留路径前缀；Download Map + Upload Map）
        ├── /WebDatabase/  → WebDB / LabDB（Django，保留路径前缀；与 LabDatabase 同 upstream）
        ├── /tplot-api/    → TPlot Flask（TFDesignWeb，去掉 /tplot-api 前缀）
        └── /res/          → 用户上传文件（头像、附件）
```

| 组件 | 技术 | 默认端口 | 说明 |
|------|------|----------|------|
| 前端 | Vue 3 + Vite 构建产物 | — | `npm run build` 输出至 `dist/` |
| 后端 API | Express 5 + Prisma 7 | `9092` | 需常驻进程（systemd / PM2） |
| 数据库 | MySQL / MariaDB | `3306` | 与 Web 服务器独立部署 |
| T-Pro | 外部 HTTP 服务 | 按实际 | 由 `TPRO_API_URL` 配置 |
| LabDatabase / WebDatabase | Django（遗留 / MapProcess / WebDB） | `8000` | `/LabDatabase/` 与 `/WebDatabase/` 共用同一 upstream，均保留路径前缀 |
| TPlot Flask | TFDesignWeb（遗留） | `8101` | Dimer Plot（`/TFPlot` iframe）/ Fitting / Optimization / Assembly；生产经 `/tplot-api/` 代理（去掉前缀） |

> 开发环境的 `vite.config.js` 代理规则**仅用于本地开发**。生产环境必须在 Nginx / Apache 层配置等价规则。

本项目前端使用 **Hash 路由**（地址形如 `https://example.com/#/dashboard`），因此无需为每个前端路由单独配置 SPA 回退规则；但仍建议对根路径配置 `index.html` 回退，以兼容直接访问 `/` 的场景。

---

## 2. 前置条件

### 2.1 服务器软件

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | ≥ 18（推荐 20 / 22 LTS） | 运行后端 API |
| MySQL / MariaDB | 5.7+ / 10.x | 业务数据库 |
| Nginx | ≥ 1.18 | 方案 A |
| Apache httpd | ≥ 2.4 | 方案 B |
| Git | 任意较新版本 | 拉取代码 |

### 2.2 网络与域名

- 已解析至服务器的域名（下文以 `bio.example.com` 为例）
- 防火墙放行 `80`、`443`（以及内网数据库端口，**勿**对公网开放 `3306`）
- T-Pro 服务地址可从应用服务器访问

### 2.3 推荐目录规划

以下路径可按运维规范调整，全文以此为例：

| 路径 | 用途 |
|------|------|
| `/var/www/bio-app` | 项目根目录（Git 检出） |
| `/var/www/bio-app/dist` | 前端构建产物 |
| `/var/www/bio-app/api` | 后端源码与运行时 |
| `/var/www/bio-app/api/res` | 用户上传文件（需持久化、备份） |

---

## 3. 应用部署（Nginx / Apache 共用）

以下步骤在选定 Web 服务器之前完成。

### 3.1 获取代码

```bash
sudo mkdir -p /var/www
sudo chown "$USER":"$USER" /var/www

git clone git@github.com:berserker001/bio-app.git /var/www/bio-app
cd /var/www/bio-app
```

### 3.2 安装依赖并构建前端

```bash
# 前端
npm install
npm run build          # 产物输出至 dist/

# 后端
cd api
npm install --omit=dev # 生产环境可省略 devDependencies（prisma CLI 见下文说明）
```

> 若生产环境需要执行 `prisma migrate deploy` 等命令，请在部署机保留 `prisma` CLI（使用 `npm install` 安装完整依赖，或全局安装 `prisma`）。

### 3.3 配置数据库

```bash
mysql -u root -p -e "CREATE DATABASE bio_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 3.4 配置后端环境变量

```bash
cd /var/www/bio-app/api
cp .env.example .env
chmod 600 .env
```

编辑 `api/.env`，至少填写：

```env
DATABASE_URL="mysql://bio_app:强密码@127.0.0.1:3306/bio_app"
PORT=9092
TPRO_API_URL="http://tpro.internal:8004/"

# 邮件功能（找回密码、验证码）
SMTP_HOST="smtp.example.com"
SMTP_PORT=465
SMTP_USER="noreply@example.com"
SMTP_PASS="your_smtp_auth_code"
SMTP_FROM_NAME="Bio App"
```

### 3.5 同步数据库结构

```bash
cd /var/www/bio-app/api
npm run prisma:db:push    # 或 npm run prisma:sync（若有迁移文件）
npm run prisma:generate
```

### 3.6 创建运行时目录并设置权限

```bash
mkdir -p /var/www/bio-app/api/res/avatars
mkdir -p /var/www/bio-app/api/res/user-files
mkdir -p /var/www/bio-app/api/tmp/uploads

# 假设后端以 www-data 用户运行（Debian/Ubuntu）
sudo chown -R www-data:www-data /var/www/bio-app/api/res
sudo chown -R www-data:www-data /var/www/bio-app/api/tmp
sudo chmod -R 750 /var/www/bio-app/api/res
```

> `api/res/` 存放用户头像与上传文件，**必须纳入备份策略**。

### 3.7 验证后端可独立启动

```bash
cd /var/www/bio-app/api
npm start
```

另开终端验证：

```bash
curl http://127.0.0.1:9092/health
```

确认返回 JSON 且包含 `"service":"bio-app-api"` 后，停止前台进程，改由进程管理器托管（见 §4）。

---

## 4. 后端进程守护

Web 服务器只负责静态资源与反向代理；Express API 需单独常驻运行。推荐 **systemd**（首选）或 **PM2**。

### 4.1 systemd（推荐）

创建 `/etc/systemd/system/bio-app-api.service`：

```ini
[Unit]
Description=Bio App API (Express)
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/bio-app/api
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=5

# 可选：限制内存
# MemoryMax=512M

[Install]
WantedBy=multi-user.target
```

> 将 `ExecStart` 中的 `node` 路径改为 `which node` 的实际输出（如 `/usr/local/bin/node`）。

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable bio-app-api
sudo systemctl start bio-app-api
sudo systemctl status bio-app-api
```

### 4.2 PM2（可选）

```bash
sudo npm install -g pm2
cd /var/www/bio-app/api
pm2 start src/server.js --name bio-app-api
pm2 save
pm2 startup    # 按提示配置开机自启
```

---

## 5. Nginx 部署

### 5.1 安装

```bash
# Debian / Ubuntu
sudo apt update && sudo apt install -y nginx

# RHEL / CentOS / Rocky
sudo dnf install -y nginx
```

### 5.2 站点配置

创建 `/etc/nginx/sites-available/bio-app.conf`（或 `conf.d/bio-app.conf`）：

```nginx
# 上游服务（按实际修改 T-Pro 地址）
upstream bio_app_api {
    server 127.0.0.1:9092;
    keepalive 16;
}

upstream bio_app_tpro {
    server 127.0.0.1:8004;   # 与 api/.env 中 TPRO_API_URL 一致
    keepalive 8;
}

upstream bio_app_labdatabase {
    server 127.0.0.1:8000;   # 遗留 LabDatabase / WebDatabase（Django）；按实际修改
    keepalive 8;
}

upstream bio_app_tplot {
    server 127.0.0.1:8101;   # 遗留 TFDesignWeb Flask；与 VITE_TPLOT_API_PROXY_TARGET 一致
    keepalive 8;
}

# HTTP → HTTPS 跳转（启用 SSL 后使用）
server {
    listen 80;
    listen [::]:80;
    server_name bio.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bio.example.com;

    # SSL 证书（见 §7）
    ssl_certificate     /etc/letsencrypt/live/bio.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bio.example.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    root /var/www/bio-app/dist;
    index index.html;

    # 上传大小：后端默认限制 50MB，此处略留余量
    client_max_body_size 64m;

    # 安全响应头（可按安全策略调整）
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # ---- 反向代理：后端 API ----
    # 请求 /api/account/login → 转发至 127.0.0.1:9092/account/login
    location /api/ {
        proxy_pass http://bio_app_api/;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection        "";
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # ---- 反向代理：T-Pro 物种 / 资源接口 ----
    # 请求 /t-pro-api/xxx → 转发至 T-Pro /xxx
    location /t-pro-api/ {
        proxy_pass http://bio_app_tpro/;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
    }

    # ---- 可选：T-Pro 遗留路径（与 vite 开发代理 /t-pro 对应）----
    location /t-pro/ {
        proxy_pass http://bio_app_tpro/;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
    }

    # ---- 反向代理：LabDatabase（Download + Upload Map；保留 /LabDatabase 前缀）----
    # 请求 /LabDatabase/downloadPartMap/1 → 转发至 Django /LabDatabase/downloadPartMap/1
    # 请求 /LabDatabase/upload/ → MapProcess Upload Map（同步解析并落库）
    # proxy_pass 无 URI 后缀，避免剥掉路径前缀。
    location /LabDatabase/ {
        proxy_pass http://bio_app_labdatabase;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection        "";
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # ---- 反向代理：WebDatabase（与 LabDatabase 同 upstream :8000；保留 /WebDatabase 前缀）----
    # 与 Vite `VITE_WEBDB_PROXY_TARGET`（未设时回退 LABDB）行为一致。
    location /WebDatabase/ {
        proxy_pass http://bio_app_labdatabase;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection        "";
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # ---- 反向代理：TPlot Flask（去掉 /tplot-api 前缀，与 Vite 一致）----
    # 请求 /tplot-api/Opt → 转发至 Flask /Opt
    location /tplot-api/ {
        proxy_pass http://bio_app_tplot/;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }

    # ---- 用户上传文件 ----
    # 方案 A（推荐入门）：经 API 转发
    location /res/ {
        proxy_pass http://bio_app_api/res/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 7d;
        add_header Cache-Control "public";
    }

    # 方案 B（可选优化）：由 Nginx 直接读盘，减轻 Node 压力
    # 启用时注释掉上方 location /res/ 代理块
    # location /res/ {
    #     alias /var/www/bio-app/api/res/;
    #     autoindex off;
    #     expires 7d;
    # }

    # ---- 前端静态资源 ----
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 带 hash 的构建资源可长期缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    access_log /var/log/nginx/bio-app.access.log;
    error_log  /var/log/nginx/bio-app.error.log;
}
```

启用站点并重载：

```bash
# Debian / Ubuntu
sudo ln -sf /etc/nginx/sites-available/bio-app.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# RHEL 系（配置文件已在 conf.d/ 则直接测试重载）
sudo nginx -t && sudo systemctl reload nginx
```

### 5.3 仅 HTTP、暂不启用 SSL 的最小配置

若内网测试暂未配置证书，可暂时使用单 `server` 块监听 `80`，去掉 SSL 相关行，并删除 HTTP→HTTPS 跳转块。

---

## 6. Apache 部署

### 6.1 安装与启用模块

```bash
# Debian / Ubuntu
sudo apt update && sudo apt install -y apache2
sudo a2enmod proxy proxy_http headers rewrite ssl
sudo systemctl enable apache2

# RHEL / CentOS / Rocky
sudo dnf install -y httpd mod_ssl
sudo systemctl enable --now httpd
```

### 6.2 站点配置

创建 `/etc/apache2/sites-available/bio-app.conf`（Debian/Ubuntu）或 `/etc/httpd/conf.d/bio-app.conf`（RHEL）：

```apache
# 上游地址（与 api/.env / 前端 Vite 代理目标保持一致；LabDB / TPlot 按实际修改）
Define BIO_API_URL     http://127.0.0.1:9092/
Define BIO_TPRO_URL    http://127.0.0.1:8004/
Define BIO_LABDB_URL   http://127.0.0.1:8000/LabDatabase/
Define BIO_WEBDB_URL   http://127.0.0.1:8000/WebDatabase/
Define BIO_TPLOT_URL   http://127.0.0.1:8101/

<VirtualHost *:80>
    ServerName bio.example.com

    # ACME 证书申请目录
    Alias /.well-known/acme-challenge/ /var/www/certbot/.well-known/acme-challenge/
    <Directory /var/www/certbot/.well-known/acme-challenge/>
        Require all granted
    </Directory>

    # 启用 SSL 后取消下行注释，强制跳转 HTTPS
    # Redirect permanent / https://bio.example.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName bio.example.com

    DocumentRoot /var/www/bio-app/dist
    <Directory /var/www/bio-app/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>

    # SSL（见 §7）
    SSLEngine on
    SSLCertificateFile      /etc/letsencrypt/live/bio.example.com/fullchain.pem
    SSLCertificateKeyFile   /etc/letsencrypt/live/bio.example.com/privkey.pem

    # 上传大小限制（与 Nginx client_max_body_size 对应）
    LimitRequestBody 67108864

    # ---- 反向代理（须在 DocumentRoot 静态规则之前生效）----
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    ProxyPass        /api/       ${BIO_API_URL}
    ProxyPassReverse /api/       ${BIO_API_URL}

    ProxyPass        /t-pro-api/ ${BIO_TPRO_URL}
    ProxyPassReverse /t-pro-api/ ${BIO_TPRO_URL}

    # 可选：遗留 T-Pro 路径
    ProxyPass        /t-pro/     ${BIO_TPRO_URL}
    ProxyPassReverse /t-pro/     ${BIO_TPRO_URL}

    # LabDatabase：Download Map + Upload Map（保留 /LabDatabase 前缀）
    ProxyPass        /LabDatabase/ ${BIO_LABDB_URL}
    ProxyPassReverse /LabDatabase/ ${BIO_LABDB_URL}

    # WebDatabase：与 LabDatabase 同机 :8000，保留 /WebDatabase 前缀
    ProxyPass        /WebDatabase/ ${BIO_WEBDB_URL}
    ProxyPassReverse /WebDatabase/ ${BIO_WEBDB_URL}

    # TPlot Flask：去掉 /tplot-api 前缀（与 Vite rewrite 一致）
    ProxyPass        /tplot-api/ ${BIO_TPLOT_URL}
    ProxyPassReverse /tplot-api/ ${BIO_TPLOT_URL}

    # 用户上传文件：经 API 转发
    ProxyPass        /res/       ${BIO_API_URL}res/
    ProxyPassReverse /res/       ${BIO_API_URL}res/

    # 可选：由 Apache 直接提供 /res/ 静态文件
    # ProxyPass /res/ !
    # Alias /res/ /var/www/bio-app/api/res/
    # <Directory /var/www/bio-app/api/res/>
    #     Options -Indexes
    #     Require all granted
    # </Directory>

    # 长耗时任务（T-Pro）超时
    ProxyTimeout 600

    # 构建资源缓存
    <LocationMatch "^/assets/.*">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </LocationMatch>

    ErrorLog  ${APACHE_LOG_DIR}/bio-app-error.log
    CustomLog ${APACHE_LOG_DIR}/bio-app-access.log combined
</VirtualHost>
```

启用站点并重载：

```bash
# Debian / Ubuntu
sudo a2ensite bio-app.conf
sudo a2dissite 000-default.conf    # 可选：禁用默认站点
sudo apachectl configtest
sudo systemctl reload apache2

# RHEL
sudo apachectl configtest
sudo systemctl reload httpd
```

### 6.3 路径代理说明

| 浏览器请求 | Apache 转发目标 |
|------------|---------------|
| `GET /api/health` | `http://127.0.0.1:9092/health` |
| `POST /api/account/login` | `http://127.0.0.1:9092/account/login` |
| `GET /t-pro-api/species` | `http://127.0.0.1:8004/species` |
| `GET /LabDatabase/upload/` | `http://127.0.0.1:8000/LabDatabase/upload/` |
| `GET /WebDatabase/...` | `http://127.0.0.1:8000/WebDatabase/...` |
| `GET /tplot-api/TFPlot` | `http://127.0.0.1:8101/TFPlot`（Dimer Plot iframe；去掉 `/tplot-api` 前缀） |
| `POST /tplot-api/Opt` | `http://127.0.0.1:8101/Opt`（去掉 `/tplot-api` 前缀） |
| `GET /res/avatars/xxx.jpg` | `http://127.0.0.1:9092/res/avatars/xxx.jpg` |
| `GET /` 或 `GET /assets/index.js` | `DocumentRoot` 下静态文件 |

> `ProxyPass` 与 `ProxyPassReverse` 的源路径与目标 URL **末尾斜杠**需严格对应，否则容易出现路径拼接错误。上方配置已按本项目前端 `baseURL: '/api/'` 对齐。

---

## 7. HTTPS 证书（Let's Encrypt）

Nginx 与 Apache 均可使用 Certbot 自动签发：

```bash
# Debian / Ubuntu — Nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bio.example.com

# Debian / Ubuntu — Apache
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d bio.example.com
```

证书续期：

```bash
sudo certbot renew --dry-run
```

---

## 8. 上线检查清单

部署完成后，按序验证：

- [ ] `systemctl status bio-app-api` 为 `active (running)`
- [ ] `curl http://127.0.0.1:9092/health` 返回正常
- [ ] `https://bio.example.com/` 可打开登录页
- [ ] 浏览器开发者工具中 `/api/account/login` 等接口返回 200，**不是** 404 / 502
- [ ] 登录后可进入 `/#/dashboard`，数据正常加载
- [ ] 头像上传后可通过 `/res/avatars/...` 访问
- [ ] T-Pro 相关页面可加载物种列表（依赖 T-Pro 服务可达）
- [ ] TPlot Dimer Plot / Fitting / Opt / Assembly 可调用（依赖 `/tplot-api/` → `:8101`、`/WebDatabase/` → `:8000`；Dimer Plot 访问 `/tplot-api/TFPlot`）
- [ ] `api/res/` 目录有新文件写入，权限正确
- [ ] 管理员账号可访问 `/#/admin`
- [ ] SMTP 配置后找回密码邮件可发送

---

## 9. 更新与回滚

### 9.1 常规更新

```bash
cd /var/www/bio-app
git pull

# 前端
npm install
npm run build

# 后端
cd api
npm install --omit=dev
npm run prisma:generate
# 若有新迁移：npm run prisma:migrate:deploy

sudo systemctl restart bio-app-api
sudo systemctl reload nginx    # 或 apache2 / httpd
```

### 9.2 回滚

```bash
cd /var/www/bio-app
git checkout <previous-commit>
npm run build
cd api && npm install && npm run prisma:generate
sudo systemctl restart bio-app-api
```

> 若数据库 Schema 已向前迁移，回滚代码前请先确认迁移兼容性。

---

## 10. 常见问题

### Q1：页面能打开，但所有 `/api/` 请求 502 Bad Gateway

**原因**：后端未启动或端口不一致。

**处理**：

```bash
sudo systemctl status bio-app-api
curl http://127.0.0.1:9092/health
```

检查 Nginx / Apache 上游地址是否为 `127.0.0.1:9092`。

### Q2：`/api/` 请求 404，路径似乎多了一层 `/api`

**原因**：反向代理未正确去除 `/api` 前缀。

**处理**：

- Nginx：`proxy_pass` 目标必须以 `/` 结尾，如 `proxy_pass http://127.0.0.1:9092/;`
- Apache：使用 `ProxyPass /api/ http://127.0.0.1:9092/`，**不要**写成 `http://127.0.0.1:9092/api/`

### Q3：文件上传失败，提示 413 Request Entity Too Large

**原因**：Web 服务器上传限制小于应用限制。

**处理**：

- Nginx：增大 `client_max_body_size`（如 `64m` 或更高）
- Apache：增大 `LimitRequestBody`（字节数，64MB = `67108864`）

### Q4：T-Pro 任务创建失败，物种列表为空

**原因**：`/t-pro-api/` 未代理或 `TPRO_API_URL` 不可达。

**处理**：

1. 确认 `api/.env` 中 `TPRO_API_URL` 正确
2. 在服务器上执行：`curl -I "$TPRO_API_URL"`
3. 检查 Nginx / Apache 的 `/t-pro-api/` 代理配置

### Q5：头像或用户文件 403 / 404

**原因**：`api/res/` 权限不足或代理路径错误。

**处理**：

```bash
sudo chown -R www-data:www-data /var/www/bio-app/api/res
ls -la /var/www/bio-app/api/res/avatars
```

若使用 Nginx 直接 `alias` 提供 `/res/`，确认路径与 `alias` 末尾斜杠写法正确。

### Q6：HTTPS 混合内容或 Cookie 异常

**原因**：未传递 `X-Forwarded-Proto`，后端或前端误判协议。

**处理**：确保反向代理配置中包含：

- Nginx：`proxy_set_header X-Forwarded-Proto $scheme;`
- Apache：`RequestHeader set X-Forwarded-Proto "https"`

---

## 11. 路径对照表（开发 vs 生产）

| 前端请求 | 开发环境（Vite） | 生产环境（Nginx / Apache） |
|----------|------------------|----------------------------|
| `/api/*` | → `127.0.0.1:9092/*` | → `127.0.0.1:9092/*` |
| `/t-pro-api/*` | → `TPRO 服务/*` | → `TPRO 服务/*` |
| `/t-pro/*` | → `TPRO 服务/*` | → `TPRO 服务/*`（可选） |
| `/LabDatabase/*` | → `127.0.0.1:8000/LabDatabase/*`（`VITE_LABDB_PROXY_TARGET`） | → LabDatabase / MapProcess（保留前缀；Download Map + `POST /LabDatabase/upload/`） |
| `/WebDatabase/*` | → `127.0.0.1:8000/WebDatabase/*`（`VITE_WEBDB_PROXY_TARGET`，未设回退 LABDB） | → 同 LabDB upstream :8000（保留前缀） |
| `/tplot-api/*` | → `127.0.0.1:8101/*`（`VITE_TPLOT_API_PROXY_TARGET`；rewrite 去掉前缀） | → TPlot Flask（去掉 `/tplot-api` 前缀） |
| `/res/*` | → `127.0.0.1:9092/res/*` | → API 或静态目录 |
| `/*`（页面） | Vite 开发服务器 | `dist/` 静态文件 |

开发环境变量见仓库根目录 `.env.example`（`VITE_LABDB_PROXY_TARGET`、`VITE_WEBDB_PROXY_TARGET`、`VITE_TPLOT_API_PROXY_TARGET`；可选 `VITE_TPLOT_PLOT_URL` 覆盖 Dimer Plot iframe 地址，默认 `/tplot-api/TFPlot`）。生产环境在 Nginx / Apache 中配置等价 upstream / `ProxyPass`，无需再设上述 `VITE_*` 变量。

> TPlot / WebDatabase 依赖的遗留服务（`refs/TFDesignWeb`、`refs/WebDatabase`）由运维独立部署；本仓库仅配置前端代理，不修改其源码。

---

## 12. 相关文档

| 文档 | 内容 |
|------|------|
| [README.md](../README.md) | 本地开发、数据库初始化、首次使用 |
| [delivery.md](./delivery.md) | 功能清单、环境变量、API 目录 |
| [acceptance.md](./acceptance.md) | 交接验收清单 |

如部署环境涉及 Docker、K8s 或 CI/CD，可在本指南基础上封装镜像与流水线；仓库当前仅提供 Web 服务器层面的参考配置。
