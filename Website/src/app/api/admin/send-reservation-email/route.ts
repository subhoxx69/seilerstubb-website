/**
 * POST /api/admin/send-reservation-email
 * 
 * Send acceptance or decline email to guest after admin decision
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendReservationAcceptanceEmail, sendReservationDeclineEmail } from '@/lib/services/gmail-service';
import { MAIN_ADMIN_EMAILS } from '@/lib/firebase/admin-constants';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 === Received request to /api/admin/send-reservation-email ===');
    
    // Get auth header
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7);
    
    if (!idToken || idToken.length === 0) {
      console.error('❌ Token is empty');
      return NextResponse.json(
        { success: false, error: 'Empty token' },
        { status: 401 }
      );
    }

    // Verify token and get user
    let userEmail: string | undefined;
    let adminApp: any;
    
    try {
      const { getAuth } = await import('firebase-admin/auth');
      const { initializeApp, getApp } = await import('firebase-admin/app');
      
      try {
        adminApp = getApp();
      } catch {
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
      console.log('✅ Token verified, user email:', userEmail);
    } catch (tokenError) {
      console.error('❌ Token verification failed:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is a main admin
    if (!userEmail || !MAIN_ADMIN_EMAILS.includes(userEmail)) {
      console.warn(`Unauthorized email action attempt by ${userEmail}`);
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get request body
    const {
      reservationId,
      status, // 'confirmed' or 'rejected'
      guestEmail,
      guestName,
      date,
      time,
      numberOfGuests,
      reservationArea,
      rejectionReason,
    } = await request.json();

    // Validate required fields
    if (!reservationId || !status || !guestEmail || !guestName || !date || !time || !numberOfGuests) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['confirmed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Use "confirmed" or "rejected"' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending ${status} email to ${guestEmail}...`);

    let result;

    if (status === 'confirmed') {
      // Send acceptance email
      result = await sendReservationAcceptanceEmail({
        to: guestEmail,
        firstName: guestName.split(' ')[0], // Get first name
        date,
        time,
        people: numberOfGuests,
        bereich: reservationArea,
        reservationId,
      });
    } else {
      // Send decline email
      result = await sendReservationDeclineEmail({
        to: guestEmail,
        firstName: guestName.split(' ')[0], // Get first name
        date,
        time,
        people: numberOfGuests,
        area: reservationArea,
        reason: rejectionReason || 'Der Termin ist leider nicht mehr verfügbar.',
        reservationId,
      });
    }

    if (!result.success) {
      console.error(`❌ Failed to send ${status} email:`, result.error);
      return NextResponse.json(
        { success: false, error: `Failed to send email: ${result.error}` },
        { status: 500 }
      );
    }

    console.log(`✅ ${status} email sent successfully to ${guestEmail}`);
    return NextResponse.json({
      success: true,
      message: `${status} email sent successfully to ${guestEmail}`,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error sending reservation email:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
