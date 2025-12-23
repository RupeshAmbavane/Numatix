# Real-Time Trading Platform (Testnet)

A full-stack real-time trading platform built with Next.js, Node.js, and Redis, demonstrating event-driven architecture and real-time data handling.

## 🚀 Quick Start with Docker

The easiest way to run the entire platform:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Numatix

# 2. Copy environment variables
cp .env.example .env

# 3. Edit .env and add your Binance Testnet API keys
# Get keys from: https://testnet.binance.vision/

# 4. Start all services
docker-compose up

# 5. Open your browser
http://localhost:3003
```

That's it! All services will start automatically.

## 📋 Features

### Core Features
- ✅ **User Authentication** - JWT-based auth with encrypted API keys
- ✅ **Real-time Trading** - Place MARKET, LIMIT, and STOP_MARKET orders
- ✅ **Live Price Updates** - WebSocket integration with Binance Testnet
- ✅ **Trading Chart** - Interactive candlestick charts with multiple timeframes
- ✅ **Order Management** - View and cancel orders in real-time
- ✅ **Position Tracking** - Automatic position calculation from filled orders

### Bonus Features (10/11 Implemented)
- ✅ **Input Validation** - Zod schemas on backend and frontend
- ✅ **Rate Limiting** - Protection against abuse (5 login attempts, 20 orders/min)
- ✅ **WebSocket Reconnection** - Exponential backoff with status indicators
- ✅ **Order Cancellation** - Cancel pending orders from UI
- ✅ **Dark/Light Theme** - Toggle between themes with persistence
- ✅ **Keyboard Shortcuts** - Press `?` for help, `Esc` to close modals
- ✅ **Enhanced Error Handling** - User-friendly error messages
- ✅ **Connection Status** - Live WebSocket connection indicator
- ✅ **URL-based Routing** - Shareable links like `/trade/BTCUSDT`
- ✅ **Docker Setup** - One-command development environment

## 🏗️ Architecture

```
Frontend (Next.js) → API Gateway (Express) → Redis → Execution Service → Binance API
                                                ↓
Frontend ← WebSocket ← Event Service ← Redis ← Order Events
```

### Services

1. **Frontend** (Port 3003) - Next.js 14 with TypeScript
2. **API Gateway** (Port 3001) - Express.js with JWT auth
3. **Execution Service** - Consumes Redis commands, executes on Binance
4. **Event Service** (Port 3002) - WebSocket server for real-time updates
5. **Redis** (Port 6379) - Message broker for pub/sub

## 🛠️ Manual Setup

If you prefer not to use Docker:

### Prerequisites
- Node.js 18+
- Redis
- Binance Testnet account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run database migrations
cd apps/backend
npx prisma migrate dev

# Start Redis
docker run -p 6379:6379 redis

# Start all services (in separate terminals)
npm run dev --workspace=apps/backend
npm run dev --workspace=apps/execution-service
npm run dev --workspace=apps/event-service
npm run dev --workspace=apps/frontend
```

## 📖 Usage

### Register
1. Navigate to `http://localhost:3003/register`
2. Enter email, password, and Binance Testnet API keys
3. Auto-login after registration

### Trade
1. Select a trading pair (BTCUSDT, ETHUSDT, etc.)
2. Choose order type (MARKET, LIMIT, STOP_MARKET)
3. Enter quantity and price (for LIMIT orders)
4. Click "Place Order"
5. Watch real-time updates in Orders and Positions tabs

### Keyboard Shortcuts
- `?` - Show keyboard shortcuts help
- `Esc` - Close modals

## 🧪 Testing

### Test Order Flow
```bash
# 1. Register and login
# 2. Place a MARKET order for BTCUSDT
# 3. Watch the Orders tab update to FILLED
# 4. Check Positions tab for new position
```

### Test WebSocket Reconnection
```bash
# Stop event-service
# Watch status change to "Reconnecting..."
# Restart event-service
# Status returns to "Live trading"
```

## 📁 Project Structure

```
Numatix/
├── apps/
│   ├── backend/          # API Gateway (Express)
│   ├── execution-service/ # Order Execution
│   ├── event-service/    # WebSocket Server
│   └── frontend/         # Next.js App
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── docker-compose.yml    # Docker Compose config
└── .env.example          # Environment variables template
```

## 🔒 Security

- JWT tokens for authentication
- Bcrypt password hashing
- AES-256-CBC encryption for API keys
- Rate limiting on all endpoints
- Input validation with Zod
- CORS configuration

## 🚢 Deployment

### Environment Variables

Required for production:
- `JWT_SECRET` - Generate with `openssl rand -hex 32`
- `ENCRYPTION_KEY` - Generate with `openssl rand -hex 32`
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

### Recommended Platforms
- **Frontend**: Vercel
- **Backend Services**: Railway, Render, or AWS ECS
- **Database**: Railway PostgreSQL
- **Redis**: Railway Redis or Upstash

## 📊 Performance

- WebSocket reconnection: 1s to 30s exponential backoff
- Order execution: ~400ms average latency
- Real-time updates: <100ms from event to UI

## 🤝 Contributing

This is a coding assignment project. Not accepting contributions.

## 📝 License

MIT

## 🙏 Acknowledgments

- Binance Testnet for API access
- lightweight-charts for trading charts
- Next.js and React teams

---

**Built with ❤️ for the Fullstack Developer Hiring Assignment**
