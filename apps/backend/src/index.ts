import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST, before any other imports
const envPath = path.join(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
console.log('Dotenv result:', result.error ? result.error.message : 'SUCCESS');
console.log('JWT_SECRET from process.env:', process.env.JWT_SECRET);

import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { tradingRouter } from './routes/trading';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:3003', 'http://localhost:3000'], // Allow frontend origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use('/auth', authRouter);
app.use('/api/trading', tradingRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

