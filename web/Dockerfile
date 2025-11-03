# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 5173

# Run the preview server
CMD ["npm", "run", "serve", "--", "--host", "0.0.0.0", "--port", "5173"]


