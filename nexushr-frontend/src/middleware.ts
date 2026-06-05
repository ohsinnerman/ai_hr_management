import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected path prefixes — require authentication.
const PROTECTED_PATHS = ['/admin', '/hr', '/recruiter', '/manager', '/employee'];
const AUTH_PATHS = ['/login', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The accessToken lives in Zustand memory (not a cookie). The only cookie is the
  // httpOnly refreshToken — we use its presence as a proxy for "is logged in".
  const hasRefreshToken = request.cookies.has('refreshToken');

  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtectedPath && !hasRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && hasRefreshToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
