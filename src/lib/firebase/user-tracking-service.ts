/**
 * User Tracking Service
 * Captures user login data (IP address, timestamps) for audit and analytics
 */

import { db } from '@/lib/firebase/config';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * Get user's IP address from our server endpoint
 * Server endpoint can read from request headers (more reliable than client-side API calls)
 */
async function getUserIpAddress(): Promise<string> {
  try {
    // Call our own server endpoint to capture IP from request headers
    const response = await fetch('/api/auth/get-ip', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch IP from server endpoint:', response.status);
      throw new Error(`Failed to fetch IP: ${response.status}`);
    }

    const data = await response.json();
    const ip = data.ip || data.ipAddress || 'Unknown';
    
    console.log(`✓ IP fetched from server: ${ip}`);
    return ip;
  } catch (error) {
    console.warn('Error getting IP address from server:', error);
    
    // Fallback: Try to get IP from external API
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const ip = data.ip || 'Unknown';
        console.log(`✓ IP fetched from ipify fallback: ${ip}`);
        return ip;
      }
    } catch (fallbackError) {
      console.warn('Fallback IP fetch also failed:', fallbackError);
    }

    return 'Unknown';
  }
}

/**
 * Update user's latest IP address and login timestamp
 * Called when user successfully signs in
 * 
 * @param uid - User's Firebase UID
 */
export async function recordUserLogin(uid: string): Promise<void> {
  try {
    const ipAddress = await getUserIpAddress();

    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      latestIp: ipAddress,
      lastLoginAt: Timestamp.now(),
    });

    console.log(`✓ User login recorded: UID=${uid}, IP=${ipAddress}`);
  } catch (error) {
    console.error('Error recording user login:', error);
    // Don't throw - login should succeed even if IP capture fails
  }
}

/**
 * Update user's last activity timestamp
 * Can be called periodically during user session
 * 
 * @param uid - User's Firebase UID
 */
export async function updateLastActivity(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      lastActivityAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating last activity:', error);
    // Silently fail - this is non-critical
  }
}

/**
 * Get user's current session IP if available
 * Useful for checking if IP has changed during session
 * 
 * @returns Current IP address
 */
export async function getCurrentSessionIp(): Promise<string> {
  try {
    return await getUserIpAddress();
  } catch (error) {
    console.error('Error getting current IP:', error);
    return 'Unknown';
  }
}

/**
 * Log security event (e.g., failed login, suspicious activity)
 * 
 * @param uid - User's Firebase UID
 * @param eventType - Type of security event
 * @param details - Additional event details
 */
export async function logSecurityEvent(
  uid: string,
  eventType: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const ipAddress = await getUserIpAddress();

    const eventsRef = collection(db, 'security_logs');

    await addDoc(eventsRef, {
      uid,
      eventType,
      timestamp: Timestamp.now(),
      ipAddress,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      details: details || {},
    });

    console.log(`✓ Security event logged: UID=${uid}, Type=${eventType}`);
  } catch (error) {
    console.error('Error logging security event:', error);
    // Don't throw - operation should continue
  }
}

// Import at the end to avoid circular dependencies
import { collection, addDoc } from 'firebase/firestore';
