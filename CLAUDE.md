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
5. 发版按 `guides/release-process.md` 走（语义化版本；两个 `package.json` 的版本号都要升；把 [未发布] 移到 `## [X.Y.Z] — date`；部署后核对 `GET /api/health` 返回的 `version`；在“版本历史”表里加一行）。标签由业主推送。
   Releases follow `guides/release-process.md` (semver; bump both package.json versions; move [未发布] to `## [X.Y.Z] — date`; verify `GET /api/health` → `version` after deploy; add a row to the 版本历史 table). Tags are pushed by the owner.

## Conventions / 开发约定

- 租户隔离：每个查询都按 `orgId` 限定范围；引用的 ID 用 `checkRefs` 校验，并使用 `backend/src/lib/access.ts` 里的 `clientScope` / `isManager`。
  Tenant isolation: every query is scoped by `orgId`; validate referenced IDs with `checkRefs` and use `clientScope` / `isManager` from `backend/src/lib/access.ts`.
- 数据库结构变更：修改 `backend/prisma/schema.prisma`，并新增一个**幂等**迁移（`IF NOT EXISTS`、带保护的约束）。生产环境启动时由 `backend/src/release.ts` 自动执行迁移。已经上线的迁移不得修改。
  Schema changes: edit `backend/prisma/schema.prisma` and add an **idempotent** migration (`IF NOT EXISTS`, guarded constraints). Production applies migrations on start via `backend/src/release.ts`. Never edit a migration that has shipped.
- 前端请求统一走 `frontend/src/lib/api.ts`；日期输入用 `dateInputToISO` 转换。新增界面文案放进 `frontend/src/lib/i18n/extra.ts`，四种语言（en、zh-CN、zh-TW、es）都要填。
  Frontend requests go through `frontend/src/lib/api.ts`; date inputs are converted with `dateInputToISO`. New UI strings go in `frontend/src/lib/i18n/extra.ts` for all four languages (en, zh-CN, zh-TW, es).
- 功能开关：`frontend/src/lib/features.ts` + 后端环境变量。AI 助手有意保持关闭（“正在开发”），直到路线图第 4 阶段。
  Feature switches: `frontend/src/lib/features.ts` + backend env vars. The AI assistant is intentionally off ("in development") until roadmap stage 4.
- 绝不向真实用户发布假数据 / 示例数据、写死的密码或任何密钥。
  Never ship fake/sample data to real users, hard-coded passwords, or secrets.
- 本仓库是**公开**的，提交历史无法真正抹掉：不要提交密钥、连接串、密码，也不要提交含有它们的文档（包括 Word 等二进制文件）。涉及账号、密钥或未关闭风险的待办，只写在业主本机的文档里，不要写进仓库。
  This repo is **public** and its history cannot truly be erased: never commit secrets, connection strings or passwords, nor documents (including Word or other binary files) that contain them. To-dos that involve accounts, secrets or open risks belong in the owner's local documents, not in the repo.

## Checks before pushing / 推送前的检查

```bash
cd backend && npx tsc --skipLibCheck --noEmit
API_URL=http://localhost:4000 npm run test:smoke   # API running on a disposable DB
cd ../frontend && npx tsc --noEmit -p . && npx next build
```

冒烟测试只能在一次性数据库上运行，绝不能指向生产库；没有一次性数据库时，如实说明“没跑”。
The smoke test may only run against a disposable database and must never be pointed at production; when no disposable database is available, say plainly that it was not run.
