export interface OrderCommand {
  orderId: string;
  userId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET';
  quantity: number;
  price?: number;
  timestamp: string;
}

export interface OrderEvent {
  orderId: string;
  userId: string;
  status: 'FILLED' | 'REJECTED' | 'PARTIALLY_FILLED' | 'PENDING';
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'ORDER_UPDATE' | 'PRICE_UPDATE';
  data: any;
}

export interface User {
  id: string;
  email: string;
  binanceApiKey: string;
  binanceSecretKey: string;
  createdAt: Date;
}

