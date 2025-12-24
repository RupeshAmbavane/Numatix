import { createClient } from 'redis';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import type { OrderEvent, WebSocketMessage } from '@trading-platform/shared-types';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const WS_PORT = parseInt(process.env.PORT || process.env.WS_PORT || '3002', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

console.log('Event-service JWT_SECRET:', JWT_SECRET);

// Map of userId -> WebSocket connections
const userConnections = new Map<string, Set<WebSocket>>();

// WebSocket server
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws: WebSocket, req) => {
  console.log('========================================');
  console.log('New WebSocket connection attempt');
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);

  // Extract token from query string or headers
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token') ||
    req.headers.authorization?.split(' ')[1];

  if (!token) {
    console.log('❌ No token provided, closing connection');
    ws.close(1008, 'Authentication required');
    return;
  }

  console.log('Token received:', token.substring(0, 20) + '...');

  let userId: string;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    userId = decoded.userId;
    console.log('✓ Token verified for user:', userId);
  } catch (error: any) {
    console.log('❌ Token verification failed:', error.message);
    ws.close(1008, 'Invalid token');
    return;
  }

  // Add connection to user's set
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)!.add(ws);

  console.log(`User ${userId} connected. Total connections: ${userConnections.get(userId)!.size}`);

  // Handle connection close
  ws.on('close', () => {
    const connections = userConnections.get(userId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        userConnections.delete(userId);
      }
    }
    console.log(`User ${userId} disconnected`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    data: { message: 'Connected to trading platform' },
  }));
});

// Redis subscriber for order events
async function main() {
  console.log('Event Broadcasting Service starting...');

  const subscriber = createClient({ url: redisUrl });
  await subscriber.connect();
  console.log('Connected to Redis');

  // Subscribe to order events
  await subscriber.subscribe('events:order:status', (message) => {
    try {
      const event: OrderEvent = JSON.parse(message);
      console.log('Received order event:', event.orderId, event.status);

      // Broadcast to user's WebSocket connections
      const connections = userConnections.get(event.userId);
      if (connections) {
        const wsMessage: WebSocketMessage = {
          type: 'ORDER_UPDATE',
          data: {
            orderId: event.orderId,
            status: event.status,
            symbol: event.symbol,
            side: event.side,
            quantity: event.quantity,
            price: event.price,
            timestamp: event.timestamp,
          },
        };

        const messageStr = JSON.stringify(wsMessage);
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(messageStr);
          }
        });

        console.log(`Broadcasted to ${connections.size} connection(s) for user ${event.userId}`);
      }
    } catch (error) {
      console.error('Error processing order event:', error);
    }
  });

  console.log('Subscribed to events:order:status');
  console.log(`WebSocket server listening on port ${WS_PORT}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

