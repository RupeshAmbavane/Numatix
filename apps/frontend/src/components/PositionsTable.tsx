'use client';

import { useState, useEffect } from 'react';
import { getOrders, getPositions, cancelOrder } from '@/lib/api';
import { wsClient } from '@/lib/websocket';

export default function PositionsTable() {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'trades'>('positions');
  const [positions, setPositions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();

    // Set up auto-refresh every 5 seconds
    const refreshInterval = setInterval(() => {
      loadData();
    }, 5000);

    // Listen for order updates via WebSocket
    const handleOrderUpdate = (data: any) => {
      console.log('Order update received:', data);
      // Reload data when order status changes
      loadData();
    };

    wsClient.on('ORDER_UPDATE', handleOrderUpdate);

    return () => {
      clearInterval(refreshInterval);
      wsClient.off('ORDER_UPDATE', handleOrderUpdate);
    };
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'positions') {
        const data = await getPositions();
        setPositions(data);
      } else if (activeTab === 'orders') {
        const data = await getOrders();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await cancelOrder(orderId);
      // Reload orders
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to cancel order');
    }
  };

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-color p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${activeTab === 'positions'
              ? 'bg-accent-green text-bg-primary'
              : 'bg-bg-tertiary text-text-secondary hover:bg-border-color'
              }`}
          >
            Positions
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${activeTab === 'orders'
              ? 'bg-accent-green text-bg-primary'
              : 'bg-bg-tertiary text-text-secondary hover:bg-border-color'
              }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${activeTab === 'trades'
              ? 'bg-accent-green text-bg-primary'
              : 'bg-bg-tertiary text-text-secondary hover:bg-border-color'
              }`}
          >
            Trades
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Auto-refresh (5s)</span>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1 text-xs bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-border-color rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-text-secondary">Loading...</div>
      ) : activeTab === 'positions' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-color">
                <th className="text-left py-2 px-3 text-text-secondary">Symbol</th>
                <th className="text-left py-2 px-3 text-text-secondary">Side</th>
                <th className="text-right py-2 px-3 text-text-secondary">Quantity</th>
                <th className="text-right py-2 px-3 text-text-secondary">Entry Price</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-text-secondary">
                    No positions
                  </td>
                </tr>
              ) : (
                positions.map((pos, idx) => (
                  <tr key={idx} className="border-b border-border-color">
                    <td className="py-2 px-3 text-text-primary">{pos.symbol}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`${pos.side === 'BUY' ? 'text-accent-green' : 'text-accent-red'
                          }`}
                      >
                        {pos.side}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-text-primary">{pos.quantity.toFixed(4)}</td>
                    <td className="py-2 px-3 text-right text-text-primary">${pos.entryPrice.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-color">
                <th className="text-left py-2 px-3 text-text-secondary">Time</th>
                <th className="text-left py-2 px-3 text-text-secondary">Symbol</th>
                <th className="text-left py-2 px-3 text-text-secondary">Side</th>
                <th className="text-left py-2 px-3 text-text-secondary">Type</th>
                <th className="text-right py-2 px-3 text-text-secondary">Quantity</th>
                <th className="text-right py-2 px-3 text-text-secondary">Price</th>
                <th className="text-left py-2 px-3 text-text-secondary">Status</th>
                <th className="text-right py-2 px-3 text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-secondary">
                    No orders
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-border-color">
                    <td className="py-2 px-3 text-text-primary text-xs">
                      {new Date(order.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2 px-3 text-text-primary">{order.symbol}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`${order.side === 'BUY' ? 'text-accent-green' : 'text-accent-red'
                          }`}
                      >
                        {order.side}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-text-secondary">{order.type}</td>
                    <td className="py-2 px-3 text-right text-text-primary">{order.quantity}</td>
                    <td className="py-2 px-3 text-right text-text-primary">
                      {order.price ? `$${parseFloat(order.price).toFixed(2)}` : <span className="text-text-secondary">Market</span>}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${order.status === 'FILLED'
                          ? 'bg-accent-green/20 text-accent-green'
                          : order.status === 'REJECTED'
                            ? 'bg-accent-red/20 text-accent-red'
                            : order.status === 'CANCELLED'
                              ? 'bg-gray-500/20 text-gray-400'
                              : 'bg-yellow-500/20 text-yellow-500'
                          }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancelOrder(order.orderId)}
                          className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-text-secondary">Trades coming soon</div>
      )}
    </div>
  );
}

