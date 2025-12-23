# Setup Guide

## Quick Start

### 1. Generate Encryption Key

First, generate a 32-byte hex key for encrypting Binance API keys:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save this key - you'll need it for both `backend` and `execution-service` `.env` files.

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

```bash
# Generate Prisma clients for both services
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate

cd ../execution-service
npx prisma generate

cd ../..
```

**Note**: The execution-service uses the same database schema as the backend, so you only need to run migrations once in the backend directory.

### 4. Configure Environment Variables

Create `.env` files in each app directory with the encryption key from step 1.

### 5. Start Redis

Make sure Redis is running:

```bash
# Local Redis
redis-server

# Or use Redis Cloud and update REDIS_URL in .env files
```

### 6. Start All Services

```bash
npm run dev
```

This will start all services concurrently using Turborepo.

### 7. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3000
- WebSocket: ws://localhost:3001

## Getting Binance Testnet API Keys

1. Go to https://testnet.binance.vision/
2. Create an account or login
3. Go to API Management
4. Create a new API key
5. Copy the API Key and Secret Key
6. Use these when registering in the application

## Troubleshooting

### Database Issues

If you get database errors, make sure:
- SQLite database file exists (created by Prisma migrate)
- DATABASE_URL points to the correct path
- Prisma client is generated (`npx prisma generate`)

### Redis Connection Issues

- Check Redis is running: `redis-cli ping` should return `PONG`
- Verify REDIS_URL in `.env` files
- For Redis Cloud, use the full connection string

### WebSocket Connection Issues

- Make sure event-service is running on port 3001
- Check JWT token is valid
- Verify NEXT_PUBLIC_WS_URL in frontend `.env.local`

### Order Execution Issues

- Verify Binance Testnet API keys are correct
- Check execution-service logs for Binance API errors
- Ensure ENCRYPTION_KEY matches between backend and execution-service

