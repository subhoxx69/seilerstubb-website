import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch,
  startAt,
  endAt,
  Unsubscribe,
  DocumentData,
} from 'firebase/firestore';

// Helper to convert Firestore Timestamp to serializable format
export function serializeTimestamp(ts: any): string | number {
  if (ts instanceof Timestamp) {
    return ts.toMillis();
  }
  if (ts && typeof ts.toDate === 'function') {
    return ts.toDate().getTime();
  }
  return ts;
}

export interface ContactThread {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  createdAt: any;
  lastMessageAt: any;
  isOpen: boolean;
  lastActor: 'user' | 'admin';
  subject?: string;
  messageCount: number;
}

export interface ContactMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  createdAt: any;
  status: 'sent' | 'delivered' | 'seen';
  // Attachment support
  image?: {
    url: string;
    name: string;
    size: number;
  };
  pageLink?: {
    url: string;
    title?: string;
  };
  reservation?: {
    reservationId: string;
    date: string;
    time: string;
    people: number;
    status: string;
  };
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'contact-reply';
  threadId: string;
  unreadCount: number;
  lastAt: any;
}

// Helper to serialize document data for JSON response
function serializeDoc(docData: DocumentData): any {
  const result: any = {};
  for (const [key, value] of Object.entries(docData)) {
    if (value instanceof Timestamp) {
      result[key] = value.toMillis();
    } else if (value && typeof value.toDate === 'function') {
      result[key] = value.toDate().getTime();
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Get or create user's open thread
 */
export async function getOrCreateUserThread(
  userId: string,
  userName: string,
  userEmail: string,
  userPhone: string,
  subject?: string
): Promise<ContactThread> {
  try {
    console.log(`\n🔍 [getOrCreateUserThread] Starting...`);
    console.log(`   User ID: ${userId}`);
    console.log(`   User Name: ${userName}`);
    console.log(`   User Email: ${userEmail}`);
    
    // First, try to find an open thread with a simple userId query
    const q = query(
      collection(db, 'contactThreads'),
      where('userId', '==', userId),
      where('isOpen', '==', true)
    );

    console.log(`   🔍 Searching for existing open threads...`);
    const snapshot = await getDocs(q);
    console.log(`   ✅ Query successful. Found ${snapshot.docs.length} existing open threads`);

    if (snapshot.docs.length > 0) {
      const doc = snapshot.docs[0];
      console.log(`   ✅ Using existing thread: ${doc.id}`);
      return {
        id: doc.id,
        ...doc.data(),
      } as ContactThread;
    }

    // Create new thread
    console.log(`\n   📝 Creating NEW thread...`);
    console.log(`      - Name: ${userName}`);
    console.log(`      - Email: ${userEmail}`);
    console.log(`      - Phone: ${userPhone}`);
    console.log(`      - Subject: ${subject || 'Kontaktanfrage'}`);
    
    const threadData = {
      userId,
      userName,
      userEmail,
      userPhone,
      subject: subject || 'Kontaktanfrage',
      createdAt: Timestamp.now(),
      lastMessageAt: Timestamp.now(),
      isOpen: true,
      lastActor: 'user',
      messageCount: 0,
    };
    
    console.log(`   📤 Attempting addDoc to contactThreads collection...`);
    console.log(`      Data being written:`, JSON.stringify(threadData, null, 2));
    
    let threadRef;
    try {
      threadRef = await addDoc(collection(db, 'contactThreads'), threadData);
      console.log(`   ✅ addDoc succeeded! Thread ID: ${threadRef.id}`);
    } catch (addDocErr) {
      console.error(`   ❌ addDoc FAILED with error:`, addDocErr);
      if (addDocErr instanceof Error) {
        console.error(`      Error Code: ${(addDocErr as any).code}`);
        console.error(`      Error Message: ${addDocErr.message}`);
        console.error(`      Full Error:`, JSON.stringify(addDocErr, null, 2));
      }
      throw addDocErr;
    }

    console.log(`✅ Thread created successfully`);

    return {
      id: threadRef.id,
      userId,
      userName,
      userEmail,
      userPhone,
      subject: subject || 'Kontaktanfrage',
      createdAt: Timestamp.now(),
      lastMessageAt: Timestamp.now(),
      isOpen: true,
      lastActor: 'user',
      messageCount: 0,
    };
  } catch (error) {
    console.error('\n❌ [getOrCreateUserThread] ERROR:', error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Code: ${(error as any).code}`);
      console.error(`   Details: ${JSON.stringify(error, null, 2)}`);
    }
    throw error;
  }
}

/**
 * Add message to thread
 */
export async function addMessageToThread(
  threadId: string,
  sender: 'user' | 'admin',
  text: string
): Promise<string> {
  try {
    const threadRef = doc(db, 'contactThreads', threadId);
    const messagesRef = collection(threadRef, 'messages');

    const messageRef = await addDoc(messagesRef, {
      sender,
      text,
      createdAt: Timestamp.now(),
      status: 'sent',
    });

    // Update thread metadata
    await updateDoc(threadRef, {
      lastMessageAt: Timestamp.now(),
      lastActor: sender,
      messageCount: (await getDocs(messagesRef)).size,
    });

    // If admin replied, create/update notification
    if (sender === 'admin') {
      const userNotifQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', (await getDoc(threadRef)).data()?.userId),
        where('threadId', '==', threadId)
      );

      const notifSnap = await getDocs(userNotifQuery);

      if (notifSnap.docs.length > 0) {
        const notifDoc = notifSnap.docs[0];
        await updateDoc(notifDoc.ref, {
          unreadCount: (notifDoc.data().unreadCount || 0) + 1,
          lastAt: Timestamp.now(),
        });
      } else {
        const threadData = (await getDoc(threadRef)).data();
        await addDoc(collection(db, 'notifications'), {
          userId: threadData?.userId,
          type: 'contact-reply',
          threadId,
          unreadCount: 1,
          lastAt: Timestamp.now(),
        });
      }
    }

    return messageRef.id;
  } catch (error) {
    console.error('Error adding message to thread:', error);
    throw error;
  }
}

/**
 * Get thread messages (paginated)
 */
export async function getThreadMessages(threadId: string, limitCount = 50) {
  try {
    const threadRef = doc(db, 'contactThreads', threadId);
    const messagesRef = collection(threadRef, 'messages');

    const q = query(
      messagesRef,
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...serializeDoc(doc.data()),
    })) as ContactMessage[];

    // Sort by createdAt on client side
    messages.sort((a, b) => {
      const aTime = a.createdAt || 0;
      const bTime = b.createdAt || 0;
      return Number(aTime) - Number(bTime);
    });

    return messages;
  } catch (error) {
    console.error('Error getting thread messages:', error);
    throw error;
  }
}

/**
 * Get user's threads
 */
export async function getUserThreads(userId: string) {
  try {
    // Simple query by userId only - will be sorted in client
    const q = query(
      collection(db, 'contactThreads'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);

    const threads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...serializeDoc(doc.data()),
    })) as ContactThread[];

    // Sort by lastMessageAt on client side
    threads.sort((a, b) => {
      const aTime = a.lastMessageAt || 0;
      const bTime = b.lastMessageAt || 0;
      return Number(bTime) - Number(aTime);
    });

    return threads;
  } catch (error) {
    console.error('Error getting user threads:', error);
    throw error;
  }
}

/**
 * Subscribe to user's threads (real-time)
 */
export function subscribeToUserThreads(
  userId: string,
  callback: (threads: ContactThread[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'contactThreads'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    snapshot => {
      const threads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...serializeDoc(doc.data()),
      })) as ContactThread[];

      // Sort by lastMessageAt on client side
      threads.sort((a, b) => {
        const aTime = a.lastMessageAt || 0;
        const bTime = b.lastMessageAt || 0;
        return Number(bTime) - Number(aTime);
      });

      callback(threads);
    },
    onError
  );
}

/**
 * Subscribe to thread messages (real-time)
 */
export function subscribeToThreadMessages(
  threadId: string,
  callback: (messages: ContactMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const threadRef = doc(db, 'contactThreads', threadId);
  const messagesRef = collection(threadRef, 'messages');

  const q = query(messagesRef);

  return onSnapshot(
    q,
    snapshot => {
      console.log(`📨 Firestore snapshot received for thread ${threadId}`);
      console.log(`   Total documents in snapshot: ${snapshot.docs.length}`);
      
      const messages = snapshot.docs.map(doc => {
        const data = serializeDoc(doc.data());
        console.log(`   - Message ID: ${doc.id}, Sender: ${data.sender}, Text: ${data.text.substring(0, 30)}...`);
        return {
          id: doc.id,
          ...data,
        };
      }) as ContactMessage[];

      // Sort by createdAt on client side
      messages.sort((a, b) => {
        const aTime = a.createdAt || 0;
        const bTime = b.createdAt || 0;
        return Number(aTime) - Number(bTime);
      });

      console.log(`✅ Calling callback with ${messages.length} messages`);
      callback(messages);
    },
    error => {
      console.error(`❌ Error loading messages for thread ${threadId}:`, error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to all threads for admin
 */
export function subscribeToAllThreads(
  callback: (threads: ContactThread[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'contactThreads')
  );

  return onSnapshot(
    q,
    snapshot => {
      const threads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...serializeDoc(doc.data()),
      })) as ContactThread[];

      // Sort by lastMessageAt on client side
      threads.sort((a, b) => {
        const aTime = a.lastMessageAt || 0;
        const bTime = b.lastMessageAt || 0;
        return Number(bTime) - Number(aTime);
      });

      callback(threads);
    },
    onError
  );
}

/**
 * Subscribe to user notifications
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: UserNotification[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    snapshot => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...serializeDoc(doc.data()),
      })) as UserNotification[];
      callback(notifications);
    },
    onError
  );
}

/**
 * Close thread
 */
export async function closeThread(threadId: string): Promise<void> {
  try {
    const threadRef = doc(db, 'contactThreads', threadId);
    await updateDoc(threadRef, {
      isOpen: false,
    });
  } catch (error) {
    console.error('Error closing thread:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      unreadCount: 0,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}
