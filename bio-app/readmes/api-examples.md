# 前端接口请求与响应示例

> 覆盖 [delivery.md §11](./delivery.md#11-api-清单前端调用全集) 中前端实际调用的全部接口。

> 本仓库 `/api`：HTTP 多为 `200`，业务看 JSON `status`（`1` 成功），数据在 `options`。

> 除登录 / 注册 / 找回密码外，请求头需 `Token: <有效token>`。

> 外部服务（T-Pro / TPlot / LabDatabase）非本仓库实现，示例按前端实际读取字段整理。

## 目录

- [A. 账户](#a-账户-account)
- [B. 用户](#b-用户-user)
- [C. 应用与仪表盘](#c-应用与仪表盘)
- [D. 任务与共享](#d-任务与共享)
- [E. 文件](#e-文件-files)
- [F. 数据集](#f-数据集-datasets)
- [G. 文档 / 搜索 / 通知 / 反馈 / T-Pro 辅助](#g-文档--搜索--通知--反馈--t-pro-辅助)
- [H. 后台管理](#h-后台管理-admin)
- [I. T-Pro 外部接口](#i-t-pro-外部接口-t-pro-api)
- [J. TPlot / WebDatabase](#j-tplot--webdatabase)
- [K. 遗留 LabDatabase](#k-遗留-labdatabase)

## A. 账户 `/account`

### A.1 POST `account/login` — 登录

**所属页面 / 组件：** `signin.vue`

**认证：** 可选（带有效 Token 时可跳过密码）

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | ✅ | 邮箱（亦支持 `account` / `email`） |
| `password` | string | ✅ | 明文密码 |

**请求示例：**

```json
{
  "username": "user@example.com",
  "password": "your_password"
}
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "user": {
      "id": 1,
      "name": "张三",
      "email": "user@example.com",
      "token": "a1b2c3d4e5f6...",
      "status": 1,
      "role": 0,
      "title": "Researcher",
      "organization": "Lab A",
      "phone": "",
      "gender": "",
      "avatar": "/res/avatars/1.png",
      "username": "user@example.com",
      "last_login_time": "2026-07-09 10:00:00",
      "created_at": "2026-07-01 08:00:00",
      "updated_at": "2026-07-09 10:00:00"
    }
  }
}
```

**失败 / 边界：** `status:2` 账号不存在；`3` 密码错误；`4` 已禁用。带有效 Token 时跳过密码校验。响应不含 `password`。

### A.2 POST `account/register` — 注册

**所属页面 / 组件：** `signup.vue`

**认证：** 不需要

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 显示名称 |
| `email` | string | ✅ | 邮箱，唯一 |
| `password` | string | ✅ | 密码 |
| `organization` | string | ✅ | 所属单位 |

**请求示例：**

```json
{
  "name": "张三",
  "email": "user@example.com",
  "password": "your_password",
  "organization": "Lab A"
}
```

**成功响应：**

```json
{
  "status": 1,
  "options": { "user": { "...": "同登录，含新 token" } }
}
```

**失败 / 边界：** `status:4` 缺必填；`5` 邮箱格式无效；`6` 邮箱已注册。

### A.3 POST `account/logout` — 登出

**所属页面 / 组件：** `parts/app-menu.vue`

**认证：** 需 Header `Token`

**请求参数：** 无 Body。

**成功响应：**

```json
{ "status": 1, "options": {} }
```

**失败 / 边界：** 服务端将 `users.token` 置空；无 Token 时亦返回成功。

### A.4 POST `account/sendVCode` — 发送找回密码验证码

**所属页面 / 组件：** `recover-password-modal.vue`

**认证：** 不需要

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tel` | string | ✅ | 邮箱（前端字段名 `tel`；后端亦接受 `email`） |

**请求示例：**

```json
{ "tel": "user@example.com" }
```

**成功响应：**

```json
{ "status": 1, "options": {} }
```

**失败 / 边界：** `status:2` 邮箱未注册；`3` 格式错误或 SMTP 发送失败。验证码存内存，服务重启失效。

### A.5 POST `account/resetPassword` — 重置密码

**所属页面 / 组件：** `recover-password-modal.vue`

**认证：** 不需要

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tel` | string | ✅ | 邮箱（同 sendVCode） |
| `vcode` | string | ✅ | 验证码 |
| `password` | string | ✅ | 新密码 |

**请求示例：**

```json
{
  "tel": "user@example.com",
  "vcode": "123456",
  "password": "new_password_6plus"
}
```

**成功响应：**

```json
{ "status": 1, "options": {} }
```

**失败 / 边界：** `status:2` 用户不存在；`3` 验证码错误 / 参数不合法。

## B. 用户 `/user`

### B.1 POST `user/refreshProfile` — 会话恢复

**所属页面 / 组件：** `App.vue`、`settings.vue`

**认证：** 需 Header `Token`

**请求参数：** 无 Body，依赖 Header `Token`。

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "user": {
      "id": 1,
      "name": "张三",
      "email": "user@example.com",
      "token": "a1b2c3d4e5f6...",
      "status": 1,
      "role": 0,
      "title": "Researcher",
      "organization": "Lab A",
      "phone": "",
      "gender": "",
      "avatar": "/res/avatars/1.png",
      "username": "user@example.com",
      "last_login_time": "2026-07-09 10:00:00",
      "created_at": "2026-07-01 08:00:00",
      "updated_at": "2026-07-09 10:00:00"
    }
  }
}
```

**失败 / 边界：** `status:2` Token 无效；用户禁用由 `requireUser` 返回失败。前端 `status !== 1` 时跳转 `/signin`。

### B.2 POST `user/updateProfile` — 更新资料

**所属页面 / 组件：** `settings/profile-card.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 显示名称 |
| `title` | string | — | 职称 |
| `organization` | string | — | 单位 |
| `phone` | string | — | 电话 |
| `gender` | string | — | 性别 |

**请求示例：**

```json
{
  "name": "张三",
  "title": "Researcher",
  "organization": "Lab A",
  "phone": "",
  "gender": ""
}
```

**成功响应：**

```json
{
  "status": 1,
  "options": { "user": { "...": "sanitizeUser 用户对象" } }
}
```

**失败 / 边界：** `status:3` 名称为空。

### B.3 POST `user/uploadAvatar` — 上传头像

**所属页面 / 组件：** `settings/profile-card.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `data` | string | ✅ | Base64 Data URL（亦接受字段名 `avatar`） |

**请求示例：**

```json
{ "data": "data:image/png;base64,iVBORw0KGgo..." }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "user": {
      "...": "用户对象",
      "avatar": "/res/avatars/1.png"
    }
  }
}
```

**失败 / 边界：** `status:3` 解析失败或超过 5MB。

### B.4 POST `user/changePassword` — 修改密码

**所属页面 / 组件：** `settings/password-card.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `currentPassword` | string | ✅ | 当前密码 |
| `newPassword` | string | ✅ | 新密码（≥6 位） |
| `confirmPassword` | string | ✅ | 确认新密码 |

**请求示例：**

```json
{
  "currentPassword": "old_pass",
  "newPassword": "new_pass_6plus",
  "confirmPassword": "new_pass_6plus"
}
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "user": { "...": "含新 token 的用户对象" }
  }
}
```

**失败 / 边界：** `status:3` 当前密码错误、两次不一致或新密码过短。成功后旧 token 立即失效。

### B.5 POST `user/sendCurrentEmailVCode` — 向当前邮箱发验证码

**所属页面 / 组件：** `settings/email-card.vue`

**认证：** 需 Header `Token`

**请求参数：** 无 Body。

**成功响应：**

```json
{ "status": 1, "options": {} }
```

**失败 / 边界：** `status:3` SMTP 发送失败等。

### B.6 POST `user/sendNewEmailVCode` — 向新邮箱发验证码

**所属页面 / 组件：** `settings/email-card.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | ✅ | 新邮箱 |

**请求示例：**

```json
{ "email": "new@example.com" }
```

**成功响应：**

```json
{ "status": 1, "options": {} }
```

**失败 / 边界：** `status:5` 格式错误；`6` 已被占用；`3` 与当前邮箱相同或发送失败。

### B.7 POST `user/changeEmail` — 确认修改邮箱

**所属页面 / 组件：** `settings/email-card.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | ✅ | 新邮箱 |
| `currentVcode` | string | ✅ | 当前邮箱验证码 |
| `newVcode` | string | ✅ | 新邮箱验证码 |

**请求示例：**

```json
{
  "email": "new@example.com",
  "currentVcode": "111111",
  "newVcode": "222222"
}
```

**成功响应：**

```json
{
  "status": 1,
  "options": { "user": { "...": "email/username 已更新" } }
}
```

**失败 / 边界：** `status:3` 缺参 / 验证码错误；`5` 格式错；`6` 邮箱占用。

## C. 应用与仪表盘

### C.1 POST `apps/list` — 应用列表

**所属页面 / 组件：** `apps.vue`

**认证：** 需 Header `Token`

**请求参数：** 无 Body。

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "apps": [
      {
        "id": "t-pro",
        "title": "T-Pro",
        "description": "Promoter design toolkit",
        "icon": "/images/logo.png",
        "route": "/t-pro",
        "author": "Lab",
        "date": "09 Jul 2026",
        "taskCount": "12",
        "starred": false
      }
    ]
  }
}
```

### C.2 POST `apps/toggleStar` — 收藏/取消收藏

**所属页面 / 组件：** `apps.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `appId` | string | ✅ | 应用 ID |

**请求示例：**

```json
{ "appId": "t-pro" }
```

**成功响应：**

```json
{ "status": 1, "options": { "starred": true } }
```

**失败 / 边界：** `status:3` 应用不存在等。

### C.3 POST `dashboard/getData` — 仪表盘聚合

**所属页面 / 组件：** `dashboard.vue`

**认证：** 需 Header `Token`

**请求参数：** 无 Body。

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "appCards": [
      { "id": "t-pro", "title": "T-Pro", "description": "...", "icon": "/images/logo.png", "route": "/t-pro" }
    ],
    "notifications": [
      {
        "id": 1,
        "tag": "T-Pro",
        "tagColor": "#26c0e2",
        "message": "Your task has been completed.",
        "time": "2h ago",
        "read": false,
        "taskId": "T-00042"
      }
    ],
    "todos": [
      { "id": 1, "text": "Review promoter results", "highlight": "promoter", "done": false }
    ],
    "taskStats": {
      "dates": ["07/01", "07/02", "07/03"],
      "values": [2, 0, 5]
    },
    "storage": {
      "usedPercent": 12,
      "availablePercent": 88,
      "totalMB": 1024
    }
  }
}
```

### C.4 POST `todos/update` — 更新待办

**所属页面 / 组件：** `dashboard.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 待办 ID |
| `done` | boolean | ✅ | 是否完成 |

**请求示例：**

```json
{ "id": 1, "done": true }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "todo": { "id": 1, "text": "Review promoter results", "highlight": "promoter", "done": true }
  }
}
```

**失败 / 边界：** 前端多为乐观更新，主要校验 `status`。`status:3` 待办不存在。

## D. 任务与共享

### D.1 POST `tasks/list` — 任务列表

**所属页面 / 组件：** `tasks.vue`、`modals/tpro-resource-manage.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `scope` | string | — | `all` / `mine` / `sharing`，默认 `all` |
| `search` | string | — | 关键词 |
| `sortKey` | string | — | 如 `date` / `id` |
| `sortDir` | string | — | `asc` / `desc` |
| `sharedByUserId` | number | — | 按共享者筛选 |
| `sharedWithUserId` | number | — | 按被共享者筛选 |

**请求示例：**

```json
{
  "scope": "mine",
  "sortKey": "date",
  "sortDir": "desc",
  "search": ""
}
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "tasks": [
      {
      "id": "T-00042",
      "app": "T-Pro",
      "appColor": "#26c0e2",
      "name": "Predict promoter strength - 09 Jul 2026",
      "date": "2026-07-09",
      "status": "pending",
      "operation": "promoter/predict",
      "creator": { "name": "Me", "avatar": "/images/avatar.png" },
      "scope": "mine",
      "isMine": true,
      "sharedToMe": false,
      "permission": "owner",
      "sharedCount": 0
    }
    ]
  }
}
```

### D.2 POST `tasks/create` — 创建 T-Pro 任务

**所属页面 / 组件：** `assets/js/tpro-task.js`（各 T-Pro 弹窗）

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `appId` | string | — | 默认 `t-pro` |
| `name` | string | ✅ | 任务显示名称 |
| `operation` | string | ✅ | 白名单 operation |
| `params` | object | ✅ | 传给 T-Pro 的业务参数 |
| `displayMeta` | object | — | 前端展示元数据 |

**合法 operation：** `promoter/generate`、`promoter/predict`、`library/generate`、`regulation/design`、`regulation/optimize`、`reporter/register`、`generator/register`、`activator/register`、`predictor/register`、`regulator/register`

**请求示例：**

```json
{
  "appId": "t-pro",
  "name": "Predict promoter strength - 09 Jul 2026",
  "operation": "promoter/predict",
  "params": { "speciesId": 1, "predictorId": "pred-1", "sequences": ["ATCG"] },
  "displayMeta": { "speciesName": "E. coli" }
}
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "task": {
      "id": "T-00042",
      "app": "T-Pro",
      "appColor": "#26c0e2",
      "name": "Predict promoter strength - 09 Jul 2026",
      "date": "2026-07-09",
      "status": "pending",
      "operation": "promoter/predict",
      "creator": { "name": "Me", "avatar": "/images/avatar.png" },
      "scope": "mine",
      "isMine": true,
      "sharedToMe": false,
      "permission": "owner",
      "sharedCount": 0
    }
  }
}
```

**失败 / 边界：** `status:2` 未登录；`3` Invalid operation。创建后为 `pending`，由 `taskRunner` 异步执行。

### D.3 POST `tasks/detail` — 任务详情

**所属页面 / 组件：** `task-detail.vue`、`tpro-task.js` 轮询

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string/number | ✅ | 如 `T-00042` 或 `42` |

**请求示例：**

```json
{ "id": "T-00042" }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "task": {
      "id": "T-00042",
      "name": "Predict promoter strength - 09 Jul 2026",
      "status": "completed",
      "operation": "promoter/predict",
      "result": { "resultList": ["..."], "regions": ["..."] },
      "errorMsg": null,
      "params": { "apiParams": {}, "displayMeta": {} }
    }
  }
}
```

**失败 / 边界：** `status:3` 不存在或无权查看。共享任务通常仅 `read`。

### D.4 POST `tasks/cancel` — 取消任务

**所属页面 / 组件：** `tpro-task.js`、`task-detail.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string/number | ✅ | 任务 ID |

**请求示例：**

```json
{ "id": "T-00042" }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "task": {
      "...": "同 list 项",
      "status": "cancelled"
    }
  }
}
```

**失败 / 边界：** `status:3` 不可取消（已完成等）或非本人任务。`pending` 直接取消，`running` 中断 in-flight。

### D.5 POST `tasks/update` — 更新任务

**所属页面 / 组件：** `tasks.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 数字任务 ID |
| `name` | string | ✅ | 新名称 |

**请求示例：**

```json
{ "id": 42, "name": "Renamed task" }
```

**成功响应：**

```json
{
  "status": 1,
  "options": { "task": { "...": "更新后的任务对象" } }
}
```

**失败 / 边界：** `status:3` 无权或不存在。

### D.6 POST `tasks/delete` — 批量删除

**所属页面 / 组件：** `tasks.vue`、`tpro-resource-manage.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ids` | number[] | ✅ | 任务 ID 列表 |

**请求示例：**

```json
{ "ids": [42, 43] }
```

**成功响应：**

```json
{ "status": 1, "options": { "deleted": 2 } }
```

**失败 / 边界：** 删除前会尝试 `cancel` 进行中任务。`status:3` 未选中。

### D.7 POST `tasks/share` — 共享任务

**所属页面 / 组件：** `tasks.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `taskIds` | array | ✅ | 任务 ID 列表 |
| `userIds` | array | ✅ | 目标用户 ID |
| `permission` | string | — | 默认 `read` |

**请求示例：**

```json
{
  "taskIds": [42],
  "userIds": [3, 5],
  "permission": "read"
}
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "shared": 2,
    "tasks": [{ "id": "T-00042", "name": "..." }],
    "users": [
      { "id": 3, "name": "Bob", "email": "b@example.com", "avatar": "...", "title": "..." }
    ]
  }
}
```

**失败 / 边界：** `status:3` 无任务被共享。成功时会给目标用户写通知。

### D.8 POST `sharing/list` — 共享关系列表

**所属页面 / 组件：** `sharing.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `search` | string | — | 搜索用户 |

**请求示例：**

```json
{ "search": "" }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "toMe": [
      {
        "userId": 2,
        "id": "2",
        "name": "Alice",
        "email": "a@example.com",
        "role": "Researcher",
        "avatar": "/images/avatar.png",
        "status": "Tasks",
        "taskCount": 3,
        "datasetCount": 0
      }
    ],
    "fromMe": []
  }
}
```

### D.9 POST `sharing/users` — 搜索可共享用户

**所属页面 / 组件：** `tasks.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `search` | string | — | 关键词 |

**请求示例：**

```json
{ "search": "bob" }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "users": [
      {
        "userId": 3,
        "id": "3",
        "name": "Bob",
        "email": "b@example.com",
        "role": "User",
        "avatar": "/images/avatar.png"
      }
    ]
  }
}
```

### D.10 POST `sharing/unshare` — 取消共享

**所属页面 / 组件：** `sharing.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userIds` | number[] | ✅ | 取消与这些用户的共享（前端按用户维度） |

**请求示例：**

```json
{ "userIds": [2] }
```

**成功响应：**

```json
{ "status": 1, "options": { "deleted": 2 } }
```

## E. 文件 `/files`

### E.1 POST `files/list` — 文件列表

**所属页面 / 组件：** `files.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | — | 页码 |
| `pageSize` | number | — | 每页条数 |
| `keyword` | string | — | 文件名搜索 |
| `type` | string | — | 分类过滤 |
| `sortBy` | string | — | 排序字段 |
| `sortOrder` | string | — | `asc` / `desc` |

**请求示例：**

```json
{
  "page": 1,
  "pageSize": 20,
  "keyword": "",
  "type": "",
  "sortBy": "createdAt",
  "sortOrder": "desc"
}
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "files": [
      {
        "id": 55,
        "originalName": "data.csv",
        "storedName": "...",
        "sizeBytes": 10240,
        "sizeMB": 0.01,
        "mimeType": "text/csv",
        "extension": "csv",
        "category": "spreadsheet",
        "createdAt": "2026-07-09 10:30:00"
      }
    ],
    "pagination": { "currentPage": 1, "pageSize": 20, "totalCount": 42, "totalPages": 3 },
    "quota": { "usedMB": 128, "totalMB": 1024, "availableMB": 896, "usedPercent": 12 },
    "categories": ["image", "spreadsheet", "document", "other"]
  }
}
```

### E.2 POST `files/upload` — 上传文件

**所属页面 / 组件：** `files.vue`

**认证：** 需 Header `Token`

> Content-Type: `multipart/form-data`

**表单字段：** `files`（可多文件）

**成功响应：**

```json
{
  "status": 1,
  "msg": "Upload completed",
  "options": {
    "files": [
      {
        "id": 55,
        "originalName": "data.csv",
        "sizeBytes": 10240,
        "mimeType": "text/csv",
        "category": "spreadsheet",
        "createdAt": "2026-07-09 10:30:00"
      }
    ],
    "quota": { "usedMb": 128, "totalMb": 1024 }
  }
}
```

**失败 / 边界：** 超额或单文件超限（`USER_FILE_MAX_BYTES`）返回 `status:0` + `msg`。

### E.3 GET `files/download/:id` — 下载文件

**所属页面 / 组件：** `files.vue`、`search.vue`

**认证：** 需 Header `Token`

**路径参数：** `id` — 文件 ID

**成功响应：** HTTP `200`，`Content-Disposition: attachment`，响应体为文件二进制流。

**失败 / 边界：** 跨用户或不存在 → HTTP 404 + JSON `{ "status": 0, "msg": "File not found" }`。

### E.4 POST `files/delete` — 批量删除

**所属页面 / 组件：** `files.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ids` | number[] | ✅ | 文件 ID 列表 |

**请求示例：**

```json
{ "ids": [55, 56] }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "deleted": 2,
    "quota": { "usedMB": 100, "totalMB": 1024, "availableMB": 924, "usedPercent": 10 }
  }
}
```

**失败 / 边界：** `status:3` 未选择文件。

## F. 数据集 `/datasets`

### F.1 POST `datasets/legacy/rows` — 遗留多表浏览

**所属页面 / 组件：** `datasets-legacy.vue`（早期原型，未投产）

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tableId` | string | ✅ | 表标识 |
| `withSharingData` | boolean | — | 是否含共享字段 |
| `sortKey` | string | — | 排序字段 |
| `sortDir` | string | — | `asc` / `desc` |
| `filters` | object | — | 筛选 |
| `search` | string | — | 搜索 |

**请求示例：**

```json
{
  "tableId": "parts",
  "sortKey": "name",
  "sortDir": "asc",
  "filters": {},
  "search": ""
}
```

**成功响应：**

```json
{ "status": 1, "options": { "rows": [{ "id": 1, "name": "..." }] } }
```

### F.2 POST `datasets/browse/rows` — 元件列表

**所属页面 / 组件：** `dataset-browse.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `datasetType` | string | ✅ | `part` / `backbone` / `plasmid` |
| `search` | string | — | 名称 / 别名 |
| `filters` | object | — | 筛选条件 |
| `sortKey` | string | — | 默认 `name` |
| `sortDir` | string | — | `asc` / `desc` |
| `page` | number | — | 默认 1 |
| `pageSize` | number | — | 默认 10 |

**请求示例：**

```json
{
  "datasetType": "part",
  "search": "T7",
  "filters": { "partType": ["Promoter"] },
  "sortKey": "name",
  "sortDir": "asc",
  "page": 1,
  "pageSize": 20
}
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "rows": [
      {
        "id": 101,
        "name": "P_inducible_T7",
        "alias": "T7 promoter",
        "length": 120,
        "type": "Promoter",
        "uploadDate": "2025-06-01"
      }
    ],
    "columns": [{ "key": "name", "label": "Name" }],
    "filterGroups": [{ "id": "partType", "title": "Part Type", "options": ["Promoter"] }],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalCount": 156,
      "totalPages": 8
    }
  }
}
```

**失败 / 边界：** `status:0` + `msg: Invalid datasetType`。

### F.3 POST `datasets/browse/detail` — 元件详情

**所属页面 / 组件：** `dataset-item-detail.vue`、`dataset-item-edit.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `datasetType` | string | ✅ | `part` / `backbone` / `plasmid` |
| `id` | number | ✅ | 记录主键 |

**请求示例：**

```json
{ "datasetType": "part", "id": 101 }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "datasetType": "part",
    "detail": {
      "id": 101,
      "name": "P_inducible_T7",
      "sequence": "ATCG...",
      "features": [{ "start": 1, "end": 50, "label": "promoter", "color": "#ff0000" }],
      "scar": { "BsmBI": "...", "BsaI": "..." },
      "rpuEntries": [{ "RPU": 1.23, "TestStrain": "MG1655" }]
    }
  }
}
```

**失败 / 边界：** `Record not found` → `status:0`。

### F.4 POST `datasets/browse/update` — 编辑元件

**所属页面 / 组件：** `dataset-item-edit.vue`

**认证：** 需 Header `Token`

> 需 `role >= 1`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `datasetType` | string | ✅ | 数据集类型 |
| `id` | number | ✅ | 记录 ID |
| `values` | object | ✅ | 待更新字段 |

**请求示例：**

```json
{
  "datasetType": "part",
  "id": 101,
  "values": { "name": "P_inducible_T7", "alias": "T7" }
}
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "datasetType": "part",
    "detail": { "...": "更新后的详情" }
  }
}
```

**失败 / 边界：** 普通用户 → `Permission denied`。

### F.5 POST `datasets/browse/delete` — 删除元件

**所属页面 / 组件：** `dataset-browse.vue`、`dataset-item-detail.vue`

**认证：** 需 Header `Token`

> 需 `role >= 1`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `datasetType` | string | ✅ | 数据集类型 |
| `id` | number | ✅ | 记录 ID |

**请求示例：**

```json
{ "datasetType": "part", "id": 101 }
```

**成功响应：**

```json
{ "status": 1, "options": { "datasetType": "part", "id": 101 } }
```

**失败 / 边界：** 无权限或删除失败 → `status:0` + `msg`。

### F.6 POST `datasets/browse/upload-batch` — Batch Upload

**所属页面 / 组件：** `dataset-browse.vue`

**认证：** 需 Header `Token`

> 需 `role >= 1`；`multipart/form-data`

**表单字段：** `file`（xlsx）

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "taskId": 42,
    "task": { "id": "T-00042", "status": "pending" },
    "message": "Upload task created"
  }
}
```

**失败 / 边界：** 前端随后用 `upload-status` 轮询 `taskId`。

### F.7 POST `datasets/browse/upload-status` — 轮询上传状态

**所属页面 / 组件：** `dataset-browse.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `taskId` | number | ✅ | 上传任务 ID |

**请求示例：**

```json
{ "taskId": 42 }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "taskId": 42,
    "status": "running",
    "progress": 40,
    "message": "Importing...",
    "errorMsg": "",
    "uploadKind": "batch",
    "datasetType": null,
    "result": null
  }
}
```

完成时 `options.status === "completed"`（或失败态）。`Task not found` → `status:0`。

### F.8 GET `datasets/browse/upload-template` — 下载模板

**所属页面 / 组件：** `dataset-batch-upload-modal.vue`

**认证：** 需 Header `Token`

> 需 `role >= 1`

**Query：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `datasetType` | string | ✅ | `part` / `backbone` / `plasmid` |

**成功：** 文件流（blob，xlsx），非 JSON。

**失败 / 边界：** 失败时可能返回 JSON `{ "status": 0, "msg": "Template not found" }` 等。

## G. 文档 / 搜索 / 通知 / 反馈 / T-Pro 辅助

### G.1 POST `documents/getTree` — 文档目录树

**所属页面 / 组件：** `document.vue`

**认证：** 需 Header `Token`

**请求参数：** 无 Body。

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "sections": [
      {
        "id": "getting-started",
        "title": "Getting Started",
        "expanded": true,
        "items": [{ "id": "overview", "title": "Overview" }]
      }
    ],
    "defaultPageId": "overview"
  }
}
```

### G.2 POST `documents/getPage` — 文档页内容

**所属页面 / 组件：** `document.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pageId` | string | ✅ | 页面 ID |

**请求示例：**

```json
{ "pageId": "overview" }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "page": {
      "breadcrumb": [
        { "label": "Getting Started", "sectionId": "getting-started" },
        { "label": "Overview" }
      ],
      "title": "Overview",
      "intro": "...",
      "heroImage": "",
      "contentHtml": "<h2 id=\"s1\">Section</h2>",
      "summary": [{ "id": "s1", "label": "Section" }]
    }
  }
}
```

**失败 / 边界：** `status:3` 页面不存在。

### G.3 POST `search/global` — 全局搜索

**所属页面 / 组件：** `search.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `query` | string | ✅ | 关键词 |
| `types` | string[] | — | `tasks`/`parts`/`backbones`/`plasmids`/`files`/`documents` |
| `limit` | number | — | 每类条数，默认 5，最大 20 |

**请求示例：**

```json
{ "query": "T7", "limit": 20 }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "query": "T7",
    "totalCount": 12,
    "blocks": [
      {
        "key": "parts",
        "label": "Parts",
        "total": 5,
        "items": [
          {
            "id": 101,
            "type": "part",
            "title": "P_inducible_T7",
            "subtitle": "Part · Promoter",
            "description": "Length: 120bp",
            "route": {
              "name": "dataset-item-detail",
              "params": { "datasetType": "part", "id": 101 }
            }
          }
        ]
      }
    ]
  }
}
```

### G.4 POST `notifications/list` — 通知列表

**所属页面 / 组件：** `notifications.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `filter` | string | — | `all` / `unread` / `read` |

**请求示例：**

```json
{ "filter": "all" }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "notifications": [
      {
        "id": 1,
        "tag": "T-Pro",
        "tagColor": "#26c0e2",
        "message": "Your task has been completed.",
        "time": "2h ago",
        "read": false,
        "taskId": "T-00042",
        "user": "Alice"
      }
    ]
  }
}
```

### G.5 POST `notifications/markRead` — 标记已读

**所属页面 / 组件：** `notifications.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 通知 ID |

**请求示例：**

```json
{ "id": 1 }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "notification": {
      "id": 1,
      "tag": "T-Pro",
      "message": "...",
      "read": true,
      "taskId": "T-00042"
    }
  }
}
```

**失败 / 边界：** `status:3` 通知不存在。

### G.6 POST `feedback/submit` — 提交意见反馈

**所属页面 / 组件：** `modals/feedback-modal.vue`

**认证：** 需 Header `Token`

> `multipart/form-data`；管理员账户不可提交

**表单字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | ✅ | 如 `bug` / `suggestion` |
| `content` | string | ✅ | 意见正文 |
| `page_url` | string | — | 当前页面 URL |
| `contact_name` | string | — | 联系人 |
| `contact_org` | string | — | 单位 |
| `contact_phone` | string | — | 电话 |
| `contact_email` | string | — | 邮箱 |
| `files` | file[] | — | 截图，最多若干张，单张 ≤5MB |

**成功响应：**

```json
{
  "status": 1,
  "msg": "意见反馈已提交",
  "options": {
    "feedback": {
      "id": 9,
      "user_id": 1,
      "type": "bug",
      "type_label": "Bug反馈",
      "content": "...",
      "content_preview": "...",
      "page_url": "http://localhost:8090/#/dashboard",
      "status": "pending",
      "images": [],
      "image_count": 0,
      "created_at": "2026-07-09 11:00:00",
      "user": { "id": 1, "name": "张三", "email": "user@example.com" }
    }
  }
}
```

**失败 / 边界：** 管理员 → `管理员账户无需提交意见反馈`；上传超限等 `status:0`。

### G.7 POST `tpro/stats` — T-Pro 资源统计

**所属页面 / 组件：** `assets/js/tpro-stats.js` → `t-pro.vue`

**认证：** 需 Header `Token`

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `speciesId` | number | ✅ | 正整数物种 ID |

**请求示例：**

```json
{ "speciesId": 1 }
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "stats": {
      "expressionDataset": 3,
      "geneDataset": 5,
      "predictor": 2,
      "regulator": 1,
      "generator": 1,
      "activator": 4,
      "reporter": 0,
      "task": 12
    }
  }
}
```

**失败 / 边界：** `status:3` Invalid speciesId。统计聚合本地任务 + 外部 T-Pro。

## H. 后台管理 `/admin`

> 全部需 `role >= 9`（`requireAdmin`）。未登录 `status:2`；非管理员 `status:0` + `msg: 暂无后台管理权限`。调用页面均为 `admin.vue`。

### H.1 GET `admin/summary` — 鉴权与模块就绪概览

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求参数：** 无。

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "admin": {
      "id": 1,
      "name": "Admin",
      "email": "admin@example.com",
      "role": 9,
      "status": 1,
      "title": "",
      "avatar": ""
    },
    "summary": {
      "users": { "ready": true },
      "tasks": { "ready": true },
      "files": { "ready": true },
      "apps": { "ready": false },
      "documents": { "ready": true },
      "settings": { "ready": true }
    }
  }
}
```

### H.2 GET `admin/users` — 用户列表

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**Query：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | — | 页码 |
| `pageSize` | number | — | 每页 |
| `keyword` | string | — | 搜索 |
| `status` | string/number | — | 状态 |
| `role` | string/number | — | 角色 |

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "users": [
      {
        "id": 2,
        "name": "Alice",
        "email": "a@example.com",
        "username": "a@example.com",
        "status": 1,
        "role": 0,
        "title": "",
        "organization": "",
        "phone": "",
        "gender": "",
        "avatar": "",
        "last_login_time": "...",
        "created_at": "...",
        "updated_at": "...",
        "storage": { "used_mb": 10, "total_mb": 1024 },
        "task_count": 3,
        "file_count": 5
      }
    ],
    "pagination": { "currentPage": 1, "pageSize": 20, "totalCount": 42, "totalPages": 3 }
  }
}
```

### H.3 GET `admin/users/:id` — 用户详情

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**路径参数：** `id`

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "user": { "...": "同列表用户项，字段更完整" },
    "permissions": [],
    "editableTables": []
  }
}
```

前端当前主要使用 `options.user`。

### H.4 PUT `admin/users/:id/status` — 启用/禁用

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{ "status": 0 }
```

**成功响应：**

```json
{ "status": 1, "options": { "user": { "...": "更新后用户" } } }
```

`status`：`0` 禁用，`1` 启用。

### H.5 PUT `admin/users/:id/role` — 修改角色

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{ "role": 1 }
```

**成功响应：**

```json
{ "status": 1, "options": { "user": { "...": "更新后用户" } } }
```

`role`：`0` 普通 / `1` 数据管理员 / `9` 管理员。

### H.6 PUT `admin/users/:id/storage` — 调整配额

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{ "total_mb": 2048 }
```

**成功响应：**

```json
{ "status": 1, "options": { "user": { "...": "含新 storage" } } }
```

### H.7 GET `admin/files` — 全站文件

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**Query：** `page`、`pageSize`、`userId`、`keyword`、`category`、`extension`

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "files": [
      {
        "id": 55,
        "user_id": 2,
        "original_name": "data.csv",
        "stored_name": "...",
        "relative_path": "...",
        "size_bytes": 10240,
        "size_mb": 0.01,
        "mime_type": "text/csv",
        "extension": "csv",
        "category": "spreadsheet",
        "created_at": "...",
        "user": { "id": 2, "name": "Alice", "email": "a@example.com" }
      }
    ],
    "pagination": { "currentPage": 1, "pageSize": 20, "totalCount": 42, "totalPages": 3 }
  }
}
```

### H.8 POST `admin/files/cleanup/preview` — 清理预览

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{ "userId": 2, "keyword": "", "category": "", "extension": "" }
```

亦可传 `{ "fileIds": [1, 2, 3] }`。

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "criteria": { "userId": 2 },
    "count": 5,
    "totalSizeBytes": 102400,
    "totalSizeMb": 0.1,
    "sampleFiles": [{ "id": 1, "original_name": "a.csv" }]
  }
}
```

### H.9 POST `admin/files/cleanup` — 执行清理

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{
  "userId": 2,
  "confirm": true
}
```

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "count": 5,
    "totalSizeBytes": 102400,
    "totalSizeMb": 0.1
  }
}
```

**失败 / 边界：** 未 `confirm: true` → `status:3`。

### H.10 GET `admin/tasks` — 全站任务

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**Query：** `page`、`pageSize`、`userId`、`appId`、`status`、`keyword`

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "tasks": [
      {
        "id": 42,
        "user_id": 1,
        "app_id": "t-pro",
        "name": "...",
        "status": "completed",
        "scope": "mine",
        "operation": "promoter/predict",
        "error_msg": "",
        "created_at": "...",
        "user": { "id": 1, "name": "...", "email": "...", "status": 1, "role": 0 },
        "app": { "id": "t-pro", "title": "T-Pro", "app_color": "#26c0e2", "status": 1 },
        "share_count": 0,
        "params": { "value": {}, "parseError": false },
        "result": { "value": {}, "parseError": false }
      }
    ],
    "pagination": { "currentPage": 1, "pageSize": 20, "totalCount": 42, "totalPages": 3 }
  }
}
```

### H.11 GET `admin/tasks/:id` — 任务详情

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**成功响应：**

```json
{ "status": 1, "options": { "task": { "...": "详情，字段同列表项并更完整" } } }
```

### H.12 PUT `admin/tasks/:id/status` — 改任务状态

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{ "status": "failed" }
```

合法状态：`pending` / `running` / `completed` / `failed` / `cancelled`。

**成功响应：**

```json
{ "status": 1, "options": { "task": { "...": "列表项形状" } } }
```

### H.13 DELETE `admin/tasks/:id` — 删除任务

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**成功响应：**

```json
{ "status": 1, "options": { "deleted": true, "task": { "...": "被删任务快照" } } }
```

### H.14 GET `admin/apps` — 应用列表

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**Query：** `page`、`pageSize`、`keyword`、`status`

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "apps": [
      {
        "id": "t-pro",
        "title": "T-Pro",
        "description": "...",
        "icon": "...",
        "route": "/t-pro",
        "author": "...",
        "app_color": "#26c0e2",
        "sort_order": 1,
        "status": 1,
        "created_at": "...",
        "favorites_count": 2,
        "task_count": 10
      }
    ],
    "pagination": { "currentPage": 1, "pageSize": 20, "totalCount": 42, "totalPages": 3 }
  }
}
```

### H.15 POST `admin/apps` — 新建应用

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{
  "id": "new-app",
  "title": "New App",
  "description": "...",
  "icon": "/images/logo.png",
  "route": "/apps",
  "author": "Admin",
  "app_color": "#605bff",
  "sort_order": 10,
  "status": 1
}
```

**成功响应：**

```json
{ "status": 1, "options": { "app": { "...": "新建应用对象" } } }
```

**失败 / 边界：** ID 已存在 → `status:3`。

### H.16 PUT `admin/apps/:id` — 编辑应用

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{
  "title": "T-Pro",
  "description": "...",
  "icon": "...",
  "route": "/t-pro",
  "author": "...",
  "app_color": "#26c0e2",
  "sort_order": 1,
  "status": 1
}
```

**成功响应：**

```json
{ "status": 1, "options": { "app": { "...": "更新后应用" } } }
```

### H.17 PUT `admin/apps/:id/status` — 上下架

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{ "status": 0 }
```

**成功响应：**

```json
{ "status": 1, "options": { "app": { "...": "更新后应用" } } }
```

### H.18 PUT `admin/apps/sort` — 排序

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{ "items": [{ "id": "t-pro", "sort_order": 1 }, { "id": "tplot", "sort_order": 2 }] }
```

**成功响应：**

```json
{ "status": 1, "options": { "apps": [{ "...": "排序后列表" }] } }
```

### H.19 GET `admin/documents` — 文档管理树

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "sections": [
      {
        "id": "getting-started",
        "title": "Getting Started",
        "sort_order": 1,
        "expanded_default": true,
        "pages": [
          {
            "id": "overview",
            "section_id": "getting-started",
            "title": "Overview",
            "intro": "",
            "hero_image": "",
            "content_html": "<p>...</p>",
            "sort_order": 1
          }
        ]
      }
    ]
  }
}
```

### H.20 POST `admin/documents/sections` — 新建章节

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{ "id": "guides", "title": "Guides", "sort_order": 2, "expanded_default": false }
```

**成功响应：**

```json
{ "status": 1, "options": { "section": { "...": "新建章节" } } }
```

### H.21 PUT `admin/documents/sections/:id` — 编辑章节

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{ "title": "Guides", "sort_order": 2, "expanded_default": true }
```

**成功响应：**

```json
{ "status": 1, "options": { "section": { "...": "更新后章节" } } }
```

### H.22 DELETE `admin/documents/sections/:id` — 删除章节

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**成功响应：**

```json
{ "status": 1, "options": { "...": "删除结果" } }
```

**失败 / 边界：** 章节下仍有页面时可能拒绝删除。

### H.23 POST `admin/documents/pages` — 新建页面

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{
  "id": "faq",
  "section_id": "guides",
  "title": "FAQ",
  "intro": "",
  "hero_image": "",
  "content_html": "<p>FAQ</p>",
  "sort_order": 1
}
```

**成功响应：**

```json
{ "status": 1, "options": { "page": { "...": "新建页面" } } }
```

### H.24 PUT `admin/documents/pages/:id` — 编辑页面

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{
  "section_id": "guides",
  "title": "FAQ",
  "intro": "",
  "hero_image": "",
  "content_html": "<p>Updated</p>",
  "sort_order": 1
}
```

**成功响应：**

```json
{ "status": 1, "options": { "page": { "...": "更新后页面" } } }
```

### H.25 DELETE `admin/documents/pages/:id` — 删除页面

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**成功响应：**

```json
{ "status": 1, "options": { "...": "删除结果" } }
```

### H.26 GET `admin/settings` — 系统配置

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "settings": [
      {
        "key": "site.name",
        "value": "Bio App",
        "type": "string",
        "group": "general",
        "description": "Site display name",
        "updated_at": "..."
      }
    ]
  }
}
```

### H.27 PUT `admin/settings/:key` — 更新配置

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**路径参数：** `key`（需 URL encode）

**请求示例：**

```json
{ "value": "Bio App", "type": "string", "group": "general", "description": "..." }
```

**成功响应：**

```json
{ "status": 1, "options": { "setting": { "...": "更新后配置项" } } }
```

### H.28 DELETE `admin/settings/:key` — 删除配置

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**成功响应：**

```json
{ "status": 1, "options": { "...": "删除结果" } }
```

### H.29 GET `admin/feedback` — 反馈列表

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**Query：** `page`、`pageSize`、`status`、`type`、`keyword`

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "feedbacks": [
      {
        "id": 9,
        "type": "bug",
        "type_label": "Bug反馈",
        "content_preview": "...",
        "page_url": "...",
        "status": "pending",
        "created_at": "...",
        "user": { "id": 1, "name": "张三", "email": "user@example.com" },
        "user_id": 1,
        "contact_name": ""
      }
    ],
    "pagination": { "currentPage": 1, "pageSize": 20, "totalCount": 42, "totalPages": 3 }
  }
}
```

### H.30 GET `admin/feedback/:id` — 反馈详情

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**成功响应：**

```json
{
  "status": 1,
  "options": {
    "feedback": {
      "id": 9,
      "type": "bug",
      "content": "完整正文...",
      "status": "pending",
      "images": [{ "url": "/res/...", "originalName": "shot.png" }],
      "user": { "id": 1, "name": "张三", "email": "user@example.com" }
    }
  }
}
```

### H.31 PUT `admin/feedback/:id/status` — 更新反馈状态

**所属页面 / 组件：** `admin.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{ "status": "completed" }
```

**成功响应：**

```json
{ "status": 1, "options": { "feedback": { "...": "更新后反馈", "status": "completed" } } }
```

前端常用 `pending` → `completed`。

## I. T-Pro 外部接口 `/t-pro-api/`

> 通过 `window.tpro`（`baseURL: '/t-pro-api/'`）调用，代理至 `TPRO_API_URL`。**非本仓库后端**；成功多为 HTTP 200，结构以下列前端读取为准。

> 计算类任务不直接打这些端点，而是 `POST /api/tasks/create`，由后端 `taskRunner` 调用 `promoter/generate` 等。

### I.1 GET `species/show` — 物种列表

**所属页面 / 组件：** `t-pro.vue`

**认证：** 一般无本仓库 Token（视代理配置）

**成功响应：**

```json
{
  "species": [
    { "id": 1, "name": "Escherichia coli", "variantName": "MG1655" }
  ]
}
```

前端使用 `res.data` 中的物种列表字段（具体键名以 T-Pro 服务为准）。

### I.2 POST `species/register` — 注册物种

**所属页面 / 组件：** `modals/add-species.vue`

**认证：** 需 Header `Token`

**请求示例：**

```json
{ "name": "Escherichia coli", "variantName": "MG1655" }
```

**成功响应：**

```json
{ "species": { "id": 2, "name": "Escherichia coli", "variantName": "MG1655" } }
```

前端：`res.status == 200` 时取 `res.data.species`。

### I.3 GET `dataset/show/expression/:speciesId`

**所属页面 / 组件：** `tpro-create-loaders.js`、资源管理

**认证：** 需 Header `Token`

### I.4 GET `dataset/show/genes/:speciesId`

**所属页面 / 组件：** 多个 T-Pro 弹窗

**认证：** 需 Header `Token`

### I.5 GET `predictor/show/:speciesId`

**所属页面 / 组件：** 多个 T-Pro 弹窗

**认证：** 需 Header `Token`

### I.6 GET `activator/show/:speciesId`

**所属页面 / 组件：** 多个 T-Pro 弹窗 / 资源管理

**认证：** 需 Header `Token`

### I.7 GET `regulator/show/:speciesId`

**所属页面 / 组件：** 多个 T-Pro 弹窗 / 资源管理

**认证：** 需 Header `Token`

### I.8 GET `generator/show/:speciesId`

**所属页面 / 组件：** 多个 T-Pro 弹窗 / 资源管理

**认证：** 需 Header `Token`

### I.9 GET `reporter/show/:speciesId`

**所属页面 / 组件：** `tpro-resources.js` 资源管理

**认证：** 需 Header `Token`

**响应形态（列表类，示意）：**

```json
{
  "items": [
    { "id": "res-1", "name": "Example resource", "...": "其它元数据" }
  ]
}
```

前端通常遍历 `res.data` 数组或服务约定的列表字段，映射为下拉选项。

### I.10 POST `dataset/view/field/conditionNames`

**所属页面 / 组件：** `tpro-create-loaders.js`

**认证：** 需 Header `Token`

**请求示例：**

```json
{ "datasetIDs": ["ds-1", "ds-2"] }
```

**成功响应：**

```json
{ "conditionNames": ["ConditionA", "ConditionB"] }
```

### I.11 GET `activator/templates/TXT`

**所属页面 / 组件：** `modals/create-activator.vue`

**认证：** 需 Header `Token`

**成功：** 文本/模板内容（可能为纯文本或 JSON 包装，前端按 blob/text 使用）。

### I.12 GET `activator/submotifPositions/:id`

**所属页面 / 组件：** `modals/generating-promoter-libraries.vue`

**认证：** 需 Header `Token`

**成功响应：**

```json
{ "positions": [10, 25, 40] }
```

### I.13 GET `dataset/specs/file`

**所属页面 / 组件：** `modals/upload-dataset.vue`

**认证：** 需 Header `Token`

### I.14 GET `dataset/templates/:type/:fileType`

**所属页面 / 组件：** `modals/upload-dataset.vue`

**认证：** 需 Header `Token`

### I.15 GET `dataset/specs/metadata/:type/:fileType/:speciesId`

**所属页面 / 组件：** `modals/upload-dataset.vue`

**认证：** 需 Header `Token`

上传数据集弹窗并行请求上述三个接口，用于表单校验、模板下载与元数据字段。

### I.16 POST `dataset/register`

**所属页面 / 组件：** `modals/upload-dataset.vue`

**认证：** 需 Header `Token`

> `multipart/form-data`

**表单：** 数据集文件 + 元数据字段（随 specs 动态变化）。

**成功响应：**

```json
{ "success": true, "dataset": { "id": "ds-9", "name": "..." } }
```

### I.17 资源管理动态路径

**所属页面 / 组件：** `modals/tpro-resource-manage.vue` + `tpro-resources.js`

**认证：** 需 Header `Token`

**列表 GET（示例）：**

- `dataset/show/expression/:speciesId` / `dataset/show/genes/:speciesId`
- `predictor/show/:speciesId` / `regulator/show/:speciesId` / `generator/show/:speciesId`
- `activator/show/:speciesId` / `reporter/show/:speciesId`

**删除 POST：**

- `dataset/delete`、`predictor/delete`、`regulator/delete`、`generator/delete`、`activator/delete`、`reporter/delete`

**请求示例：**

```json
{ "ids": ["res-1"] }
```

payload 以资源管理弹窗实际构造为准（通常含资源 ID 列表）。

## J. TPlot / WebDatabase

> `window.tplotApi` → `baseURL: '/tplot-api/'`；`tplot-api.js` 内 `webDb` → `baseURL: '/'`。非本仓库 Express。

### J.1 POST `/tplot-api/UploadData`

**所属页面 / 组件：** `tplot.vue`

**认证：** 需 Header `Token`

> `multipart/form-data`，字段名 `file`（可多文件）

**成功响应：**

```json
{ "success": true, "upload_id": "UUID", "uploaded": 2 }
```

`upload_id` 用于后续 Fitting 请求，不应与其他用户或其他上传任务混用。

### J.2 POST `/tplot-api/Fitting`

**所属页面 / 组件：** `tplot.vue`

**认证：** 需 Header `Token`

> `application/x-www-form-urlencoded`

**请求示例：**

```json
Algorithm=xxx&I0=1&upload_id=550e8400-e29b-41d4-a716-446655440000
```

（实际为 `URLSearchParams` 表单；`upload_id` 必填）

**成功响应：**

```json
{ "success": true, "DBD": "DBD_A", "LBD": "LBD_B" }
```

**失败 / 边界：** `success === false` 时前端按失败处理；亦接受小写 `dbd`/`lbd`。

### J.3 POST `/tplot-api/Opt`

**所属页面 / 组件：** `tplot.vue`

**认证：** 需 Header `Token`

**表单字段：** `alpha`、`beta`，可选 `lbd`、`dbd`。

**成功响应：**

```json
{ "DBD": "...", "LBD": "...", "L": "...", "RPU": 1.2 }
```

### J.4 POST `/tplot-api/Assembly`

**所属页面 / 组件：** `tplot/assembly-panel.vue`

**认证：** 需 Header `Token`

**表单：** 组装相关参数（面板字段）。成功后可再调 Download。

### J.5 GET `/tplot-api/Download`

**所属页面 / 组件：** `tplot/assembly-panel.vue`

**认证：** 需 Header `Token`

**成功：** `blob` 文件流，前端触发浏览器下载。

### J.6 GET `/tplot-api/DownloadTempalte`

**所属页面 / 组件：** `tplot/fitting-panel.vue`

**认证：** 需 Header `Token`

**成功：** `blob` 模板文件（路径拼写与服务端一致：`Tempalte`）。

### J.7 GET `/tplot-api/TFPlot`

**所属页面 / 组件：** `tplot/dimer-plot-panel.vue`

**认证：** 需 Header `Token`

**用途：** 二聚体绘图页面 / iframe 直链，非 JSON API。

### J.8 GET `/WebDatabase/GetLBDDimerNameList`

**所属页面 / 组件：** `assets/js/tplot-api.js`

**认证：** 需 Header `Token`

**成功响应：**

```json
["LBD_A", "LBD_B"]
```

**失败 / 边界：** 失败或空列表时前端回退 Mock。

### J.9 GET `/WebDatabase/GetDBDNameList`

**所属页面 / 组件：** `assets/js/tplot-api.js`

**认证：** 需 Header `Token`

**成功响应：**

```json
["DBD_A", "DBD_B"]
```

**失败 / 边界：** 失败或空列表时前端回退 Mock。

## K. 遗留 LabDatabase

> 非 `/api`；Upload Map 用 axios `baseURL: '/'`，下载多为 `window.location` 直链。详见 [Upload-Map更新说明.md](./Upload-Map更新说明.md)。

### K.1 POST `/LabDatabase/upload/` — Upload Map

**所属页面 / 组件：** `dataset-browse.vue`

**认证：** axios `baseURL: '/'` 直调网关（不走 `/api` Token 拦截；依赖网关策略）

> `multipart/form-data`

**表单字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `files` | file[] | ✅ | Map 文件 |
| `type` | string | ✅ | `part` / `backbone` / `plasmid` |
| `save_feature` | string | — | `true` / `false` |

**成功响应：**

```json
{
  "success": true,
  "message": "OK",
  "results": [
    { "filename": "map1.gb", "success": true }
  ]
}
```

**失败 / 边界：** `success !== true` 时前端展示 `message` 或 `results` 中失败项。

### K.2 GET `/LabDatabase/downloadPartMap/:id`

**所属页面 / 组件：** `dataset-item-detail.vue`

**认证：** 浏览器直链（不走本仓库 axios `Token`；依赖网关/会话策略）

### K.3 GET `/LabDatabase/downloadBackboneMap/:id`

**所属页面 / 组件：** `dataset-item-detail.vue`

**认证：** 浏览器直链（不走本仓库 axios `Token`；依赖网关/会话策略）

### K.4 GET `/LabDatabase/downloadPlasmidMap/:id`

**所属页面 / 组件：** `dataset-item-detail.vue`

**认证：** 浏览器直链（不走本仓库 axios `Token`；依赖网关/会话策略）

**成功：** 浏览器下载 Map 文件流。

### K.5 GET `/LabDatabase/FetchExperienceDetail/:name`

**所属页面 / 组件：** `dataset-item-detail.vue`

**认证：** 浏览器直链（不走本仓库 axios `Token`；依赖网关/会话策略）

**用途：** `window.location.href` 跳转经验详情页（非 JSON）。

## 附录：未纳入示例的接口

以下后端存在但**前端当前未调用**，故不写示例：`account/refreshProfile`、`files/quota`、`notifications/markAllRead`、`todos/toggle`、`datasets/browse/options`、`datasets/browse/upload-map`、`tasks/unshare`、`GET/PUT admin/users/:id/permissions`。

废弃组件 `components/--unused/modal-sets.vue` 内 `org/*` 亦忽略。

