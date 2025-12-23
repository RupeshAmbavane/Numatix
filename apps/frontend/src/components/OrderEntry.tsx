'use client';

import { useState, useEffect } from 'react';
import { submitOrder } from '@/lib/api';

interface OrderEntryProps {
  symbol: string;
  onOrderPlaced: () => void;
}

// Trading limits for each symbol
const SYMBOL_LIMITS: Record<string, { minQty: number; stepSize: number; minNotional: number }> = {
  BTCUSDT: { minQty: 0.00001, stepSize: 0.00001, minNotional: 10 },
  ETHUSDT: { minQty: 0.0001, stepSize: 0.0001, minNotional: 10 },
  BNBUSDT: { minQty: 0.001, stepSize: 0.001, minNotional: 10 },
  SOLUSDT: { minQty: 0.1, stepSize: 0.1, minNotional: 10 },
  ADAUSDT: { minQty: 1, stepSize: 1, minNotional: 10 },
};

export default function OrderEntry({ symbol, onOrderPlaced }: OrderEntryProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [type, setType] = useState<'MARKET' | 'LIMIT' | 'STOP_MARKET'>('MARKET');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const limits = SYMBOL_LIMITS[symbol] || SYMBOL_LIMITS.BTCUSDT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await submitOrder({
        symbol,
        side,
        type,
        quantity: parseFloat(quantity),
        price: type === 'LIMIT' ? parseFloat(price) : undefined,
      });
      setQuantity('');
      setPrice('');
      onOrderPlaced();
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const total = quantity && price ? (parseFloat(quantity) * parseFloat(price)).toFixed(2) : '0.00';

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-color p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Place Order</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={`flex-1 py-2 rounded font-semibold transition-colors ${side === 'BUY'
            ? 'bg-accent-green text-bg-primary'
            : 'bg-bg-tertiary text-text-secondary hover:bg-border-color'
            }`}
        >
          BUY
        </button>
        <button
          type="button"
          onClick={() => setSide('SELL')}
          className={`flex-1 py-2 rounded font-semibold transition-colors ${side === 'SELL'
            ? 'bg-accent-red text-text-primary'
            : 'bg-bg-tertiary text-text-secondary hover:bg-border-color'
            }`}
        >
          SELL
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Order Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-4 py-2 bg-bg-tertiary border border-border-color rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
          >
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
            <option value="STOP_MARKET">Stop Market</option>
          </select>
        </div>

        {type === 'LIMIT' && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required={type === 'LIMIT'}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-color rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Quantity
          </label>
          <input
            type="number"
            step={limits.stepSize.toString()}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            placeholder={`Min: ${limits.minQty}`}
            className="w-full px-4 py-2 bg-bg-tertiary border border-border-color rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
          />
          <div className="mt-1 text-xs text-text-secondary">
            Min: {limits.minQty} • Min order value: ${limits.minNotional}
          </div>
        </div>

        {type === 'LIMIT' && price && (
          <div className="p-3 bg-bg-tertiary rounded">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Total</span>
              <span className={`font-semibold ${parseFloat(total) >= limits.minNotional ? 'text-accent-green' : 'text-accent-red'}`}>
                ${total}
              </span>
            </div>
            {parseFloat(total) < limits.minNotional && (
              <div className="mt-1 text-xs text-accent-red">
                Order value must be at least ${limits.minNotional}
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !quantity}
          className={`w-full py-3 rounded font-semibold transition-colors ${side === 'BUY'
            ? 'bg-accent-green text-bg-primary hover:bg-accent-green/90'
            : 'bg-accent-red text-text-primary hover:bg-accent-red/90'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? 'Placing Order...' : `Place ${side} Order`}
        </button>
      </form>
    </div>
  );
}

