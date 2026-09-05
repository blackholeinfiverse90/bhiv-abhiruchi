# Stage 1: Build Frontend Assets
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package specifications
COPY package*.json ./

# Install all dependencies (including devDependencies for Vite & Tailwind)
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build Arguments for Vite Environment Variables
ARG VITE_API_BASE_URL
ARG VITE_GROK_API_KEY

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GROK_API_KEY=$VITE_GROK_API_KEY

# Build static production bundle
RUN npm run build

# Stage 2: Production Static File Server
FROM node:22-alpine AS runner

WORKDIR /app

# Install curl for healthcheck and lightweight static file server
RUN apk add --no-cache curl && \
    npm install -g serve

# Copy compiled dist from builder
COPY --from=builder /app/dist ./dist

# Create unprivileged system user
RUN addgroup -g 1001 -S frontend && \
    adduser -S frontend -u 1001 && \
    chown -R frontend:frontend /app

# Switch to non-root user
USER frontend

# Expose frontend port
EXPOSE 5173

# Healthcheck testing frontend availability
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5173/ || exit 1

# Serve SPA on port 5173 with client-side routing fallback (-s)
CMD ["serve", "-s", "dist", "-l", "5173"]
