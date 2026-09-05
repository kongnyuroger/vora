# VORA — NuxCine 2026

Full build plan, data model, and design system: @docs/VORA-BUILD.md

## Rules for every task
- Follow the Prisma data model in §6 and the design system in §7 exactly.
- Build ONE branch at a time (see §8). Stop at each checkpoint and tell me how to test.
- Never start a SHOULD feature until every MUST is demoable.
- Stack: Next.js 15 PWA + NestJS + Prisma + Postgres/PostGIS + Mapbox + Socket.IO.