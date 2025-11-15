import { NextRequest, NextResponse } from 'next/server';
import { getThreadMessages } from '@/lib/firebase/contact-thread-service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MAIN_ADMIN_EMAILS } from '@/lib/firebase/admin-constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;

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

    // Check if user owns thread or is admin
    const threadRef = doc(db, 'contactThreads', threadId);
    const threadSnap = await getDoc(threadRef);

    if (!threadSnap.exists()) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    const threadData = threadSnap.data();
    const isOwner = threadData.userId === uid;
    const isAdmin = MAIN_ADMIN_EMAILS.includes(email);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const messages = await getThreadMessages(threadId);

    return NextResponse.json(
      { messages, thread: threadData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in thread GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}
