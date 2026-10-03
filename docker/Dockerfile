# ========================================================
# Multi-Stage Production Dockerfile for Migration Workbench
# Stage 1: Build the React 18 Frontend
# Stage 2: Production Node.js Server & Static SPA Serving
# ========================================================

# --- Stage 1: Build Frontend Client ---
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Install frontend dependencies
COPY client/package*.json ./
RUN npm ci

# Copy client source code and build production bundle
COPY client/ ./
RUN npm run build

# --- Stage 2: Production Server ---
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install server dependencies (omitting devDependencies)
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server application source
COPY server/src ./src
COPY server/vitest.config.js ./

# Copy built frontend assets into server public directory
COPY --from=client-builder /app/client/dist /app/server/public

# Run as non-root user for enterprise container security
USER node

# Expose backend & frontend unified port
EXPOSE 5000

# Container healthcheck against /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Launch the Migration Workbench server
CMD ["node", "src/app.js"]
