# VORA — NuxCine 2026

Safety-first, moto-inclusive, landmark-aware mobility app for Cameroon. Full brief: [`docs/VORA-BUILD.md`](docs/VORA-BUILD.md).

## Repo layout

```
apps/
  web/        # Next.js 15 PWA (rider + driver modes)
  api/        # NestJS + Prisma backend
packages/
  shared/     # shared TS enums/types/pricing used by both apps
```

## Prerequisites

- Node.js 20+
- pnpm 9 (`corepack enable` or `npm i -g pnpm`)
- Docker (optional for now — only needed once you run Prisma migrations against Postgres/PostGIS)

## Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

## Run

```bash
pnpm dev:web   # http://localhost:3000
pnpm dev:api   # http://localhost:4000
```

## Database

Any Postgres with PostGIS works. The deployed build uses [Neon](https://neon.tech); `docker compose up -d` starts a local one on `:5436` instead.

`apps/api/.env` needs two URLs when the database is behind a connection pooler:

- `DATABASE_URL` — the pooled host (Neon's `-pooler`), what the app runs on.
- `DIRECT_URL` — the same host without `-pooler`. Migrations take advisory locks a pooler cannot hold.

On a fresh database, enable PostGIS once, then migrate and seed:

```bash
psql "$DIRECT_URL" -c 'CREATE EXTENSION IF NOT EXISTS postgis;'
cd apps/api
pnpm prisma:migrate           # or `pnpm deploy:migrate` against a deployed DB
pnpm prisma:seed              # landmarks via Nominatim + 6 demo drivers
```

The API boots and serves `/health` without a database connection — Prisma connects lazily on first query. A Neon instance that has scaled to zero can drop the first connection while it wakes; retry once.

## Deploying

Deploy the API first: the web build needs its URL, and the API only needs the web URL afterwards for CORS.

**API — Render** (or any container host). [`render.yaml`](render.yaml) is a blueprint: in the dashboard, **New → Blueprint**, point it at this repo, and fill in the secrets it prompts for. The build context is the repo root, because the API depends on the `@vora/shared` workspace package:

```bash
docker build -f apps/api/Dockerfile -t vora-api .   # to reproduce locally
```

The container runs `prisma migrate deploy` before starting, so a deploy carries its own schema changes. Environment: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `MAPBOX_SECRET`, `CORS_ORIGINS` (the deployed web URL), optionally `CAMPAY_API_KEY` / `CAMPAY_API_SECRET`.

**Web — Vercel.** Set the project's root directory to `apps/web`; pnpm workspaces resolve from the repo root, and the build runs the i18n key check first. Environment: `NEXT_PUBLIC_API_URL` (the deployed API URL) and `NEXT_PUBLIC_MAPBOX_TOKEN`.

Then set `CORS_ORIGINS` on the API to the Vercel URL and redeploy.

> **Free tiers sleep.** Render spins a free service down after ~15 minutes idle and takes up to a minute to wake; Neon scales to zero and can drop the first connection. Open the app a few minutes before you present, and load a page once more just before.

## Demo

The rehearsed jury run-through, including what to have open beforehand: [`docs/DEMO.md`](docs/DEMO.md).
