import { z } from 'zod';

// Order validation schema
export const orderSchema = z.object({
    symbol: z.string().min(1).regex(/^[A-Z]+$/, 'Symbol must be uppercase letters only'),
    side: z.enum(['BUY', 'SELL'], { errorMap: () => ({ message: 'Side must be BUY or SELL' }) }),
    type: z.enum(['MARKET', 'LIMIT', 'STOP_MARKET'], { errorMap: () => ({ message: 'Invalid order type' }) }),
    quantity: z.number().positive('Quantity must be positive').max(1000, 'Quantity too large'),
    price: z.number().positive('Price must be positive').optional(),
}).refine((data) => {
    if (data.type === 'LIMIT' && !data.price) {
        return false;
    }
    return true;
}, {
    message: "Price is required for LIMIT orders",
    path: ['price'],
});

// Login validation schema
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// Register validation schema  
export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    binanceApiKey: z.string().min(1, 'Binance API key is required'),
    binanceSecretKey: z.string().min(1, 'Binance secret key is required'),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
