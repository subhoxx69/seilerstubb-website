import { NextRequest, NextResponse } from 'next/server';
import { getUserThreads } from '@/lib/firebase/contact-thread-service';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let uid = '';

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString()
      );
      uid = payload.sub || payload.user_id;

      if (!uid) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    } catch (err) {
      console.error('Token verification error:', err);
      return NextResponse.json(
        { error: 'Token verification failed' },
        { status: 401 }
      );
    }

    let threads;
    try {
      threads = await getUserThreads(uid);
    } catch (err) {
      console.error('Error fetching threads:', err);
      return NextResponse.json(
        { error: 'Failed to fetch threads: ' + (err instanceof Error ? err.message : 'Unknown error') },
        { status: 500 }
      );
    }

    return NextResponse.json({ threads }, { status: 200 });
  } catch (error) {
    console.error('Error in my-threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
