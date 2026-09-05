# ============================================================================
# UnMoGrowP Attribution Platform - Attribution Engine Dockerfile
# Multi-stage build for production-ready Go application
# ============================================================================

# Build stage
FROM golang:1.25-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -o attribution-engine \
    ./services/attribution/engine.go

# Runtime stage
FROM alpine:3.18

# Install runtime dependencies
RUN apk --no-cache add ca-certificates curl

# Create non-root user
RUN adduser -D -s /bin/sh attribution

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/attribution-engine .

# Create logs directory
RUN mkdir -p logs && chown -R attribution:attribution /app

# Switch to non-root user
USER attribution

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8082/health || exit 1

# Set default command
CMD ["./attribution-engine"]