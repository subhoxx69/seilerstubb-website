import { NextRequest, NextResponse } from 'next/server';
import { closeThread } from '@/lib/firebase/contact-thread-service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MAIN_ADMIN_EMAILS } from '@/lib/firebase/admin-constants';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { threadId } = body;

    if (!threadId) {
      return NextResponse.json(
        { error: 'threadId is required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let uid = '';
    let email = '';

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
      email = payload.email || '';

      if (!uid) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Token verification failed' },
        { status: 401 }
      );
    }

    // Check admin role
    if (!MAIN_ADMIN_EMAILS.includes(email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Verify thread exists
    const threadRef = doc(db, 'contactThreads', threadId);
    const threadSnap = await getDoc(threadRef);

    if (!threadSnap.exists()) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Close thread
    await closeThread(threadId);

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in close thread:', error);
    return NextResponse.json(
      { error: 'Failed to close thread' },
      { status: 500 }
    );
  }
}
