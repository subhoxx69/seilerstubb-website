/**
 * GET /api/reservations/mine
 * Fetch user's own reservations with server-side decryption
 * Requires authentication via Firebase ID token
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { decrypt, hashValue } from '@/lib/encryption';
import { getAuth } from 'firebase/auth';

/**
 * Verify Firebase ID token from Authorization header
 * Returns uid if valid, null if invalid
 */
async function verifyAuth(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    // Note: Client-side verification only. For production, use Firebase Admin SDK
    // This is a placeholder - in real implementation, validate token server-side
    // For now, we return null to prevent unauthorized access
    // TODO: Implement Firebase Admin SDK verification
    return null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const uid = await verifyAuth(request);
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's reservations
    const reservationsRef = collection(db, 'reservations');
    const q = query(reservationsRef, where('uid', '==', uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Decrypt each reservation
    const reservations = snapshot.docs
      .map((doc) => {
        try {
          const data = doc.data();
          const decrypted = decrypt(data.enc);

          return {
            id: doc.id,
            name: decrypted.name,
            email: decrypted.email,
            phone: decrypted.phone,
            date: decrypted.date,
            time: decrypted.time,
            people: decrypted.people,
            area: decrypted.area,
            notes: decrypted.notes,
            status: decrypted.status,
            createdAt: data.meta?.createdAt,
          };
        } catch (error) {
          console.error('Failed to decrypt reservation:', error);
          return null;
        }
      })
      .filter((r) => r !== null);

    return NextResponse.json({ success: true, data: reservations });
  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reservations' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
