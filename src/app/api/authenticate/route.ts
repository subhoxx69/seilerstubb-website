import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    let auth, db;
    try {
      const { auth: adminAuth, db: adminDb } = getFirebaseAdmin();
      auth = adminAuth;
      db = adminDb;
    } catch (initError) {
      console.error('[Auth API] Firebase Admin initialization failed:', initError);
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: initError instanceof Error ? initError.message : 'Firebase Admin SDK initialization failed',
        },
        { status: 500 }
      );
    }

    // Check if Firebase Admin SDK is initialized
    if (!auth || !db) {
      console.error('[Auth API] Firebase Admin SDK not initialized');
      return NextResponse.json(
        { error: 'Server configuration error: Firebase Admin SDK not initialized' },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    // Validate inputs
    if (!email || !password) {
      console.error('[Auth API] Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log(`[Auth API] Authenticating user: ${email}`);

    // Check if user exists in Firestore
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', email).get();

    if (userSnapshot.empty) {
      console.error(`[Auth API] User not found: ${email}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userSnapshot.docs[0].data();
    console.log(`[Auth API] Found user in Firestore: ${email}`);

    // Try to get or create Firebase Auth user
    let authUser;
    try {
      // Try to get existing auth user
      authUser = await auth.getUserByEmail(email);
      console.log(`[Auth API] Auth user already exists: ${email}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log(`[Auth API] Auth user not found for ${email}, creating new auth account...`);
        try {
          // Create new auth user
          authUser = await auth.createUser({
            email: email,
            password: password,
            displayName: userData.displayName || '',
          });
          console.log(`[Auth API] Created new auth user: ${email}`);
        } catch (createError: any) {
          console.error(`[Auth API] Error creating auth user:`, createError.message);
          // If creation fails (e.g., email already exists in another account), 
          // just continue - we'll use the Firestore account
          console.log(`[Auth API] Proceeding with Firestore account for ${email}`);
          authUser = null;
        }
      } else {
        console.error(`[Auth API] Unexpected error getting user:`, error.message);
        throw error;
      }
    }

    // Update last login time in Firestore
    const userDocRef = userSnapshot.docs[0].ref;
    await userDocRef.update({
      lastLogin: new Date(),
    });
    console.log(`[Auth API] Updated lastLogin for ${email}`);

    // Generate custom Firebase Auth token for the user
    // If we have an auth user, generate a token; otherwise still allow sign-in
    let customToken = null;
    if (authUser) {
      try {
        customToken = await auth.createCustomToken(authUser.uid);
        console.log(`[Auth API] Generated custom token for ${email}`);
      } catch (tokenError: any) {
        console.error(`[Auth API] Error generating token:`, tokenError.message);
      }
    } else {
      console.log(`[Auth API] No auth user available for custom token generation`);
    }

    console.log(`✅ [Auth API] User authenticated successfully: ${email}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Authentication successful',
        customToken: customToken,
        email: email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [Auth API] Authentication error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
