# Real Estate Agency CRM

An open-source CRM built for real estate brokerages to manage clients,
listings, deals and commissions — built for, and in production use at, a real
estate brokerage in New York.

## What it does

- **Client management** — buyers, sellers, renters and investors with lead
  source, priority (hot / warm / cold), tags, a full activity timeline, and a
  "needs follow-up" view for anyone not contacted in 14 days.
- **Website lead capture** — each brokerage gets its own public listings page
  (`/public-listings?b=<slug>`, link in Settings → Org Settings). Inquiries (and
  open-house sign-ins via a QR link) become hot leads for the listing agent with
  an urgent call-back task and a notification.
- **Listings** — properties, photos, public pages, MLS-style details.
- **Offers & deals** — submit offers, accept / counter / reject. Accepting an
  offer opens the deal and creates a contract-to-close checklist.
- **Commissions** — closing a deal creates the agent's commission from the
  brokerage defaults (or a per-deal rate); agents request payouts, managers approve.
- **Appointments & tasks** — calendar, reminders 24h ahead, overdue-task tracking.
- **AI assistant** — *in development, switched off.* Listing descriptions,
  follow-ups, objection handling and more, built from your own CRM records.
  Enable with `AI_ASSISTANT_ENABLED=true` (API) and
  `NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true` (web).
- **Team & roles** — firm admins, managers, agents, office support, marketing;
  each brokerage's data is isolated from every other brokerage.
- English, 简体中文, 繁體中文 and Español.

## Live demo

https://real-estate-agency-crm.vercel.app

## Tech stack

- Frontend: Next.js 16, React 19, Tailwind — deployed on Vercel (`frontend/`)
- Backend: Express 5, Prisma, PostgreSQL — deployed on Render (`backend/`)

## Running locally

```bash
# 1. Database
cd backend
cp .env.example .env            # set DATABASE_URL and JWT_SECRET at minimum
npm install
npm run db:migrate              # applies prisma/migrations
SEED_PASSWORD='choose-one' npm run db:seed   # optional demo data

# 2. API (http://localhost:4000)
npm run dev

# 3. Web app (http://localhost:3000)
cd ../frontend
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

The seed never deletes data, refuses to run in production, and prints the demo
logins (`admin@`, `manager@`, `agent@demo.example.com`).

## Tests

With the API running against a disposable database:

```bash
cd backend
API_URL=http://localhost:4000 npm run test:smoke
```

The smoke test registers two brokerages and walks through clients, offers,
deals, commissions, lead capture and tenant isolation.

## Deploying / upgrading

1. Set the environment variables listed in `backend/.env.example` on the API
   host (and `NEXT_PUBLIC_API_URL` on the frontend).
2. In production the API brings the database up to date before it starts
   (`backend/src/release.ts`): it baselines a database created with
   `prisma db push`, retries migrations that failed earlier, and runs
   `prisma migrate deploy`. Disable with `RUN_MIGRATIONS_ON_START=false` and run
   `npm run release` by hand instead.

Every migration after the first is idempotent, so it is safe on an existing
database. See [CHANGELOG.md](CHANGELOG.md) for what changed and how to sync a
local checkout, and [guides/roadmap.md](guides/roadmap.md) for planned work.

## License

MIT — see [LICENSE](LICENSE).
