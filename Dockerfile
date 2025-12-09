# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
