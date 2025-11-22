'use server';

import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * Post admin reply to contact thread
 */
export async function postThreadReply(
  threadId: string,
  replyText: string,
  image?: { url: string; name: string; size: number } | null,
  pageLink?: { url: string; title?: string } | null,
  reservation?: {
    id: string;
    date: string;
    time: string;
    people: number;
    status: string;
  } | null
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get thread to verify it exists
    const threadRef = doc(db, 'contactThreads', threadId);
    const threadDoc = await getDoc(threadRef);

    if (!threadDoc.exists()) {
      return { success: false, error: 'Thread not found' };
    }

    // Add message to thread
    const messagesRef = collection(threadRef, 'messages');
    const messageDoc = await addDoc(messagesRef, {
      sender: 'admin',
      text: replyText,
      createdAt: Timestamp.now(),
      status: 'delivered',
      ...(image && { image }),
      ...(pageLink && { pageLink }),
      ...(reservation && { 
        reservation: {
          reservationId: reservation.id,
          date: reservation.date,
          time: reservation.time,
          people: reservation.people,
          status: reservation.status,
        }
      }),
    });

    // Update thread's last message time and actor
    await updateDoc(threadRef, {
      lastMessageAt: Timestamp.now(),
      lastActor: 'admin',
      isOpen: true,
    });

    return { success: true, messageId: messageDoc.id };
  } catch (error: any) {
    console.error('Error posting thread reply:', error);
    return { success: false, error: error.message };
  }
}

/**
 * @deprecated Use postThreadReply instead
 * Post admin reply to contact thread and create notification for user
 */
export async function postThreadReplyWithNotification(
  threadId: string,
  replyText: string,
  image?: { url: string; name: string; size: number } | null,
  pageLink?: { url: string; title?: string } | null,
  reservation?: {
    id: string;
    date: string;
    time: string;
    people: number;
    status: string;
  } | null
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Just call the plain version without notifications
  return postThreadReply(threadId, replyText, image, pageLink, reservation);
}
