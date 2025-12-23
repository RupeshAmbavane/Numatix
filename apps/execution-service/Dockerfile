FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/execution-service/package*.json ./apps/execution-service/
COPY packages/shared/types/package*.json ./packages/shared/types/

RUN npm install

COPY apps/execution-service ./apps/execution-service
COPY apps/backend/prisma ./apps/backend/prisma
COPY packages ./packages

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

WORKDIR /app/apps/execution-service
CMD ["npm", "run", "dev"]
