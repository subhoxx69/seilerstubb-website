import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    let db;
    try {
      const { db: adminDb } = getFirebaseAdmin();
      db = adminDb;
    } catch (initError) {
      console.error('[Reset Password API] Firebase Admin initialization failed:', initError);
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: initError instanceof Error ? initError.message : 'Firebase Admin SDK initialization failed',
        },
        { status: 500 }
      );
    }

    const { email, newPassword } = await request.json();

    // Validate inputs
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find user by email
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('email', '==', email).get();

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    // Hash the new password
    const hashedPassword = createHash('sha256').update(newPassword).digest('hex');

    // Update password in database using admin SDK (bypasses security rules)
    await usersRef.doc(userId).update({
      password: hashedPassword,
      updatedAt: new Date(),
    });

    console.log(`✅ Password reset successfully for user: ${email}`);

    return NextResponse.json(
      { 
        message: 'Password reset successfully',
        success: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Password reset error:', error);

    return NextResponse.json(
      { 
        error: 'Failed to reset password',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
