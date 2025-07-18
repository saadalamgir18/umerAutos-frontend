# # # Stage 1: Install dependencies
# # FROM node:20-alpine AS deps
# # WORKDIR /app
# # COPY package.json package-lock.json* ./
# # # Use --legacy-peer-deps to bypass peer dependency conflicts
# # RUN npm ci --omit=dev --prefer-offline --no-audit --legacy-peer-deps

# # # Stage 2: Build application
# # FROM node:20-alpine AS builder
# # WORKDIR /app
# # COPY --from=deps /app/node_modules ./node_modules
# # COPY . .
# # # Add --legacy-peer-deps to build command if needed
# # RUN npm run build

# # # Stage 3: Production image
# # FROM node:20-alpine AS runner
# # WORKDIR /app
# # RUN apk add --no-cache curl
# # COPY --from=deps /app/node_modules ./node_modules
# # COPY --from=builder /app/.next ./.next
# # COPY --from=builder /app/public ./public
# # COPY --from=builder /app/package.json ./package.json

# # ENV NODE_ENV=production
# # ENV PORT=3000
# # EXPOSE 3000

# # HEALTHCHECK --interval=30s --timeout=3s \
# #   CMD curl -f http://localhost:3000 || exit 1

# # CMD ["npm", "run", "start"]

# # Use Node.js 22 Alpine image (or closest available)
# FROM node:22-alpine

# # Set working directory
# WORKDIR /app

# # Copy standalone build output
# COPY .next/standalone/ ./
# COPY .next/static ./.next/static
# COPY public ./public

# # Set environment to production
# # ENV NODE_ENV=production

# # Expose the port your app runs on
# EXPOSE 3000

# # Start the Next.js server (already bundled in standalone)
# CMD ["node", "server.js"]

# syntax=docker.io/docker/dockerfile:1

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]