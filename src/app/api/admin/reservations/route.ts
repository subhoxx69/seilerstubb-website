/**
 * GET /api/admin/reservations
 * Admin endpoint to fetch all reservations with decryption and filtering
 * Requires MAIN_ADMIN authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { decrypt, hashValue } from '@/lib/encryption';
import { MAIN_ADMIN_EMAILS } from '@/lib/firebase/admin-constants';

// Extract user email from Firebase auth token
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
    const dateIndex = searchParams.get('dateIndex');
    const emailHash = searchParams.get('emailHash');
    const status = searchParams.get('status');

    // Build query
    let q;
    const reservationsRef = collection(db, 'reservations');

    if (dateIndex) {
      q = query(reservationsRef, where('search.dateIndex', '==', dateIndex));
    } else if (emailHash) {
      q = query(reservationsRef, where('search.emailHash', '==', emailHash));
    } else {
      q = query(reservationsRef);
    }

    const snapshot = await getDocs(q);

    // Decrypt and filter by status if needed
    const reservations = snapshot.docs
      .map((doc) => {
        try {
          const data = doc.data();
          const decrypted = decrypt(data.enc);

          // Filter by status if provided
          if (status && decrypted.status !== status) {
            return null;
          }

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
            ipHash: data.meta?.ipHash, // For admin investigation
          };
        } catch (error) {
          console.error('Failed to decrypt reservation:', error);
          return null;
        }
      })
      .filter((r) => r !== null);

    return NextResponse.json({ success: true, data: reservations, total: reservations.length });
  } catch (error: any) {
    console.error('Error fetching admin reservations:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reservations' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
