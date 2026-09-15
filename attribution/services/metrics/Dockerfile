# Customer Success Tracker Service Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git ca-certificates

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the service
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o customer-success-tracker customer-success-tracker.go

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/customer-success-tracker .

# Create volume for customer data
VOLUME ["/root/pilot-customers"]

# Expose API port
EXPOSE 8084

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8084/health || exit 1

CMD ["./customer-success-tracker"]
