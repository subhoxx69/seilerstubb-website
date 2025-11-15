import { auth } from '@/lib/firebase/config';
import { getRedirectResult } from 'firebase/auth';

export async function handleAppleSignInCallback() {
  try {
    console.log('🍎 Checking Apple Sign-In redirect result...');
    
    const result = await getRedirectResult(auth);
    
    if (result && result.user) {
      console.log('✅ Apple Sign-In successful:', result.user.email);
      return {
        success: true,
        user: result.user,
        email: result.user.email,
        uid: result.user.uid,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };
    }
    
    return {
      success: false,
      message: 'No authentication result found'
    };
  } catch (error: any) {
    console.error('❌ Error handling Apple Sign-In callback:', error);
    return {
      success: false,
      error: error.message || 'Failed to process Apple Sign-In'
    };
  }
}
