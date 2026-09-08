import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all routes - auth is handled client-side via useAuth
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
