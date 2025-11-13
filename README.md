# E-commerce Template

A modern e-commerce monorepo powered by Medusa.js backend, and Next.js frontend with docker deployment

## Links
- Medusa documentation [docs.medusajs.com](https://docs.medusajs.com/)
- Backend setup: [docs.medusajs.com/learn/installation/docker](https://docs.medusajs.com/learn/installation/docker)
- Repository base setup: [https://www.better-t-stack.dev/new](https://www.better-t-stack.dev/new)

## Tech Stack
- **Monorepo**: Turborepo
- **Backend**: Medusa.js 2.11.3
- **Frontend**: Next.js
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Package Manager**: npm
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites
- Node.js >= 20
- Docker & Docker Compose
- npm >= 11.2.0

### Development

Start the entire stack with Docker:
```bash
npm run docker:up
```

This will:
- Spin up PostgreSQL database
- Spin up Redis cache
- Build and start the Medusa backend
- Run database migrations
- Seed the database with sample data
- Start the Medusa development server on port 9000
- Build and start the Next.js frontend on port 3001

Stop the Docker containers:
```bash
npm run docker:down
```

## Project Structure

```
ecommerce-template/
├── apps/
│   ├── backend/          # Medusa.js backend
│   └── web/              # Next.js frontend
├── docker-compose.yml    # Docker orchestration
├── turbo.json           # Turborepo configuration
└── package.json         # Root package with scripts
```

## Services

- **Frontend (Next.js)**: http://localhost:3001
- **Backend (Medusa)**: http://localhost:9000
- **Admin Dashboard**: http://localhost:9000/app
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## Initial Setup (For Reference)

1 - Create the base monorepo:

```bash
npx create-better-t-stack@latest ecommerce-template --frontend next --backend none --runtime none --api none --auth none --payments none --database none --orm none --db-setup none --package-manager npm --no-git --web-deploy none --server-deploy none --install --addons turborepo --examples none
```

2 - Navigate to apps directory:
```bash
cd apps
```

3 - Clone Medusa starter as backend:
```bash
git clone https://github.com/medusajs/medusa-starter-default.git --depth=1 backend
```

4 - Create `docker-compose.yml` in the root:

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: medusa_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: medusa-store
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - medusa_network

  # Redis
  redis:
    image: redis:7-alpine
    container_name: medusa_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - medusa_network

  # Medusa Server
  # This service runs the Medusa backend application
  # and the admin dashboard.
  medusa:
    build: ./apps/backend
    container_name: medusa_backend
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    ports:
      - "9000:9000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/medusa-store
      - REDIS_URL=redis://redis:6379
    env_file:
      - .env
    volumes:
      - ./apps/backend:/server
      - /server/node_modules
    networks:
      - medusa_network

volumes:
  postgres_data:

networks:
  medusa_network:
    driver: bridge

5 - Create `start.sh` in the backend:

```bash
#!/bin/sh

# Run migrations and start server
echo "Running database migrations..."
npx medusa db:migrate

echo "Seeding database..."
yarn seed || echo "Seeding failed, continuing..."

echo "Starting Medusa development server..."
yarn dev
```

6 - Create the `Dockerfile` for the backend:

```dockerfile
# Development Dockerfile for Medusa
FROM node:20-alpine

# Set working directory
WORKDIR /server

# Copy package files and yarn config
COPY package.json yarn.lock .yarnrc.yml ./

# Install all dependencies using yarn
RUN yarn install

# Copy source code
COPY . .

# Make start.sh executable
RUN chmod +x start.sh

# Expose the port Medusa runs on
EXPOSE 9000

# Start with migrations and then the development server
CMD ["sh", "./start.sh"]
```

7 - Inside the backend folder, install dependencies:
```bash
npm install --legacy-peer-deps
```

8 - In `medusa-config.ts` inside the `projectConfig` block, add:

```typescript
databaseDriverOptions: {
  ssl: false,
  sslmode: "disable",
},
```

9 - Create `.dockerignore` in the backend folder:

```
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.git
.gitignore
README.md
.env.test
.nyc_output
coverage
.DS_Store
*.log
dist
build
```

10 - Copy `.env.template` from the backend and paste it in the root as `.env`

11 - Create `Dockerfile` in the web folder:

```dockerfile
# Multi-stage Dockerfile for Next.js production build

# Stage 1: Dependencies
FROM node:20-alpine AS deps

# Install libc6-compat for compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p public

# Set environment variable for Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner

WORKDIR /app

# Set to production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose the port Next.js runs on
EXPOSE 3001

# Set environment variable for port
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Start the Next.js application
CMD ["node", "server.js"]
```

12 - Create `.dockerignore` in the web folder:

```
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Next.js build output
.next
out
dist
build

# Testing
coverage
.nyc_output

# Environment files
.env
.env*.local
.env.development
.env.test
.env.production

# IDE and editor files
.vscode
.idea
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Git
.git
.gitignore
.gitattributes

# Documentation
README.md
*.md

# Misc
.cache
.turbo
*.log
```

13 - Update `next.config.ts` to enable standalone output:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  output: "standalone",
};

export default nextConfig;
```

14 - Update `docker-compose.yml` to include the web service:

```yaml
# Add this service after the medusa service
web:
  build: ./apps/web
  container_name: nextjs_web
  restart: unless-stopped
  depends_on:
    - medusa
  ports:
    - "3001:3001"
  environment:
    - NODE_ENV=production
    - NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://medusa:9000
  env_file:
    - .env
  networks:
    - medusa_network
```

15 - Start the development environment:
```bash
npm run docker:up
```

15 - Create Admin User:
```bash
docker compose run --rm medusa npx medusa user -e admin@example.com -p supersecret
```
Make sure to replace admin@example.com and supersecret with your desired email and password.

You can now log in to the Medusa Admin dashboard at http://localhost:9000/app using the email and password you just created.