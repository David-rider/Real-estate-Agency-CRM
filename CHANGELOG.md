# 变更记录（Changelog） / Changelog

本项目使用**四段式版本号**：`主版本.次版本.修订号.构建号`（`X.Y.Z.W`，如 `1.0.1.0`）。

*This project uses a **4-segment version**: `major.minor.patch.build` (`X.Y.Z.W`, e.g. `1.0.1.0`).*
- **构建/微调号**（1.0.1.**1**）：日常小修补、文案/样式微调、CI 或配置调整，不改功能与数据库。
  *Build (1.0.1.**1**): small fixes, copy/style tweaks, CI or config changes; no feature or database change.*
- **修订号**（1.0.**1**.0）：只修 bug 或安全加固，不加功能，不改数据库。
  *Patch (1.0.**1**.0): bug or security fixes only; no new features, no database change.*
- **次版本**（1.**1**.0.0）：新增功能；数据库只增不减，旧数据不受影响。
  *Minor (1.**1**.0.0): new features; the database only grows, old data is unaffected.*
- **主版本**（**2**.0.0.0）：不兼容的改动，例如删字段、改接口、需要人工迁移数据。
  *Major (**2**.0.0.0): breaking changes, e.g. dropped fields, changed APIs, manual data migration.*

每次改动先记在 **[未发布]**，发版时再改成版本号和日期。发版流程见 [`guides/release-process.md`](guides/release-process.md)；
线上运行的版本可以通过 `GET /api/health` 返回的 `version` 字段确认。
本地同步方法见文末 **“与本地代码同步”**。
*Every change is first logged under **[未发布]** and renamed to a version and date at release. See [`guides/release-process.md`](guides/release-process.md) for the release process; the running version can be confirmed via the `version` field of `GET /api/health`. For local syncing see **“与本地代码同步” (Syncing with local code)** at the end.*

---

## [未发布]

#### 变更 / Changed
- 部署：新增 Cloudflare Workers 部署配置（`frontend/wrangler.jsonc`、`frontend/cloudflare/worker.js`），前端可以同时部署到 Cloudflare 免费版；旧链接在 Cloudflare 上同样自动跳转。正式切换前，Vercel 地址照常使用。
  *Deployment: added the Cloudflare Workers config (`frontend/wrangler.jsonc`, `frontend/cloudflare/worker.js`) so the frontend can also deploy to Cloudflare's free plan, with old links redirecting there too. Until the switch-over, the Vercel address stays in use.*
- 前端改为静态网站，为迁移到 Cloudflare 做准备。房源公开页、开放日签到海报和客户详情页的地址变成 `/property?id=…`、`/property/sign?id=…`、`/client?id=…`；新生成的二维码使用新地址。**以前打印的二维码和分享出去的旧链接会自动跳转到新地址，开放日参数保留，照常可用。**
  *The frontend is now a static site, in preparation for moving to Cloudflare. The public listing page, the open-house sign and the client detail page move to `/property?id=…`, `/property/sign?id=…` and `/client?id=…`; new QR codes use the new addresses. **QR codes printed earlier and old shared links redirect automatically to the new addresses, with the open-house parameter kept, and keep working.***

---

## [1.4.2.0] — 2026-11-12 · 错误提示与过户清单多语言、移除访问控制栏目、数据库结构说明同步 / Localized error messages and checklist titles, Access Control section removed, schema description synced

#### 新增 / Added
- 标准过户清单的任务标题现在使用负责经纪人的语言（简中、繁中、西语）；“过户清单模板”编辑器里的标准清单也按你的语言显示。公司自己写的模板保持原样。已经生成的旧任务不变。
  *Standard closing-checklist task titles now use the deal agent's language (Simplified Chinese, Traditional Chinese, Spanish), and the standard list in the "Checklist template" editor appears in your language. A brokerage's own template keeps its wording. Tasks already created stay as they are.*
- 服务器返回的错误提示（如“邮箱或密码不正确”“找不到该客户”“验证码不正确”“你的角色不能创建房源”等约 230 条）现在按你选择的语言显示：English、简体中文、繁體中文、Español。以前这些提示一律是英文。
  *Error messages from the server (about 230 of them, such as "Invalid credentials", "Client not found", "That code is not correct" or "Your role cannot create listings") now appear in your chosen language: English, Simplified Chinese, Traditional Chinese or Spanish. Before, they were always English.*

#### 移除 / Removed
- 设置页的“访问控制”栏目已移除。它一直标着“即将推出”，界面上的权限矩阵只保存在浏览器里，从来没有真正生效。权限仍按固定角色（经纪人、经理、公司管理员）执行，以后有客户需要再做成真正可配置的。
  *The "Access Control" section of Settings is removed. It was always marked "Coming soon" and its permission matrix was only stored in the browser, never actually applied. Permissions still follow the fixed roles (agent, manager, firm admin); a truly configurable version can come when a customer needs it.*

#### 变更 / Changed
- 数据库结构说明（`schema.prisma`）补上了迁移早已建好的 3 个索引和一个默认值，结构说明与实际数据库完全一致。数据库本身不变，没有新迁移，用户感受不到变化。
  *The database schema description (`schema.prisma`) now declares 3 indexes and a default that the migrations had already created, so the description matches the real database exactly. The database itself is unchanged, with no new migration; users notice nothing.*

---

## [1.4.1.0] — 2026-11-12 · Prisma 升级到 6.19.3、Vercel 部署减量（跳过无前端改动的构建、删除重复的 Deploy Hook）/ Prisma upgraded to 6.19.3, leaner Vercel deploys (skip builds without frontend changes, duplicate Deploy Hook removed)

已部署，线上已确认（`/api/health` → `1.4.1.0`）。/ *Deployed, confirmed live.*

#### 变更 / Changed
- 部署：删除重复的 Vercel Deploy Hook（GitHub Action `deploy.yml`）。Vercel 的 GitHub 集成本来就会在合并到 `main` 时自动部署生产，以前每次合并可能部署两次。
  *Deployment: removed the duplicate Vercel Deploy Hook (the `deploy.yml` GitHub Action). Vercel's GitHub integration already deploys production on every merge to `main`; before, a merge could deploy twice.*
- 部署：Vercel 只在 `frontend/` 有改动时才构建前端（`frontend/scripts/vercel-ignore.sh`）；只改后端或文档的提交不再生成部署，减少免费团队 10 GB 部署存储的占用。线上网站不受影响。
  *Deployment: Vercel now builds the frontend only when something under `frontend/` changed (`frontend/scripts/vercel-ignore.sh`); backend-only and docs-only commits no longer create deployments, easing the free team's 10 GB deployment storage. The live site is unaffected.*
- 后端数据库组件 Prisma 从 4.16（官方已停止维护）升级到 6.19.3。用户不会感到变化，所有功能照常；数据库结构不变，没有新迁移。
  *The backend database layer, Prisma, is upgraded from 4.16 (no longer maintained) to 6.19.3. Users notice no change and everything works as before; the database structure is unchanged, with no new migration.*

---

## [1.4.0.0] — 2026-11-12 · 账号安全：两步验证、登录提醒、IP 白名单 / Account security: two-factor authentication, login alerts, IP whitelist

已部署，线上已确认（`/api/health` → `1.4.0.0`）。/ *Deployed, confirmed live.*

#### 安全 / Security
- IP 白名单：公司管理员可以在“设置 → 安全”里填写允许的 IP 地址或网段（如 `203.0.113.0/24`）。填写后，成员只能从这些网络登录和使用系统，其他地方会被拒绝并提示联系管理员；留空表示不限制。保存时名单必须包含你当前的 IP，页面会显示你的 IP 并提供“添加我的 IP”按钮，避免把自己锁在外面。
  *IP whitelist: firm admins can list allowed IP addresses or ranges (e.g. `203.0.113.0/24`) in Settings → Security. Members can then sign in and use the system only from those networks; elsewhere they are refused and told to contact their administrator. Empty means no restriction. When saving, the list must include your current IP; the page shows your IP and an "Add my IP" button so you can't lock yourself out.*
- 数据库：新增 `Organization.ipAllowlist`（幂等迁移 `20261113000200_ip_allowlist`）。新增可选环境变量 `DISABLE_IP_ALLOWLIST`（紧急开关，平时不设置）。
  *Database: new `Organization.ipAllowlist` (idempotent migration `20261113000200_ip_allowlist`). New optional environment variable `DISABLE_IP_ALLOWLIST` (emergency switch, normally unset).*
- 两步验证（2FA）：在“设置 → 安全”里用验证器 App（Google Authenticator、Microsoft Authenticator、1Password 等）扫码开启。开启后，输入密码还要再输入 App 中的 6 位验证码。开启时会给出 10 个一次性恢复码，手机丢失时可以用它们登录；每个验证码和恢复码只能用一次。关闭需要密码加验证码。公司管理员可以在“团队与角色”里为丢了手机的同事重置两步验证。
  *Two-factor authentication (2FA): turn it on in Settings → Security by scanning a QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…). After that, signing in asks for the app's 6-digit code after the password. Turning it on gives 10 one-time recovery codes for signing in if the phone is lost; each code and recovery code works only once. Turning it off needs the password plus a code. Firm admins can reset 2FA for a colleague who lost their phone under Team & Roles.*
- 数据库：新增 `User.totpEnabled`、`totpSecret`（加密存储）、`totpRecoveryCodes`（只存哈希）、`totpLastStep`（幂等迁移 `20261113000100_two_factor`）。
  *Database: new `User.totpEnabled`, `totpSecret` (stored encrypted), `totpRecoveryCodes` (hashes only) and `totpLastStep` (idempotent migration `20261113000100_two_factor`).*
- 登录提醒：你的账号在新的设备或网络上登录时，会收到一封邮件，写明设备、IP 和时间，并附“重置密码”按钮；同一台电脑重复登录不会提醒。在“设置 → 安全”里可以随时关闭（默认开启）。
  *Login alerts: when your account signs in from a new device or network, you get an email with the device, IP address and time, plus a "Reset password" button; repeat sign-ins from the same computer don't trigger it. Turn it off any time in Settings → Security (on by default).*
- 数据库：新增 `User.loginAlerts`、`User.knownDevices`（幂等迁移 `20261113000000_login_alerts`）。
  *Database: new `User.loginAlerts` and `User.knownDevices` (idempotent migration `20261113000000_login_alerts`).*

---

## [1.3.0.0] — 2026-11-12 · 交易详情与合作经纪人分佣、自定义过户清单、年度目标与业绩报表、开放日二维码签到、移除假集成 / Deal details and co-agent split, custom closing checklist, annual goal and performance report, open-house QR sign-in, fake integrations removed

#### 修复 / Fixed
- 仪表盘上的“已完成年度目标的 75%”和进度条以前是写死的，所有人都一样；现在只显示真实的目标进度，没设目标时提示“设定目标”。
  *The dashboard's "75% to annual goal" and its progress bar were hard-coded and identical for everyone; they now show only real progress, and prompt you to set a goal when none exists.*
- 去掉三处会误导用户的“假功能”：交易卡片上的“DocuSign 发送”按钮以前会提示“已发送签署”并给出一个假的信封编号，实际什么都没发；新建房源里的“从 Zillow 自动填充”会填入虚构的房源数据；预约页的“同步 Google”会先转圈再提示。现在 DocuSign 和 Zillow 按钮已移除，Google 同步按钮显示为“即将推出”且不可点击；对应的后端接口明确返回“尚未开放”。这三项集成仍在路线图上（3.1、3.2、3.3b）。
  *Removed three misleading “fake features”: the “Send via DocuSign” button on deal cards said the document was sent for signature and showed a fake envelope ID while sending nothing; “Auto-fill from Zillow” in the new-listing form filled in made-up listing data; “Sync with Google” on Appointments spun as if working. The DocuSign and Zillow buttons are gone, the Google sync button now shows “Coming soon” and cannot be clicked, and the backend endpoints say plainly that they are not available yet. The three integrations remain on the roadmap (3.1, 3.2, 3.3b).*

#### 新增 / Added
- 浏览器标签页标题和页面语言属性（`<html lang>`）会跟随所选语言切换，换页后也保持；读屏软件会按正确的语言朗读。搜索引擎抓取的英文标题不变。
  *The browser tab title and the page language attribute (`<html lang>`) now follow the chosen language and stay that way across pages, so screen readers use the right language. The English titles that search engines see are unchanged.*
- 年度佣金目标：在仪表盘的“年度佣金”卡片上点“设定目标”，填写自己的年度目标（净佣金），进度条按真实的已发放佣金显示完成比例；经理的公司视图显示团队目标之和。
  *Annual commission goal: click "Set goal" on the dashboard's commission card to enter your own yearly target (net commission); the progress bar shows real progress based on paid commissions, and a manager's brokerage view shows the team's goals added up.*
- 报表新增“业绩”页签：本财年的线索来源及转化率、成交笔数和总额、平均成交周期；经理还能看到经纪人对比（新客户、成交、佣金）。可一键导出为 Excel 能直接打开的 CSV（中文和重音字符不乱码）。
  *Reports gain a "Performance" tab: lead sources and conversion, deals closed and volume, and average time to close for the fiscal year; managers also see an agent comparison (new clients, closings, commission). One click exports a CSV that Excel opens directly, with Chinese and accented characters intact.*
- 数据库：新增 `User.annualCommissionGoal`（幂等迁移 `20261112000200_annual_goal`）。
  *Database: new `User.annualCommissionGoal` (idempotent migration `20261112000200_annual_goal`).*
- 自定义过户清单模板：经理和管理员可在“交易”页点“过户清单模板”，编辑本公司的过户任务（标题、相对签约日或过户日的天数、优先级、顺序），之后新开的交易都按这份清单生成任务；已开的交易不受影响，随时可以恢复标准清单。经纪人只能查看，不能修改。
  *Custom closing-checklist template: managers and admins can click "Checklist template" on Transactions to edit the brokerage's own closing tasks (title, days relative to the contract or closing date, priority, order); new deals then get that checklist, existing deals are unaffected, and the standard list can be restored at any time. Agents can view it but not change it.*
- 数据库：新增 `Organization.checklistTemplate`（幂等迁移 `20261112000100_checklist_template`）。
  *Database: new `Organization.checklistTemplate` (idempotent migration `20261112000100_checklist_template`).*
- 交易详情面板：在“交易”页点任一交易卡片，会打开详情面板。可以查看和修改关键日期（签约、验房、董事会 / 业主协会资料、可以过户、过户，并显示“还有 N 天 / N 天前”），设置该交易的佣金比例，勾选过户清单任务。以前这些在界面上都无法查看或修改。
  *Deal detail panel: clicking any deal card on Transactions opens a detail panel to view and edit the key dates (contract, inspection, board / HOA package, clear to close, closing, with "in N days / N days ago"), set the deal's commission rate and tick off closing-checklist tasks. None of this could be seen or changed in the UI before.*
- 合作经纪人分佣：可以给交易指定一位合作经纪人和他的分成比例（默认 50%）。成交时系统会为两位经纪人各生成一条佣金记录，每人的部分再按公司分成结算；重复标记成交不会重复生成。合作经纪人能看到这笔交易，但不能修改。
  *Co-agent split: a deal can have a co-agent with a share (50% by default). At closing the system creates a commission record for each of the two agents, each part then subject to the firm split; marking the deal closed again never duplicates them. The co-agent can see the deal but not edit it.*
- 数据库：新增 `Transaction.coAgentSplit`（幂等迁移 `20261112000000_co_agent_split`）。
  *Database: new `Transaction.coAgentSplit` (idempotent migration `20261112000000_co_agent_split`).*
- 开放日签到增强：签到表单新增“是否已有经纪人”“预算”“计划购房时间”，以及必须勾选的“同意被联系”（记录同意时间）。签到的访客会自动成为客户线索，回答写进客户备注；已有经纪人的访客标为“温”而非“热”。开放日线索会生成“24 小时内跟进”任务，网站咨询仍是“15 分钟内回电”。
  *Open-house sign-in improvements: the form adds "working with an agent?", budget and purchase timeline, plus a required "agree to be contacted" box (the time of consent is recorded). Visitors become leads automatically with their answers in the client notes; visitors who already have an agent are marked warm rather than hot. Open-house leads get a "follow up within 24 hours" task, while website inquiries keep the 15-minute call-back.*
- 可打印的开放日二维码签到页：在“房源”卡片上点 “QR” 会打开该房源的签到海报（大号二维码、地址、经纪公司名，四种语言），可直接打印放在门口；同时复制签到链接，方便发短信或邮件。二维码在浏览器本地生成，不经过第三方。
  *A printable open-house QR sign: clicking "QR" on a listing card opens a sign-in poster for that listing (large QR code, address, brokerage name, in four languages) ready to print for the entrance; the sign-in link is also copied for texting or email. The QR code is generated in the browser, with no third party involved.*

---

## [1.2.1.0] — 2026-11-12 · 多语言补全（邮件与通知按收件人语言、西班牙语设置页补齐）、一键本地开发环境、GitHub 仓库安全设置 / Language completion (emails and notifications in the recipient's language, Spanish Settings page completed), one-command local development, GitHub repository security settings

- 数据库：无迁移。环境变量：生产无新增（`DEV_*` 仅用于本地 Docker）。
  *Database: no migration. Environment variables: none new in production (`DEV_*` are for local Docker only).*

#### 新增 / Added
- 邮件和站内通知现在按收件人的语言发送（English、简体中文、繁體中文、Español）：邀请、验证邮箱、重置密码，以及新线索、报价、预约、任务逾期、佣金等提醒。以前这些全是英文。
  *Emails and in-app notifications are now sent in the recipient's language (English, Simplified Chinese, Traditional Chinese, Spanish): invitations, email verification, password reset, and the new-lead, offer, appointment, overdue-task and commission alerts. Before, all of these were English only.*
- 你选的界面语言现在会保存到账号：在顶栏切换语言、登录、注册、忘记密码、重发验证邮件、邀请成员时都会带上；换新设备登录时，会自动使用账号里保存的语言。
  *The interface language you choose is now saved to your account: it is sent when you switch language in the top bar, sign in, sign up, request a password reset, resend the verification email or invite a teammate; on a new device the language saved on the account is used after sign-in.*
- 邮件里的姓名、公司名等内容现在会做 HTML 转义，避免特殊字符破坏邮件版式。
  *Names, company names and similar values in emails are now HTML-escaped, so special characters can no longer break the layout.*
- 冒烟测试新增“语言”检查（共 33 项）：四种语言的邮件和通知文案都齐全，语言能保存、校验，通知按语言发出。
  *The smoke test gains a language check (33 in total): every email and notification message exists in all four languages, the language is saved and validated, and notifications follow it.*
- 本地开发环境一条命令启动：根目录新增 `docker-compose.yml` 和 `.env.example`，`docker compose up` 会一起启动数据库（PostgreSQL 16）、API 和网站，自动安装依赖并执行迁移；密码从 `.env` 读取，仓库里没有任何写死的密码，所有端口只绑定本机。用法见 README。
  *One-command local development: a new `docker-compose.yml` and `.env.example` in the repo root; `docker compose up` starts the database (PostgreSQL 16), the API and the web app together, installs dependencies and applies migrations. Passwords come from `.env`, nothing is hard-coded in the repo, and every port is bound to localhost. See the README.*

#### 修复 / Fixed
- 西班牙语界面的“设置”页以前大部分是英文（300 条文案缺失），现在全部为西班牙语。
  *The Settings page in the Spanish interface was mostly English (300 strings missing); it is now fully Spanish.*
- 仪表盘的“待办事项”卡片以前在任何语言下都是英文，现在按界面语言显示；卡片旁的数量以前固定显示 3，现在显示真实数量。
  *The dashboard “action items” cards were English in every language; they now follow the interface language, and the count next to them, which always showed 3, now shows the real number.*
- 营销页 AI 技能的名称和说明、登录和注册页的“或”分隔符，现在四种语言都已翻译。西班牙语“待办事项”的译名改为更自然的 “Acciones pendientes”。
  *The AI skill names and descriptions on the Marketing page and the “or” divider on the login and sign-up pages are now translated in all four languages. The Spanish label for action items is now the more natural “Acciones pendientes”.*

#### 移除 / Removed
- 删除 `backend/docker-compose.yml`：它只有一个数据库，并且写死了密码，已被根目录的新 `docker-compose.yml` 取代。
  *Removed `backend/docker-compose.yml`: it held only a database and had a hard-coded password; the new root `docker-compose.yml` replaces it.*

#### 变更 / Changed
- GitHub 仓库设置（不影响代码）：`main` 分支开启保护（合并前必须通过 CI 的后端和前端两项检查，禁止强制推送和删除）；开启私下报告漏洞、Dependabot 警报和安全更新；合并后自动删除分支；外部贡献者的 PR 需要业主批准后才会运行 CI。机密扫描和推送保护原本已开启。
  *GitHub repository settings (no code change): `main` is protected (the backend and frontend CI checks must pass before merging; force pushes and deletion are blocked); private vulnerability reporting, Dependabot alerts and security updates are on; branches are deleted after merging; CI on PRs from outside contributors needs the owner's approval first. Secret scanning and push protection were already on.*

---

## [1.2.0.0] — 2026-11-12 · 设置栏目落地（CRM、房源、财务、预约、文档由服务器强制执行）、安全策略生效、审计日志扩展 / Settings sections made real (CRM, Properties, Finance, Appointments, Documents enforced by the server), security policy enforced, wider audit trail

#### 新增 / Added
- 设置里的五个栏目现在都是真的：**CRM、房源、财务、预约、文档**。公司管理员定下全公司的规则，每个人再按自己的习惯调整个人偏好；所有规则由服务器强制执行，不是只改界面。
  *Five Settings sections are now real: **CRM, Properties, Finance, Appointments and Documents**. Company admins set the rules for the whole firm and everyone adjusts their own preferences; the server enforces every rule, it is not just a change to the screen.*
  - **CRM**：可设客户必填字段、每位经纪人最多同时跟进多少客户、经纪人能否看到全公司客户（只读，仍只能改自己的客户）、是否检查重复客户、线索来源列表；个人偏好：新建客户的默认类型和阶段、是否显示预算、列表是否紧凑。
    *CRM: required client fields, the maximum open clients per agent, whether agents can see the whole firm's clients (read-only; they can still edit only their own), the duplicate check, and the lead-source list; personal: default type and stage for new clients, showing the budget, and a compact list.*
  - **房源**：谁能新建房源（所有员工或仅经理）、必填字段、上架前至少几张照片、每个房源最多几张照片、描述字数上限；个人偏好：新房源默认状态。照片不够时新房源自动为“即将上市”，卡片上有“设为在售”按钮。
    *Properties: who can create listings (all staff or managers only), required fields, photos needed before a listing can go Active, a photo limit per listing, and a description length limit; personal: default status for new listings. Without enough photos a new listing starts as Coming Soon, and its card has a “Set Active” button.*
  - **财务**：财年起始月份（影响“年初至今”），以及是否让经纪人看到同事的佣金总额（经理始终可见）；默认佣金比例和分成也移到这里；个人偏好：是否显示排行榜、仪表盘是否显示收入。
    *Finance: the fiscal-year start month (changes “year to date”), and whether agents can see colleagues' gross commission (managers always can); the default commission rate and split moved here; personal: showing the leaderboard and showing income on the dashboard.*
  - **预约**：工作时间（周视图和日视图按此显示）、是否显示周末、是否禁止重复预约（冲突时提示，可确认后仍然预约）、预约间隔缓冲；个人偏好：默认时长、提前几小时提醒、新预约是否自动确认。
    *Appointments: workday hours (week and day views follow them), showing weekends, preventing double booking (a conflict asks you to confirm and you can still book), and a buffer between appointments; personal: default length, how many hours ahead to be reminded, and auto-confirming new appointments.*
  - **文档**：允许上传的格式（PDF、Word、图片）和单个文件大小上限（1–20 MB）；上传框会提示规则，超限时给出清楚的说明。房源照片不受影响。
    *Documents: allowed formats (PDF, Word, images) and the maximum file size (1–20 MB); the upload box shows the rules and explains clearly when a file is refused. Listing photos are not affected.*
- 所有默认值与原来的行为一致，升级后什么都不会变，直到管理员修改。管理员的每次修改都会记入审计日志。
  *All defaults match the previous behaviour, so nothing changes after the upgrade until an admin changes a rule. Every admin change is recorded in the audit trail.*
- 新接口：`GET/PATCH /api/settings/policies`（所有成员可读，公司管理员可写）和 `GET/PATCH /api/settings/preferences`（本人）。
  *New endpoints: `GET/PATCH /api/settings/policies` (everyone can read, company admins can write) and `GET/PATCH /api/settings/preferences` (your own).*
- 数据库：`Organization.policies` 和 `User.preferences` 两个可空列（幂等迁移 `20261111000000_settings_policies_preferences`），旧数据不受影响。无新增环境变量。
  *Database: nullable `Organization.policies` and `User.preferences` columns (idempotent migration `20261111000000_settings_policies_preferences`); old data is unaffected. No new environment variables.*
- 冒烟测试增加“权限矩阵”和“审计日志”检查：经纪人、经理、公司管理员各自能访问和不能访问的接口，套餐档位限制返回 403，未登录或令牌无效始终返回 401；共 25 项。
  *The smoke test gains permission-matrix and audit-trail checks: what an agent, a manager and a firm admin can and cannot reach, plan-tier limits returning 403, and signed-out or invalid tokens always returning 401; 25 checks in total.*

#### 变更 / Changed
- **营销**（依赖 AI 助手）、**访问控制**、**集成**仍标“即将推出”：营销要等 AI 助手（路线图第 4 阶段）；访问控制的权限矩阵尚不能真正驱动鉴权；集成要随各自的对接一起上线。
  *Marketing (depends on the AI assistant), Access Control and Integrations stay marked “coming soon”: Marketing waits for the AI assistant (roadmap stage 4), the access-control matrix cannot yet truly drive authorization, and integrations ship together with each integration.*
- 以前只存在浏览器里、对服务器没有任何作用的设置项已移除（例如自动归档、房源审核、MLS 同步、货币、费用收据、文档保留期），以免让人误以为生效。
  *Options that were only stored in the browser and did nothing on the server have been removed (for example auto-archive, listing approval, MLS sync, currency, expense receipts and document retention), so nobody believes they work.*
- 防重复预约的提示现在按你自己的时区显示冲突时间（以前显示 UTC）。
  *The double-booking warning now shows the clashing time in your own time zone (it used to show UTC).*
- 预约提醒邮件按每位经纪人自己的“提前小时数”发送。
  *Appointment reminder emails are sent according to each agent's own “hours ahead” setting.*
- 冒烟测试增加 6 项检查（设置接口、CRM、房源、预约、文档、财务），共 32 项。
  *The smoke test gains 6 checks (settings API, CRM, properties, appointments, documents, finance); 32 in total.*
- 文档补充英文：`CHANGELOG.md`、`guides/roadmap.md`、`guides/release-process.md`、`guides/security-audit-2026-10.md`、`guides/competitive-research.md` 现在是中英双语（中文在前、英文紧随），内容不变。
  *Docs gain English: `CHANGELOG.md`, `guides/roadmap.md`, `guides/release-process.md`, `guides/security-audit-2026-10.md` and `guides/competitive-research.md` are now bilingual (Chinese first, English right after); content unchanged.*
- 依赖更新（Dependabot 5 个 PR 逐个测试后合并）：后端 Express 相关依赖（`body-parser`、`qs`、`type-is` 等）、前端 Next.js 16.4.3、React 19.3.1、Tailwind 4.3、`recharts` 3.10、`date-fns`、`react-big-calendar`，以及 CI 使用的 GitHub Actions（`checkout`、`setup-node` v7）。用户界面和功能没有变化；生产依赖 `npm audit` 前后端均为 0 漏洞，23 项冒烟测试全部通过。
  *Dependency updates (5 Dependabot PRs, each tested before merging): backend Express-related packages (`body-parser`, `qs`, `type-is`, etc.), frontend Next.js 16.4.3, React 19.3.1, Tailwind 4.3, `recharts` 3.10, `date-fns`, `react-big-calendar`, and the GitHub Actions used by CI (`checkout`, `setup-node` v7). No UI or feature change; `npm audit` shows 0 production vulnerabilities on both sides and all 23 smoke checks pass.* *Later bumps (Dependabot PRs #35–#37): Next.js 16.4.5, Tailwind 4.3.5 and two backend packages.*

#### 安全 / Security
- 设置 → 安全 现在真正生效：公司管理员可以设置会话时长（15 分钟到 24 小时）、最短密码长度、是否要求特殊字符、密码有效期、改密码后是否让旧登录退出。这些规则对公司里所有人生效，保存后立即应用；登录、邀请注册和重置密码都会按规则检查。以前这些选项只是摆设。
  *Settings → Security now really works: company admins can set the session length (15 minutes to 24 hours), minimum password length, whether a special character is required, the password lifetime, and whether a password change signs out older sessions. The rules apply to everyone in the company, take effect as soon as they are saved, and are checked at sign-in, invitation sign-up and password reset. Before, these options did nothing.*
- 密码过期只在服务器能发邮件时才强制执行，否则忘记密码流程不可用，账号会被永久锁住。双因素认证、登录提醒、IP 白名单仍标“即将推出”。
  *Password expiry is enforced only when the server can send email; otherwise the forgot-password flow would not work and an account could be locked out for good. Two-factor authentication, login alerts and the IP whitelist are still marked “coming soon”.*
- “发送重置链接”按钮以前只弹出一个假提示，现在会真的发出密码重置邮件（前提是服务器已配置邮件服务）。
  *The “Send Reset Link” button used to show a fake message; it now really sends the password reset email (provided the server has an email service configured).*
- 数据库：新增 `Organization` 的 5 个安全策略字段和 `User.passwordChangedAt`（幂等迁移 `20261110000000_security_policy`）；默认值与原来的行为一致（会话 24 小时、最短 8 位、无特殊字符要求、密码不过期），升级后现有用户不受影响，只有“改密码后退出”默认开启。
  *Database: 5 security-policy columns on `Organization` and `User.passwordChangedAt` (idempotent migration `20261110000000_security_policy`); the defaults match the old behaviour (24-hour sessions, minimum 8 characters, no special-character rule, passwords never expire), so existing users are unaffected after the upgrade, and only “sign out on password change” is on by default.*
- 新增 `SECURITY.md`：说明如何通过 GitHub 私下报告漏洞、处理流程、范围和支持的版本。
  *Added `SECURITY.md`: how to report a vulnerability privately through GitHub, what happens next, scope and supported versions.*
- 审计日志现在也记录房源、报价、预约、文档的新增、修改和删除（只记录改动的字段；文档链接和存储路径不会写入日志）。公司管理员可在“设置”里导出。
  *The audit trail now also records creating, editing and deleting listings, offers, appointments and documents (only the changed fields are stored; document links and storage keys are never written to it). Company admins can export it from Settings.*

---

## [1.1.0.1] — 2026-10-26 · 清除全部 旧第三方 品牌字样、恢复全端多语言与主题切换按钮 / Removed all legacy third-party branding, restored language and theme switchers everywhere

#### 修复与优化 / Fixes and polish
- **移除全部 旧第三方 相关内容**：清理 `frontend/src/app/page.tsx`、`frontend/src/app/layout.tsx`、`frontend/src/app/marketing/page.tsx`、`backend/docker-compose.yml` 与 `guides/roadmap.md` 中的所有 `旧第三方` / `旧第三方` 品牌标识，统一替换为中立的 `Real Estate CRM` / `RE CRM`。
  *Removed all legacy third-party references: cleaned every legacy brand mark from `frontend/src/app/page.tsx`, `frontend/src/app/layout.tsx`, `frontend/src/app/marketing/page.tsx`, `backend/docker-compose.yml` and `guides/roadmap.md`, replacing them with the neutral `Real Estate CRM` / `RE CRM`.*
- **首页（`/`）支持 4 语言与 5 套主题即时切换**：新增客户端落地页组件 `frontend/src/components/landing/LandingPageClient.tsx`，在首页顶部导航栏加入多语言切换器（English / 简体中文 / 繁體中文 / Español）与主题切换器，已登录用户可直接点击“进入工作台 →”（`/dashboard`）回到熟悉的 CRM 界面。
  *The home page (`/`) supports 4 languages and 5 themes instantly: a new client-side landing component `frontend/src/components/landing/LandingPageClient.tsx` adds a language switcher (English / 简体中文 / 繁體中文 / Español) and a theme switcher to the top nav; signed-in users can click “进入工作台 →” (Enter workspace, `/dashboard`) to return to the familiar CRM.*
- **修复小屏幕 / 移动端顶部栏隐藏多语言切换按钮的问题**：移除 `frontend/src/components/layout/Header.tsx` 中语言切换器和主题切换器上的 `hidden sm:block` 样式，确保在任何屏幕尺寸下都清晰可见。
  *Fixed the language switcher being hidden in the top bar on small screens / mobile: removed `hidden sm:block` from the language and theme switchers in `frontend/src/components/layout/Header.tsx`, so they are visible at any screen size.*

---

## [1.1.0.0] — 2026-10-26 · 核心痛点闭环（文件直传、线索自动分配、邮件提醒、品牌短链、CSV 批量导入）与安全加固 / Core pain points closed (direct file upload, automatic lead routing, email reminders, branded short links, CSV bulk import) and security hardening

#### 安全 / Security
- 升级 `body-parser` 至 `2.2.2`（`npm audit` 生产与开发依赖 0 漏洞）。
  *Upgraded `body-parser` to `2.2.2` (`npm audit`: 0 vulnerabilities in production and dev dependencies).*
- 开启 GitHub Dependabot 自动依赖巡检（`.github/dependabot.yml`），每周定期扫描前后端 npm 依赖与 GitHub Actions 安全更新。
  *Enabled GitHub Dependabot dependency scanning (`.github/dependabot.yml`): weekly scans of frontend/backend npm dependencies and GitHub Actions security updates.*
- 登录态支持 `httpOnly` Cookie（`crm_session`）与 CSRF 防护：登录、注册、接受邀请、令牌刷新与 Google 登录时自动下发 `HttpOnly` Cookie，退出登录（`POST /api/auth/logout`）时清除；对基于 Cookie 的写请求强制校验 `X-CSRF-Protection` 自定义请求头，阻止跨站请求伪造（CSRF）。
  *Sessions now support an `httpOnly` cookie (`crm_session`) with CSRF protection: the cookie is issued on login, sign-up, accepting an invitation, token refresh and Google sign-in, and cleared on logout (`POST /api/auth/logout`); cookie-authenticated write requests must carry the custom `X-CSRF-Protection` header, blocking cross-site request forgery.*
- 前端增加 `Content-Security-Policy-Report-Only` 响应头（可通过 `NEXT_PUBLIC_CSP_ENFORCE=true` 切换为强制模式），限制脚本、连接和内嵌来源，防止恶意脚本注入。
  *The frontend now sends a `Content-Security-Policy-Report-Only` header (set `NEXT_PUBLIC_CSP_ENFORCE=true` to enforce), restricting script, connection and embed sources against malicious script injection.*

#### 新增 / Added
- 客户与房源 CSV 批量导入（`3.3a`）：
  *Bulk CSV import of clients and listings (`3.3a`):*
  - 后端新增 `POST /api/clients/import` 与 `POST /api/properties/import` 接口，单次支持最多 500 行批量导入，支持按邮箱 / 电话（客户）或 `mlsNumber` / `地址+邮编`（房源）自动防重，并提供“跳过已有记录（`skip`）”或“更新已有记录（`update`）”两种策略及行级错误明细。
    *Backend: new `POST /api/clients/import` and `POST /api/properties/import` endpoints, up to 500 rows per call, duplicate detection by email / phone (clients) or `mlsNumber` / `address + ZIP` (listings), “skip existing (`skip`)” or “update existing (`update`)” strategies and per-row error details.*
  - 前端新增 `frontend/src/lib/csv.ts`（支持 RFC 4180 引号转义解析与中 / 英 / 西文常见表头自动映射），并在客户页（`/crm`）与房源页（`/listings`）工具栏上线“导入 CSV”弹窗（含标准 CSV 模板下载、前 5 行实时预览与导入结果汇总）。
    *Frontend: new `frontend/src/lib/csv.ts` (RFC 4180 quoted-field parsing and automatic mapping of common Chinese / English / Spanish headers) and an “Import CSV” dialog on the clients page (`/crm`) and listings page (`/listings`) toolbars, with a standard CSV template download, live preview of the first 5 rows and an import summary.*
- 公开房源页自定义网址标识（Slug）、旧链接永久跳转与品牌定制（`1.4`）：
  *Custom public-page address (slug), permanent redirects for old links and branding (`1.4`):*
  - 新增 `OrgSlugHistory` 表与 `Organization.brandColor` 字段（幂等迁移 `20261026000300_org_slug_history`）。
    *New `OrgSlugHistory` table and `Organization.brandColor` column (idempotent migration `20261026000300_org_slug_history`).*
  - 公司管理员可在“设置 → 组织设置（Org Settings）”中直接上传公司 Logo、配置品牌主题色（`brandColor`），并自定义公开页短链标识（`slug`）；修改后旧 `slug` 自动写入 `OrgSlugHistory` 并自动跳转至最新地址，防止已印制的传单和门口二维码失效。
    *Company admins can upload the company logo, set the brand colour (`brandColor`) and customise the public-page slug under “Settings → Org Settings”; after a change the old slug is saved into `OrgSlugHistory` and redirects to the latest address, so printed flyers and door QR codes keep working.*
- 线索 / 预约 / 任务逾期的邮件提醒与个人通知偏好（`1.3`）：
  *Email reminders for leads / appointments / overdue tasks and personal notification preferences (`1.3`):*
  - 新增 `User.notificationPrefs`（`JSONB`）与 `Task.overdueNotified` 字段（幂等迁移 `20261026000200_notification_prefs`），并提供 `GET/PATCH /api/settings/notifications` 接口。
    *New `User.notificationPrefs` (`JSONB`) and `Task.overdueNotified` columns (idempotent migration `20261026000200_notification_prefs`) and `GET/PATCH /api/settings/notifications` endpoints.*
  - 当产生新线索分配、收到报价、交易状态变更、佣金发放、预约前 24 小时提醒或跟进任务逾期（`backend/src/lib/reminders.ts`）时，系统在生成站内通知的同时自动根据收件人的 `notificationPrefs` 发送包含直达链接的邮件提醒（支持 Resend / SendGrid，未配置密钥时在开发日志输出预览）。
    *When a new lead is assigned, an offer arrives, a deal status changes, a commission is paid, an appointment is 24 hours away or a follow-up task is overdue (`backend/src/lib/reminders.ts`), the system sends an email with a deep link, per the recipient's `notificationPrefs`, alongside the in-app notification (Resend / SendGrid supported; without keys a preview is logged in development).*
  - 前端“设置 → 通知（Notifications）”正式解除“即将推出”只读锁定，与后端数据库实时同步。
    *Frontend: “Settings → Notifications” is no longer read-only “coming soon” and syncs with the backend in real time.*
- 线索自动分配（`1.2`）：支持将公开房源网站咨询与开放日签到线索按优先级规则自动分配给团队经纪人。
  *Automatic lead routing (`1.2`): website inquiries on public listings and open-house sign-ins are assigned to team agents by priority rules.*
  - 新增 `LeadRoutingRule` 表与 `User.acceptingLeads` / `User.maxActiveLeads` 字段（幂等迁移 `20261026000100_lead_routing`），分配引擎（`backend/src/lib/routing.ts`）支持按来源、城市、价格区间匹配，并提供轮询分配（`ROUND_ROBIN`）、最低负载（`LEAST_LOADED`）、指定经纪人（`SPECIFIC_AGENT`）与挂牌经纪人优先（`LISTING_AGENT`）四种策略；暂停接单或达到跟进上限的经纪人自动跳过，无规则命中时自动兜底给挂牌经纪人或公司管理员。
    *New `LeadRoutingRule` table and `User.acceptingLeads` / `User.maxActiveLeads` columns (idempotent migration `20261026000100_lead_routing`). The routing engine (`backend/src/lib/routing.ts`) matches on source, city and price range and offers four strategies: round-robin (`ROUND_ROBIN`), least loaded (`LEAST_LOADED`), named agent (`SPECIFIC_AGENT`) and listing agent first (`LISTING_AGENT`). Agents who paused leads or hit their follow-up cap are skipped; if no rule matches, the lead falls back to the listing agent or the company admin.*
  - 设置页新增“线索分配（Lead Routing）”面板与干跑模拟器（Dry-Run Simulator），并在“团队与角色”列表中支持一键切换成员是否接单及最大活跃客户上限。
    *Settings gains a “Lead Routing” panel with a Dry-Run Simulator, and the “Team & Roles” list lets you toggle whether a member accepts leads and set their maximum active-client cap in one click.*
- 真实文件上传（`1.1`）：支持直接从手机或电脑上传房源照片与私密合同文档，告别手动粘贴外部链接。
  *Real file upload (`1.1`): upload listing photos and private contract documents straight from a phone or computer — no more pasting external links.*
  - 后端新增 `POST /api/uploads`、`GET /api/uploads/public/:id`、`GET /api/uploads/private/:id`、`PATCH /api/media/reorder` 及 `GET /api/documents/:id/view-url`：支持 Cloudflare R2 对象存储（配置 `R2_*` 环境变量时启用）与 PostgreSQL `UploadedFile` 持久化存储自动降级（未配置 R2 时开箱即用，Render 重启不丢文件）。
    *Backend: new `POST /api/uploads`, `GET /api/uploads/public/:id`, `GET /api/uploads/private/:id`, `PATCH /api/media/reorder` and `GET /api/documents/:id/view-url`. Supports Cloudflare R2 object storage (enabled when the `R2_*` env vars are set) and automatic fallback to PostgreSQL `UploadedFile` storage (works out of the box without R2; files survive Render restarts).*
  - 房源照片公开访问，支持多图拖拽上传、一键设为封面、左右排序及删除联动清理底层文件；合同文档仅限同公司授权人员通过 10 分钟临时签名链接预览与下载。
    *Listing photos are public, with multi-image drag-and-drop upload, one-click cover, left/right reordering and deletion that also cleans up the underlying file; contract documents can be previewed and downloaded only by authorised people in the same company through 10-minute signed links.*
- 接入 GitHub Actions CI 自动测试（`.github/workflows/ci.yml`）：每次提交或 PR 自动启动 PostgreSQL 16 容器，执行后端类型检查、幂等数据库迁移与端到端冒烟测试，并执行前端 TypeScript 检查与生产构建。
  *Added GitHub Actions CI (`.github/workflows/ci.yml`): every commit or PR starts a PostgreSQL 16 container and runs the backend type check, idempotent migrations and the end-to-end smoke test, plus the frontend TypeScript check and production build.*
- 前后端接入轻量级 Sentry 错误监控（`backend/src/lib/sentry.ts`、`frontend/src/lib/sentry.ts`）：配置 `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` 后自动捕获并上报未处理的 500 异常与前端崩溃，未配置时静默跳过。
  *Added lightweight Sentry error monitoring to backend and frontend (`backend/src/lib/sentry.ts`, `frontend/src/lib/sentry.ts`): with `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` set, unhandled 500s and frontend crashes are captured and reported; silently skipped when unset.*

#### 变更 / Changed
- 版本号编码规则由 3 段式（`X.Y.Z`）升级为 4 段式（`X.Y.Z.W`），当前基线版本更新为 `1.0.1.0`，冒烟测试同步校验 4 段式版本号格式。
  *The version scheme moved from 3 segments (`X.Y.Z`) to 4 segments (`X.Y.Z.W`); the baseline is now `1.0.1.0`, and the smoke test checks the 4-segment format.*

#### 修复 / Fixed
- 修复前端遗留的 ESLint 报错（`marketing/page.tsx` 变量声明顺序、`reports/page.tsx` 渲染函数内调用随机函数及硬编码假排行榜数据），并在 CI 中增加 `eslint --quiet` 零错误门禁。
  *Fixed leftover frontend ESLint errors (variable declaration order in `marketing/page.tsx`; a random-number call during render and hard-coded fake leaderboard data in `reports/page.tsx`) and added a zero-error `eslint --quiet` gate to CI.*
- 补全公开房源列表页（`/public-listings`）、邮箱验证页（`/verify-email`）、财务页、升级结账弹窗及设置页提示信息的四语言（英 / 简 / 繁 / 西）国际化支持，消除切换语言后残留英文提示的体验割裂问题。
  *Completed four-language (EN / 简 / 繁 / ES) i18n for the public listings page (`/public-listings`), the email verification page (`/verify-email`), the finance page, the upgrade checkout dialog and Settings hints, removing the jarring leftover English after switching language.*
- 财务页的“佣金审批”队列：一人公司的老板（公司里没有第二位审批人）现在可以在页面上批准或退回自己的佣金申请。
  *Finance page “commission approval” queue: the owner of a one-person company (no second approver) can now approve or send back their own commission request on the page.*
  以前后端已经允许，但页面会一律隐藏自己申请的按钮，导致单人经纪公司在界面上无法放款。
  *  Previously the backend allowed it but the page hid the buttons on one's own requests, so a solo brokerage could not release payouts from the UI.*
  公司里有其他审批人时规则不变：不能审批自己的申请，页面显示“需由其他审批人处理”。
  *  When the company has other approvers the rule is unchanged: you cannot approve your own request, and the page shows “needs another approver”.*
  接口 `GET /api/finance/payout-requests` 为每条申请增加 `canReview` 字段，页面据此显示按钮。
  *  `GET /api/finance/payout-requests` now returns a `canReview` field per request, which the page uses to show the buttons.*

---

## [1.0.1.0] — 2026-10-22 · 安全加固与版本管理（原 1.0.1） / Security hardening and version management (formerly 1.0.1)

- 已合并：[PR #2](https://github.com/David-rider/Real-estate-Agency-CRM/pull/2)
  *Merged: [PR #2](https://github.com/David-rider/Real-estate-Agency-CRM/pull/2)*
- 数据库：无变更，没有新的迁移。
  *Database: no change, no new migration.*
- 回滚：直接回滚到 1.0.0 即可，不涉及数据。
  *Rollback: simply roll back to 1.0.0; no data is involved.*

#### 安全 / Security
- 安全检查（报告见 `guides/security-audit-2026-10.md`）：网站不使用 PHP；线上依赖无已知漏洞；2026 年公开的 Next.js / React / Express 漏洞已逐项核对。
  *Security audit (report in `guides/security-audit-2026-10.md`): the site does not use PHP; production dependencies have no known vulnerabilities; the 2026 public Next.js / React / Express vulnerabilities were checked one by one.*
- `react` / `react-dom` 升级到 19.2.9，`multer` 升级到 2.5.0（修复已公开的拒绝服务漏洞）。
  *Upgraded `react` / `react-dom` to 19.2.9 and `multer` to 2.5.0 (fixes publicly disclosed denial-of-service flaws).*
- 注册时密码至少 8 位（以前任何密码都能用）。
  *Passwords must be at least 8 characters at sign-up (previously any password was accepted).*
- 密码重置令牌改为只存哈希值；数据库即使泄露，也拿不到能用的重置链接。
  *Password-reset tokens are stored hashed only; even a database leak yields no usable reset link.*
- 登录令牌只接受 HS256 签名算法。
  *Login tokens accept the HS256 signature algorithm only.*
- 支付接口不再把内部错误详情返回给用户。
  *Payment endpoints no longer return internal error details to users.*
- API 增加安全响应头（nosniff、禁止嵌入页面、CSP、HSTS），隐藏 `X-Powered-By`；前端增加 HSTS。
  *The API adds security headers (nosniff, anti-framing, CSP, HSTS) and hides `X-Powered-By`; the frontend adds HSTS.*
- 房源的虚拟看房链接、封面图只允许 http/https 地址，防止 `javascript:` 链接。
  *Listing virtual-tour links and cover images accept only http/https addresses, blocking `javascript:` links.*

#### 新增 / Added
- 版本管理：`GET /api/health` 返回当前运行的版本号（`version`），部署后可以直接核对线上版本。
  *Version management: `GET /api/health` returns the running version (`version`), so the live version can be verified right after deploy.*
- 发版流程文档 `guides/release-process.md`：记录位置、版本号规则、发版步骤、回滚方法和版本历史。
  *Release-process document `guides/release-process.md`: where records live, versioning rules, release steps, rollback and version history.*
- `guides/roadmap.md` 增加“版本规划与进度跟踪”表。
  *`guides/roadmap.md` gains a “version plan and progress tracking” table.*
- `CLAUDE.md`：项目约定，后续开发会话会自动读取，确保每次改动都更新这些记录。
  *`CLAUDE.md`: project conventions, read automatically by future development sessions so every change updates these records.*

#### 变更 / Changed
- 前端版本号与后端统一（1.0.1 起前后端始终同号）。
  *Frontend and backend versions are unified (always the same number from 1.0.1 on).*

---

## [1.0.0] — 2026-10-22 · 试用版首发 / First trial release

- 合并：[PR #1](https://github.com/David-rider/Real-estate-Agency-CRM/pull/1)，`main` 上的提交 `a892a82`
  *Merged: [PR #1](https://github.com/David-rider/Real-estate-Agency-CRM/pull/1), commit `a892a82` on `main`.*
- 已部署：前端（Vercel）、后端（Render）。部署后已在线确认：三个泄露的默认账号用旧密码无法登录，Apple 登录已关闭，公开房源页已按公司区分。
  *Deployed: frontend (Vercel) and backend (Render). Confirmed live after deploy: the three leaked default accounts can no longer sign in with the old password, Apple sign-in is off, and the public listings page is separated by company.*
- 下面两部分是这个版本的开发过程记录。
  *The two parts below are the development log of this version.*

---

### 第 2 轮：上线前安全与部署收尾 / Round 2: pre-launch security and deployment wrap-up

#### 安全 / Security
- **删除泄露的默认管理员 `admin@xyz.com`**（密码 `USA%100` 曾写在公开的种子脚本里）。
  ***Deleted the leaked default admin `admin@xyz.com`** (its password had been written in the public seed script).*
  - 迁移 `20261023000000_remove_leaked_default_admin`：先立即切断访问（清空密码、解绑 Google/Apple、停用、邮箱改为 `removed-<id>@removed.invalid`），再删除该账号。
    *Migration `20261023000000_remove_leaked_default_admin`: first cut access immediately (clear the password, unlink Google/Apple, deactivate, change the email to `removed-<id>@removed.invalid`), then delete the account.*
  - 如果这个账号名下还有业务数据（客户、交易、审计日志等），就只停用和匿名化，不删除，数据保留。
    *If the account still owns business data (clients, deals, audit logs, etc.) it is only deactivated and anonymised, not deleted, and the data is kept.*
  - 迁移 `20261023000200_remove_leaked_default_staff`：用同样的方式删除 `manager@xyz.com`、`agent@xyz.com`（与管理员共用同一个泄露密码）。
    *Migration `20261023000200_remove_leaked_default_staff`: removes `manager@xyz.com` and `agent@xyz.com` the same way (they shared the same leaked password).*
    原先种子数据里的客户都归在 `agent@xyz.com` 名下，所以这个账号在生产上大概率会被“停用 + 匿名化”而不是删除，名下客户保留；如有需要，可由公司管理员把这些客户重新分配给真实经纪人。
      *The clients in the old seed data all belonged to `agent@xyz.com`, so in production that account will most likely be “deactivated + anonymised” rather than deleted and its clients kept; if needed a company admin can reassign those clients to real agents.*
- **已删除或已停用的账号立即失效**：以前登录令牌在 24 小时内一直有效，现在每次请求都会核对账号是否仍然存在、是否启用（30 秒缓存）。角色、套餐的变更也即时生效。
  ***Deleted or deactivated accounts stop working immediately**: login tokens used to stay valid for 24 hours; now every request checks that the account still exists and is active (30-second cache). Role and plan changes also take effect at once. File: `backend/src/middleware/authMiddleware.ts`*
  文件：`backend/src/middleware/authMiddleware.ts`
- **修复社交登录越权（严重）**：
  ***Fixed social-login privilege escalation (critical):***
  - 以前首次用 Google/Apple 登录的人，会被自动加入数据库里的**第一家公司**，能看到该公司的数据。现在首次社交登录会创建自己的新公司；加入已有公司只能通过邀请。
    *Previously the first Google/Apple sign-in was added to the **first company** in the database and could see its data. Now a first social sign-in creates a new company of its own; joining an existing company is by invitation only.*
  - Apple 登录以前完全不做身份校验，现已关闭，接口返回 503，等实现校验后再开放。
    *Apple sign-in used to do no identity verification at all; it is now disabled and the endpoint returns 503 until verification is implemented.*
  - Google 登录在生产环境必须配置 `GOOGLE_CLIENT_ID` 才能使用，不再接受未经校验的身份。
    *Google sign-in in production now requires `GOOGLE_CLIENT_ID`; unverified identities are no longer accepted.*
  - 文件：`backend/src/routes/oauth.ts`
    *File: `backend/src/routes/oauth.ts`*

#### 部署 / 数据库 / Deployment / Database
- **生产环境启动时自动完成基线和迁移**：新增 `backend/src/release.ts`，生产环境下 API 启动前会依次：
  ***Baseline and migrations run automatically at production start**: new `backend/src/release.ts`; in production the API does the following before starting:*
  1. 检测到“用 `db push` 建的库、没有迁移记录”时，先执行基线（把 `20260303200258_init_multi_tenant` 标记为已执行）；
     *If it detects a database built with `db push` and without migration history, it runs the baseline first (marks `20260303200258_init_multi_tenant` as applied);*
  2. 之前执行失败的迁移会标记为回滚后重新执行（这些迁移都是幂等的，重复执行安全）；
     *Migrations that failed earlier are marked rolled back and re-run (all migrations are idempotent, so re-running is safe);*
  3. 执行 `prisma migrate deploy`。
     *Runs `prisma migrate deploy`.*
  - 如果迁移失败，进程直接退出，Render 会继续运行旧版本，不会造成停机。
    *If a migration fails the process exits and Render keeps running the old version, so there is no downtime.*
  - 可设置 `RUN_MIGRATIONS_ON_START=false` 关闭；也可手动执行 `npm run release`。
    *Set `RUN_MIGRATIONS_ON_START=false` to turn it off, or run `npm run release` manually.*
  - 已在本地模拟了 5 种场景，全部通过：`db push` 老库（管理员名下无数据 / 有数据）、重复启动、全新空库、之前有失败迁移的库。
    *5 scenarios were simulated locally and all passed: an old `db push` database (admin with / without data), repeated start, a brand-new empty database, and a database with earlier failed migrations.*

#### 功能调整 / Feature adjustments
- **AI 助手暂不启用，标注“正在开发”**：
  ***The AI assistant is not enabled for now and is labelled “in development”:***
  - 后端开关 `AI_ASSISTANT_ENABLED`（默认 `false`）；前端开关 `NEXT_PUBLIC_AI_ASSISTANT_ENABLED`（默认 `false`）。
    *Backend switch `AI_ASSISTANT_ENABLED` (default `false`); frontend switch `NEXT_PUBLIC_AI_ASSISTANT_ENABLED` (default `false`).*
  - 营销页的 AI 助手和旧的 “Marketing Copilot” 都显示“正在开发”，按钮禁用。
    *The marketing page AI assistant and the old “Marketing Copilot” both show “in development” with disabled buttons.*
  - 客户详情页的 “用 AI 起草跟进” 和房源卡片上的 “AI 写文案” 入口隐藏。
    *The “Draft follow-up with AI” entry on client detail and the “AI copywriting” entry on listing cards are hidden.*
  - 移除了 Copilot 里写死的假房源选项。
    *Removed the hard-coded fake listing options in Copilot.*
- **每家公司独立的公开房源页**：
  ***A separate public listings page per company:***
  - 新增 `Organization.slug` 字段，迁移 `20261023000100_organization_public_slug` 会为已有公司自动生成。
    *New `Organization.slug` column; migration `20261023000100_organization_public_slug` generates one for existing companies.*
  - 公开房源页地址变为 `/public-listings?b=<slug>`，只展示该公司的在售、即将上市、已签约房源。不带 `b` 参数时提示“请向经纪人索取链接”。
    *The public listings URL becomes `/public-listings?b=<slug>` and shows only that company's active, coming-soon and under-contract listings. Without the `b` parameter it says “ask your agent for the link”.*
  - 设置 → 组织 中可以看到并复制本公司的公开页链接。
    *Settings → Organization shows and copies the company's public page link.*
  - 首页的 “Browse Listings” 链接只有在设置了 `NEXT_PUBLIC_FEATURED_BROKERAGE_SLUG` 时才显示，没设置就隐藏。
    *The home page “Browse Listings” link only appears when `NEXT_PUBLIC_FEATURED_BROKERAGE_SLUG` is set, and is hidden otherwise.*
  - 去掉了公开页上的假示例房源和随机图库照片：没有照片的房源显示占位图标。房源照片改用普通 `<img>`，任何图片地址都能显示。
    *Removed fake sample listings and random stock photos from the public page: listings without photos show a placeholder icon. Listing photos now use a plain `<img>`, so any image address displays.*
- **佣金列表对所有套餐开放**（上一轮已实现，确认保留）。
  ***The commission list is open to every plan** (implemented in the previous round, confirmed and kept).*

#### 测试 / Tests
- 冒烟测试增加到 17 项，新增：公开页按公司隔离、社交登录不能加入他人公司。
  *The smoke test grew to 17 checks, adding: public page isolated by company, and social login cannot join someone else's company.*

---

### 第 1 轮：同类产品调研 + 上线前补全 / Round 1: competitor research + pre-launch completion

提交：`cf59e35` `c55a9cb` `5b1cb91` `38a62f3` `e582aea` `a80c0b0`

*Commits: `cf59e35` `c55a9cb` `5b1cb91` `38a62f3` `e582aea` `a80c0b0`*

#### 仓库清理（公开仓库） / Repository cleanup
- 从 git 中移除：`backend/dist/` 编译产物、编译/类型错误日志、一次性脚本、根目录未使用的 `xlsx` 依赖、两个失效的子模块链接（`.agents/...`、`.claude/worktrees/...`）。
  *Removed from git: the `backend/dist/` build output, compile/type-error logs, one-off scripts, the unused root `xlsx` dependency, and two dead submodule links (`.agents/...`, `.claude/worktrees/...`).*
- 种子脚本 `backend/prisma/seed.ts` 改为安全版本：不删除任何数据；生产环境默认拒绝运行；不再内置固定密码（用 `SEED_PASSWORD`，或自动生成随机密码）。演示账号为 `admin@ / manager@ / agent@demo.example.com`。
  *The seed script `backend/prisma/seed.ts` is now safe: it deletes no data, refuses to run in production by default, and has no built-in fixed password (it uses `SEED_PASSWORD` or generates a random one). Demo accounts are `admin@ / manager@ / agent@demo.example.com`.*
- Stop hook 改为相对路径 `cd frontend && npm run audit:i18n`。
  *The Stop hook now uses a relative path: `cd frontend && npm run audit:i18n`.*

#### 数据库迁移 / Database migrations
- 新增 `20260709000000_sync_schema_baseline`：补齐以前用 `db push` 添加、但没写进迁移文件的表和字段，全部幂等。以前在全新数据库上执行迁移会直接失败。
  *New `20260709000000_sync_schema_baseline`: fills in tables and columns that had been added with `db push` but never written into migration files, all idempotent. Running the migrations on a fresh database used to fail outright.*
- 已有的迁移文件改为幂等写法（`IF NOT EXISTS`）。
  *Existing migration files were rewritten to be idempotent (`IF NOT EXISTS`).*
- 新增 `20261022000000_lead_temperature_commission_defaults`：客户优先级 `temperature`、公司默认佣金比例和分成、单笔交易佣金比例。
  *New `20261022000000_lead_temperature_commission_defaults`: client priority `temperature`, company default commission rate and split, and per-deal commission rate.*

#### 后端修复 / Backend fixes
- **跨公司数据隔离**：新建或修改报价、交易、预约、文档、礼品、照片、任务时，会校验引用的客户、房源、交易是否属于本公司（`backend/src/lib/access.ts` 的 `checkRefs`）。
  ***Cross-company data isolation**: when creating or editing offers, deals, appointments, documents, gifts, photos and tasks, the referenced client, listing and deal are checked to belong to the company (`checkRefs` in `backend/src/lib/access.ts`).*
- 补上缺失的 `GET /api/clients/:id`（以前客户详情页一直空白）。
  *Added the missing `GET /api/clients/:id` (the client detail page used to be blank).*
- 通知类型写错导致通知静默丢失；营销素材保存时缺少经纪人；CSV 导入能创建 SUPERADMIN 且绕过席位上限——均已修复。
  *Fixed: a wrong notification type silently dropped notifications; marketing assets were saved without an agent; CSV import could create a SUPERADMIN and bypass the seat cap.*
- 生产环境启用 `trust proxy`，避免所有用户共用同一个登录限流额度；登录限流只计算失败的尝试。
  *Enabled `trust proxy` in production so all users no longer share one login rate-limit quota; the login limiter now counts failed attempts only.*
- 仪表盘按角色区分范围（经纪人只看自己的数据），图表按年月统计，“待处理报价”的计数改正。
  *The dashboard is scoped by role (agents see only their own data), charts aggregate by year-month, and the “pending offers” count was corrected.*
- 一人公司的老板可以审批自己的佣金发放（以前没人能审批）。
  *The owner of a one-person company can approve their own commission payouts (previously nobody could).*
- 交易详情、文档、搜索、报价都按角色限制可见范围。
  *Deal detail, documents, search and offers are limited by role.*

#### 后端新功能 / New backend features
- 客户：服务端搜索和筛选、重复客户检测（409 提示，可强制创建）、归档、优先级、14 天未跟进筛选；活动记录存为备注，并自动更新“最近联系”时间。
  *Clients: server-side search and filtering, duplicate detection (409 with a force-create option), archiving, priority, a 14-days-without-follow-up filter; activities are stored as notes and update “last contacted” automatically.*
- 报价：接受、还价、拒绝；接受后自动建交易。
  *Offers: accept, counter, reject; accepting auto-creates a deal.*
- 交易：新建时自动生成过户清单任务；状态变化时自动同步房源和客户状态；标记“已成交”时按比例自动生成佣金（`backend/src/lib/deals.ts`）。
  *Deals: closing-checklist tasks are generated on creation; listing and client status sync on status changes; marking “closed” auto-generates commissions by rate (`backend/src/lib/deals.ts`).*
- 公开房源详情和咨询接口：咨询自动生成“热”线索、紧急回电任务和通知（含频率限制和反机器人字段）。
  *Public listing detail and inquiry endpoints: an inquiry auto-creates a “hot” lead, an urgent call-back task and a notification (with rate limiting and an anti-bot field).*
- 预约提醒：预约前 24 小时站内提醒（`backend/src/lib/reminders.ts`）。
  *Appointment reminders: an in-app reminder 24 hours before (`backend/src/lib/reminders.ts`).*
- 团队目录接口 `GET /api/settings/team`；组织的默认佣金设置。
  *Team directory endpoint `GET /api/settings/team`; organisation default commission settings.*
- AI 技能库（`backend/src/lib/ai.ts`，目前已关闭）。
  *AI skill library (`backend/src/lib/ai.ts`, currently off).*
- 端到端冒烟测试 `backend/tests/smoke.ts`（`npm run test:smoke`）。
  *End-to-end smoke test `backend/tests/smoke.ts` (`npm run test:smoke`).*

#### 前端 / Frontend
- 客户列表：服务端搜索（以前只能搜当前页的 10 条），新增优先级、最近联系、待跟进筛选，重复客户确认。
  *Client list: server-side search (previously only the current page of 10 was searchable), new priority, last-contacted and needs-follow-up filters, and duplicate-client confirmation.*
- 客户详情：恢复正常显示，补充资料字段、更多活动类型、跟进提醒、归档。
  *Client detail: displays correctly again, with extra profile fields, more activity types, follow-up reminders and archiving.*
- 公开房源详情页和咨询/开放日签到表单（以前的联系表单不保存提交内容）。首页和房源页不再把未登录访客跳转到登录页。
  *Public listing detail page and inquiry / open-house sign-in forms (the old contact form did not save submissions). The home and listings pages no longer redirect signed-out visitors to the login page.*
- 报价：接受 / 还价 / 拒绝；预约：类型、地点、确认 / 完成 / 取消 / 删除。
  *Offers: accept / counter / reject; appointments: type, location, confirm / complete / cancel / delete.*
- 服务页：礼品和转介使用真实的客户和同事数据（以前发送的是假 ID）。
  *Services page: gifts and referrals use real clients and colleagues (they used to send fake IDs).*
- 仪表盘新增“今日”面板，去掉了假的示例待办。
  *The dashboard gains a “Today” panel and drops the fake sample to-dos.*
- 设置：佣金默认值。
  *Settings: commission defaults.*
- 日期和时间改为在浏览器端换算时区，不再出现时间偏移 4–5 小时、日期提前一天的问题。
  *Dates and times are converted to the time zone in the browser, fixing the 4–5 hour shift and the date being a day early.*
- 新增文案统一放在 `frontend/src/lib/i18n/extra.ts`（英、简、繁、西四种语言）。
  *New strings all live in `frontend/src/lib/i18n/extra.ts` (English, Simplified Chinese, Traditional Chinese, Spanish).*

#### 文档 / Docs
- `README.md`：本地运行、测试、部署和升级说明。
  *`README.md`: running locally, testing, deployment and upgrade notes.*
- `guides/competitive-research.md`：同类产品调研。
  *`guides/competitive-research.md`: competitor research.*
- `guides/testing-checklist.md`：给试用客户的测试清单。
  *`guides/testing-checklist.md`: a test checklist for trial customers.*
- `guides/roadmap.md`：后续功能的执行计划。
  *`guides/roadmap.md`: the execution plan for upcoming features.*

---

## [0.x] — 2026-10-22 以前 / Before 2026-10-22

最初的开发阶段，详见 git 历史（截至提交 `9d4dc24`）。

*The initial development phase; see git history (up to commit `9d4dc24`).*

---

## 环境变量变更汇总 / Environment variable summary

| 位置<br>*Where* | 变量<br>*Variable* | 说明<br>*Description* |
|---|---|---|
| 后端<br>*Backend* | `AI_ASSISTANT_ENABLED` | AI 助手开关，默认 `false`<br>*AI assistant switch, default `false`* |
| 后端<br>*Backend* | `ANTHROPIC_API_KEY` | AI 助手启用后才需要<br>*Needed only once the AI assistant is enabled* |
| 后端<br>*Backend* | `RUN_MIGRATIONS_ON_START` | 默认开启；设为 `false` 时启动不自动迁移<br>*On by default; `false` disables migrations at start* |
| 后端<br>*Backend* | `TRUST_PROXY` | 可选，生产环境默认 `1`<br>*Optional; defaults to `1` in production* |
| 后端<br>*Backend* | `DISABLE_IP_ALLOWLIST` | 可选，紧急开关：设为 `true` 时忽略所有公司的 IP 白名单（管理员被锁在外面时使用），平时不要设置<br>*Optional emergency switch: `true` ignores every brokerage's IP allowlist (for when admins are locked out); leave unset normally* |
| 后端<br>*Backend* | `DISABLE_JOBS` | 可选，设为 `true` 关闭预约提醒任务<br>*Optional; `true` turns off the appointment-reminder job* |
| 后端<br>*Backend* | `SEED_PASSWORD` / `ALLOW_SEED` | 仅种子脚本使用<br>*Used only by the seed script* |
| 前端<br>*Frontend* | `NEXT_PUBLIC_AI_ASSISTANT_ENABLED` | AI 助手开关，默认 `false`<br>*AI assistant switch, default `false`* |
| 前端<br>*Frontend* | `NEXT_PUBLIC_FEATURED_BROKERAGE_SLUG` | 可选：首页 “Browse Listings” 链接到哪家公司<br>*Optional: which company the home page “Browse Listings” links to* |
| 后端<br>*Backend* | `SENTRY_DSN` | 可选：后端 Sentry 错误上报 DSN，未填时静默不启用<br>*Optional: backend Sentry DSN; silently disabled when empty* |
| 前端<br>*Frontend* | `NEXT_PUBLIC_SENTRY_DSN` | 可选：前端 Sentry 错误上报 DSN，未填时静默不启用<br>*Optional: frontend Sentry DSN; silently disabled when empty* |
| 前端<br>*Frontend* | `NEXT_PUBLIC_CSP_ENFORCE` | 可选：设为 `true` 时前端 CSP 从仅报告切换为强制拦截，默认 `false`<br>*Optional: `true` switches the frontend CSP from report-only to enforcing; default `false`* |
| 本地开发<br>*Local dev* | `DEV_DB_PASSWORD` / `JWT_SECRET` | 仅根目录 `docker-compose.yml` 使用，必填；见根目录 `.env.example`，不用于生产<br>*Used only by the root `docker-compose.yml`, required; see the root `.env.example`, not for production* |
| 本地开发<br>*Local dev* | `DEV_DB_USER` / `DEV_DB_NAME` / `DEV_DB_PORT` / `DEV_API_PORT` / `DEV_WEB_PORT` | 可选，仅本地 Docker 开发环境<br>*Optional, local Docker development only* |

## 待确认 / To confirm

- 无。三个默认账号（`admin@`、`manager@`、`agent@xyz.com`）都会在下次部署时处理。
  *None. The three default accounts (`admin@`, `manager@`, `agent@xyz.com`) are handled on the next deploy.*

---

## 与本地代码同步 / Syncing with local code

本地如果有未提交的改动，先提交或 `git stash`。

*If you have uncommitted local changes, commit or `git stash` them first.*

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

*After merging, run locally:*

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

*Notes:*
- `backend/dist/` 已不再纳入 git 管理。本地如果还有这个目录，可以保留，`.gitignore` 会忽略它。
  *`backend/dist/` is no longer tracked by git. If the directory still exists locally you may keep it; `.gitignore` ignores it.*
- 本地的 `.env` 不受影响，可以参照 `backend/.env.example` 补充新变量。
  *Your local `.env` is unaffected; add the new variables by following `backend/.env.example`.*
- 上线方式：合并到 `main` 后，Vercel 会通过 GitHub Action 自动部署前端。Render 是否自动部署后端，取决于 Render 控制台的 Auto-Deploy 设置；如果没有开启，需要在控制台手动点 Deploy。API 启动时会自动完成基线、迁移和删除旧管理员，在 Render 日志里搜索 `[release]` 和 `admin@xyz.com` 即可确认结果。
  *Going live: after merging to `main`, Vercel deploys the frontend via a GitHub Action. Whether Render deploys the backend automatically depends on the Auto-Deploy setting in the Render dashboard; if it is off, click Deploy manually. The API runs the baseline, migrations and the old-admin removal at start; search the Render logs for `[release]` and `admin@xyz.com` to confirm the result.*
