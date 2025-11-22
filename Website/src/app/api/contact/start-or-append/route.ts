import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, limit, getDocs, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAZCHQpX6IMONGeECKOhQLJlhyfY5osbkY",
  authDomain: "seilerstubb-6731f.firebaseapp.com",
  projectId: "seilerstubb-6731f",
  storageBucket: "seilerstubb-6731f.firebasestorage.app",
  messagingSenderId: "951021513285",
  appId: "1:951021513285:web:4cf7bacdea3da39698512c",
  measurementId: "G-CW6K221EJE"
};

// Initialize Firebase on server
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

// Rate limiting: Check thread creation limit (2 threads per 24 hours)
const THREADS_PER_24_HOURS = 2;
const RATE_LIMIT_WINDOW_24H = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function checkThreadCreationLimit(userId: string, db: any): Promise<{ allowed: boolean; reason?: string }> {
  try {
    console.log(`🔍 Checking thread creation limit for user: ${userId}`);
    
    // Get all open threads created by this user in the last 24 hours
    const now = Date.now();
    const twentyFourHoursAgo = now - RATE_LIMIT_WINDOW_24H;
    
    const threadsQuery = query(
      collection(db, 'contactThreads'),
      where('userId', '==', userId),
      where('isOpen', '==', true)
    );
    
    const threadsSnapshot = await getDocs(threadsQuery);
    
    // Filter threads created in the last 24 hours
    const recentThreads = threadsSnapshot.docs.filter(doc => {
      const createdAt = doc.data().createdAt;
      const createdAtMs = createdAt.seconds * 1000 + createdAt.nanoseconds / 1000000;
      return createdAtMs > twentyFourHoursAgo;
    });
    
    console.log(`   📊 Recent open threads (last 24h): ${recentThreads.length}/${THREADS_PER_24_HOURS}`);
    
    // If user already has an open thread, they can continue using it (don't create new)
    if (recentThreads.length > 0) {
      console.log(`   ✅ User has ${recentThreads.length} open thread(s) - can append to existing`);
      return { allowed: true };
    }
    
    // Check if user has created 2 threads already in last 24 hours (including closed ones)
    const allThreadsQuery = query(
      collection(db, 'contactThreads'),
      where('userId', '==', userId)
    );
    
    const allThreadsSnapshot = await getDocs(allThreadsQuery);
    const recentAllThreads = allThreadsSnapshot.docs.filter(doc => {
      const createdAt = doc.data().createdAt;
      const createdAtMs = createdAt.seconds * 1000 + createdAt.nanoseconds / 1000000;
      return createdAtMs > twentyFourHoursAgo;
    });
    
    console.log(`   📊 Total threads created (last 24h): ${recentAllThreads.length}/${THREADS_PER_24_HOURS}`);
    
    if (recentAllThreads.length >= THREADS_PER_24_HOURS) {
      console.log(`   ❌ Rate limit exceeded: User has reached ${THREADS_PER_24_HOURS} threads in 24 hours`);
      return { 
        allowed: false, 
        reason: `You can only create ${THREADS_PER_24_HOURS} contact threads per 24 hours. Please wait before creating a new thread.` 
      };
    }
    
    console.log(`   ✅ Thread creation allowed`);
    return { allowed: true };
  } catch (err) {
    console.error('❌ Error checking thread limit:', err);
    // On error, allow the request to proceed
    return { allowed: true };
  }
}

// Auto-close inactive threads (no messages for 24 hours)
async function closeInactiveThreads(db: any): Promise<void> {
  try {
    console.log('\n🧹 Checking for inactive threads to auto-close...');
    
    const now = Date.now();
    const twentyFourHoursAgo = now - RATE_LIMIT_WINDOW_24H;
    
    // Get all open threads
    const threadsQuery = query(
      collection(db, 'contactThreads'),
      where('isOpen', '==', true)
    );
    
    const threadsSnapshot = await getDocs(threadsQuery);
    let closedCount = 0;
    
    for (const threadDoc of threadsSnapshot.docs) {
      const threadData = threadDoc.data();
      const lastMessageAt = threadData.lastMessageAt;
      const lastMessageAtMs = lastMessageAt.seconds * 1000 + lastMessageAt.nanoseconds / 1000000;
      
      // If no message activity for 24 hours, close the thread
      if (lastMessageAtMs < twentyFourHoursAgo) {
        console.log(`   ⏱️ Thread ${threadDoc.id} inactive since ${new Date(lastMessageAtMs).toISOString()}`);
        
        await updateDoc(doc(db, 'contactThreads', threadDoc.id), {
          isOpen: false,
          closedAt: Timestamp.now(),
          closedReason: 'auto-closed-inactivity'
        });
        
        closedCount++;
        console.log(`   ✅ Auto-closed thread: ${threadDoc.id}`);
      }
    }
    
    if (closedCount > 0) {
      console.log(`   📊 Auto-closed ${closedCount} inactive thread(s)`);
    } else {
      console.log(`   ✅ No inactive threads to close`);
    }
  } catch (err) {
    console.error('❌ Error closing inactive threads:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n🚀 ===== CONTACT FORM SUBMISSION START (CLIENT SDK) =====');
    
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

    // Decode JWT to get UID (note: not verifying signature on server, client already did)
    let uid = '';
    let userEmail = email;
    
    try {
      console.log(`🔍 Decoding ID token...`);
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        console.error('❌ Invalid token format - not 3 parts');
        return NextResponse.json(
          { error: 'Invalid token format' },
          { status: 401 }
        );
      }

      // Decode payload
      let payload;
      try {
        payload = JSON.parse(
          Buffer.from(parts[1], 'base64').toString('utf-8')
        );
      } catch (e) {
        console.error('❌ Base64 decode failed:', e);
        // Try with URL-safe base64 decoding
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
      }
      
      console.log(`✅ Token decoded successfully`);
      console.log(`   📋 Token Details:`);
      console.log(`      - UID: ${payload.sub}`);
      console.log(`      - Email: ${payload.email}`);
      
      uid = payload.sub;
      userEmail = payload.email || email;

      if (!uid) {
        console.error('❌ No UID in token payload');
        return NextResponse.json(
          { error: 'Invalid token - no user ID' },
          { status: 401 }
        );
      }
      
      console.log(`✅ UID extracted: ${uid}`);
    } catch (err) {
      console.error('❌ Token decode error:', err);
      if (err instanceof Error) {
        console.error(`   Error message: ${err.message}`);
      }
      return NextResponse.json(
        { error: 'Token verification failed', details: err instanceof Error ? err.message : 'Unknown error' },
        { status: 401 }
      );
    }

    // Auto-close any inactive threads (no messages for 24 hours)
    await closeInactiveThreads(db);

    // Check thread creation limit (2 threads per 24 hours)
    console.log('\n⏱️ Checking thread creation limit...');
    const limitCheck = await checkThreadCreationLimit(uid, db);
    if (!limitCheck.allowed) {
      console.warn(`⚠️ ${limitCheck.reason}`);
      return NextResponse.json(
        { error: limitCheck.reason || 'Thread creation limit exceeded' },
        { status: 429 }
      );
    }

    console.log('✅ Thread creation limit check passed');

    // Get or create thread using Firestore client SDK
    let threadId: string;
    try {
      console.log(`\n📨 Getting or creating contact thread...`);
      console.log(`   - User ID: ${uid}`);
      console.log(`   - User Name: ${name}`);
      console.log(`   - User Email: ${userEmail}`);
      
      // Search for existing open thread
      const threadsQuery = query(
        collection(db, 'contactThreads'),
        where('userId', '==', uid),
        where('isOpen', '==', true),
        limit(1)
      );

      const threadsSnapshot = await getDocs(threadsQuery);

      if (!threadsSnapshot.empty) {
        // Use existing thread
        threadId = threadsSnapshot.docs[0].id;
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
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          isOpen: true,
          lastActor: 'user',
          messageCount: 0,
        };

        console.log(`   Data being written:`, JSON.stringify(threadData, null, 2));

        const newThread = await addDoc(collection(db, 'contactThreads'), threadData);
        threadId = newThread.id;
        console.log(`✅ Thread created successfully: ${threadId}`);
      }
    } catch (threadErr) {
      console.error('\n❌ ERROR creating/getting thread:');
      console.error(`   Full Error: ${threadErr}`);
      if (threadErr instanceof Error) {
        console.error(`   Message: ${threadErr.message}`);
        console.error(`   Code: ${(threadErr as any).code}`);
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
    let isNewThread = false;
    try {
      console.log(`\n📩 Adding message to thread ${threadId}...`);
      
      const messageData = {
        sender: 'user',
        text: text,
        createdAt: Timestamp.now(),
        status: 'sent',
      };

      console.log(`   Message data:`, JSON.stringify(messageData, null, 2));

      const messagesRef = collection(db, 'contactThreads', threadId, 'messages');
      const newMessage = await addDoc(messagesRef, messageData);

      messageId = newMessage.id;
      console.log(`✅ Message added successfully: ${messageId}`);

      // Get messages count to check if thread was just created
      const existingMessagesSnapshot = await getDocs(messagesRef);
      isNewThread = existingMessagesSnapshot.size <= 1; // Just the user's message

      // Add auto-reply message (only if thread was just created)
      if (isNewThread) {
        console.log(`\n🤖 Adding auto-reply message...`);
        const autoReplyData = {
          sender: 'admin',
          text: `Vielen Dank für Ihre Nachricht! 

Wir haben Ihre Kontaktanfrage erhalten und werden uns innerhalb von 24 Stunden bei Ihnen melden. 

Bitte beachten Sie: Sie erhalten KEINE E-Mail-Benachrichtigung. Um Antworten von unserem Support-Team zu erhalten, müssen Sie regelmäßig diese Website besuchen und Ihren Nachrichten-Thread hier überprüfen.

Herzliche Grüße,
Seilerstubb Support-Team`,
          createdAt: Timestamp.now(),
          status: 'sent',
        };

        await addDoc(messagesRef, autoReplyData);
        console.log(`✅ Auto-reply message added`);
      }

      // Update thread metadata
      console.log(`   📊 Updating thread metadata...`);
      const messagesSnapshot = await getDocs(messagesRef);
      const threadRef = doc(db, 'contactThreads', threadId);

      await updateDoc(threadRef, {
        lastMessageAt: Timestamp.now(),
        lastActor: isNewThread ? 'system' : 'user',
        messageCount: messagesSnapshot.size,
      });
      
      console.log(`   ✅ Thread metadata updated`);
    } catch (msgErr) {
      console.error('\n❌ ERROR adding message:');
      console.error(`   Full Error: ${msgErr}`);
      if (msgErr instanceof Error) {
        console.error(`   Message: ${msgErr.message}`);
        console.error(`   Code: ${(msgErr as any).code}`);
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
    console.log('✅ Message ID:', messageId);
    console.log('✅ Thread ID:', threadId);
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
