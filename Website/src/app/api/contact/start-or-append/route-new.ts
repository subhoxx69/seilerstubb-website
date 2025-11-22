import { NextRequest, NextResponse } from 'next/server';
// DEPRECATED: This file is a backup and should not be used
// Use ./route.ts instead (which uses client SDK)
// import { adminDb, adminAuth } from '@/lib/firebase/admin-config';
import { FieldValue } from 'firebase-admin/firestore';

// Dummy admin objects since admin-config no longer exists
const adminDb = null as any;
const adminAuth = null as any;

// Simple rate limiting: store last submission time in memory (per deployment)
const userLastSubmission: Map<string, number> = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_MESSAGES_PER_WINDOW = 3;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const lastTime = userLastSubmission.get(userId);

  if (!lastTime) {
    userLastSubmission.set(userId, now);
    return true;
  }

  if (now - lastTime < RATE_LIMIT_WINDOW) {
    // Still in rate limit window, increment count or reject
    const count = (userLastSubmission.get(`${userId}_count`) as number) || 1;
    if (count >= MAX_MESSAGES_PER_WINDOW) {
      return false;
    }
    userLastSubmission.set(`${userId}_count`, count + 1);
    return true;
  }

  // Reset rate limit window
  userLastSubmission.set(userId, now);
  userLastSubmission.delete(`${userId}_count`);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n🚀 ===== CONTACT FORM SUBMISSION START (ADMIN SDK) =====');
    
    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('❌ JSON parse error:', parseErr);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { name, email, phone, text, subject } = body;
    console.log(`📝 Form data received:`);
    console.log(`   - Name: ${name}`);
    console.log(`   - Email: ${email}`);
    console.log(`   - Phone: ${phone}`);
    console.log(`   - Subject: ${subject}`);
    console.log(`   - Text length: ${text?.length || 0}`);

    // Validate inputs
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.error('❌ Text validation failed');
      return NextResponse.json(
        { error: 'Text is required and must be non-empty' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      console.error('❌ Text too long');
      return NextResponse.json(
        { error: 'Message too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      console.error('❌ Name validation failed');
      return NextResponse.json(
        { error: 'Name is required (min 2 characters)' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error('❌ Email validation failed');
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 3) {
      console.error('❌ Phone validation failed');
      return NextResponse.json(
        { error: 'Phone is required (min 3 characters)' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      console.error('❌ Subject validation failed');
      return NextResponse.json(
        { error: 'Subject is required (min 3 characters)' },
        { status: 400 }
      );
    }

    console.log('✅ All input validations passed');

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    console.log(`\n🔐 Authorization header: ${authHeader ? '✅ Present' : '❌ Missing'}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header or invalid format');
      return NextResponse.json(
        { error: 'Unauthorized - missing auth token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log(`   Token length: ${token.length} characters`);

    // Verify token with Firebase Admin SDK
    let decodedToken;
    try {
      console.log(`🔍 Verifying ID token with Firebase Admin SDK...`);
      decodedToken = await adminAuth.verifyIdToken(token);
      console.log(`✅ Token verified successfully`);
      console.log(`   📋 Token Details:`);
      console.log(`      - UID: ${decodedToken.uid}`);
      console.log(`      - Email: ${decodedToken.email}`);
      console.log(`      - Email Verified: ${decodedToken.email_verified}`);
      console.log(`      - Auth Time: ${new Date(decodedToken.auth_time * 1000).toISOString()}`);
      console.log(`      - Token Expiry: ${new Date(decodedToken.exp * 1000).toISOString()}`);
    } catch (err) {
      console.error('❌ Token verification failed:', err);
      if (err instanceof Error) {
        console.error(`   Error Message: ${err.message}`);
      }
      return NextResponse.json(
        { error: 'Invalid or expired token', details: err instanceof Error ? err.message : 'Unknown error' },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;
    const userEmail = decodedToken.email || email;

    // Rate limit check
    if (!checkRateLimit(uid)) {
      console.warn(`⚠️ Rate limit exceeded for user: ${uid}`);
      return NextResponse.json(
        { error: 'Too many messages. Please wait before sending another.' },
        { status: 429 }
      );
    }

    console.log('✅ Rate limit check passed');

    // Get or create thread using Admin SDK
    let threadId: string;
    try {
      console.log(`\n📨 Getting or creating contact thread...`);
      console.log(`   - User ID: ${uid}`);
      console.log(`   - User Name: ${name}`);
      console.log(`   - User Email: ${userEmail}`);
      
      // Search for existing open thread
      const threadsQuery = await adminDb
        .collection('contactThreads')
        .where('userId', '==', uid)
        .where('isOpen', '==', true)
        .limit(1)
        .get();

      if (!threadsQuery.empty) {
        // Use existing thread
        threadId = threadsQuery.docs[0].id;
        console.log(`✅ Found existing thread: ${threadId}`);
      } else {
        // Create new thread
        console.log(`📝 Creating NEW thread...`);
        const threadData = {
          userId: uid,
          userName: name,
          userEmail: userEmail,
          userPhone: phone,
          subject: subject || 'Kontaktanfrage',
          createdAt: new Date(),
          lastMessageAt: new Date(),
          isOpen: true,
          lastActor: 'user',
          messageCount: 0,
        };

        console.log(`   Data being written:`, JSON.stringify(threadData, null, 2));

        const newThread = await adminDb.collection('contactThreads').add(threadData);
        threadId = newThread.id;
        console.log(`✅ Thread created successfully: ${threadId}`);
      }
    } catch (threadErr) {
      console.error('\n❌ ERROR creating/getting thread:');
      console.error(`   Full Error: ${threadErr}`);
      if (threadErr instanceof Error) {
        console.error(`   Message: ${threadErr.message}`);
        console.error(`   Code: ${(threadErr as any).code}`);
        console.error(`   Stack: ${threadErr.stack}`);
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create thread: ' + (threadErr instanceof Error ? threadErr.message : 'Unknown error'),
          details: threadErr instanceof Error ? threadErr.message : 'Unknown'
        },
        { status: 500 }
      );
    }

    // Add message to thread
    let messageId: string;
    try {
      console.log(`\n📩 Adding message to thread ${threadId}...`);
      
      const messageData = {
        sender: 'user',
        text: text,
        createdAt: new Date(),
        status: 'sent',
      };

      console.log(`   Message data:`, JSON.stringify(messageData, null, 2));

      const newMessage = await adminDb
        .collection('contactThreads')
        .doc(threadId)
        .collection('messages')
        .add(messageData);

      messageId = newMessage.id;
      console.log(`✅ Message added successfully: ${messageId}`);

      // Update thread metadata
      console.log(`   📊 Updating thread metadata...`);
      const messagesSnapshot = await adminDb
        .collection('contactThreads')
        .doc(threadId)
        .collection('messages')
        .get();

      await adminDb.collection('contactThreads').doc(threadId).update({
        lastMessageAt: new Date(),
        lastActor: 'user',
        messageCount: messagesSnapshot.size,
      });
      
      console.log(`   ✅ Thread metadata updated`);
    } catch (msgErr) {
      console.error('\n❌ ERROR adding message:');
      console.error(`   Full Error: ${msgErr}`);
      if (msgErr instanceof Error) {
        console.error(`   Message: ${msgErr.message}`);
        console.error(`   Code: ${(msgErr as any).code}`);
        console.error(`   Stack: ${msgErr.stack}`);
      }
      return NextResponse.json(
        { 
          error: 'Failed to add message: ' + (msgErr instanceof Error ? msgErr.message : 'Unknown error'),
          details: msgErr instanceof Error ? msgErr.message : 'Unknown'
        },
        { status: 500 }
      );
    }

    console.log(`\n✅ SUCCESS: Created thread and message for user ${uid}`);
    console.log('🚀 ===== CONTACT FORM SUBMISSION END =====\n');
    
    return NextResponse.json(
      {
        success: true,
        threadId: threadId,
        messageId: messageId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('\n❌ Unhandled error in start-or-append:', error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
    return NextResponse.json(
      { error: 'Failed to send message: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
