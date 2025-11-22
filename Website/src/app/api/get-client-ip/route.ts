import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/get-client-ip
 * Returns the client's IP address
 * Used for tracking non-logged-in users in reservations
 */
export async function GET(request: NextRequest) {
  try {
    const clientIP =
      (request.headers.get('cf-connecting-ip') as string) ||
      (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() as string) ||
      (request.headers.get('x-real-ip') as string) ||
      'unknown';

    return NextResponse.json(
      {
        ip: clientIP,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting client IP:', error);
    return NextResponse.json(
      {
        ip: 'unknown',
        success: false,
      },
      { status: 500 }
    );
  }
}
