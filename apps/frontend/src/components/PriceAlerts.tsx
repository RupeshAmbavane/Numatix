'use client';

import { useState, useEffect } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import { requestNotificationPermission, getNotificationPermission } from '@/lib/notifications';

interface PriceAlertsProps {
    symbol: string;
    currentPrice: number | null;
}

export default function PriceAlerts({ symbol, currentPrice }: PriceAlertsProps) {
    const { alerts, triggeredAlerts, createAlert, deleteAlert } = useAlerts(symbol, currentPrice);
    const [targetPrice, setTargetPrice] = useState('');
    const [direction, setDirection] = useState<'above' | 'below'>('above');
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [showPermissionWarning, setShowPermissionWarning] = useState(false);

    // Check notification permission on mount
    useEffect(() => {
        setPermissionStatus(getNotificationPermission());
    }, []);

    const handleCreateAlert = async () => {
        const price = parseFloat(targetPrice);

        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid price');
            return;
        }

        if (!currentPrice) {
            alert('Current price not available');
            return;
        }

        // Validate direction makes sense
        if (direction === 'above' && price <= currentPrice) {
            if (!confirm(`Target price ($${price}) is below current price ($${currentPrice.toFixed(2)}). Continue?`)) {
                return;
            }
        } else if (direction === 'below' && price >= currentPrice) {
            if (!confirm(`Target price ($${price}) is above current price ($${currentPrice.toFixed(2)}). Continue?`)) {
                return;
            }
        }

        // Request notification permission if needed
        if (permissionStatus !== 'granted') {
            const granted = await requestNotificationPermission();
            setPermissionStatus(getNotificationPermission());

            if (!granted) {
                setShowPermissionWarning(true);
            }
        }

        createAlert(price, direction);
        setTargetPrice('');
    };

    return (
        <div className="bg-bg-secondary rounded-lg border border-border-color p-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Price Alerts</h3>

            {/* Permission Warning */}
            {showPermissionWarning && permissionStatus !== 'granted' && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded text-yellow-400 text-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <strong>Notifications Blocked</strong>
                            <p className="mt-1">Enable browser notifications to receive price alerts.</p>
                        </div>
                        <button
                            onClick={() => setShowPermissionWarning(false)}
                            className="text-yellow-400 hover:text-yellow-300"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Create Alert Form */}
            <div className="space-y-3 mb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setDirection('above')}
                        className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${direction === 'above'
                                ? 'bg-accent-green text-bg-primary'
                                : 'bg-bg-tertiary text-text-secondary hover:bg-border-color'
                            }`}
                    >
                        Above
                    </button>
                    <button
                        onClick={() => setDirection('below')}
                        className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${direction === 'below'
                                ? 'bg-accent-red text-text-primary'
                                : 'bg-bg-tertiary text-text-secondary hover:bg-border-color'
                            }`}
                    >
                        Below
                    </button>
                </div>

                <div className="flex gap-2">
                    <input
                        type="number"
                        step="0.01"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder={currentPrice ? `Current: $${currentPrice.toFixed(2)}` : 'Enter price'}
                        className="flex-1 px-4 py-2 bg-bg-tertiary border border-border-color rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
                    />
                    <button
                        onClick={handleCreateAlert}
                        disabled={!targetPrice}
                        className="px-4 py-2 bg-accent-green text-bg-primary rounded font-semibold hover:bg-accent-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Set Alert
                    </button>
                </div>
            </div>

            {/* Active Alerts */}
            {alerts.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-text-secondary mb-2">Active Alerts</h4>
                    <div className="space-y-2">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="flex items-center justify-between p-3 bg-bg-tertiary rounded border border-border-color"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${alert.direction === 'above' ? 'bg-accent-green' : 'bg-accent-red'
                                        }`} />
                                    <div>
                                        <div className="text-text-primary font-medium">
                                            {alert.direction === 'above' ? '↑' : '↓'} ${alert.targetPrice.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-text-secondary">
                                            {new Date(alert.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteAlert(alert.id)}
                                    className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Triggered Alerts */}
            {triggeredAlerts.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-text-secondary mb-2">Triggered Alerts</h4>
                    <div className="space-y-2">
                        {triggeredAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="flex items-center justify-between p-3 bg-bg-tertiary rounded border border-green-500/30 opacity-60"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <div>
                                        <div className="text-text-primary font-medium">
                                            ✓ ${alert.targetPrice.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-text-secondary">Triggered</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteAlert(alert.id)}
                                    className="px-3 py-1 text-xs bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {alerts.length === 0 && triggeredAlerts.length === 0 && (
                <div className="text-center py-8 text-text-secondary text-sm">
                    No price alerts set for {symbol}
                </div>
            )}
        </div>
    );
}
