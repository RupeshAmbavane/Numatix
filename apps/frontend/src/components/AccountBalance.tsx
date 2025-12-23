'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Balance {
    asset: string;
    free: number;
    locked: number;
    total: number;
}

interface AccountBalance {
    balances: Balance[];
    canTrade: boolean;
    canWithdraw: boolean;
    canDeposit: boolean;
}

export default function AccountBalance() {
    const [balance, setBalance] = useState<AccountBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const fetchBalance = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_URL}/api/trading/balance`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch balance');
            }

            const data = await response.json();
            setBalance(data);
        } catch (err: any) {
            console.error('Failed to fetch balance:', err);
            setError(err.message || 'Failed to fetch balance');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
        // Refresh balance every 30 seconds
        const interval = setInterval(fetchBalance, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !balance) {
        return (
            <div className="text-sm text-gray-600 dark:text-text-secondary">
                Loading balance...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-sm text-red-600 dark:text-red-400">
                Balance unavailable
            </div>
        );
    }

    if (!balance || balance.balances.length === 0) {
        return (
            <div className="text-sm text-gray-600 dark:text-text-secondary">
                No balance
            </div>
        );
    }

    // Get primary balances (USDT, BTC, ETH, BNB)
    const primaryAssets = ['USDT', 'BTC', 'ETH', 'BNB'];
    const primaryBalances = balance.balances.filter(b => primaryAssets.includes(b.asset));
    const otherBalances = balance.balances.filter(b => !primaryAssets.includes(b.asset));

    return (
        <div className="relative">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-bg-tertiary border border-gray-300 dark:border-border-color rounded hover:bg-gray-300 dark:hover:bg-border-color transition-colors"
            >
                <div className="text-left">
                    <div className="text-xs text-gray-600 dark:text-text-secondary">Balance</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-text-primary">
                        {primaryBalances.length > 0 ? (
                            <span>
                                {primaryBalances[0].free.toFixed(primaryBalances[0].asset === 'BTC' ? 6 : 2)} {primaryBalances[0].asset}
                            </span>
                        ) : (
                            <span>0.00 USDT</span>
                        )}
                    </div>
                </div>
                <svg
                    className={`w-4 h-4 text-gray-600 dark:text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-bg-secondary border border-gray-300 dark:border-border-color rounded-lg shadow-xl z-50">
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-text-primary">
                                Account Balance
                            </h3>
                            <button
                                onClick={fetchBalance}
                                className="text-xs text-accent-green hover:text-opacity-80"
                                disabled={loading}
                            >
                                {loading ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>

                        {/* Trading Status */}
                        <div className="mb-4 p-3 bg-gray-100 dark:bg-bg-tertiary rounded">
                            <div className="flex items-center gap-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${balance.canTrade ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-gray-900 dark:text-text-primary">
                                    Trading: {balance.canTrade ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                        </div>

                        {/* Primary Balances */}
                        {primaryBalances.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-xs font-semibold text-gray-600 dark:text-text-secondary mb-2 uppercase">
                                    Main Assets
                                </h4>
                                <div className="space-y-2">
                                    {primaryBalances.map((bal) => (
                                        <div
                                            key={bal.asset}
                                            className="flex justify-between items-center p-2 bg-gray-50 dark:bg-bg-tertiary rounded"
                                        >
                                            <span className="font-medium text-gray-900 dark:text-text-primary">
                                                {bal.asset}
                                            </span>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-text-primary">
                                                    {bal.free.toFixed(bal.asset === 'BTC' || bal.asset === 'ETH' ? 6 : 2)}
                                                </div>
                                                {bal.locked > 0 && (
                                                    <div className="text-xs text-gray-600 dark:text-text-secondary">
                                                        Locked: {bal.locked.toFixed(bal.asset === 'BTC' || bal.asset === 'ETH' ? 6 : 2)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Other Balances */}
                        {otherBalances.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-600 dark:text-text-secondary mb-2 uppercase">
                                    Other Assets
                                </h4>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {otherBalances.map((bal) => (
                                        <div
                                            key={bal.asset}
                                            className="flex justify-between items-center p-2 text-sm"
                                        >
                                            <span className="text-gray-700 dark:text-text-secondary">
                                                {bal.asset}
                                            </span>
                                            <span className="text-gray-900 dark:text-text-primary">
                                                {bal.free.toFixed(6)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
