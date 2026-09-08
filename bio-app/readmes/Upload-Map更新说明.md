# Upload Map 更新说明

> 更新日期：2026-07-24  
> 关联范围：质粒数据库 Browse 页 Upload Map；网关与 Download 共用 LabDatabase upstream

---

## 1. 更新概述

本次将 **Upload Map** 从 Express `/api/datasets/browse/upload-map` 异步任务队列，改为经现有 **LabDatabase 网关** 同步调用上传接口。

| 项目 | 变更前 | 变更后 |
|------|--------|--------|
| 调用路径 | `POST /api/datasets/browse/upload-map` + 轮询 `upload-status` | `POST /LabDatabase/upload/`（同步一次返回） |
| 解析与落库 | Express 异步任务（已弃用） | LabDatabase 上传接口自行解析并写入遗留库 |
| Batch Upload | 工具栏隐藏 | **入口恢复**；见 [Batch-Upload更新说明.md](./Batch-Upload更新说明.md) |
| 网关 | Upload 未专门配置 | 与 Download Map 共用 `VITE_LABDB_PROXY_TARGET` / `bio_app_labdatabase` |

---

## 2. 功能说明

### 2.1 Upload Map（已切换）

| 项目 | 说明 |
|------|------|
| 入口 | Browse 页工具栏「Upload Map」 |
| 请求 | `POST /LabDatabase/upload/`，`multipart/form-data` |
| 字段 | `files`（多文件）、`type`（`part` / `backbone` / `plasmid`）、`save_feature`（`true` / `false`） |
| 超时 | 前端 axios 超时 300s（与网关长超时一致） |
| 成功 | 提示成功 → 关闭弹窗 → 刷新列表 |
| 部分失败 | 展示失败文件的 `file_name` + `message`；若有成功项仍刷新列表 |
| 请求失败 | 将服务端 `message` 或网络错误写入弹窗错误区 |

支持的文件类型：`.fasta` / `.fa` / `.gb` / `.gbk` / `.ape` / `.str` / `.dna`。

### 2.2 Batch Upload

Batch Upload 已单独本地实现（Excel 解析 + Prisma 落库）。详见 **[Batch-Upload更新说明.md](./Batch-Upload更新说明.md)**。
---

## 3. 调用链路

```
浏览器
  → POST /LabDatabase/upload/（同源，不走 /api）
  → Vite / Nginx / Apache 的 /LabDatabase/ location
  → VITE_LABDB_PROXY_TARGET（默认 http://127.0.0.1:8000）
  → LabDatabase 上传接口（同步解析 + 落库）
  → JSON { success, total, results }
  → 前端刷新 browse 列表
```

Download Map 仍为：

```
window.location → /LabDatabase/download{Part|Backbone|Plasmid}Map/:id
```

二者共用同一 LabDatabase 代理配置，**无需新增 upstream**。

---

## 4. 接口约定

| 方法 | 路径 | Content-Type |
|------|------|--------------|
| POST | `/LabDatabase/upload/` | `multipart/form-data` |

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `files` | File[] | 是 | 可多文件，同名字段重复传递 |
| `type` | string | 是 | `plasmid` / `backbone` / `part` |
| `save_feature` | string | 否 | `true` / `1` / `yes` / `on` |

**成功响应（HTTP 200）：**

```json
{
  "success": true,
  "total": 1,
  "results": [
    { "success": true, "data": { "name": "...", "sequence": "...", ... } }
  ]
}
```

顶层 `success: false` 时仍可能 HTTP 200，需遍历 `results[]` 查看各文件成败。  
请求级错误一般为 HTTP 400，body 含 `message`。

---

## 5. 代码与文档变更清单

### 5.1 前端

| 文件 | 变更 |
|------|------|
| `src/components/dataset-browse.vue` | 重写 `uploadMap`；移除 Batch 入口与轮询逻辑 |
| `src/components/dataset-browse/dataset-upload-modal.vue` | 提交中 indeterminate 进度；错误信息支持多行 |

### 5.2 网关 / 文档

| 文件 | 变更 |
|------|------|
| `vite.config.js` | 注释标明 Upload 与 Download 共用 `/LabDatabase` |
| `README.md` | 开发代理表更新用途说明 |
| `readmes/deploy-webserver.md` | Nginx / Apache LabDatabase 说明更新 |
| `readmes/unfinished.md` | Upload Map 阻塞项改为依赖 LabDatabase 上传服务部署 |

### 5.3 Express Upload 代码

- Upload Map：Express `upload-map` 仍保留但前端**不再调用**（走 LabDatabase）。
- Batch Upload：已改为本地实现，详见 [Batch-Upload更新说明.md](./Batch-Upload更新说明.md)。

---

## 6. 部署前提

1. **LabDatabase 服务** 监听网关目标端口（默认 `8000`），并实际提供：
   - `POST /LabDatabase/upload/`
2. **落库**：上传接口写入与 Browse 列表同一套遗留库（本仓库前端不再经 Express 入库）。
3. **CSRF**：浏览器同源 POST 需服务端豁免或提供 CSRF。
4. **代理超时 / body 大小**：沿用现有 LabDatabase location（文档建议约 64m body、300s 超时），同步解析大文件时勿缩短超时。

开发环境：设置 `VITE_LABDB_PROXY_TARGET`（默认 `http://127.0.0.1:8000/`）即可；无需单独为 Upload 配置代理 key。

生产环境：见 [deploy-webserver.md](./deploy-webserver.md) 中 `/LabDatabase/` location。

---

## 7. 验收要点

- [ ] Network 中 Upload Map 请求为 `/LabDatabase/upload/`，**不出现** `/api/datasets/browse/upload-map`
- [ ] Browse 工具栏对数据管理员可见「Batch Upload」；细节见 [Batch-Upload更新说明.md](./Batch-Upload更新说明.md)
- [ ] Upload Map 全部成功后弹窗关闭且列表刷新
- [ ] Upload Map 部分失败时错误文案可读，且成功项已入库可见
- [ ] Download Map 仍走 `/LabDatabase/download*Map/...`，行为不变

---

## 8. 已知后续项

| 项 | 说明 |
|----|------|
| Express Upload Map 清理 | `upload-map` 等死代码可择机删除或旁路 |
| LabDatabase 上传服务部署 | 见 [unfinished.md](./unfinished.md) Upload Map 阻塞项 |
