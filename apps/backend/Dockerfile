FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared/types/package*.json ./packages/shared/types/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start backend
CMD ["npm", "run", "dev"]
