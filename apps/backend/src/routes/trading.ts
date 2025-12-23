import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { redisClient, connectRedis } from '../config/redis';
import { prisma } from '../config/database';
import { orderLimiter } from '../middleware/rateLimiter';
import type { OrderCommand } from '@trading-platform/shared-types';

const router = Router();

const orderSchema = z.object({
  symbol: z.string().min(1).regex(/^[A-Z]+$/, 'Symbol must be uppercase'),
  side: z.enum(['BUY', 'SELL']),
  type: z.enum(['MARKET', 'LIMIT', 'STOP_MARKET']),
  quantity: z.number().positive().max(1000),
  price: z.number().positive().optional(),
}).refine((data) => {
  if (data.type === 'LIMIT' && !data.price) {
    return false;
  }
  return true;
}, {
  message: "Price is required for LIMIT orders",
  path: ['price'],
});

// Submit order - publishes to Redis
router.post('/orders', orderLimiter, authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const validated = orderSchema.parse(req.body);
    const userId = req.userId!;

    const orderId = randomUUID();
    const command: OrderCommand = {
      orderId,
      userId,
      symbol: validated.symbol,
      side: validated.side,
      type: validated.type,
      quantity: validated.quantity,
      price: validated.price,
      timestamp: new Date().toISOString(),
    };

    // Publish to Redis
    await connectRedis();
    await redisClient.publish('commands:order:submit', JSON.stringify(command));

    // Log to database
    await prisma.orderCommand.create({
      data: {
        orderId,
        userId,
        symbol: validated.symbol,
        side: validated.side,
        type: validated.type,
        quantity: validated.quantity,
        price: validated.price,
        status: 'PENDING',
      },
    });

    res.json({
      orderId,
      status: 'PENDING',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Order submission error:', error);
    res.status(500).json({ error: 'Failed to submit order' });
  }
});

// Get user's orders
router.get('/orders', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const orders = await prisma.orderCommand.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get account balance from Binance
router.get('/balance', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Fetch user's encrypted Binance credentials from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        binanceApiKey: true,
        binanceSecretKey: true,
      },
    });

    if (!user || !user.binanceApiKey || !user.binanceSecretKey) {
      return res.status(400).json({ error: 'Binance API credentials not configured for this user' });
    }

    // Decrypt the credentials
    const { decrypt } = await import('../utils/encryption');
    const BINANCE_API_KEY = decrypt(user.binanceApiKey);
    const BINANCE_API_SECRET = decrypt(user.binanceSecretKey);

    const timestamp = Date.now() - 1000; // Subtract 1 second to handle clock skew
    const recvWindow = 5000; // 5 second receive window
    const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;

    // Create signature
    const signature = crypto
      .createHmac('sha256', BINANCE_API_SECRET)
      .update(queryString)
      .digest('hex');

    const url = `https://testnet.binance.vision/api/v3/account?${queryString}&signature=${signature}`;

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Binance API error:', errorData);
      return res.status(response.status).json({ error: 'Failed to fetch balance', details: errorData });
    }

    const accountData = await response.json() as {
      balances: Array<{ asset: string; free: string; locked: string }>;
      canTrade: boolean;
      canWithdraw: boolean;
      canDeposit: boolean;
    };

    // Extract balances with non-zero amounts
    const balances = accountData.balances
      .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map((b: any) => ({
        asset: b.asset,
        free: parseFloat(b.free),
        locked: parseFloat(b.locked),
        total: parseFloat(b.free) + parseFloat(b.locked),
      }));

    res.json({
      balances,
      canTrade: accountData.canTrade,
      canWithdraw: accountData.canWithdraw,
      canDeposit: accountData.canDeposit,
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Get user's positions
router.get('/positions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get all filled orders
    const filledOrders = await prisma.orderEvent.findMany({
      where: {
        userId,
        status: {
          in: ['FILLED', 'PARTIALLY_FILLED'],
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Calculate positions by symbol
    const positionsMap = new Map<string, {
      symbol: string;
      side: string;
      quantity: number;
      entryPrice: number;
      totalCost: number;
    }>();

    for (const order of filledOrders) {
      const key = `${order.symbol}_${order.side}`;
      const existing = positionsMap.get(key);

      if (existing) {
        if (order.side === 'BUY') {
          existing.quantity += order.quantity;
          existing.totalCost += order.quantity * order.price;
          existing.entryPrice = existing.totalCost / existing.quantity;
        } else {
          existing.quantity -= order.quantity;
          if (existing.quantity <= 0) {
            positionsMap.delete(key);
          } else {
            existing.totalCost -= order.quantity * order.price;
            existing.entryPrice = existing.totalCost / existing.quantity;
          }
        }
      } else {
        if (order.side === 'BUY') {
          positionsMap.set(key, {
            symbol: order.symbol,
            side: order.side,
            quantity: order.quantity,
            entryPrice: order.price,
            totalCost: order.quantity * order.price,
          });
        }
      }
    }

    const positions = Array.from(positionsMap.values());

    res.json(positions);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Cancel order
router.delete('/orders/:orderId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId!;

    // Verify order belongs to user
    const order = await prisma.orderCommand.findUnique({
      where: { orderId },
    });

    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'FILLED' || order.status === 'REJECTED') {
      return res.status(400).json({ error: 'Cannot cancel completed order' });
    }

    // Publish cancel command to Redis
    const cancelCommand = {
      orderId,
      userId,
      action: 'CANCEL',
      timestamp: new Date().toISOString(),
    };

    await connectRedis();
    await redisClient.publish('commands:order:cancel', JSON.stringify(cancelCommand));

    // Update order status to CANCELLED
    await prisma.orderCommand.update({
      where: { orderId },
      data: { status: 'CANCELLED' },
    });

    res.json({ message: 'Cancel request submitted', orderId });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

export { router as tradingRouter };

