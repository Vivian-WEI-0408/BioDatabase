from pathlib import Path
from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Alignment


root = Path(__file__).resolve().parent
source = next(p for p in root.glob("*.xlsx") if "已填写" not in p.name)
target = source.with_name(source.stem + "_已填写.xlsx")
wb = load_workbook(source)

status_fill = {
    "通过": "C6EFCE",
    "有条件通过": "FFEB9C",
    "不通过": "FFC7CE",
    "未检查": "D9EAF7",
    "不适用": "E7E6E6",
}

tech = "乙方技术负责人（待实名确认）"
project = "乙方项目负责人（待实名确认）"
ops = "乙方运维负责人（待实名确认）"
design = "乙方设计负责人（待实名确认）"
legal = "乙方项目/法务负责人（待实名确认）"

# 编号: (结果, 证据, 问题与整改要求, 负责人, 风险备注)
C = {
"C01":("通过","bio-app/readmes/delivery.md；readmes/unfinished.md；README.md","交付文档已区分正式链路、Mock、部分完成和未完成项。",project,"以仓库当前版本为评估基线。"),
"C02":("通过","本工作簿“交接总览/签收确认”；bio-app/readmes/acceptance.md","签署时仍需双方书面确认其不构成最终验收。",project,"需双方签字后生效。"),
"C03":("有条件通过","bio-app/readmes/delivery.md §15；仓库 .git；package.json","文档列有提交记录和 main 分支，但未见 tag/release，且未提供本次构建产物版本。",tech,"补充最终 commit、tag、交接日期。"),
"C04":("通过","bio-app/readmes/unfinished.md","未完成、部分完成、外部依赖和建议优先级已有集中清单。",tech,"后续整改纳入问题台账。"),
"C05":("有条件通过","bio-app/readmes/unfinished.md；readmes/delivery.md 已知限制","已有已知限制，但缺少逐 Bug 复现步骤、影响范围及规避方案。",tech,"补充可复现缺陷清单。"),
"C06":("不通过","仓库未发现联系人清单","补充乙方技术、项目、商务联系人、联系方式和支持渠道。",project,"阻碍后续协调。"),
"C07":("有条件通过","bio-app/readmes/unfinished.md §7；本工作簿问题协调台账","已有优先级建议，但缺少双方确认的缺陷与新增需求边界。",project,"需会议纪要确认。"),
"C08":("通过","bio-app/src；public；package.json；vite.config.js；api/","已交付可编辑的前后端完整源码及配置，不是仅有构建产物。",tech,"未发现 Git 子模块。"),
"C09":("有条件通过","bio-app/.git；readmes/delivery.md §15","Git 历史存在，但未验证远端权限、分支保护、tag 和 release note。",tech,"补充远端仓库截图及 tag。"),
"C10":("通过","bio-app/src；bio-app/api/src","Vue、JS、SCSS、Express 源码可读可编辑；少数第三方 min.js 属依赖资源。",tech,"第三方压缩库应补许可证。"),
"C11":("通过","bio-app/package.json；package-lock.json；api/package.json；api/package-lock.json；README.md","前后端依赖、锁文件和 Node 版本要求齐备。",tech,"前后端需分别 npm install。"),
"C12":("通过","bio-app/README.md §项目结构；readmes/模块代码位置.csv","关键目录和模块代码位置已有说明。",tech,"可再补充 services/routes 分层图。"),
"C13":("通过","bio-app/src/router/index.js；readmes/模块代码位置.csv；本表“功能接手清单”","路由、组件、API 和完成状态已在源码及本表映射。",tech,"正式与原型路由已标注。"),
"C14":("不通过","package.json 未配置 lint/format/typecheck/test 脚本","补充 ESLint、Prettier、命名/提交规范和生成规则。",tech,"当前质量约束主要依赖人工。"),
"C15":("有条件通过","package.json；api/package.json；readmes/delivery.md 第三方依赖章节","依赖可枚举，但未见独立 LICENSE/NOTICE 与逐项商业使用审查结果。",legal,"交付前完成许可证合规复核。"),
"C16":("有条件通过","api/.env.example 为占位符；readmes/delivery.md §13","当前模板未见真实密钥，但交付文档指出 Git 历史曾含数据库/SMTP 凭据，必须轮换。",tech,"立即轮换历史泄露凭据并保留记录。"),
"C17":("有条件通过","README.md；readmes/delivery.md；readmes/unfinished.md；本次项目分析结果","已有较完整上下文，但未形成专用 AI 开发约定和常见任务提示包。",tech,"建议新增 PROJECT_GUIDE.md。"),
"C18":("通过","bio-app/README.md §环境要求/本地启动/FAQ","启动步骤、数据库、前后端命令和常见问题完整。",tech,"仍需在干净环境现场复验。"),
"C19":("通过","bio-app/.env.example；bio-app/api/.env.example","前端代理、数据库、端口、T-Pro、SMTP 变量均有说明和示例。",tech,"敏感变量仅使用占位符。"),
"C20":("未检查","缺少干净机器/容器启动录屏或日志","按 README 从 clone、数据库初始化、前后端启动完成一次独立复验。",tech,"核心验收项，不能仅凭源码判定。"),
"C21":("未检查","缺少甲方测试后端地址、账号和联调记录","现场验证登录、查询、任务提交、结果展示。",tech,"T-Pro 与数据库均为外部依赖。"),
"C22":("有条件通过","package.json: npm run build -> vite build；vite.config.js","构建脚本和 dist 说明存在；本机因未安装依赖无法执行，缺正式成功日志。",tech,"npm install 后提交构建日志和 dist 校验。"),
"C23":("有条件通过","bio-app/readmes/deploy-webserver.md","已有 Nginx/Apache、反代和静态部署说明；需结合实际服务器补路径、证书、回滚演练。",ops,"部署现场复验。"),
"C24":("不适用","readmes/unfinished.md 明确仓库无 Docker/CI/CD","当前未配置 CI/CD；若合同要求则应改为不通过并补建。",ops,"建议新增自动化构建。"),
"C25":("不通过","仓库未发现浏览器/系统/分辨率兼容测试记录","补充 Chrome/Edge/Firefox 及目标分辨率测试矩阵。",tech,"Vant touch emulator 不等同兼容测试。"),
"C26":("通过","bio-app/README.md §常见问题","覆盖安装失败、数据库、接口失败、Token、空数据及端口占用。",tech,"可增加 403、静态资源和 T-Pro 超时。"),
"C27":("有条件通过","api/src/server.js；api/src/routes/*.js；src/components 中 Axios 调用","源码可完整枚举接口，但未形成独立 API 清单/Swagger。",tech,"生成 OpenAPI 或接口表。"),
"C28":("不通过","仓库未发现 Swagger/OpenAPI/Postman/Apifox 文档","补齐关键接口请求、响应、失败示例与边界情况。",tech,"后续接手风险较高。"),
"C29":("有条件通过","src/App.vue；src/components/signin.vue；api/src/middleware/auth.js；api/src/routes/account.js","Token 登录/登出可追踪，但无过期/刷新机制，前端对失效状态处理不完整。",tech,"补 Token TTL、刷新或重新登录策略。"),
"C30":("有条件通过","api/src/constants/roles.js；api/src/middleware/auth.js；api/src/routes/admin.js；src/components/admin.vue","普通/数据管理员/管理员角色存在；路由守卫为空，细粒度权限未统一用于业务接口。",tech,"补路由和接口双层权限校验。"),
"C31":("有条件通过","api/src/routes/tasks.js；services/taskRunner.js；services/tproService.js；src/components/tasks.vue","提交、后台执行、成功/失败、结果和通知已实现；缺取消、超时和可靠队列/重启恢复。",tech,"增加超时、取消、重试和持久队列。"),
"C32":("有条件通过","api/src/routes/files.js；middleware/uploadMulter.js；src/components/files.vue","上传、列表、额度、下载、删除存在；缺失败重试/更完整格式说明与安全测试。",tech,"补文件类型白名单和下载鉴权测试。"),
"C33":("不通过","api/src/lib/response.js；src/App.vue 响应拦截；readmes/unfinished.md","存在响应封装，但无完整错误码文档，且部分 catch 静默为空列表。",tech,"统一错误码、toast、重试与错误页。"),
"C34":("通过","bio-app/readmes/unfinished.md §2/§6；src/data/*-mock.js","TPlot、早期 datasets 原型及 fallback Mock 已明确列出。",tech,"后续清理废弃原型。"),
"C35":("通过","src/router/index.js；readmes/模块代码位置.csv；本表功能接手清单","所有注册路由、组件及状态已有清单。",tech,"补菜单可达性和权限列。"),
"C36":("有条件通过","src/components/dashboard.vue；parts/app-menu.vue；search.vue","Dashboard、侧边菜单、应用及搜索入口存在；未进行设计稿/现场可访问复验。",tech,"现场核对导航权限与设计。"),
"C37":("有条件通过","signin.vue；signup.vue；recover-password-modal.vue；settings/*；account/user routes","注册登录登出、找回密码和账户设置已实现；邮件依赖 SMTP，注册未校验邮箱，Token 长期有效。",tech,"配置 SMTP 并补安全机制。"),
"C38":("有条件通过","dataset-browse.vue；dataset-item-detail.vue；dataset-item-edit.vue；api/src/routes/datasets.js","正式链路支持列表、筛选、详情、编辑、删除；收藏/正式下载及部分图谱能力未明确完成。",tech,"按真实需求补下载/收藏/图谱。"),
"C39":("有条件通过","document.vue；document/*；api/src/routes/documents.js；admin.js 文档接口","文档树、页面、富文本和后台维护存在；种子内容为占位，独立文档内搜索未完成。",tech,"替换正式内容并补文档搜索。"),
"C40":("有条件通过","apps.vue；t-pro.vue；modals/*；t-pro/results/*；taskRunner.js","T-Pro 主流程已接外部服务；TPlot 仍为 Mock，取消/超时/结果下载不完整。",tech,"先明确 TPlot 范围，再完成可靠任务链路。"),
"C41":("有条件通过","dashboard.vue；tasks.vue；files.vue；sharing.vue；apps.vue","任务、文件、收藏应用和分享具备；没有独立“项目”实体及完整 Workspace 聚合页。",tech,"明确项目工作区需求。"),
"C42":("有条件通过","src/components/admin.vue；api/src/routes/admin.js","用户、权限、文件、任务、应用、文档、设置、反馈可管理；无审计日志查看页，数据管理入口分散。",tech,"拆分后台并补审计日志 UI。"),
"C43":("有条件通过","各 Vue 组件含 loading/empty/validation；readmes/unfinished.md 错误提示项","部分页面具备状态处理，但 catch 静默和失败空列表仍存在。",tech,"统一表单校验和错误反馈。"),
"C44":("未检查","缺少性能、响应式和目标尺寸测试记录","执行目标浏览器、分辨率和大数据量测试。",tech,"admin.vue 体积较大。"),
"C45":("不通过","仓库未发现 Figma/Sketch/XD/蓝湖链接或源文件","移交设计源文件及版本链接。",design,"无法核对视觉还原。"),
"C46":("不通过","仅有 main.scss 和组件样式，未见设计规范文档","补色彩、字体、间距、控件和图标规范。",design,"影响后续一致性。"),
"C47":("有条件通过","bio-app/public/images；public/fonts；src/assets","图片、Logo、字体和模板已交付；未见完整授权来源清单。",design,"补素材与字体授权。"),
"C48":("不通过","仓库未发现设计稿差异清单","按页面补充设计差异、原因和处理建议。",design,"需结合设计源文件完成。"),
"C49":("未检查","源码包含 modal/toast/loading/disabled，但缺交互状态截图/测试记录","现场逐页检查 hover/focus/error/empty 等状态。",design,"仅源码存在不能证明交互完整。"),
"C50":("未检查","无法从本地仓库验证 Git owner/admin 权限","提供远端成员、分支保护、deploy key、webhook 权限截图。",project,"账号交接必须现场确认。"),
"C51":("未检查","仓库未含服务器/云平台账号交接记录","提供服务器、云平台、容器/镜像管理权限。",ops,"敏感信息通过安全渠道交接。"),
"C52":("未检查","仓库未含域名、DNS、SSL、CDN 权限记录","移交配置和管理权限，验证证书续期。",ops,"生产部署前完成。"),
"C53":("未检查","api/.env.example 仅说明 SMTP/T-Pro 配置，不含账号交接记录","移交 SMTP、T-Pro 等第三方服务账号及责任边界。",ops,"不得在表内写明文密钥。"),
"C54":("不通过","README.md 明确系统不自动创建管理员，需直接 UPDATE users SET role=9","提供最高管理员账号，并补安全的管理员创建/恢复流程。",project,"当前需直接改库。"),
"C55":("不通过","readmes/delivery.md §13.3 指出历史凭据需轮换","完成数据库密码、SMTP 授权码等密钥清单与轮换并留证。",ops,"高优先级安全项。"),
"C56":("未检查","无乙方权限收回记录","交接后撤销或最小化乙方 Git、服务器、数据库和第三方账号权限。",project,"需双方签字确认。"),
"C57":("未检查","无敏感数据返还/删除确认","乙方书面确认本地、云端、备份和日志的返还/删除情况。",legal,"涉及数据安全。"),
"C58":("有条件通过","src/data/*-mock.js；api/src/data/*；services/seedData.js；public/templates","Mock、种子和样例模板可定位，但缺来源、清理和脱敏说明。",tech,"补测试数据说明。"),
"C59":("不通过","仅 console 日志；未发现监控、告警、错误追踪配置","补后端日志、前端错误追踪、监控告警和查看方式。",ops,"生产运维风险。"),
"C60":("未检查","仓库未发现备份/恢复演示记录","补数据库、上传文件、配置与部署包的备份恢复方案。",ops,"生产上线前演练。"),
"C61":("有条件通过","README.md；readmes/delivery.md；模块代码位置.csv","覆盖栈、结构、启动、构建和功能，但接口、代码规范、权限细节仍需补充。",tech,"整理成统一开发手册。"),
"C62":("有条件通过","readmes/deploy-webserver.md；README.md FAQ","有代理、静态部署和排障说明；实际路径、证书、日志、回滚需现场化。",ops,"结合目标环境更新。"),
"C63":("有条件通过","README.md 首次使用；readmes/delivery.md 功能说明","有基础操作说明，但缺完整普通用户/管理员图文手册。",project,"补操作截图和权限说明。"),
"C64":("未检查","未提供培训会议纪要或录屏","安排代码、部署、功能及问题清单培训并留档。",project,"必须项。"),
"C65":("未检查","问题协调台账为空，未提供交接会议纪要","将问答和待办写入本工作簿问题台账。",project,"持续更新。"),
"C66":("未检查","本表建议 90 日，但未见乙方书面确认","按合同确定支持期起止日期并签字。",project,"不得仅保留模板文字。"),
"C67":("未检查","未见双方确认的支持范围说明","确认运行、部署、接口、缺陷、文档、账号和历史代码解释范围。",project,"与新增需求边界联动。"),
"C68":("不通过","未提供乙方技术/项目/升级联系人及渠道","补实名联系人、电话/邮箱和 Issue 渠道。",project,"直接影响问题处理。"),
"C69":("有条件通过","本工作簿“问题协调台账”已给出 P0-P3 建议 SLA","模板已有 SLA，但需乙方书面确认具体时限。",project,"签收时确认。"),
"C70":("通过","本工作簿“问题协调台账”","已提供统一台账字段和编号，可用于后续跟踪。",project,"需实际持续维护。"),
"C71":("未检查","未见远程协助承诺或会议安排","书面确认远程协助条件、工具和双方配合要求。",project,"按支持期执行。"),
"C72":("未检查","本地 Git 存在，但未见缺陷修复 PR/提交规范","约定通过 commit/PR 提交并附验证说明。",tech,"补修复模板。"),
"C73":("未检查","未见乙方对文档补充义务的书面确认","在签收页/补充确认函中确认。",project,"避免交接资料缺失。"),
"C74":("未检查","readmes/unfinished.md 有建议，但无双方责任边界确认","签署缺陷、交接缺失与新增需求的区分原则。",project,"建议法务复核。"),
"C75":("不通过","未提供升级联系人清单","补双方项目、商务/法务升级联系人和触发规则。",project,"SLA 落地所需。"),
"C76":("未检查","源码仓库无法证明合同知识产权归属","由合同/补充确认函确认修改、部署、科研/商业使用权。",legal,"必须法务复核。"),
"C77":("有条件通过","package.json/API package.json 可列依赖；public/assets 已交付","未发现完整第三方许可证与素材授权清单。",legal,"完成开源与素材合规审查。"),
"C78":("未检查","仓库无法证明乙方保密与数据删除履行情况","由合同和书面确认落实保密、数据安全与禁止复用。",legal,"必须项。"),
"C79":("通过","本工作簿“交接总览/签收确认”保护性声明","模板已明确签收不放弃追究延期、缺陷和未完成事项的权利。",legal,"签署前保留原文。"),
"C80":("通过","本工作簿“交接总览/签收确认”；bio-app/readmes/acceptance.md","已明确最终验收、付款、质保和违约以合同及后续书面文件为准。",legal,"需双方签署。"),
}

ws = wb["交接验收清单"]
for row in range(2, ws.max_row + 1):
    code = ws.cell(row, 1).value
    result, evidence, issue, owner, risk = C[code]
    ws.cell(row, 7).value = result
    ws.cell(row, 8).value = evidence
    ws.cell(row, 9).value = issue
    ws.cell(row, 10).value = owner
    ws.cell(row, 12).value = risk
    ws.cell(row, 7).fill = PatternFill("solid", fgColor=status_fill[result])
    for col in range(7, 13):
        ws.cell(row, col).alignment = Alignment(wrap_text=True, vertical="top")

# 功能清单：完成状态、验收结果、路由、API、源码、差距、证据、建议
F = {
"F01":("部分完成","有条件通过","/#/dashboard","POST /api/dashboard/getData","src/components/dashboard.vue","目前是登录后工作台，不是独立平台宣传首页；缺设计稿复验。","dashboard.vue；router/index.js","确认是否需要未登录门户首页。"),
"F02":("部分完成","有条件通过","全局侧栏菜单","按页面调用","src/components/parts/app-menu.vue","菜单入口存在，但前端全局路由守卫为空，权限展示需复验。","app-menu.vue；App.vue initRouter","补路由/按钮权限控制。"),
"F03":("已完成","通过","/#/search","POST /api/search/global","src/components/search.vue；api/src/routes/search.js","可跨元件、任务、文件、文档搜索。","search.vue；searchService.js","补错误提示与结果高亮测试。"),
"F04":("部分完成","有条件通过","/#/signup；/#/signin","/api/account/register|login|logout","signup.vue；signin.vue；app-menu.vue","主流程存在；Token 无过期刷新，注册不验证邮箱。","account.js；auth.js；App.vue","补 Token TTL/刷新及注册邮箱验证。"),
"F05":("部分完成","有条件通过","登录页找回密码弹窗","/api/account/sendVCode|resetPassword","recover-password-modal.vue","依赖 SMTP；验证码为进程内 Map，重启丢失。","mailService.js；vcodeStore.js","持久化验证码并做限流。"),
"F06":("已完成","通过","/#/settings","/api/user/*","settings.vue；settings/*.vue","资料、头像、密码、邮箱功能已实现。","user.js；profile/email/password-card.vue","现场复验 SMTP 和头像权限。"),
"F07":("已完成","通过","/#/datasets/:id/browse","POST /api/datasets/browse/rows|options","dataset-browse.vue；dataset-browse/*","支持分页、排序、筛选并对接数据库。","datasets.js；datasetBrowseStore.js","无 datasetType 时部分元数据仍回退 Mock。"),
"F08":("已完成","通过","/#/search；数据浏览页","POST /api/search/global；browse/rows","search.vue；dataset-browse.vue","基础检索已接后端。","searchService.js；datasetBrowseStore.js","补网络错误统一提示。"),
"F09":("部分完成","有条件通过","/#/datasets/:id/browse","POST /api/datasets/browse/options|rows","dataset-browse-filter.vue","正式 datasetType 链路走数据库；部分无参数场景仍取 Mock。","unfinished.md §2.1；dataset-browse.vue","移除 Mock fallback 并完整 API 化筛选元数据。"),
"F10":("已完成","通过","/#/datasets/:datasetType/:id/detail","POST /api/datasets/browse/detail","dataset-item-detail.vue","展示元件详情、序列及按类型组织的信息。","dataset-item-detail.vue；datasets.js","现场核对图谱/结构需求。"),
"F11":("未开始","不通过","元件详情页","未发现专用下载/收藏 API","dataset-item-detail.vue","未确认实现元件序列下载、复制和收藏完整链路。","路由/API 扫描未发现对应端点","按需求补复制、下载、收藏及权限。"),
"F12":("已完成","通过","/#/document","POST /api/documents/getTree","document.vue；document/doc-sidebar.vue","支持分节文档树。","documents.js；documentStore.js","替换种子占位内容。"),
"F13":("已完成","通过","/#/document","POST /api/documents/getPage","document/doc-content.vue","使用 HTML/富文本内容展示。","documentContent.js；DocumentPage.content_html","补复杂表格/代码块兼容测试。"),
"F14":("部分完成","有条件通过","/#/search","POST /api/search/global","search.vue；searchService.js","全局搜索覆盖文档，但文档中心内部未见独立搜索。","searchService.js","可增加文档中心内搜索与高亮。"),
"F15":("已完成","通过","/#/apps","POST /api/apps/list|toggleStar","apps.vue；apps/app-card.vue","展示应用、说明、状态、入口和收藏。","apps.js；appStore.js","补权限可见性现场复验。"),
"F16":("部分完成","有条件通过","/#/t-pro 各弹窗","直连 /t-pro-api/* 及 /api/tasks/create","src/components/modals/*.vue","T-Pro 表单丰富，但依赖外部服务且缺统一 Schema 驱动校验。","t-pro.vue；modals/*","统一参数校验并记录接口版本。"),
"F17":("已完成","通过","T-Pro 弹窗 → /#/tasks","POST /api/tasks/create","modals/*；tasks.vue","创建后返回 task 并进入任务历史链路。","routes/tasks.js；taskStore.js","补幂等和重复提交保护。"),
"F18":("部分完成","有条件通过","/#/tasks；/#/tasks/:id","POST /api/tasks/list|detail","tasks.vue；task-detail.vue","支持 queued/running/completed/failed 等展示；缺取消、超时和可靠轮询说明。","taskRunner.js；tasks.js","增加取消、超时、重试、重启恢复。"),
"F19":("部分完成","有条件通过","/#/tasks/:id","POST /api/tasks/detail","t-pro/results/*.vue","T-Pro 多类结果组件已实现；TPlot 仍是 Mock，异常提示需统一。","results/*；tplot-mock.js","完成 TPlot 对接或明确移除。"),
"F20":("未开始","不通过","任务详情","未发现任务结果下载端点","task-detail.vue；t-pro/results/*","没有明确的计算结果文件下载和鉴权链路。","API 路由扫描无结果下载接口","按任务类型补导出/下载。"),
"F21":("部分完成","有条件通过","/#/dashboard；/#/tasks；/#/files；/#/sharing","dashboard/tasks/files/sharing APIs","dashboard.vue 等","个人任务、文件、收藏和分享分散存在；没有独立项目实体/统一工作区页。","Dashboard 与相关路由","明确 Workspace 是否需要项目概念。"),
"F22":("已完成","通过","/#/files","/api/files/list|quota|upload|download|delete","files.vue；api/src/routes/files.js","上传、查看、下载、删除和额度已实现。","files.js；userFileStore.js","补格式白名单、重试和安全测试。"),
"F23":("已完成","通过","/#/tasks；/#/tasks/:id","/api/tasks/list|detail|update|delete","tasks.vue；task-detail.vue","可查看历史任务、状态、参数和结果。","taskStore.js；tasks.js","增加取消和恢复能力。"),
"F24":("部分完成","有条件通过","/#/sharing；/#/tasks","/api/tasks/share|unshare；/api/sharing/*","sharing.vue；tasks.vue","支持指定用户共享和撤销；无链接有效期，权限模型较简单。","taskStore.js；sharingStore.js","补有效期和更细权限。"),
"F25":("已完成","通过","/#/admin Users","GET/PUT /api/admin/users*","admin.vue；api/src/routes/admin.js","支持查询、启禁用、角色和额度管理。","admin.js users endpoints","补创建用户和重置密码。"),
"F26":("部分完成","有条件通过","/#/admin Permissions","GET/PUT /api/admin/users/:id/permissions","admin.vue；UserPermission model","可配置权限，但业务 API 并未统一消费细粒度权限，路由守卫为空。","auth.js；roles.js；admin.vue","实现统一 RBAC 并同步按钮/路由。"),
"F27":("部分完成","有条件通过","/#/datasets/:id/browse；详情编辑页","/api/datasets/browse/update|delete|upload-*","dataset-item-edit.vue；dataset-browse.vue","可编辑、删除、上传；批量解析器默认关闭，新增单条入口需复验。","datasets.js；datasetUploadRunner.js","部署解析器并补新增/导入验收。"),
"F28":("已完成","通过","/#/admin Documents","/api/admin/documents/*","admin.vue；document-content-editor.vue","栏目和页面可新增、编辑、删除。","admin.js documents endpoints","补显式发布/下线状态。"),
"F29":("部分完成","有条件通过","/#/admin Apps","/api/admin/apps*","admin.vue；appStore.js","支持应用增改、状态与排序；参数说明和可见权限配置有限。","admin.js apps endpoints","扩展应用权限与版本配置。"),
"F30":("部分完成","有条件通过","/#/admin Tasks","/api/admin/tasks*","admin.vue；api/src/routes/admin.js","支持查询、详情、改状态、删除；缺集中错误日志与重跑。","admin.js task endpoints","补日志、重试和审计。"),
"F31":("部分完成","有条件通过","全局","无","src/assets/css/main.scss；parts/*","已有统一主题和公共部件，但缺正式设计规范且部分页面样式内聚。","main.scss；Vant","抽取设计 token 和组件规范。"),
"F32":("部分完成","有条件通过","多列表页面","各 list API","parts/list-pagination.vue；dataset-browse/*","分页/筛选组件存在，但通用性不完全一致，错误态不足。","list-pagination.vue；pagination.js","统一表格状态与可复用 API。"),
"F33":("部分完成","有条件通过","全局弹窗与页面","无统一端点","modals/*；SweetAlert；Vant","modal/loading/toast 已使用，但不同模块实现不统一，部分错误静默。","App.vue；modals/*；unfinished.md","建立统一反馈服务和状态组件。"),
"F34":("未开始","不通过","未注册 404/403/500 路由","无","src/router/index.js；App.vue","无 catch-all 404 页面，路由守卫为空，接口错误处理不统一。","router/index.js；App.vue","新增 404/403/500 页面与全局异常处理。"),
"F35":("待确认","未检查","全局","无","全局前端","没有目标浏览器兼容测试记录。","仓库未发现测试矩阵","执行 Chrome/Edge/Firefox 兼容测试。"),
"F36":("部分完成","有条件通过","数据浏览/搜索/结果页","分页查询 API","dataset-browse.vue；search.vue；tasks.vue","列表有分页，但未见大数据性能基准或虚拟列表。","datasetBrowseStore.js；list-pagination.vue","用真实数据量做性能测试并优化索引/渲染。"),
}

ws = wb["功能接手清单"]
for row in range(2, ws.max_row + 1):
    code = ws.cell(row, 1).value
    state, result, route, api, src, gap, evidence, suggestion = F[code]
    for col, value in {5:route, 6:api, 7:src, 8:state, 9:result, 10:gap, 11:evidence, 12:suggestion}.items():
        ws.cell(row, col).value = value
        ws.cell(row, col).alignment = Alignment(wrap_text=True, vertical="top")
    ws.cell(row, 9).fill = PatternFill("solid", fgColor=status_fill[result])

# 将主要后续改进项按优先级写入问题台账，便于后续追踪。
issues = [
("I001","安全/数据","P0-阻断","历史数据库/SMTP 凭据曾进入 Git 历史，需立即轮换并留存记录。","readmes/delivery.md §13.3","账号与生产安全","乙方原因",ops,"待乙方反馈","轮换全部历史凭据，检查 Git 历史和生产配置。"),
("I002","账号权限","P1-严重","Token 无过期/刷新机制，前端全局路由守卫为空。","App.vue initRouter；auth.js","登录安全和未授权访问","乙方原因",tech,"未开始","增加 Token TTL/刷新/撤销及路由守卫。"),
("I003","功能缺陷","P1-严重","数据集批量上传解析器默认关闭，批量上传会受阻。","unfinished.md §2.1；datasetUploadRunner.js","数据导入","第三方原因",tech,"待乙方反馈","部署并配置 DATASET_PARSER_*，完成端到端复验。"),
("I004","接口/API","P1-严重","T-Pro 依赖外部服务，缺超时、取消、可靠队列和重启恢复。","taskRunner.js；tproService.js","计算任务","第三方原因",tech,"未开始","增加超时、重试、取消和持久队列。"),
("I005","功能缺陷","P2-一般","TPlot 仍使用 Mock 数据，未接真实计算服务。","src/data/tplot-mock.js；components/tplot.vue","TPlot 模块","乙方原因",tech,"待乙方反馈","明确范围：完成对接或从生产入口移除。"),
("I006","接口/API","P2-一般","缺少 OpenAPI/Postman 及关键接口请求响应示例。","api/src/routes/*.js","后续接口维护","乙方原因",tech,"未开始","生成 OpenAPI 及错误码文档。"),
("I007","功能缺陷","P2-一般","部分页面 catch 静默、缺 404/403/500 和统一错误反馈。","unfinished.md；router/index.js；App.vue","全站用户体验","乙方原因",tech,"未开始","统一错误处理、错误页、toast 和重试。"),
("I008","功能缺陷","P2-一般","细粒度 UserPermission 未统一用于业务 API 和前端按钮。","UserPermission model；auth.js","权限一致性","乙方原因",tech,"未开始","建立统一 RBAC。"),
("I009","源码/构建","P2-一般","缺自动化测试、CI/CD、Docker 和正式迁移版本。","unfinished.md §5","交付质量和部署","乙方原因",tech,"未开始","补核心测试、CI 构建、部署脚本和 Prisma migrations。"),
("I010","设计/UI","P2-一般","未移交设计源文件、设计规范及设计还原差异清单。","仓库未发现设计交付物","UI 后续维护","乙方原因",design,"待乙方反馈","交付设计链接、规范、授权和差异表。"),
("I011","账号权限","P1-严重","缺 Git/服务器/域名/第三方服务/管理员账号交接证据。","验收清单 C50-C55","生产接管","双方待确认",project,"待乙方反馈","通过安全渠道完成账号权限交接并截图。"),
("I012","文档/培训","P2-一般","缺实名联系人、培训录屏、支持期和双方确认的 SLA。","验收清单 C64-C75","交接支持","乙方原因",project,"待乙方反馈","安排培训并签署支持与升级机制。"),
]
ws = wb["问题协调台账"]
for idx, issue in enumerate(issues, start=13):
    code, typ, severity, desc, proof, impact, blame, owner, state, solution = issue
    values = {1:code, 2:"2026-07-14", 3:"代码验收", 4:typ, 5:severity, 6:desc,
              7:proof, 8:impact, 9:blame, 10:owner, 13:state, 14:solution,
              17:"由双方确认整改日期后复验"}
    for col, value in values.items():
        ws.cell(idx, col).value = value
        ws.cell(idx, col).alignment = Alignment(wrap_text=True, vertical="top")

# 补充总览与签收页中可由仓库确认的信息；甲乙方实名、合同号和日期保留待确认。
overview = wb["交接总览"]
overview["B3"] = "标准元件库 Online（Bio App）阶段性交接"
overview["H3"] = "前端 0.0.0 / API 1.0.0"
overview["E4"] = "乙方（待填写公司全称）"
overview["H4"] = "2026-07-14（代码评估日期）"

sign = wb["签收确认"]
sign["B10"] = "标准元件库 Online（Bio App）"
sign["E11"] = "乙方（待填写公司全称）"
sign["B12"] = "main；最终 commit/tag 待乙方确认"
sign["E12"] = "bio-app 源码仓库及本验收工作簿"
sign["H12"] = "本工作簿“问题协调台账”"
reservations = [
    "完成历史泄露凭据轮换及账号权限交接",
    "完成干净环境启动、生产构建和甲方测试环境联调",
    "完善 Token/路由/RBAC 安全机制",
    "部署数据集解析器并完善 T-Pro 任务可靠性",
    "补齐 API、测试、部署、设计和培训资料",
]
for row, text in enumerate(reservations, start=16):
    sign.cell(row, 2).value = text
    sign.cell(row, 3).value = "乙方对应负责人（待实名）"
    sign.cell(row, 5).value = "提交证据后由甲方复验"
    sign.cell(row, 6).value = "在复验通过前不视为最终验收完成"

# 工作表视图和列宽优化。
for name in ("交接验收清单", "功能接手清单", "问题协调台账"):
    sheet = wb[name]
    sheet.freeze_panes = "A2" if name != "问题协调台账" else "A13"
    sheet.auto_filter.ref = sheet.dimensions if name != "问题协调台账" else "A12:Q42"
    for row in sheet.iter_rows():
        for cell in row:
            if cell.value is not None:
                cell.alignment = copy(cell.alignment)
                cell.alignment = Alignment(horizontal=cell.alignment.horizontal,
                                           vertical="top", wrap_text=True)

wb.calculation.fullCalcOnLoad = True
wb.calculation.forceFullCalc = True
wb.save(target)
print(target)
