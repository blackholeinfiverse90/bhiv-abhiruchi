# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package specifications
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production --ignore-scripts || npm install --omit=dev --ignore-scripts

# Copy application source code
COPY . .

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Install dumb-init for proper PID 1 signal forwarding and curl for health checks
RUN apk add --no-cache dumb-init curl

# Create unprivileged system user for secure execution
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy application from builder stage with appropriate permissions
COPY --from=builder --chown=nodejs:nodejs /app /app

# Switch to non-root user
USER nodejs

# Expose backend API port
EXPOSE 5000

# Container healthcheck testing /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Process management entrypoint
ENTRYPOINT ["dumb-init", "--"]

# Start Express server
CMD ["node", "server.js"]
