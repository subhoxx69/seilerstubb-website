import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Try to extract user ID from Firebase auth cookie or token
  // For now, we'll let the API endpoints handle it client-side
  // This middleware is a placeholder for future enhancements

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
