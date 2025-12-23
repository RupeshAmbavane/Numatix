import { getToken } from './api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';

export interface WebSocketMessage {
  type: 'ORDER_UPDATE' | 'PRICE_UPDATE' | 'CONNECTED';
  data: any;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'failed';

export class TradingWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Increased from 5
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private statusCallbacks: Set<(status: ConnectionStatus) => void> = new Set();
  private connectionStatus: ConnectionStatus = 'disconnected';

  connect(): void {
    const token = getToken();
    if (!token) {
      console.error('No token available for WebSocket connection');
      this.updateStatus('failed');
      return;
    }

    try {
      this.ws = new WebSocket(`${WS_URL}/prices?token=${token}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.notifyListeners(message.type, message.data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.updateStatus('disconnected');
        this.ws = null;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.updateStatus('failed');
      return;
    }

    this.reconnectAttempts++;
    this.updateStatus('reconnecting');

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  private updateStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.statusCallbacks.clear();
    this.updateStatus('disconnected');
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new TradingWebSocket();

