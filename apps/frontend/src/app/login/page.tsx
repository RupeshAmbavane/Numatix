'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (loading || isSubmitting) {
      console.log('Already submitting, ignoring...');
      return;
    }
    
    setError('');
    setLoading(true);
    setIsSubmitting(true);

    try {
      console.log('Starting login request...');
      const response = await login({ email, password });
      console.log('Login response received:', response);
      
      // Save token
      setToken(response.token);
      console.log('Token saved to localStorage');
      
      // Verify token was saved
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        throw new Error('Failed to save token');
      }
      
      // Navigate to trade page using window.location for a hard redirect
      console.log('Navigating to /trade');
      window.location.href = '/trade';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      setLoading(false);
      setIsSubmitting(false);
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
            Login
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-color rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-green"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-accent-green text-bg-primary font-semibold rounded hover:bg-accent-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-text-secondary text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-accent-green hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

