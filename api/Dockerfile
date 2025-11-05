# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install wget for health checks
RUN apk add --no-cache wget

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create data directory
RUN mkdir -p /app/data && chown -R node:node /app

# Use non-root user
USER node

# Expose port
EXPOSE 8080

# Health check
# Note: Uses environment variable $PORT (defaults to 8080)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-8080}/ || exit 1

# Start application
CMD ["node", "dist/index.js"]

