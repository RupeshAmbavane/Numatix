const API_URL = process.env.NEXT_PUBLIC_API_URL!;


export interface RegisterData {
  email: string;
  password: string;
  binanceApiKey: string;
  binanceSecretKey: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface OrderData {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET';
  quantity: number;
  price?: number;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Backend API is not responding correctly. Make sure the backend is running on ${API_URL}. Received: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(`Cannot connect to backend API at ${API_URL}. Make sure the backend service is running.`);
    }
    throw error;
  }
}

export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Backend API is not responding correctly. Make sure the backend is running on ${API_URL}. Received: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      const errorData = await response.json();
      // Handle both single error string and error object
      const errorMessage = typeof errorData.error === 'string'
        ? errorData.error
        : errorData.error?.message || JSON.stringify(errorData.error) || 'Login failed';
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(`Cannot connect to backend API at ${API_URL}. Make sure the backend service is running.`);
    }
    throw error;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;

  // Store in localStorage for client-side API calls
  localStorage.setItem('token', token);

  // Store in cookies for middleware (7 days expiry, same as JWT)
  document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;

  // Remove from localStorage
  localStorage.removeItem('token');

  // Remove from cookies
  document.cookie = 'token=; path=/; max-age=0';
}

export async function submitOrder(data: OrderData): Promise<{ orderId: string; status: string }> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/trading/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit order');
  }

  return response.json();
}

export async function getOrders(): Promise<any[]> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/trading/orders`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  return response.json();
}

export async function getPositions(): Promise<any[]> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/trading/positions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch positions');
  }

  return response.json();
}

export async function cancelOrder(orderId: string): Promise<{ message: string; orderId: string }> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/trading/orders/${orderId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel order');
  }

  return response.json();
}

