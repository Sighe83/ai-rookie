# Use Node.js 20 LTS Alpine for smaller image size
FROM node:20-alpine

# Install OpenSSL and curl for Prisma and health checks
RUN apk add --no-cache openssl curl

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files from backend directory
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code from backend directory
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port (Cloud Run uses PORT env var, default to 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Start application
CMD ["npm", "start"]