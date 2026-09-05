# ============================================================================
# UnMoGrowP Attribution Platform - TypeScript API Gateway Dockerfile
# Multi-stage build for production-ready Bun application
# ============================================================================

# Build stage
FROM oven/bun:1.1-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    ca-certificates \
    curl

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Build the application (if needed)
RUN bun run build || true

# Runtime stage
FROM oven/bun:1.1-alpine

# Install runtime dependencies
RUN apk --no-cache add \
    ca-certificates \
    curl \
    dumb-init

# Create non-root user
RUN adduser -D -s /bin/sh attribution

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/index.ts ./
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/modules ./modules

# Create logs directory
RUN mkdir -p logs && chown -R attribution:attribution /app

# Switch to non-root user
USER attribution

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Set default command
CMD ["bun", "run", "index.ts"]