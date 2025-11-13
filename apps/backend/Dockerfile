# Development Dockerfile for Medusa
# Build context is set to root directory to access root .env file
FROM node:20-alpine

# Set working directory
WORKDIR /server

# Copy package files and yarn config
COPY package.json yarn.lock .yarnrc.yml ./

# Install all dependencies using yarn
RUN yarn install

# Copy start script first
COPY start.sh ./

# Make start.sh executable
RUN chmod +x start.sh

# Copy rest of source code from apps/backend
COPY . .

# Expose the port Medusa runs on
EXPOSE 9000

# Start with migrations and then the development server
# Environment variables will be passed from docker-compose
CMD ["sh", "/server/start.sh"]