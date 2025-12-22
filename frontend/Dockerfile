# syntax=docker.io/docker/dockerfile:1

FROM node:current-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- 1) Prune monorepo to only the target app + its deps
FROM base AS pruner
ARG APP_SCOPE=web

# Install turbo (prefer the version declared in the repo)
COPY package.json package-lock.json* ./
RUN set -eu; \
  TURBO_MAJOR="$(node -e "const p=require('./package.json'); const v=(p.devDependencies&&p.devDependencies.turbo)||(p.dependencies&&p.dependencies.turbo)||''; const m=String(v).match(/(\\d+)/); process.stdout.write(m?m[1]:'');")"; \
  if [ -n "$TURBO_MAJOR" ]; then npm i -g "turbo@^${TURBO_MAJOR}"; else npm i -g turbo; fi

# turbo prune needs the full repo to compute the dependency graph
COPY . .
RUN turbo prune "${APP_SCOPE}" --docker

# --- 2) Install deps + build inside the pruned output
FROM base AS builder
ARG APP_SCOPE=web

# Copy pruned manifests first for caching
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Don't set NODE_ENV=production here or npm will skip dev deps needed for build
RUN npm ci

# Copy the actual (pruned) source and build
COPY --from=pruner /app/out/full/ ./
RUN npx turbo build --filter="${APP_SCOPE}"

# --- 3) Runtime image (Next standalone)
FROM base AS runner
ARG APP_PATH=apps/web

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
  && adduser  --system --uid 1001 nextjs

# Your app-specific writable dirs (keep if your app writes to them at runtime)

# Public + standalone output + static assets
COPY --from=builder --chown=nextjs:nodejs /app/${APP_PATH}/public ./${APP_PATH}/public
COPY --from=builder --chown=nextjs:nodejs /app/${APP_PATH}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/${APP_PATH}/.next/static ./${APP_PATH}/.next/static

USER nextjs
EXPOSE 3001

# In monorepos, server.js usually lives under the app path in standalone output
CMD ["node", "apps/web/server.js"]
