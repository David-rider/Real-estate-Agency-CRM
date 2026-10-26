# Project notes for Claude

Real estate brokerage CRM. `backend/` = Express 5 + Prisma + PostgreSQL (Render),
`frontend/` = Next.js 16 + React 19 + Tailwind (Vercel). The owner communicates in
Chinese; project records (CHANGELOG, guides) are written in Chinese, code and
comments in English.

## Records to keep up to date — on every change

1. `CHANGELOG.md` → add a short entry under **[未发布]** (新增 / 修复 / 安全 / 变更 / 移除),
   describing what users notice, not implementation detail.
2. `guides/roadmap.md` → update the 进度跟踪 table when a roadmap item starts or finishes.
3. New env vars → `backend/.env.example` / `frontend/.env.example`, `render.yaml`,
   and the 环境变量 table in `CHANGELOG.md`.
4. Customer-visible features → `guides/testing-checklist.md`.
5. Releases follow `guides/release-process.md` (4-segment version `X.Y.Z.W`, e.g. `1.0.1.0`; bump both package.json
   versions; move [未发布] to `## [X.Y.Z.W] — date`; verify `GET /api/health` → `version`
   after deploy; add a row to the 版本历史 table). Tags are pushed by the owner.

## Conventions

- Tenant isolation: every query is scoped by `orgId`; validate referenced IDs with
  `checkRefs` and use `clientScope` / `isManager` from `backend/src/lib/access.ts`.
- Schema changes: edit `backend/prisma/schema.prisma` and add an **idempotent**
  migration (`IF NOT EXISTS`, guarded constraints). Production applies migrations on
  start via `backend/src/release.ts`. Never edit a migration that has shipped.
- Frontend requests go through `frontend/src/lib/api.ts`; date inputs are converted
  with `dateInputToISO`. New UI strings go in `frontend/src/lib/i18n/extra.ts`
  for all four languages (en, zh-CN, zh-TW, es).
- Feature switches: `frontend/src/lib/features.ts` + backend env vars. The AI
  assistant is intentionally off ("in development") until roadmap stage 4.
- Never ship fake/sample data to real users, hard-coded passwords, or secrets.

## Checks before pushing

```bash
cd backend && npx tsc --skipLibCheck --noEmit
API_URL=http://localhost:4000 npm run test:smoke   # API running on a disposable DB
cd ../frontend && npx tsc --noEmit -p . && npx next build
```
