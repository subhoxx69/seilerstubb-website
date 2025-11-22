/**
 * POST /api/contact
 * Submit contact messages - saves to Firestore and creates support chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().trim().min(5).max(200),
  message: z.string().trim().min(10).max(5000),
});

function sanitizeHTML(text: string): string {
  // Remove any HTML tags to prevent injection
  return text.replace(/<[^>]*>/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ContactSchema.parse(body);

    // Sanitize message content
    const sanitizedMessage = sanitizeHTML(validated.message);
    const sanitizedSubject = sanitizeHTML(validated.subject);

    // Get the current user ID from the Authorization header (if logged in)
    const authHeader = request.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.substring(7);
        // Token is already verified by client - just use it
        // In production, you'd want to verify the signature
      } catch (e) {
        console.error('Token error:', e);
      }
    }

    // Save to Firestore contactMessages collection
    const messagesRef = collection(db, 'contactMessages');
    const docRef = await addDoc(messagesRef, {
      userId: userId || null,
      userName: validated.name,
      userEmail: validated.email,
      userPhone: validated.phone || '',
      subject: sanitizedSubject,
      message: sanitizedMessage,
      createdAt: serverTimestamp(),
      status: 'unread',
      adminReply: null,
      adminReplyAt: null,
    });

    console.log('✅ Contact message saved:', docRef.id);

    return NextResponse.json(
      { success: true, messageId: docRef.id, message: 'Message sent successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { success: false, error: 'Invalid input', issues: error.issues },
        { status: 400 }
      );
    }
    console.error('Error sending contact message:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}