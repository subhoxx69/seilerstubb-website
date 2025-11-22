import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  getMultiFactorResolver,
  MultiFactorError,
  PhoneMultiFactorGenerator
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, getDoc, setDoc, increment, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { COLLECTIONS } from './service-utils';

// Initialize reCAPTCHA verifier
export const initializeRecaptcha = (elementId: string = 'recaptcha-container') => {
  if (typeof window === 'undefined') return null;
  
  try {
    return new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: (response: any) => {
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error);
    return null;
  }
};

// Check if phone number auth is enabled (based on SMS quota)
export const isPhoneAuthEnabled = async (): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const quotaDocRef = doc(db, 'smsQuota', today);
    const quotaDoc = await getDoc(quotaDocRef);
    
    if (!quotaDoc.exists()) {
      return true; // If no quota doc, auth is enabled
    }
    
    const data = quotaDoc.data();
    const usedQuota = data?.usedCount || 0;
    const DAILY_LIMIT = 10;
    
    return usedQuota < DAILY_LIMIT;
  } catch (error) {
    console.error('Error checking phone auth quota:', error);
    return true; // Default to enabled on error
  }
};

// Get remaining SMS quota for today
export const getRemainingPhoneQuota = async (): Promise<number> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const quotaDocRef = doc(db, 'smsQuota', today);
    const quotaDoc = await getDoc(quotaDocRef);
    
    const DAILY_LIMIT = 10;
    
    if (!quotaDoc.exists()) {
      return DAILY_LIMIT;
    }
    
    const usedQuota = quotaDoc.data()?.usedCount || 0;
    return Math.max(0, DAILY_LIMIT - usedQuota);
  } catch (error) {
    console.error('Error getting phone quota:', error);
    return 0;
  }
};

// Increment SMS quota usage
const incrementPhoneQuota = async (): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const quotaDocRef = doc(db, 'smsQuota', today);
    
    await setDoc(quotaDocRef, {
      usedCount: increment(1),
      date: today,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error incrementing phone quota:', error);
  }
};

// Send verification code to phone number
export const sendPhoneVerificationCode = async (
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<string> => {
  try {
    // Check quota first
    const isEnabled = await isPhoneAuthEnabled();
    if (!isEnabled) {
      throw new Error('Phone authentication is temporarily disabled due to SMS quota limit. Please try again tomorrow.');
    }
    
    // Increment quota
    await incrementPhoneQuota();
    
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );
    
    return confirmationResult.verificationId;
  } catch (error: any) {
    console.error('Error sending phone verification code:', error);
    throw error;
  }
};

// Verify phone number with OTP code
export const verifyPhoneOTP = async (
  verificationId: string,
  verificationCode: string
): Promise<any> => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    const result = await signInWithCredential(auth, credential);
    
    return result;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// Track phone sign-up/sign-in statistics
export const trackPhoneAuthUsage = async (uid: string, method: 'signup' | 'signin'): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = doc(db, 'phoneAuthStats', today);
    
    await setDoc(statsRef, {
      [method]: increment(1),
      date: today,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error tracking phone auth usage:', error);
  }
};

// Get phone auth statistics for a date range
export const getPhoneAuthStats = async (startDate?: string, endDate?: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const queryDate = startDate || today;
    
    const statsRef = collection(db, 'phoneAuthStats');
    const q = query(statsRef, where('date', '>=', queryDate));
    
    const snapshot = await getDocs(q);
    const stats: any = {};
    
    snapshot.forEach(doc => {
      stats[doc.id] = doc.data();
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting phone auth stats:', error);
    return {};
  }
};
