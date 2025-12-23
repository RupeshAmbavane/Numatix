import { createClient } from 'redis';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';
import path from 'path';
import type { OrderCommand, OrderEvent } from '@trading-platform/shared-types';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// Use absolute path for database
const databaseUrl = process.env.DATABASE_URL || `file:${path.join(__dirname, '../../backend/dev.db')}`;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

const BINANCE_TESTNET_API = 'https://testnet.binance.vision/api';

// Decrypt API keys
function decrypt(encryptedText: string): string {
  try {
    if (!ENCRYPTION_KEY) {
      // Fallback: base64 decoding
      return Buffer.from(encryptedText, 'base64').toString('utf8');
    }
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      // Try base64 fallback
      return Buffer.from(encryptedText, 'base64').toString('utf8');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}

// Create Binance signature
function createSignature(queryString: string, secretKey: string): string {
  return crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
}

// Execute order on Binance Testnet
async function executeOrder(command: OrderCommand): Promise<OrderEvent> {
  try {
    // Get user's API keys
    const user = await prisma.user.findUnique({
      where: { id: command.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const apiKey = decrypt(user.binanceApiKey);
    const secretKey = decrypt(user.binanceSecretKey);

    // Prepare order parameters
    const timestamp = Date.now() - 1000; // Subtract 1 second to handle clock skew
    const params: Record<string, string> = {
      symbol: command.symbol,
      side: command.side,
      type: command.type,
      quantity: command.quantity.toString(),
      timestamp: timestamp.toString(),
      recvWindow: '5000', // 5 second receive window
    };

    if (command.type === 'LIMIT' && command.price) {
      params.price = command.price.toString();
      params.timeInForce = 'GTC';
    }

    const queryString = new URLSearchParams(params).toString();
    const signature = createSignature(queryString, secretKey);

    console.log('Order params:', params);
    console.log('Query string:', queryString);

    // Call Binance Testnet API
    const response = await axios.post(
      `${BINANCE_TESTNET_API}/v3/order?${queryString}&signature=${signature}`,
      null, // Must be null, not empty object
      {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    );

    const binanceOrder = response.data;
    console.log('Binance order response:', JSON.stringify(binanceOrder, null, 2));

    // Map Binance status to our status
    let status: 'FILLED' | 'REJECTED' | 'PARTIALLY_FILLED' | 'PENDING' = 'PENDING';
    if (binanceOrder.status === 'FILLED') {
      status = 'FILLED';
    } else if (binanceOrder.status === 'PARTIALLY_FILLED') {
      status = 'PARTIALLY_FILLED';
    } else if (binanceOrder.status === 'REJECTED' || binanceOrder.status === 'CANCELED') {
      status = 'REJECTED';
    }

    // Extract execution price
    let executionPrice = 0;
    const priceValue = parseFloat(binanceOrder.price || '0');

    if (priceValue > 0) {
      // LIMIT orders have non-zero price field
      executionPrice = priceValue;
    } else if (binanceOrder.fills && binanceOrder.fills.length > 0) {
      // MARKET orders: calculate average price from fills
      const totalValue = binanceOrder.fills.reduce((sum: number, fill: any) => {
        return sum + (parseFloat(fill.price) * parseFloat(fill.qty));
      }, 0);
      const totalQty = binanceOrder.fills.reduce((sum: number, fill: any) => {
        return sum + parseFloat(fill.qty);
      }, 0);
      executionPrice = totalQty > 0 ? totalValue / totalQty : 0;
    }

    console.log('Extracted execution price:', executionPrice);

    const orderEvent: OrderEvent = {
      orderId: command.orderId,
      userId: command.userId,
      status,
      symbol: command.symbol,
      side: command.side,
      quantity: parseFloat(binanceOrder.executedQty || command.quantity.toString()),
      price: executionPrice,
      timestamp: new Date().toISOString(),
    };

    return orderEvent;
  } catch (error: any) {
    console.error('Order execution error:', error.response?.data || error.message);

    // Return rejected event
    return {
      orderId: command.orderId,
      userId: command.userId,
      status: 'REJECTED',
      symbol: command.symbol,
      side: command.side,
      quantity: command.quantity,
      price: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

async function main() {
  console.log('Order Execution Service starting...');

  // Connect to Redis
  const subscriber = createClient({ url: redisUrl });
  const publisher = createClient({ url: redisUrl });

  await subscriber.connect();
  await publisher.connect();

  console.log('Connected to Redis');

  // Subscribe to order commands
  await subscriber.subscribe('commands:order:submit', async (message) => {
    try {
      const command: OrderCommand = JSON.parse(message);
      console.log('Received order command:', command.orderId);

      // Execute order
      const event = await executeOrder(command);

      // Publish event to Redis
      await publisher.publish('events:order:status', JSON.stringify(event));

      // Log event to database
      await prisma.orderEvent.create({
        data: {
          orderId: event.orderId,
          userId: event.userId,
          status: event.status,
          symbol: event.symbol,
          side: event.side,
          quantity: event.quantity,
          price: event.price,
          timestamp: new Date(event.timestamp),
        },
      });

      // Update order command status and price
      await prisma.orderCommand.update({
        where: { orderId: command.orderId },
        data: {
          status: event.status,
          price: event.price > 0 ? event.price : command.price, // Update with execution price for MARKET orders
        },
      }).catch(() => {
        // Order command might not exist yet, that's okay
      });

      console.log('Order executed:', event.orderId, event.status);
    } catch (error) {
      console.error('Error processing order command:', error);
    }
  });

  console.log('Subscribed to commands:order:submit');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

