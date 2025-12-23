# Quick Start Guide

## Current Status ✅
- ✅ Execution Service: Running (listening for order commands)
- ⏳ Backend API Gateway: Not started
- ⏳ Event Broadcasting Service: Not started  
- ⏳ Frontend: Not started

## Next Steps

### Option 1: Start All Services at Once (Recommended)

From the project root, run:
```bash
npm run dev
```

This will start all services concurrently using Turborepo.

### Option 2: Start Services Individually

Open **4 separate terminal windows**:

**Terminal 1 - Backend API Gateway:**
```bash
cd apps/backend
npm run dev
```
Should show: `API Gateway running on port 3000`

**Terminal 2 - Event Broadcasting Service:**
```bash
cd apps/event-service
npm run dev
```
Should show: `WebSocket server listening on port 3001`

**Terminal 3 - Frontend:**
```bash
cd apps/frontend
npm run dev
```
Should show: `Ready on http://localhost:3002` (or similar)

**Terminal 4 - Execution Service (Already Running):**
✅ Already running and connected to Redis

## Verify Everything is Working

1. **Check Backend**: Open http://localhost:3000/health
   - Should return: `{"status":"ok"}`

2. **Check Frontend**: Open http://localhost:3000 (or the port shown)
   - Should show the login page

3. **Register a User**:
   - Go to http://localhost:3000/register
   - Enter email, password
   - Get Binance Testnet API keys from: https://testnet.binance.vision/
   - Enter API Key and Secret Key
   - Click Register

4. **Login and Start Trading**:
   - Login with your credentials
   - You should see the trading interface
   - Select a symbol (e.g., BTCUSDT)
   - Place a test order

## Service Ports

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:3003
- **WebSocket**: ws://localhost:3002
- **Redis**: localhost:6379

## Troubleshooting

If a service fails to start:
1. Check that Redis is running: `redis-cli ping` (should return `PONG`)
2. Verify `.env` files are created in each app directory
3. Make sure Prisma clients are generated: `npx prisma generate` in backend and execution-service
4. Check the terminal output for specific error messages

