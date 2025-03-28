# Backend Dockerfile for Success Kid Community Platform
FROM node:22-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install PNPM
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/utils/package.json ./packages/utils/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY . .

# Run the build script
RUN pnpm --filter=backend build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Set ownership and permissions
COPY --from=builder --chown=fastify:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/apps/backend/package.json ./package.json

# Install production dependencies only
COPY --from=builder /app/node_modules ./node_modules

# Switch to non-root user
USER fastify

EXPOSE 3001

ENV PORT 3001

# Start the server
CMD ["node", "dist/index.js"]
