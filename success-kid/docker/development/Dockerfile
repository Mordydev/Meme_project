FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies
RUN apk add --no-cache bash git curl

# Install pnpm globally
RUN npm install -g pnpm@9

# Copy package.json and workspace configuration
COPY package.json pnpm-workspace.yaml ./

# Copy package.json from apps and packages
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3001

# Command to run the application
CMD ["pnpm", "--filter", "@success-kid/backend", "dev"]
