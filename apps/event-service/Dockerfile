FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/event-service/package*.json ./apps/event-service/
COPY packages/shared/types/package*.json ./packages/shared/types/

RUN npm install

COPY apps/event-service ./apps/event-service
COPY packages ./packages

EXPOSE 3002

WORKDIR /app/apps/event-service
CMD ["npm", "run", "dev"]
