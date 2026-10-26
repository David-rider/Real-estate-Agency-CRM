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
- Always respond to the user in **Chinese and English bilingual format (中英文双语)**.
- Prioritize features that solve concrete user (brokerage/agent) pain points without unnecessary bloat.

## Lessons Learned & Operational Guardrails (from `v1.1.0.0`)

1. **4-Segment Version (`X.Y.Z.W`) & Prisma CLI Semver Constraint**:
   - Prisma 4.16.2 (`npx prisma generate`) parses `package.json`'s `"version"` field using a strict 3-segment SemVer parser and throws `Error: Invalid version: "1.1.0.0"` if `"version"` has 4 segments.
   - **Rule**: Always store the 4-segment version in `"appVersion"` (e.g. `"appVersion": "1.1.0.0"`) and keep `"version"` as the first 3 segments (`"version": "1.1.0"`) in both `backend/package.json` and `frontend/package.json`. `backend/src/server.ts` reads `pkg.appVersion || pkg.version` for `/api/health`.
2. **Prisma 4 `Bytes` Field Type in TypeScript**:
   - Prisma 4 expects Node.js `Buffer` (not `Uint8Array`) for `Bytes` columns (`UploadedFile.data`). Always pass `Buffer` directly when creating binary records.
3. **Express Static vs. Parameterized Route Ordering**:
   - In Express routers (`clients.ts`, `properties.ts`), static sub-paths like `POST /import` MUST be registered **before** parameterized routes like `/:id`, or Express may match `"import"` as `:id`.
4. **TypeScript Checking `backend/tests/smoke.ts`**:
   - Running `npx tsc --noEmit tests/smoke.ts` with a file argument causes `tsc` to ignore `tsconfig.json` and fail on `import assert from 'node:assert/strict'`.
   - **Rule**: Always check `smoke.ts` with `npx tsc --esModuleInterop --skipLibCheck --noEmit tests/smoke.ts`.
5. **Hybrid File Storage (Cloudflare R2 + PostgreSQL `UploadedFile` Fallback)**:
   - Render's local disk is ephemeral. `backend/src/lib/storage.ts` automatically uses Cloudflare R2 when `R2_*` env vars are configured, and falls back to PostgreSQL `UploadedFile` (`bytea`) when R2 is not configured so uploads never vanish across container restarts.
   - Public listing photos use `/api/uploads/public/:id`; private contract documents use 10-minute HMAC-SHA256 signed URLs via `GET /api/documents/:id/view-url` → `/api/uploads/private/:id?token=...&exp=...`.
6. **Cookie + CSRF Dual-Mode Authentication**:
   - `authMiddleware.ts` accepts either `Authorization: Bearer <token>` OR the `crm_session` `httpOnly` cookie. When a state-changing request (`POST`/`PUT`/`PATCH`/`DELETE`) authenticates via cookie without a Bearer header, it MUST include `X-CSRF-Protection: 1` (automatically added by `frontend/src/lib/api.ts` and `uploadFile()`).
7. **Updating `package-lock.json` Version Safely**:
   - Never run string replace on `"version": "X.Y.Z"` across the entire `package-lock.json` (which would corrupt third-party dependency versions). Only update the root `j.version` and `j.packages[""].version` fields.
8. **Dependabot Grouping & Peer Dependency Lockstep (`react` / `react-dom`)**:
   - Because `react` and `react-dom` are pinned to exact versions in `frontend/package.json`, `.github/dependabot.yml` MUST group `react`, `react-dom`, `@types/react`, and `@types/react-dom` together (`react-ecosystem`) and ignore `version-update:semver-major` so Dependabot never bumps `react-dom` alone and triggers an `npm install` `ERESOLVE` failure on Vercel.

## Checks before pushing

```bash
cd backend && npx tsc --skipLibCheck --noEmit
API_URL=http://localhost:4000 npm run test:smoke   # API running on a disposable DB
cd ../frontend && npx tsc --noEmit -p . && npx next build
```
