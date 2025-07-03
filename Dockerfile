# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Use --legacy-peer-deps to bypass peer dependency conflicts
RUN npm ci --omit=dev --prefer-offline --no-audit --legacy-peer-deps

# Stage 2: Build application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Add --legacy-peer-deps to build command if needed
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["npm", "run", "start"]