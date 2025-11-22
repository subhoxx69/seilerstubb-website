import { NextRequest, NextResponse } from 'next/server';
import { MAIN_ADMIN_EMAILS } from '@/lib/firebase/admin-constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threadId, text, image, pageLink, reservation } = body;

    if (!threadId || (!text || typeof text !== 'string' || text.trim().length === 0) && !image && !pageLink && !reservation) {
      return NextResponse.json(
        { error: 'threadId and at least text, image, pageLink, or reservation are required' },
        { status: 400 }
      );
    }

    if (text && text.length > 5000) {
      return NextResponse.json(
        { error: 'Message too long (max 5000 characters)' },
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

    // Initialize Admin SDK
    let adminApp: any;
    let adminDb: any;

    try {
      const { initializeApp, getApp } = await import('firebase-admin/app');

      try {
        adminApp = getApp();
      } catch {
        // Initialize admin app - use individual env vars
        const serviceAccount = {
          type: process.env.FIREBASE_SERVICE_ACCOUNT_TYPE,
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI,
          token_uri: process.env.FIREBASE_TOKEN_URI,
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
          client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        } as any;

        const { cert } = await import('firebase-admin/app');
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
      }

      const { getFirestore } = await import('firebase-admin/firestore');
      adminDb = getFirestore(adminApp);
    } catch (adminError) {
      console.error('Failed to initialize Admin SDK:', adminError);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify thread exists using Admin SDK
    const threadRef = adminDb.collection('contactThreads').doc(threadId);
    const threadSnap = await threadRef.get();

    if (!threadSnap.exists) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    const threadData = threadSnap.data();
    const isAdmin = MAIN_ADMIN_EMAILS.includes(email);
    const isThreadOwner = threadData.userId === uid;

    // Check permissions - must be admin or thread owner
    if (!isAdmin && !isThreadOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to reply to this thread' },
        { status: 403 }
      );
    }

    // Add message using Admin SDK (bypasses Firestore rules)
    const messageRef = await adminDb
      .collection('contactThreads')
      .doc(threadId)
      .collection('messages')
      .add({
        sender: isAdmin ? 'admin' : 'user',
        text: text || '',
        createdAt: new Date(),
        status: 'delivered',
        ...(image && { image }),
        ...(pageLink && { pageLink }),
        ...(reservation && { reservation }),
      });

    // Update thread metadata using Admin SDK
    await threadRef.update({
      lastMessageAt: new Date(),
      lastActor: isAdmin ? 'admin' : 'user',
    });

    // Create notification for opposite party if admin replies
    if (isAdmin) {
      try {
        const userNotifQuery = await adminDb
          .collection('notifications')
          .where('userId', '==', threadData.userId)
          .where('type', '==', 'contact-reply')
          .where('threadId', '==', threadId)
          .get();

        if (!userNotifQuery.empty) {
          const notifDoc = userNotifQuery.docs[0];
          await notifDoc.ref.update({
            unreadCount: (notifDoc.data().unreadCount || 0) + 1,
            lastAt: new Date(),
          });
        } else {
          await adminDb.collection('notifications').add({
            userId: threadData.userId,
            type: 'contact-reply',
            threadId,
            unreadCount: 1,
            lastAt: new Date(),
          });
        }
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't fail the entire request if notification fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        messageId: messageRef.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in contact reply:', error);
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    );
  }
}
