# Project notes for Claude / 给 Claude 的项目说明

房产经纪 CRM。`backend/` = Express 5 + Prisma + PostgreSQL（部署在 Render），
`frontend/` = Next.js 16 + React 19 + Tailwind（部署在 Vercel）。

Real estate brokerage CRM. `backend/` = Express 5 + Prisma + PostgreSQL (Render),
`frontend/` = Next.js 16 + React 19 + Tailwind (Vercel).

## Language / 语言

业主用中文沟通，并要求**一切都中英双语**：给业主的回复，以及项目记录（`CHANGELOG.md`、`guides/`、PR 描述）都**先写中文、紧接着写英文**，两种语言信息一致，不要只翻译一半。
代码、代码注释和提交信息（commit message）仍然用英文。命令、路径、文件名只写一次，不翻译。
已有的纯中文记录，在下次修改时顺手补上英文。

The owner communicates in Chinese and requires **everything to be bilingual**: replies to the owner and project records (`CHANGELOG.md`, `guides/`, PR descriptions) are written **Chinese first, English right after**, with the same information in both — never translate only half.
Code, code comments and commit messages stay in English. Commands, paths and file names appear once and are not translated.
Existing Chinese-only records get their English added the next time they are edited.

## Records to keep up to date — on every change / 每次改动都要更新的记录

1. `CHANGELOG.md` → 在 **[未发布]** 下加一条简短记录（新增 / 修复 / 安全 / 变更 / 移除），写用户能感受到的变化，不写实现细节；中英双语。
   Add a short entry under **[未发布]** (新增 / 修复 / 安全 / 变更 / 移除), describing what users notice, not implementation detail; bilingual.
2. `guides/roadmap.md` → 某个路线图事项开始或完成时，更新“进度跟踪”表。
   Update the 进度跟踪 table when a roadmap item starts or finishes.
3. 新增环境变量 → 同步 `backend/.env.example` / `frontend/.env.example`、`render.yaml`，以及 `CHANGELOG.md` 里的“环境变量”表。
   New env vars → `backend/.env.example` / `frontend/.env.example`, `render.yaml`, and the 环境变量 table in `CHANGELOG.md`.
4. 面向客户的新功能 → 补进 `guides/testing-checklist.md`。
   Customer-visible features → `guides/testing-checklist.md`.
5. 发版按 `guides/release-process.md` 走（四段版本号 `X.Y.Z.W`，如 `1.0.1.0`；两个 `package.json` 的版本号都要升；把 [未发布] 移到 `## [X.Y.Z.W] — date`；部署后核对 `GET /api/health` 返回的 `version`；在“版本历史”表里加一行）。标签由业主推送。
   Releases follow `guides/release-process.md` (4-segment version `X.Y.Z.W`, e.g. `1.0.1.0`; bump both package.json versions; move [未发布] to `## [X.Y.Z.W] — date`; verify `GET /api/health` → `version` after deploy; add a row to the 版本历史 table). Tags are pushed by the owner.

## Conventions / 开发约定

- 租户隔离：每个查询都按 `orgId` 限定范围；引用的 ID 用 `checkRefs` 校验，并使用 `backend/src/lib/access.ts` 里的 `clientScope` / `isManager`。
  Tenant isolation: every query is scoped by `orgId`; validate referenced IDs with `checkRefs` and use `clientScope` / `isManager` from `backend/src/lib/access.ts`.
- 数据库结构变更：修改 `backend/prisma/schema.prisma`，并新增一个**幂等**迁移（`IF NOT EXISTS`、带保护的约束）。生产环境启动时由 `backend/src/release.ts` 自动执行迁移。已经上线的迁移不得修改。
  Schema changes: edit `backend/prisma/schema.prisma` and add an **idempotent** migration (`IF NOT EXISTS`, guarded constraints). Production applies migrations on start via `backend/src/release.ts`. Never edit a migration that has shipped.
- 前端请求统一走 `frontend/src/lib/api.ts`；日期输入用 `dateInputToISO` 转换。新增界面文案放进 `frontend/src/lib/i18n/extra.ts`，四种语言（en、zh-CN、zh-TW、es）都要填。
  Frontend requests go through `frontend/src/lib/api.ts`; date inputs are converted with `dateInputToISO`. New UI strings go in `frontend/src/lib/i18n/extra.ts` for all four languages (en, zh-CN, zh-TW, es).
- 功能开关：`frontend/src/lib/features.ts` + 后端环境变量。AI 助手有意保持关闭（“正在开发”），直到路线图第 4 阶段。
  Feature switches: `frontend/src/lib/features.ts` + backend env vars. The AI assistant is intentionally off ("in development") until roadmap stage 4.
- 优先做能解决经纪人 / 经纪公司具体痛点的功能，不做无谓的臃肿功能。
  Prioritize features that solve concrete user (brokerage/agent) pain points without unnecessary bloat.
- 绝不向真实用户发布假数据 / 示例数据、写死的密码或任何密钥。
  Never ship fake/sample data to real users, hard-coded passwords, or secrets.
- 本仓库是**公开**的，提交历史无法真正抹掉：不要提交密钥、连接串、密码，也不要提交含有它们的文档（包括 Word 等二进制文件）。涉及账号、密钥或未关闭风险的待办，只写在业主本机的文档里，不要写进仓库。
  This repo is **public** and its history cannot truly be erased: never commit secrets, connection strings or passwords, nor documents (including Word or other binary files) that contain them. To-dos that involve accounts, secrets or open risks belong in the owner's local documents, not in the repo.

## Lessons Learned & Operational Guardrails (from `v1.1.0.0`) / 经验教训与操作护栏

1. **四段版本号与 Prisma CLI 的 semver 限制 / 4-segment version vs Prisma CLI semver**
   Prisma 4.16.2 用严格的三段 SemVer 解析 `package.json` 的 `"version"`，四段会报 `Invalid version`。**规则**：四段版本号存在 `"appVersion"`（如 `"1.1.0.0"`），`"version"` 只保留前三段（`"1.1.0"`），后端和前端的 `package.json` 都一样；`backend/src/server.ts` 读 `pkg.appVersion || pkg.version` 作为 `/api/health` 的版本。
   Prisma 4.16.2 parses `"version"` with a strict 3-segment SemVer parser and throws `Invalid version` on 4 segments. **Rule**: keep the 4-segment version in `"appVersion"` and `"version"` as the first 3 segments, in both `package.json` files; `server.ts` reads `pkg.appVersion || pkg.version` for `/api/health`.
2. **Prisma 4 的 `Bytes` 字段 / Prisma 4 `Bytes` fields**
   `Bytes` 列（`UploadedFile.data`）必须传 Node.js `Buffer`，不能传 `Uint8Array`。
   Always pass a Node.js `Buffer` (not `Uint8Array`) for `Bytes` columns.
3. **Express 静态路由要在参数路由之前 / Express static before parameterized routes**
   `clients.ts`、`properties.ts` 里 `POST /import` 这类静态子路径必须注册在 `/:id` 之前，否则 `import` 会被当成 `:id`。
   Static sub-paths such as `POST /import` MUST be registered before `/:id` routes.
4. **检查 `backend/tests/smoke.ts` 的类型 / Type-checking `smoke.ts`**
   带文件参数运行 `tsc` 会忽略 `tsconfig.json`。**规则**：用 `npx tsc --esModuleInterop --skipLibCheck --noEmit tests/smoke.ts`。
   Passing a file to `tsc` ignores `tsconfig.json`. **Rule**: use `npx tsc --esModuleInterop --skipLibCheck --noEmit tests/smoke.ts`.
5. **混合文件存储（Cloudflare R2 + PostgreSQL 兜底）/ Hybrid file storage**
   Render 本地磁盘是临时的。配置了 `R2_*` 环境变量时 `backend/src/lib/storage.ts` 用 R2，否则退回 PostgreSQL `UploadedFile`（`bytea`），上传不会因容器重启而丢失。房源公开照片走 `/api/uploads/public/:id`；合同等私有文档走 10 分钟有效的 HMAC-SHA256 签名链接：`GET /api/documents/:id/view-url` → `/api/uploads/private/:id?token=...&exp=...`。
   Render's disk is ephemeral. `storage.ts` uses R2 when `R2_*` vars are set and falls back to PostgreSQL `UploadedFile`. Public listing photos use `/api/uploads/public/:id`; private documents use 10-minute HMAC-SHA256 signed URLs via `GET /api/documents/:id/view-url`.
6. **Cookie + CSRF 双模式认证 / Cookie + CSRF dual-mode auth**
   `authMiddleware.ts` 接受 `Authorization: Bearer` 或 `crm_session` httpOnly cookie。用 cookie 认证且没有 Bearer 头的写请求（`POST`/`PUT`/`PATCH`/`DELETE`）必须带 `X-CSRF-Protection: 1`（`frontend/src/lib/api.ts` 和 `uploadFile()` 已自动添加）。
   State-changing requests authenticated by cookie without a Bearer header MUST include `X-CSRF-Protection: 1` (added automatically by `api.ts` and `uploadFile()`).
7. **安全更新 `package-lock.json` 版本 / Updating `package-lock.json` version safely**
   不要对整个文件做 `"version"` 字符串替换（会改坏第三方依赖版本）；只改根节点的 `j.version` 和 `j.packages[""].version`。
   Never string-replace `"version"` across the whole lockfile; only update the root `j.version` and `j.packages[""].version`.
8. **Dependabot 分组与 `react` / `react-dom` 同步 / Dependabot grouping**
   `react`、`react-dom` 在 `frontend/package.json` 里是精确版本，所以 `.github/dependabot.yml` 必须把 `react`、`react-dom`、`@types/react`、`@types/react-dom` 分在同一组（`react-ecosystem`）并忽略 `version-update:semver-major`，否则单独升级 `react-dom` 会让 Vercel 的 `npm install` 报 `ERESOLVE`。
   `.github/dependabot.yml` MUST group `react`, `react-dom`, `@types/react`, `@types/react-dom` together (`react-ecosystem`) and ignore `version-update:semver-major`, or a lone `react-dom` bump breaks `npm install` on Vercel with `ERESOLVE`.
9. **唯一数据源与全站审计（零漂移）/ Single source of truth & full-site audit (zero drift)**
   - 不要重复业务数据：价格（`Core $0` / `Pro $39 月、$390 年` / `Elite $79 月、$790 年`）、套餐功能、品牌名（`Real Estate CRM`）、主题（`luxury`、`modern`、`youth`、`chinese`、`cyberpunk`）一律从 `frontend/src/lib/i18n/translations.ts` / `extra.ts` 和 `ThemeContext.tsx` 读取，不得在落地页等处另行硬编码。
     Never duplicate pricing, plan features, brand names or theme definitions; read them from `translations.ts` / `extra.ts` / `ThemeContext.tsx`.
   - 每个公开路由（`/`、`/login`、`/signup`、`/forgot-password`、`/reset-password`、`/verify-email`、`/public-listings`、`/public-listings/[id]`）和内部 `Header.tsx` 都必须在所有屏幕尺寸下显示四语言切换（`en`、`zh-CN`、`zh-TW`、`es`），不得用 `hidden sm:block` 隐藏。
     Every public route and the internal `Header.tsx` must show the 4-language switcher at all screen sizes.
   - 提交任何界面 / 品牌 / 文案改动前，先运行 `cd frontend && npm run audit:i18n`（页面覆盖率必须保持 100%），并用 `git grep` 确认没有遗留的旧品牌 / 旧价格。
     Before committing UI/branding/copy changes, run `npm run audit:i18n` (100% page coverage) and `git grep` for legacy brand/pricing drift.

## Checks before pushing / 推送前的检查

```bash
cd backend && npx tsc --skipLibCheck --noEmit
API_URL=http://localhost:4000 npm run test:smoke   # API running on a disposable DB
cd ../frontend && npm run audit:i18n && npx tsc --noEmit -p . && npx eslint . --quiet && npx next build
```

冒烟测试只能在一次性数据库上运行，绝不能指向生产库；没有一次性数据库时，如实说明“没跑”。
The smoke test may only run against a disposable database and must never be pointed at production; when no disposable database is available, say plainly that it was not run.
