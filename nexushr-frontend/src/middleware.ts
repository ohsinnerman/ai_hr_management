import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected path prefixes — require authentication.
const PROTECTED_PATHS = ['/admin', '/hr', '/recruiter', '/manager', '/employee'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The accessToken lives in Zustand memory (not a cookie). The only cookie is the
  // httpOnly refreshToken — we use its presence as a coarse "might be logged in" proxy.
  const hasRefreshToken = request.cookies.has('refreshToken');

  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  // Only guard protected routes. We deliberately do NOT bounce authenticated-looking
  // users away from /login: the refreshToken cookie can be stale/expired (cookie present
  // but token dead), and bouncing /login → / created an infinite redirect loop with the
  // client-side session check. The login page + home page handle "already logged in"
  // themselves once the real session is verified via /auth/me.
  if (isProtectedPath && !hasRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
