'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, setToken } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    binanceApiKey: '',
    binanceSecretKey: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await register(formData);
      setToken(response.token);
      router.push('/trade');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">
        <div className="bg-bg-secondary rounded-lg shadow-xl p-8 border border-border-color">
          <h1 className="text-2xl font-bold text-text-primary mb-6 text-center">
            Trading Platform
          </h1>
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Register
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-color rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-color rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
              />
            </div>

            <div>
              <label htmlFor="binanceApiKey" className="block text-sm font-medium text-text-secondary mb-2">
                Binance Testnet API Key
              </label>
              <input
                id="binanceApiKey"
                type="text"
                value={formData.binanceApiKey}
                onChange={(e) => setFormData({ ...formData, binanceApiKey: e.target.value })}
                required
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-color rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
              />
            </div>

            <div>
              <label htmlFor="binanceSecretKey" className="block text-sm font-medium text-text-secondary mb-2">
                Binance Testnet Secret Key
              </label>
              <input
                id="binanceSecretKey"
                type="password"
                value={formData.binanceSecretKey}
                onChange={(e) => setFormData({ ...formData, binanceSecretKey: e.target.value })}
                required
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-color rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-accent-green text-bg-primary font-semibold rounded hover:bg-accent-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-text-secondary text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-green hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

