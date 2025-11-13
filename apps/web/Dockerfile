# Development Dockerfile for Next.js with Yarn
# Build context is set to root directory to access root .env file
FROM node:20-alpine

# Install libc6-compat for compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Enable Corepack for Yarn 4
RUN corepack enable

# Copy package files from apps/web directory
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies using Yarn
# Yarn will automatically download and set up everything it needs
RUN yarn install

# Copy application code from apps/web directory
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p public

# Set environment variables for Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Expose the port Next.js runs on (8000 as per package.json)
EXPOSE 8000

# Set environment variable for port
ENV PORT=8000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js development server
# Environment variables will be passed from docker-compose
CMD ["yarn", "dev"]
