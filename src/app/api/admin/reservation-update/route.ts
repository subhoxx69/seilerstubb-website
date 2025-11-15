/**
 * POST /api/admin/reservation-update
 * 
 * Update reservation status (accept/reject)
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { MAIN_ADMIN_EMAILS } from '@/lib/firebase/admin-constants';

export async function POST(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7); // Remove "Bearer " prefix

    // Verify token and get user
    let userEmail: string | undefined;
    let adminApp: any;
    
    try {
      // Import admin SDK for token verification
      const { getAuth } = await import('firebase-admin/auth');
      const { initializeApp, getApp } = await import('firebase-admin/app');
      
      try {
        adminApp = getApp();
      } catch {
        // Initialize admin app - use individual env vars instead of JSON
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

      const adminAuth = getAuth(adminApp);
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      userEmail = decodedToken.email;
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is a main admin
    if (!userEmail || !MAIN_ADMIN_EMAILS.includes(userEmail)) {
      console.warn(`Unauthorized admin action attempt by ${userEmail}`);
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get request body
    const { reservationId, status, reason } = await request.json();

    if (!reservationId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: reservationId, status' },
        { status: 400 }
      );
    }

    if (!['confirmed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Use "confirmed" or "rejected"' },
        { status: 400 }
      );
    }

    // Update reservation in Firestore using admin SDK
    const { getFirestore } = await import('firebase-admin/firestore');
    const adminDb = getFirestore(adminApp);
    const reservationRef = adminDb.collection('reservations').doc(reservationId);

    await reservationRef.update({
      status,
      rejectionReason: reason || null,
      updatedAt: new Date(),
      updatedBy: userEmail,
    });

    return NextResponse.json({
      success: true,
      message: `Reservation ${status} successfully`,
    });
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
