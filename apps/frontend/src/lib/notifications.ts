// Browser notification utility for price alerts

/**
 * Request permission to show browser notifications
 * @returns Promise<boolean> - true if permission granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('[Notifications] Browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

/**
 * Show a price alert notification
 * @param symbol - Trading symbol (e.g., 'BTCUSDT')
 * @param price - Current price
 * @param targetPrice - Alert target price
 * @param direction - Alert direction ('above' or 'below')
 */
export function showPriceAlert(
    symbol: string,
    price: number,
    targetPrice: number,
    direction: 'above' | 'below'
): void {
    if (Notification.permission !== 'granted') {
        console.warn('[Notifications] Permission not granted');
        return;
    }

    const title = `🔔 Price Alert: ${symbol}`;
    const body = direction === 'above'
        ? `Price crossed above $${targetPrice.toFixed(2)}!\nCurrent: $${price.toFixed(2)}`
        : `Price crossed below $${targetPrice.toFixed(2)}!\nCurrent: $${price.toFixed(2)}`;

    const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `price-alert-${symbol}-${targetPrice}`,
        requireInteraction: true, // Notification stays until user interacts
        silent: false,
    });

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);

    // Handle notification click
    notification.onclick = () => {
        window.focus();
        notification.close();
    };
}

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
    return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
    if (!isNotificationSupported()) {
        return 'denied';
    }
    return Notification.permission;
}
