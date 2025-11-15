/**
 * Reservation Storage Service
 * Stores user reservation information locally on device
 */

export interface ReservationStorageData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bereich: string;
}

const STORAGE_KEY = 'reservation_user_info';

/**
 * Get saved reservation info from device storage
 */
export function getUserReservationInfo(): ReservationStorageData | null {
  try {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting saved user info:', error);
    return null;
  }
}

/**
 * Save reservation info to device storage
 */
export function saveUserReservationInfo(data: Partial<ReservationStorageData>): void {
  try {
    if (typeof window === 'undefined') return;
    
    const existing = getUserReservationInfo() || {};
    const updated = { ...existing, ...data };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('✅ Saved user info to device storage');
  } catch (error) {
    console.error('Error saving user info:', error);
  }
}

/**
 * Clear saved reservation info
 */
export function clearUserReservationInfo(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing user info:', error);
  }
}
