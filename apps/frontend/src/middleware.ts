import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow public routes
  if (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/register' ||
    request.nextUrl.pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Check for token in protected routes
  const token = request.cookies.get('token')?.value;

  if (!token && request.nextUrl.pathname.startsWith('/trade')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/trade/:path*'],
};

