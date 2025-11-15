import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserNotification } from '@/lib/firebase/contact-thread-service';

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
      return NextResponse.json(
        { error: 'Token verification failed' },
        { status: 401 }
      );
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', uid)
    );

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as UserNotification[];

    // Calculate total unread count
    const totalUnread = notifications.reduce(
      (sum, notif) => sum + (notif.unreadCount || 0),
      0
    );

    return NextResponse.json(
      { notifications, totalUnread },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in get notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
