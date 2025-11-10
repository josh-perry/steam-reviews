FROM node:18-alpine AS builder

WORKDIR /app

# Install tar and xz utilities for archive extraction
RUN apk add --no-cache tar xz

COPY package*.json ./

# Install all dependencies (dev + prod) for building
RUN npm install && npm cache clean --force

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Install tar and xz utilities for archive extraction
RUN apk add --no-cache tar xz

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app

EXPOSE 5000

# Run as node user
USER node

CMD ["npm", "start"]