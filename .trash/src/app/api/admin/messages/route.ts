/**
 * GET /api/admin/messages
 * Admin endpoint to fetch contact messages with decryption and filtering
 * Requires MAIN_ADMIN authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { decrypt } from '@/lib/encryption';
import { MAIN_ADMIN_EMAILS } from '@/lib/firebase/admin-constants';

function getAdminEmail(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  // TODO: Verify token with Firebase Admin SDK and extract email
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const adminEmail = getAdminEmail(request);
    if (!adminEmail || !MAIN_ADMIN_EMAILS.includes(adminEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get filter params
    const { searchParams } = new URL(request.url);
    const emailHash = searchParams.get('emailHash');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query
    let q;
    const messagesRef = collection(db, 'contactMessages');

    if (emailHash) {
      q = query(messagesRef, where('search.emailHash', '==', emailHash));
    } else {
      q = query(messagesRef);
    }

    const snapshot = await getDocs(q);

    // Decrypt messages
    const messages = snapshot.docs
      .slice(0, limit)
      .map((doc) => {
        try {
          const data = doc.data();
          const decrypted = decrypt(data.enc);

          return {
            id: doc.id,
            name: decrypted.name,
            email: decrypted.email,
            subject: decrypted.subject,
            message: decrypted.message,
            createdAt: data.meta?.createdAt,
            ipHash: data.meta?.ipHash, // For admin investigation
          };
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return null;
        }
      })
      .filter((m) => m !== null);

    return NextResponse.json({ success: true, data: messages, total: messages.length });
  } catch (error: any) {
    console.error('Error fetching admin messages:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
