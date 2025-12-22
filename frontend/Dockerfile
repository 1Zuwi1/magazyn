# syntax=docker.io/docker/dockerfile:1
FROM node:current-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- Prune the monorepo down to just the target app + deps
FROM base AS pruner
ARG APP_SCOPE=web

# Install Turbo CLI (match the major from your repo if possible, else fallback)
COPY package.json package-lock.json* ./
RUN set -eu; \
  TURBO_MAJOR="$(node -e "const p=require('./package.json'); const v=(p.devDependencies&&p.devDependencies.turbo)||(p.dependencies&&p.dependencies.turbo)||''; const m=String(v).match(/(\\d+)/); process.stdout.write(m?m[1]:'');")"; \
  if [ -n "$TURBO_MAJOR" ]; then npm i -g "turbo@^${TURBO_MAJOR}"; else npm i -g turbo; fi

# Full repo is needed for prune to figure out the graph
COPY . .
RUN turbo prune "${APP_SCOPE}" --docker

# --- Install deps + build the pruned repo
FROM base AS builder
ARG APP_SCOPE=web

# Copy pruned package.json files (better Docker layer caching)
COPY --from=pruner /app/out/json/ ./
# Copy the pruned lockfile (with --docker it lives at out root)
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# IMPORTANT: don't set NODE_ENV=production here or npm will skip dev deps needed to build
RUN npm ci

# Copy the rest of the pruned source and build
COPY --from=pruner /app/out/full/ ./
RUN npx turbo build

# --- Runtime image
FROM base AS runner
ARG APP_PATH=apps/web

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
  && adduser  --system --uid 1001 nextjs

# Next.js standalone output (monorepo path)
COPY --from=builder --chown=nextjs:nodejs /app/${APP_PATH}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/${APP_PATH}/.next/static ./${APP_PATH}/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/${APP_PATH}/public ./${APP_PATH}/public

USER nextjs
EXPOSE 3001

# In a monorepo, server.js ends up under apps/web/
CMD ["node", "apps/web/server.js"]
