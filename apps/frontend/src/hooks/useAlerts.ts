import { useState, useEffect, useCallback } from 'react';
import { showPriceAlert } from '@/lib/notifications';

export interface PriceAlert {
    id: string;
    symbol: string;
    targetPrice: number;
    direction: 'above' | 'below';
    createdAt: number;
    triggered: boolean;
}

const STORAGE_KEY = 'priceAlerts';

/**
 * Custom hook for managing price alerts
 * Handles localStorage persistence, alert checking, and notifications
 */
export function useAlerts(symbol: string, currentPrice: number | null) {
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);

    // Load alerts from localStorage on mount
    useEffect(() => {
        loadAlerts();
    }, [symbol]);

    // Check alerts against current price
    useEffect(() => {
        if (currentPrice === null) return;

        checkAlerts(currentPrice);
    }, [currentPrice, alerts]);

    /**
     * Load alerts from localStorage
     */
    const loadAlerts = useCallback(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                setAlerts([]);
                return;
            }

            const allAlerts: Record<string, PriceAlert[]> = JSON.parse(stored);
            setAlerts(allAlerts[symbol] || []);
        } catch (error) {
            console.error('[Alerts] Failed to load alerts:', error);
            setAlerts([]);
        }
    }, [symbol]);

    /**
     * Save alerts to localStorage
     */
    const saveAlerts = useCallback((symbolAlerts: PriceAlert[]) => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const allAlerts: Record<string, PriceAlert[]> = stored ? JSON.parse(stored) : {};

            allAlerts[symbol] = symbolAlerts;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allAlerts));
        } catch (error) {
            console.error('[Alerts] Failed to save alerts:', error);
        }
    }, [symbol]);

    /**
     * Create a new price alert
     */
    const createAlert = useCallback((targetPrice: number, direction: 'above' | 'below') => {
        const newAlert: PriceAlert = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            symbol,
            targetPrice,
            direction,
            createdAt: Date.now(),
            triggered: false,
        };

        const updatedAlerts = [...alerts, newAlert];
        setAlerts(updatedAlerts);
        saveAlerts(updatedAlerts);

        console.log('[Alerts] Created alert:', newAlert);
        return newAlert;
    }, [alerts, symbol, saveAlerts]);

    /**
     * Delete an alert by ID
     */
    const deleteAlert = useCallback((id: string) => {
        const updatedAlerts = alerts.filter(a => a.id !== id);
        setAlerts(updatedAlerts);
        saveAlerts(updatedAlerts);

        console.log('[Alerts] Deleted alert:', id);
    }, [alerts, saveAlerts]);

    /**
     * Check alerts against current price and trigger notifications
     */
    const checkAlerts = useCallback((price: number) => {
        let triggered = false;

        const updatedAlerts = alerts.map(alert => {
            // Skip already triggered alerts
            if (alert.triggered) return alert;

            // Check if alert condition is met
            const shouldTrigger =
                (alert.direction === 'above' && price >= alert.targetPrice) ||
                (alert.direction === 'below' && price <= alert.targetPrice);

            if (shouldTrigger) {
                console.log('[Alerts] Alert triggered:', alert);
                showPriceAlert(symbol, price, alert.targetPrice, alert.direction);
                triggered = true;

                return { ...alert, triggered: true };
            }

            return alert;
        });

        if (triggered) {
            setAlerts(updatedAlerts);
            saveAlerts(updatedAlerts);
        }
    }, [alerts, symbol, saveAlerts]);

    /**
     * Get active (non-triggered) alerts
     */
    const activeAlerts = alerts.filter(a => !a.triggered);

    /**
     * Get triggered alerts
     */
    const triggeredAlerts = alerts.filter(a => a.triggered);

    return {
        alerts: activeAlerts,
        triggeredAlerts,
        createAlert,
        deleteAlert,
        loadAlerts,
    };
}
