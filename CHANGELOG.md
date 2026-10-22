# 变更记录（Changelog）

本项目使用[语义化版本](https://semver.org/lang/zh-CN/)：`主版本.次版本.修订号`。
- **修订号**（1.0.**1**）：只修 bug，不加功能，不改数据库。
- **次版本**（1.**1**.0）：新增功能；数据库只增不减，旧数据不受影响。
- **主版本**（**2**.0.0）：不兼容的改动，例如删字段、改接口、需要人工迁移数据。

每次改动先记在 **[未发布]**，发版时再改成版本号和日期。发版流程见 [`guides/release-process.md`](guides/release-process.md)；
线上运行的版本可以通过 `GET /api/health` 返回的 `version` 字段确认。
本地同步方法见文末 **“与本地代码同步”**。

---

## [未发布]

#### 新增
- 版本管理：`GET /api/health` 返回当前运行的版本号（`version`），部署后可以直接核对线上版本。
- 发版流程文档 `guides/release-process.md`：记录位置、版本号规则、发版步骤、回滚方法和版本历史。
- `guides/roadmap.md` 增加“版本规划与进度跟踪”表。
- `CLAUDE.md`：项目约定，后续开发会话会自动读取，确保每次改动都更新这些记录。

#### 变更
- 前端版本号与后端统一为 `1.0.0`。

---

## [1.0.0] — 2026-10-22 · 试用版首发

- 合并：[PR #1](https://github.com/David-rider/Real-estate-Agency-CRM/pull/1)，`main` 上的提交 `a892a82`
- 已部署：前端（Vercel）、后端（Render）。部署后已在线确认：三个泄露的默认账号用旧密码无法登录，Apple 登录已关闭，公开房源页已按公司区分。
- 下面两部分是这个版本的开发过程记录。

---

### 第 2 轮：上线前安全与部署收尾

#### 安全
- **删除泄露的默认管理员 `admin@xyz.com`**（密码 `USA%100` 曾写在公开的种子脚本里）。
  - 迁移 `20261023000000_remove_leaked_default_admin`：先立即切断访问（清空密码、解绑 Google/Apple、停用、邮箱改为 `removed-<id>@removed.invalid`），再删除该账号。
  - 如果这个账号名下还有业务数据（客户、交易、审计日志等），就只停用和匿名化，不删除，数据保留。
  - 迁移 `20261023000200_remove_leaked_default_staff`：用同样的方式删除 `manager@xyz.com`、`agent@xyz.com`（与管理员共用同一个泄露密码）。
    原先种子数据里的客户都归在 `agent@xyz.com` 名下，所以这个账号在生产上大概率会被“停用 + 匿名化”而不是删除，名下客户保留；如有需要，可由公司管理员把这些客户重新分配给真实经纪人。
- **已删除或已停用的账号立即失效**：以前登录令牌在 24 小时内一直有效，现在每次请求都会核对账号是否仍然存在、是否启用（30 秒缓存）。角色、套餐的变更也即时生效。
  文件：`backend/src/middleware/authMiddleware.ts`
- **修复社交登录越权（严重）**：
  - 以前首次用 Google/Apple 登录的人，会被自动加入数据库里的**第一家公司**，能看到该公司的数据。现在首次社交登录会创建自己的新公司；加入已有公司只能通过邀请。
  - Apple 登录以前完全不做身份校验，现已关闭，接口返回 503，等实现校验后再开放。
  - Google 登录在生产环境必须配置 `GOOGLE_CLIENT_ID` 才能使用，不再接受未经校验的身份。
  - 文件：`backend/src/routes/oauth.ts`

#### 部署 / 数据库
- **生产环境启动时自动完成基线和迁移**：新增 `backend/src/release.ts`，生产环境下 API 启动前会依次：
  1. 检测到“用 `db push` 建的库、没有迁移记录”时，先执行基线（把 `20260303200258_init_multi_tenant` 标记为已执行）；
  2. 之前执行失败的迁移会标记为回滚后重新执行（这些迁移都是幂等的，重复执行安全）；
  3. 执行 `prisma migrate deploy`。
  - 如果迁移失败，进程直接退出，Render 会继续运行旧版本，不会造成停机。
  - 可设置 `RUN_MIGRATIONS_ON_START=false` 关闭；也可手动执行 `npm run release`。
  - 已在本地模拟了 5 种场景，全部通过：`db push` 老库（管理员名下无数据 / 有数据）、重复启动、全新空库、之前有失败迁移的库。

#### 功能调整
- **AI 助手暂不启用，标注“正在开发”**：
  - 后端开关 `AI_ASSISTANT_ENABLED`（默认 `false`）；前端开关 `NEXT_PUBLIC_AI_ASSISTANT_ENABLED`（默认 `false`）。
  - 营销页的 AI 助手和旧的 “Marketing Copilot” 都显示“正在开发”，按钮禁用。
  - 客户详情页的 “用 AI 起草跟进” 和房源卡片上的 “AI 写文案” 入口隐藏。
  - 移除了 Copilot 里写死的假房源选项。
- **每家公司独立的公开房源页**：
  - 新增 `Organization.slug` 字段，迁移 `20261023000100_organization_public_slug` 会为已有公司自动生成。
  - 公开房源页地址变为 `/public-listings?b=<slug>`，只展示该公司的在售、即将上市、已签约房源。不带 `b` 参数时提示“请向经纪人索取链接”。
  - 设置 → 组织 中可以看到并复制本公司的公开页链接。
  - 首页的 “Browse Listings” 链接只有在设置了 `NEXT_PUBLIC_FEATURED_BROKERAGE_SLUG` 时才显示，没设置就隐藏。
  - 去掉了公开页上的假示例房源和随机图库照片：没有照片的房源显示占位图标。房源照片改用普通 `<img>`，任何图片地址都能显示。
- **佣金列表对所有套餐开放**（上一轮已实现，确认保留）。

#### 测试
- 冒烟测试增加到 17 项，新增：公开页按公司隔离、社交登录不能加入他人公司。

---

### 第 1 轮：同类产品调研 + 上线前补全

提交：`cf59e35` `c55a9cb` `5b1cb91` `38a62f3` `e582aea` `a80c0b0`

#### 仓库清理（公开仓库）
- 从 git 中移除：`backend/dist/` 编译产物、编译/类型错误日志、一次性脚本、根目录未使用的 `xlsx` 依赖、两个失效的子模块链接（`.agents/...`、`.claude/worktrees/...`）。
- 种子脚本 `backend/prisma/seed.ts` 改为安全版本：不删除任何数据；生产环境默认拒绝运行；不再内置固定密码（用 `SEED_PASSWORD`，或自动生成随机密码）。演示账号为 `admin@ / manager@ / agent@demo.example.com`。
- Stop hook 改为相对路径 `cd frontend && npm run audit:i18n`。

#### 数据库迁移
- 新增 `20260709000000_sync_schema_baseline`：补齐以前用 `db push` 添加、但没写进迁移文件的表和字段，全部幂等。以前在全新数据库上执行迁移会直接失败。
- 已有的迁移文件改为幂等写法（`IF NOT EXISTS`）。
- 新增 `20261022000000_lead_temperature_commission_defaults`：客户优先级 `temperature`、公司默认佣金比例和分成、单笔交易佣金比例。

#### 后端修复
- **跨公司数据隔离**：新建或修改报价、交易、预约、文档、礼品、照片、任务时，会校验引用的客户、房源、交易是否属于本公司（`backend/src/lib/access.ts` 的 `checkRefs`）。
- 补上缺失的 `GET /api/clients/:id`（以前客户详情页一直空白）。
- 通知类型写错导致通知静默丢失；营销素材保存时缺少经纪人；CSV 导入能创建 SUPERADMIN 且绕过席位上限——均已修复。
- 生产环境启用 `trust proxy`，避免所有用户共用同一个登录限流额度；登录限流只计算失败的尝试。
- 仪表盘按角色区分范围（经纪人只看自己的数据），图表按年月统计，“待处理报价”的计数改正。
- 一人公司的老板可以审批自己的佣金发放（以前没人能审批）。
- 交易详情、文档、搜索、报价都按角色限制可见范围。

#### 后端新功能
- 客户：服务端搜索和筛选、重复客户检测（409 提示，可强制创建）、归档、优先级、14 天未跟进筛选；活动记录存为备注，并自动更新“最近联系”时间。
- 报价：接受、还价、拒绝；接受后自动建交易。
- 交易：新建时自动生成过户清单任务；状态变化时自动同步房源和客户状态；标记“已成交”时按比例自动生成佣金（`backend/src/lib/deals.ts`）。
- 公开房源详情和咨询接口：咨询自动生成“热”线索、紧急回电任务和通知（含频率限制和反机器人字段）。
- 预约提醒：预约前 24 小时站内提醒（`backend/src/lib/reminders.ts`）。
- 团队目录接口 `GET /api/settings/team`；组织的默认佣金设置。
- AI 技能库（`backend/src/lib/ai.ts`，目前已关闭）。
- 端到端冒烟测试 `backend/tests/smoke.ts`（`npm run test:smoke`）。

#### 前端
- 客户列表：服务端搜索（以前只能搜当前页的 10 条），新增优先级、最近联系、待跟进筛选，重复客户确认。
- 客户详情：恢复正常显示，补充资料字段、更多活动类型、跟进提醒、归档。
- 公开房源详情页和咨询/开放日签到表单（以前的联系表单不保存提交内容）。首页和房源页不再把未登录访客跳转到登录页。
- 报价：接受 / 还价 / 拒绝；预约：类型、地点、确认 / 完成 / 取消 / 删除。
- 服务页：礼品和转介使用真实的客户和同事数据（以前发送的是假 ID）。
- 仪表盘新增“今日”面板，去掉了假的示例待办。
- 设置：佣金默认值。
- 日期和时间改为在浏览器端换算时区，不再出现时间偏移 4–5 小时、日期提前一天的问题。
- 新增文案统一放在 `frontend/src/lib/i18n/extra.ts`（英、简、繁、西四种语言）。

#### 文档
- `README.md`：本地运行、测试、部署和升级说明。
- `guides/competitive-research.md`：同类产品调研。
- `guides/testing-checklist.md`：给试用客户的测试清单。
- `guides/roadmap.md`：后续功能的执行计划。

---

## [0.x] — 2026-10-22 以前

最初的开发阶段，详见 git 历史（截至提交 `9d4dc24`）。

---

## 环境变量变更汇总（截至 1.0.0）

| 位置 | 变量 | 说明 |
|---|---|---|
| 后端 | `AI_ASSISTANT_ENABLED` | AI 助手开关，默认 `false` |
| 后端 | `ANTHROPIC_API_KEY` | AI 助手启用后才需要 |
| 后端 | `RUN_MIGRATIONS_ON_START` | 默认开启；设为 `false` 时启动不自动迁移 |
| 后端 | `TRUST_PROXY` | 可选，生产环境默认 `1` |
| 后端 | `DISABLE_JOBS` | 可选，设为 `true` 关闭预约提醒任务 |
| 后端 | `SEED_PASSWORD` / `ALLOW_SEED` | 仅种子脚本使用 |
| 前端 | `NEXT_PUBLIC_AI_ASSISTANT_ENABLED` | AI 助手开关，默认 `false` |
| 前端 | `NEXT_PUBLIC_FEATURED_BROKERAGE_SLUG` | 可选：首页 “Browse Listings” 链接到哪家公司 |

## 待确认

- 无。三个默认账号（`admin@`、`manager@`、`agent@xyz.com`）都会在下次部署时处理。

---

## 与本地代码同步

本地如果有未提交的改动，先提交或 `git stash`。

```bash
git fetch origin
git checkout main
git pull origin main

# 方式 A：合并整个分支（推荐）
git merge origin/claude/gracious-hopper-ko7742
#   有冲突时：逐个文件解决 → git add <文件> → git commit

# 方式 B：先在本地查看改动
git diff main...origin/claude/gracious-hopper-ko7742 --stat
```

合并后在本地执行：

```bash
# 后端
cd backend
npm install                      # 新增依赖 @anthropic-ai/sdk
npx prisma generate              # schema 新增了字段
npm run release                  # 本地数据库：基线（如需要）+ 迁移
#   本地库如果是 db push 建的，release 会自动处理基线

# 前端
cd ../frontend
npm install
```

注意事项：
- `backend/dist/` 已不再纳入 git 管理。本地如果还有这个目录，可以保留，`.gitignore` 会忽略它。
- 本地的 `.env` 不受影响，可以参照 `backend/.env.example` 补充新变量。
- 上线方式：合并到 `main` 后，Vercel 会通过 GitHub Action 自动部署前端。Render 是否自动部署后端，取决于 Render 控制台的 Auto-Deploy 设置；如果没有开启，需要在控制台手动点 Deploy。API 启动时会自动完成基线、迁移和删除旧管理员，在 Render 日志里搜索 `[release]` 和 `admin@xyz.com` 即可确认结果。
