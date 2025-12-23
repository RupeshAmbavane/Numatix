FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/shared/types/package*.json ./packages/shared/types/

RUN npm install

COPY apps/frontend ./apps/frontend
COPY packages ./packages

EXPOSE 3003

WORKDIR /app/apps/frontend
CMD ["npm", "run", "dev"]
