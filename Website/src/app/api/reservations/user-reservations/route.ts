import { NextRequest, NextResponse } from 'next/server';
import { MAIN_ADMIN_EMAILS } from '@/lib/firebase/admin-constants';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let uid = '';
    let email = '';

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString()
      );
      uid = payload.sub || payload.user_id;
      email = payload.email || '';

      if (!uid) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Token verification failed' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const requestedUserId = searchParams.get('userId');

    // If requesting another user's reservations, must be admin
    if (requestedUserId && requestedUserId !== uid) {
      const isAdmin = MAIN_ADMIN_EMAILS.includes(email);
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'You do not have permission to view these reservations' },
          { status: 403 }
        );
      }
    }

    // Use requested user ID or current user ID
    const targetUserId = requestedUserId || uid;

    // Initialize Admin SDK
    let adminApp: any;
    let adminDb: any;

    try {
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

      const { getFirestore } = await import('firebase-admin/firestore');
      adminDb = getFirestore(adminApp);
    } catch (adminError) {
      console.error('Failed to initialize Admin SDK:', adminError);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Fetch all reservations for the user - try by userId first, then by email
    let reservationsSnapshot;
    
    try {
      // Try fetching by userId without orderBy to avoid index requirements
      reservationsSnapshot = await adminDb
        .collection('reservations')
        .where('userId', '==', targetUserId)
        .get();
      
      // If no results by userId, try by email
      if (reservationsSnapshot.empty && email) {
        console.log(`No reservations found by userId: ${targetUserId}, trying by email: ${email}`);
        reservationsSnapshot = await adminDb
          .collection('reservations')
          .where('userEmail', '==', email)
          .get();
      }
    } catch (queryError: any) {
      // If query fails, try just by email
      console.log(`Query by userId failed, trying by email: ${email}`, queryError);
      if (email) {
        try {
          reservationsSnapshot = await adminDb
            .collection('reservations')
            .where('userEmail', '==', email)
            .get();
        } catch (emailError) {
          console.error('Failed to query by email:', emailError);
          // As fallback, try without any filters (not ideal but better than nothing)
          try {
            reservationsSnapshot = await adminDb
              .collection('reservations')
              .get();
          } catch (fallbackError) {
            console.error('All queries failed:', fallbackError);
            return NextResponse.json(
              {
                success: true,
                reservations: [],
                count: 0,
                note: 'Could not fetch reservations at this time'
              },
              { status: 200 }
            );
          }
        }
      }
    }

    let reservations = reservationsSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id, // Document ID from Firestore
        reservationId: doc.id, // Also include as reservationId for clarity
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        userName: data.userName || (data.firstName + (data.lastName ? ' ' + data.lastName : '')),
        userEmail: data.userEmail || data.email,
        userPhone: data.userPhone || data.phone,
        email: data.email,
        phone: data.phone,
        date: data.date,
        time: data.time,
        people: data.people,
        note: data.notes || data.note || '',
        notes: data.notes || data.note || '',
        status: data.status,
        bereich: data.bereich,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || null,
      };
    });

    // Filter by current user if we got all reservations
    if (reservationsSnapshot.size > 0 && reservations.length > 0) {
      // If we fetched without where clause, filter client-side by email or userId
      if (!requestedUserId && uid) {
        reservations = reservations.filter((r: any) => {
          // Match by email or by userId
          return r.userEmail === email || r.email === email || r.userId === uid;
        });
      }
    }

    // Sort by date and time in descending order (newest first)
    reservations.sort((a: any, b: any) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`✅ Retrieved ${reservations.length} reservations for user ${email}`);

    return NextResponse.json(
      {
        success: true,
        reservations,
        count: reservations.length,
        userEmail: email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}
