# Scriptum — Production Docker Image
FROM node:20-alpine AS base

# Install system deps for Puppeteer + sharp
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libc6-compat

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# ──────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* .npmrc* ./
# Skip postinstall (prisma generate) — schema not present yet; runs in builder
RUN npm ci --legacy-peer-deps --ignore-scripts

# ──────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use the PostgreSQL schema for production builds
RUN cp prisma/schema.postgresql.prisma prisma/schema.prisma

# Generate Prisma client (skipped in deps stage, run here with schema present)
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ──────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Uploads directory
RUN mkdir -p /app/public/uploads/covers && chown -R nextjs:nodejs /app/public

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# Copy full node_modules so `prisma db push` has all transitive deps at runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3010

ENV PORT=3010
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
