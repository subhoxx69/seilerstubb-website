'use server';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

/**
 * Server action to authenticate user after OTP verification
 * This is needed because Firebase Auth client SDK needs to be used server-side
 * for proper session management
 */
export async function authenticateUserAfterOTP(email: string, password: string) {
  try {
    console.log('[Server] Authenticating user after OTP:', email);
    
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    console.log('[Server] User authenticated successfully:', result.user.uid);
    
    return {
      success: true,
      uid: result.user.uid,
      email: result.user.email,
      message: 'User authenticated successfully',
    };
  } catch (error: any) {
    console.error('[Server] Authentication error:', error);
    
    return {
      success: false,
      error: error.message || 'Authentication failed',
      code: error.code,
    };
  }
}
