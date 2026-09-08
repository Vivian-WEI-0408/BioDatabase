# Batch Upload 更新说明

> 更新日期：2026-07-24  
> 关联范围：质粒数据库 Browse 页 Batch Upload；Express API 本地解析 Excel 并写入遗留库

---

## 1. 更新概述

本次实现并完善 **Batch Upload**：用户下载三类 Excel 模板、填入数据后上传，由 **api 项目本地处理**（不转发 LabDatabase），解析后写入 Part / Backbone / Plasmid 遗留表。

| 项目 | 变更前 | 变更后 |
|------|--------|--------|
| Browse 入口 | 隐藏（组件与接口保留） | **恢复「Batch Upload」**（仅数据管理员 / 管理员） |
| 解析与落库 | Express Task（依赖外部解析，已弃用） | Express Task → 本地 `xlsx` + Prisma 写入 |
| 模板文件 | 路径默认 `api/data/upload-templates`（常找不到） | 默认 `api/res/templates/`（`part` / `backbone` / `plasmid`） |
| 类型识别 | 外部推断 | 按 Excel **表头签名**识别（不依赖当前 Browse 的 `datasetType`） |
| `name` 冲突 | — | 库级唯一；**按行跳过**并汇总 errors，其余行继续 |

Upload Map 仍走 LabDatabase 同步上传，与本次无关。详见 [Upload-Map更新说明.md](./Upload-Map更新说明.md)。

---

## 2. 功能说明

| 项目 | 说明 |
|------|------|
| 入口 | Browse 工具栏「Batch Upload」（`role === 1` 或 `role >= 9`） |
| 弹窗 | `dataset-batch-upload-modal.vue`：下载三类模板 + 选择单个 Excel |
| 模板下载 | `GET /api/datasets/browse/upload-template?datasetType=part\|backbone\|plasmid` |
| 上传 | `POST /api/datasets/browse/upload-batch`，`multipart/form-data`，字段名 `file` |
| 状态 | 创建 Task 后轮询 `POST /api/datasets/browse/upload-status`（约 2s） |
| 成功 | 至少导入 1 行 → 任务 `completed` → 提示汇总 → 关闭弹窗 → 刷新列表 |
| 全失败 | `created === 0` → 任务 `failed`，错误文案展示在弹窗内 |
| 权限 | 无管理权限：不显示按钮；直接调接口返回 `Permission denied` |

支持扩展名：`.xlsx` / `.xls`。

---

## 3. 调用链路

```
浏览器
  → POST /api/datasets/browse/upload-batch（multipart file）
  → createBatchUploadTask（落临时文件 + 建 Task）
  → datasetUploadRunner（uploadKind=batch）
  → datasetBatchImport（xlsx 读表 → 按行 Prisma 写入）
  → completeTask / failTask
  → 前端轮询 upload-status → 刷新 browse 列表
```

模板下载：

```
浏览器
  → GET /api/datasets/browse/upload-template?datasetType=...
  → res.download(api/res/templates/{part|backbone|plasmid}_template.xlsx)
```

---

## 4. 接口约定

### 4.1 下载模板

| 方法 | 路径 | 鉴权 |
|------|------|------|
| GET | `/api/datasets/browse/upload-template` | 登录 + 数据管理权限 |

| Query | 必填 | 说明 |
|-------|------|------|
| `datasetType`（或 `type`） | 是 | `part` / `backbone` / `plasmid` |

成功：返回 Excel 文件流。失败：JSON `{ status: 0, msg }`。

环境变量：`DATASET_UPLOAD_TEMPLATE_DIR` 可覆盖模板目录；未设置时默认 `api/res/templates`。

### 4.2 批量上传

| 方法 | 路径 | Content-Type |
|------|------|--------------|
| POST | `/api/datasets/browse/upload-batch` | `multipart/form-data` |

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | File | 是 | 单个 Excel（已按模板填写） |

成功响应（`status: 1`）示例：

```json
{
  "status": 1,
  "options": {
    "taskId": 123,
    "task": { "...": "..." },
    "message": "Upload task created"
  }
}
```

### 4.3 轮询状态

| 方法 | 路径 |
|------|------|
| POST | `/api/datasets/browse/upload-status` |

| Body | 说明 |
|------|------|
| `taskId` | 上传接口返回的任务 ID |

`options` 主要字段：`status`（`pending` / `running` / `completed` / `failed`）、`progress`、`message`、`errorMsg`、`result`（含 `created` / `failed` / `errors` / `datasetType`）。

---

## 5. Excel 模板与字段映射

模板位置：`api/res/templates/`

| 文件 | 识别表头 | Sheet |
|------|----------|-------|
| `part_template.xlsx` | `PartName` | Part |
| `backbone_template.xlsx` | `BackboneName` | Sheet1 |
| `plasmid_template.xlsx` | `PlasmidName` | Sheet1 |

### 5.1 Part

| Excel 列 | 库字段 | 说明 |
|----------|--------|------|
| PartName | `parttable.Name` | 必填；唯一 |
| Alias | `Alias` | |
| Type | `Type` | 必填；`Promoter` / `CDS` / `Terminator` / `RBS` / `P+R`（或对应数字 id） |
| Sequence | `Level0Sequence` + `LengthInLevel0` | 必填 |
| Species | `SourceOrganism` | |
| Note | `Note` | |

### 5.2 Backbone

| Excel 列 | 库字段 | 说明 |
|----------|--------|------|
| BackboneName | `backbonetable.Name` | 必填；唯一（最长 20） |
| Alias | `Alias` | |
| Sequence | `Sequence` + `Length` | 必填 |
| Species | `Species` | |
| Note | `Notes` | |

### 5.3 Plasmid

| Excel 列 | 库字段 / 关联 | 说明 |
|----------|---------------|------|
| PlasmidName | `plasmidneed.Name` | 必填；唯一（最长 20） |
| Alias | `Alias` | |
| Level | `Level` | 必填 |
| Sequence | `SequenceConfirm` + `Length` | 必填 |
| Note | `Note` | |
| ParentPart | `parentparttable` | 按名称查找已有 Part；逗号/换行分隔多值 |
| ParentBackbone | `parentbackbonetable` | 同上，查 Backbone |
| ParentPlasmid | `parentplasmidtable` | 同上，查 Plasmid |
| ParentSourceNote | `CustomParentInformation` | |

父本名称不存在时，**该行失败**（不影响其它行）。

### 5.4 写入约定

- `User`：当前登录用户 `name`（截断至字段长度）
- `uploaddate` / `updatedate`：导入时刻
- Scar：模板无酶切列，创建空 scar 行（五酶字段为空字符串）
- 空数据行跳过；文件内重复 name 按行失败

---

## 6. 代码与文档变更清单

### 6.1 API

| 文件 | 变更 |
|------|------|
| `api/package.json` | 新增依赖 `xlsx` |
| `api/src/services/datasetBatchImport.js` | **新建**：解析模板、校验、按行插入 |
| `api/src/services/datasetUploadRunner.js` | `batch` 走本地导入；`map` 标记为已弃用并失败 |
| `api/src/services/datasetUploadStore.js` | 模板目录默认 `res/templates`；完成态 message 含 Created/failed 汇总 |
| `api/src/routes/datasets.js` | `upload-batch` / `upload-template` 增加 `canManageBrowseRows` |
| `api/src/services/datasetBrowseStore.js` | 导出 `isNameTaken` 供导入复用 |
| `api/res/templates/*.xlsx` | 三类批量上传模板 |

### 6.2 前端

| 文件 | 变更 |
|------|------|
| `src/components/dataset-browse.vue` | 恢复 Batch 按钮、弹窗、`uploadBatch`、upload-status 轮询；按钮受 `canManageRows` 控制 |
| `src/components/dataset-browse/dataset-batch-upload-modal.vue` | 沿用（模板下载 + 单文件上传） |

Upload Map 逻辑保持 LabDatabase 同步调用，与 Batch 共享 `uploadState`，同时只开一个弹窗。

### 6.3 文档

| 文件 | 变更 |
|------|------|
| `readmes/Batch-Upload更新说明.md` | 本文 |
| `readmes/unfinished.md` | Batch Upload 标为已完成 |
| `readmes/Upload-Map更新说明.md` | 交叉引用 Batch 状态 |

---

## 7. 验收要点

- [ ] 数据管理员可见「Batch Upload」；普通用户不可见
- [ ] 三类模板均可下载，文件来自 `api/res/templates/`
- [ ] Network 中上传为 `/api/datasets/browse/upload-batch`，**不**走 `/LabDatabase`
- [ ] 合法 Part / Backbone / Plasmid 行导入后列表可见
- [ ] 重复 `name`：该行进入 errors，其它行仍入库；提示含 `Created N, failed M`
- [ ] 非法 Type / 缺 Sequence / Parent 名不存在：行级错误可读
- [ ] 无权限调 `upload-batch` / `upload-template` 返回拒绝
- [ ] Upload Map 行为不变（仍走 `/LabDatabase/upload/`）

---

## 8. 已知限制与后续

| 项 | 说明 |
|----|------|
| 模板无 Scar / Ori / Marker 列 | 导入后 scar 为空；culture functions 不写入，可在编辑页补全 |
| 大文件 | 异步 Task + 默认 multer 约 50MB；超大表按行串行插入，耗时随行数增长 |
| Express `upload-map` | 仍保留但前端不调用，可择机清理 |
| Upload Map 服务 | 仍依赖 LabDatabase 部署，见 [unfinished.md](./unfinished.md) |
