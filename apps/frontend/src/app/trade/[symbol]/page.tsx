'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getToken, removeToken } from '@/lib/api';
import { wsClient, ConnectionStatus } from '@/lib/websocket';
import { useHotkeys } from 'react-hotkeys-hook';
import TradingChart from '@/components/TradingChart';
import OrderEntry from '@/components/OrderEntry';
import PositionsTable from '@/components/PositionsTable';
import { ThemeToggle } from '@/components/ThemeToggle';
import AccountBalance from '@/components/AccountBalance';
import PriceAlerts from '@/components/PriceAlerts';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT'];

export default function TradeSymbolPage() {
    const params = useParams();
    const router = useRouter();
    const symbol = (params.symbol as string)?.toUpperCase() || 'BTCUSDT';

    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [priceChange, setPriceChange] = useState<number>(0);
    const [wsStatus, setWsStatus] = useState<ConnectionStatus>('disconnected');
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const [priceUpdating, setPriceUpdating] = useState(false);

    // Validate symbol and redirect if invalid
    useEffect(() => {
        if (!SYMBOLS.includes(symbol)) {
            console.log('Invalid symbol:', symbol, 'redirecting to BTCUSDT');
            router.push('/trade/BTCUSDT');
        }
    }, [symbol, router]);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            console.log('No token found, redirecting to login');
            router.push('/login');
            return;
        }

        console.log('Token found, initializing trade page for symbol:', symbol);

        // Connect WebSocket
        wsClient.connect();

        // Subscribe to connection status
        const unsubscribeStatus = wsClient.onStatusChange(setWsStatus);

        // Listen for order updates
        const handleOrderUpdate = (data: any) => {
            console.log('Order update:', data);
        };

        wsClient.on('ORDER_UPDATE', handleOrderUpdate);

        // Fetch initial price
        fetchPrice(symbol);

        // Set up real-time price updates every 3 seconds
        const priceInterval = setInterval(() => {
            fetchPrice(symbol);
        }, 3000);

        return () => {
            unsubscribeStatus();
            wsClient.off('ORDER_UPDATE', handleOrderUpdate);
            clearInterval(priceInterval);
        };
    }, [router, symbol]);

    const fetchPrice = async (sym: string) => {
        try {
            setPriceUpdating(true);
            const response = await fetch(
                `https://testnet.binance.vision/api/v3/ticker/24hr?symbol=${sym}`
            );
            const data = await response.json();
            setCurrentPrice(parseFloat(data.lastPrice));
            setPriceChange(parseFloat(data.priceChangePercent));

            // Reset animation after a brief moment
            setTimeout(() => setPriceUpdating(false), 300);
        } catch (error) {
            console.error('Error fetching price:', error);
            setPriceUpdating(false);
        }
    };

    const handleSymbolChange = (newSymbol: string) => {
        router.push(`/trade/${newSymbol}`);
    };

    const handleLogout = () => {
        removeToken();
        wsClient.disconnect();
        router.push('/login');
    };

    const handleOrderPlaced = () => {
        console.log('Order placed');
    };

    // Keyboard shortcuts
    useHotkeys('?', () => setShowKeyboardHelp(true));
    useHotkeys('esc', () => setShowKeyboardHelp(false));

    return (
        <div className="min-h-screen bg-white dark:bg-bg-primary transition-colors">
            {/* Header */}
            <header className="bg-gray-100 dark:bg-bg-secondary border-b border-gray-300 dark:border-border-color px-6 py-4 transition-colors">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-text-primary">Trading Platform</h1>
                    <div className="flex items-center gap-4">
                        {/* WebSocket Status Indicator */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-500' :
                                wsStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
                                    wsStatus === 'failed' ? 'bg-red-500' :
                                        'bg-gray-500'
                                }`} />
                            <span className="text-xs text-gray-600 dark:text-text-secondary">
                                {wsStatus === 'connected' ? 'Live trading' :
                                    wsStatus === 'reconnecting' ? 'Reconnecting...' :
                                        wsStatus === 'failed' ? 'Connection failed' :
                                            'Disconnected'}
                            </span>
                        </div>

                        {/* Live Updates Indicator */}
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-xs text-gray-600 dark:text-text-secondary">
                                Live updates (3s)
                            </span>
                        </div>

                        <select
                            value={symbol}
                            onChange={(e) => handleSymbolChange(e.target.value)}
                            className="px-4 py-2 bg-gray-200 dark:bg-bg-tertiary border border-gray-300 dark:border-border-color rounded text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-green transition-colors"
                        >
                            {SYMBOLS.map((sym) => (
                                <option key={sym} value={sym}>
                                    {sym}
                                </option>
                            ))}
                        </select>
                        {currentPrice && (
                            <div className={`text-right transition-all ${priceUpdating ? 'scale-105' : ''}`}>
                                <div className="text-gray-900 dark:text-text-primary font-semibold">
                                    ${currentPrice.toFixed(2)}
                                </div>
                                <div
                                    className={`text-sm ${priceChange >= 0 ? 'text-accent-green' : 'text-accent-red'
                                        }`}
                                >
                                    {priceChange >= 0 ? '+' : ''}
                                    {priceChange.toFixed(2)}%
                                </div>
                            </div>
                        )}

                        {/* Account Balance */}
                        <AccountBalance />

                        {/* Keyboard Shortcuts Help Button */}
                        <button
                            onClick={() => setShowKeyboardHelp(true)}
                            className="px-3 py-2 bg-gray-200 dark:bg-bg-tertiary border border-gray-300 dark:border-border-color rounded text-gray-700 dark:text-text-secondary hover:text-gray-900 dark:hover:text-text-primary hover:bg-gray-300 dark:hover:bg-border-color transition-colors"
                            title="Keyboard shortcuts (?)">
                            <span className="text-sm">?</span>
                        </button>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-gray-200 dark:bg-bg-tertiary border border-gray-300 dark:border-border-color rounded text-gray-900 dark:text-text-primary hover:bg-gray-300 dark:hover:bg-border-color transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Order Entry & Price Alerts */}
                    <div className="lg:col-span-1 space-y-6">
                        <OrderEntry symbol={symbol} onOrderPlaced={handleOrderPlaced} />
                        <PriceAlerts symbol={symbol} currentPrice={currentPrice} />
                    </div>

                    {/* Right Panel - Chart and Positions */}
                    <div className="lg:col-span-2 space-y-6">
                        <TradingChart symbol={symbol} />
                        <PositionsTable />
                    </div>
                </div>
            </div>

            {/* Keyboard Shortcuts Modal */}
            {showKeyboardHelp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-bg-secondary p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-text-primary mb-4">
                            Keyboard Shortcuts
                        </h3>
                        <div className="space-y-2 text-gray-700 dark:text-text-secondary">
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-gray-200 dark:bg-bg-tertiary rounded text-sm">?</kbd>
                                <span>Show this help</span>
                            </div>
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-gray-200 dark:bg-bg-tertiary rounded text-sm">Esc</kbd>
                                <span>Close modal</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowKeyboardHelp(false)}
                            className="mt-6 w-full px-4 py-2 bg-accent-green text-white rounded hover:bg-opacity-90 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
