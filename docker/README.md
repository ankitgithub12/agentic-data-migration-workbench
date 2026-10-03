# Docker Deployment Guide for Migration Workbench

This folder contains container deployment configurations for the **Agentic Data Migration Planner and Reconciliation Workbench**.

## Files
- `Dockerfile`: Multi-stage production container build (Vite frontend build + Node.js server + static SPA serving).
- `docker-compose.yml`: Multi-service orchestration for the application and MongoDB 7.0.
- `.dockerignore`: Exclusion rules for build context security and image size optimization.

## Usage

### Option 1: Run with Docker Compose (From Repository Root)
```bash
# Build and start services
docker compose -f docker/docker-compose.yml up -d --build

# View application logs
docker compose -f docker/docker-compose.yml logs -f app

# Stop all services
docker compose -f docker/docker-compose.yml down
```

### Option 2: Run with Docker Compose (From inside `docker/` folder)
```bash
cd docker
docker compose up -d --build
```

### Option 3: Build Standalone Docker Image
```bash
# From project root:
docker build -f docker/Dockerfile -t migration-workbench:latest .

# Run the container:
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.wje2jpa.mongodb.net" \
  -e LLM_PROVIDER="openrouter" \
  -e LLM_API_KEY="your-api-key" \
  -e LLM_MODEL="openrouter/free" \
  migration-workbench:latest
```
