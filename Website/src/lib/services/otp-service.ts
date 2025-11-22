import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import crypto from 'crypto';

interface OTPRecord {
  email: string;
  code: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  attempts: number;
  verified: boolean;
}

const OTP_COLLECTION = 'otp_verifications';
const OTP_VALIDITY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

/**
 * Generate a random 6-digit OTP code
 */
export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP code using SHA-256
 */
function hashOTP(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Create and store OTP in Firestore
 */
export async function createOTP(email: string): Promise<string> {
  try {
    const code = generateOTPCode();
    const hashedCode = hashOTP(code);
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(
      now.toMillis() + OTP_VALIDITY_MINUTES * 60 * 1000
    );

    const otpDocId = `${email}_${Date.now()}`;
    const otpRef = doc(db, OTP_COLLECTION, otpDocId);

    await setDoc(otpRef, {
      email,
      code: hashedCode,
      createdAt: now,
      expiresAt,
      attempts: 0,
      verified: false,
    } as OTPRecord);

    console.log(`✓ OTP created for ${email}`);
    return code; // Return unhashed code to send to user via email
  } catch (error) {
    console.error('Error creating OTP:', error);
    throw new Error('Failed to generate OTP');
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  email: string,
  code: string
): Promise<boolean> {
  try {
    const hashedCode = hashOTP(code);
    const now = Timestamp.now();

    // Find OTP documents for this email
    const q = query(
      collection(db, OTP_COLLECTION),
      where('email', '==', email)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`No OTP found for email: ${email}`);
      return false;
    }

    // Find valid, non-expired OTP
    for (const otpDoc of querySnapshot.docs) {
      const otpData = otpDoc.data() as OTPRecord;

      // Check if already verified
      if (otpData.verified) {
        continue;
      }

      // Check if expired
      if (now.toMillis() > otpData.expiresAt.toMillis()) {
        // Try to delete expired OTP (may fail silently due to permissions)
        try {
          await deleteDoc(otpDoc.ref);
        } catch (e) {
          console.warn('Could not delete expired OTP, continuing');
        }
        continue;
      }

      // Check if max attempts exceeded
      if (otpData.attempts >= MAX_ATTEMPTS) {
        console.warn(`Max OTP attempts exceeded for ${email}`);
        continue;
      }

      // Verify code
      if (otpData.code === hashedCode) {
        // Try to mark as verified, but don't fail if it doesn't work
        try {
          await setDoc(
            otpDoc.ref,
            { verified: true, verifiedAt: now },
            { merge: true }
          );
        } catch (e) {
          console.warn('Could not update OTP verification status, but code is valid');
        }
        console.log(`✓ OTP verified for ${email}`);
        return true;
      }

      // Try to increment attempts, but don't fail if it doesn't work
      try {
        await setDoc(
          otpDoc.ref,
          { attempts: otpData.attempts + 1 },
          { merge: true }
        );
      } catch (e) {
        console.warn('Could not update attempt count, but continuing');
      }
    }

    console.warn(`Invalid OTP code for ${email}`);
    return false;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new Error('Failed to verify OTP');
  }
}

/**
 * Get latest OTP expiry time for email
 */
export async function getOTPExpiryTime(email: string): Promise<Date | null> {
  try {
    const q = query(
      collection(db, OTP_COLLECTION),
      where('email', '==', email)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const now = Timestamp.now();
    let latestExpiryTime: Date | null = null;

    for (const otpDoc of querySnapshot.docs) {
      const otpData = otpDoc.data() as OTPRecord;

      // Skip verified or expired
      if (otpData.verified) {
        continue;
      }
      if (now.toMillis() > otpData.expiresAt.toMillis()) {
        continue;
      }

      const expiryDate = otpData.expiresAt.toDate();
      if (!latestExpiryTime || expiryDate > latestExpiryTime) {
        latestExpiryTime = expiryDate;
      }
    }

    return latestExpiryTime;
  } catch (error) {
    console.error('Error getting OTP expiry time:', error);
    return null;
  }
}

/**
 * Clean up expired OTPs for email
 */
export async function cleanupExpiredOTPs(email: string): Promise<void> {
  try {
    const q = query(
      collection(db, OTP_COLLECTION),
      where('email', '==', email)
    );

    const querySnapshot = await getDocs(q);
    const now = Timestamp.now();

    for (const otpDoc of querySnapshot.docs) {
      const otpData = otpDoc.data() as OTPRecord;

      // Delete verified OTPs or expired OTPs
      if (otpData.verified || now.toMillis() > otpData.expiresAt.toMillis()) {
        await deleteDoc(otpDoc.ref);
      }
    }

    console.log(`✓ Cleaned up OTPs for ${email}`);
  } catch (error) {
    console.error('Error cleaning up OTPs:', error);
  }
}

/**
 * Get remaining OTP attempts for email
 */
export async function getOTPAttempts(email: string): Promise<number> {
  try {
    const q = query(
      collection(db, OTP_COLLECTION),
      where('email', '==', email)
    );

    const querySnapshot = await getDocs(q);
    const now = Timestamp.now();

    for (const otpDoc of querySnapshot.docs) {
      const otpData = otpDoc.data() as OTPRecord;

      if (!otpData.verified && now.toMillis() < otpData.expiresAt.toMillis()) {
        return Math.max(0, MAX_ATTEMPTS - otpData.attempts);
      }
    }

    return MAX_ATTEMPTS;
  } catch (error) {
    console.error('Error getting OTP attempts:', error);
    return 0;
  }
}

/**
 * Resend OTP - delete old and create new one
 */
export async function resendOTP(email: string): Promise<string> {
  try {
    // Clean up old OTPs first
    await cleanupExpiredOTPs(email);

    // Create new OTP
    return await createOTP(email);
  } catch (error) {
    console.error('Error resending OTP:', error);
    throw new Error('Failed to resend OTP');
  }
}
