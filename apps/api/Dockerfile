# Build context is the REPO ROOT, not apps/api — the API depends on the
# @vora/shared workspace package, so the whole pnpm workspace has to come along.
#   docker build -f apps/api/Dockerfile -t vora-api .
# On Railway: set the service root to the repo root and point it at this file.
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS build
WORKDIR /repo
# Manifests first, so a dependency install is only redone when they change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
# --ignore-scripts because @vora/shared's `prepare` compiles TypeScript that
# hasn't been copied yet at this layer. The api build's own prebuild step runs
# both that compile and `prisma generate` once the sources are in place.
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @vora/api build
# Drop dev dependencies from what gets copied into the runtime image.
RUN pnpm --filter @vora/api --prod deploy /app-api
# `deploy` builds a fresh node_modules from the store, which does not carry the
# client generated during the build — without this the image starts, migrates,
# then dies importing an empty @prisma/client.
RUN cd /app-api && ./node_modules/.bin/prisma generate

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app-api ./
# Invoked directly rather than through pnpm: a runtime that shells out to a
# package manager fetches pnpm and the Prisma CLI from the registry on every
# cold start, which is exactly what a deploy must not depend on. The Prisma CLI
# ships as a runtime dependency for the same reason.
# Migrating here means a deploy carries its own schema changes.
EXPOSE 4000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node dist/src/main"]
