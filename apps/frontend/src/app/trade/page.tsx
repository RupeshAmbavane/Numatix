'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TradeRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to default symbol
    router.push('/trade/BTCUSDT');
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-bg-primary flex items-center justify-center">
      <div className="text-gray-900 dark:text-text-primary">
        Loading trading platform...
      </div>
    </div>
  );
}
