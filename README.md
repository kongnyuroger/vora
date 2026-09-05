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

## Database (needed from Branch 1 onward)

```bash
docker compose up -d          # starts Postgres + PostGIS on :5432
cd apps/api
pnpm prisma:migrate           # creates tables from prisma/schema.prisma
pnpm prisma:seed              # seeds price book + landmarks
```

The API boots and serves `/health` without a database connection — Prisma connects lazily on first query.
