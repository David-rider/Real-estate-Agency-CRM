# Real Estate Agency CRM

An open-source CRM built for real estate brokerages to manage clients,
listings, deals and commissions — built for, and in production use at, a real
estate brokerage in New York.

## What it does

- **Client management** — buyers, sellers, renters and investors with lead
  source, priority (hot / warm / cold), tags, a full activity timeline, and a
  "needs follow-up" view for anyone not contacted in 14 days.
- **Website lead capture** — every listing gets a public page. Inquiries (and
  open-house sign-ins via a QR link) become hot leads for the listing agent with
  an urgent call-back task and a notification.
- **Listings** — properties, photos, public pages, MLS-style details.
- **Offers & deals** — submit offers, accept / counter / reject. Accepting an
  offer opens the deal and creates a contract-to-close checklist.
- **Commissions** — closing a deal creates the agent's commission from the
  brokerage defaults (or a per-deal rate); agents request payouts, managers approve.
- **Appointments & tasks** — calendar, reminders 24h ahead, overdue-task tracking.
- **AI assistant** (optional) — listing descriptions, social posts, follow-up
  messages, objection handling, seller discovery questions and listing
  presentation outlines, built from your own CRM records.
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
   host (and `NEXT_PUBLIC_API_URL` on the frontend). `ANTHROPIC_API_KEY` turns
   on the AI assistant.
2. Apply database migrations: `npm run db:migrate` (from `backend/`).

**Upgrading a database that was created with `prisma db push`** (no migration
history): mark the first migration as already applied once, then migrate.
Every later migration is written to be safe on an existing database.

```bash
npx prisma migrate resolve --applied 20260303200258_init_multi_tenant
npx prisma migrate deploy
```

## License

MIT — see [LICENSE](LICENSE).
