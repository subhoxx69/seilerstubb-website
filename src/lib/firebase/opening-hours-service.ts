import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

export interface TimeSlot {
  open: string;  // HH:MM format
  close: string; // HH:MM format
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface DayConfig {
  open: boolean;           // Whether the day is open
  ranges: TimeRange[];     // Operating hours for the day
}

export interface ExceptionDay {
  date: string;            // YYYY-MM-DD format
  open: boolean;           // Whether open on this date
  ranges: TimeRange[];     // Operating hours for this date (if open)
}

export interface ReservationSlotConfig {
  intervalMinutes: number; // e.g., 15, 30
  leadTimeMinutes: number; // e.g., 60 (must book 60min in advance)
}

export interface CapacityConfig {
  innen: number;           // Indoor capacity
  aussen: number;          // Outdoor capacity
}

// NEW SCHEMA (Primary - used by reservation system)
export interface OpeningHoursV2 {
  timezone: string;        // e.g., "Europe/Berlin"
  days: {
    monday: DayConfig;
    tuesday: DayConfig;
    wednesday: DayConfig;
    thursday: DayConfig;
    friday: DayConfig;
    saturday: DayConfig;
    sunday: DayConfig;
  };
  capacity: CapacityConfig;
  exceptions?: ExceptionDay[];              // Override specific dates
  slot: ReservationSlotConfig;              // Slot generation config
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}

// OLD SCHEMA (Backward compatibility)
export interface DayHours {
  day: string;
  dayNumber: number; // 0-6 (Monday-Sunday)
  isClosed: boolean;
  shifts: TimeSlot[];
}

export interface OpeningHoursData {
  weekHours: DayHours[];
  deliveryHours: TimeSlot;
  pickupHours: TimeSlot;
  deliveryMinOrder: number; // Minimum order for free delivery
  deliveryFee: number; // Fee if under minimum
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}

// V2 Default (NEW schema for reservations)
const DEFAULT_OPENING_HOURS_V2: OpeningHoursV2 = {
  timezone: 'Europe/Berlin',
  days: {
    monday: { open: true, ranges: [{ start: '11:30', end: '14:30' }, { start: '17:00', end: '23:00' }] },
    tuesday: { open: true, ranges: [{ start: '11:30', end: '14:30' }, { start: '17:00', end: '23:00' }] },
    wednesday: { open: true, ranges: [{ start: '11:30', end: '14:30' }, { start: '17:00', end: '23:00' }] },
    thursday: { open: true, ranges: [{ start: '11:30', end: '14:30' }, { start: '17:00', end: '23:00' }] },
    friday: { open: true, ranges: [{ start: '11:30', end: '14:30' }, { start: '17:00', end: '23:00' }] },
    saturday: { open: true, ranges: [{ start: '11:30', end: '14:30' }, { start: '17:00', end: '23:00' }] },
    sunday: { open: false, ranges: [] },
  },
  capacity: { innen: 60, aussen: 40 },
  exceptions: [],
  slot: { intervalMinutes: 15, leadTimeMinutes: 60 },
};

// V1 Default (OLD schema - kept for backward compatibility)
const DEFAULT_OPENING_HOURS: OpeningHoursData = {
  weekHours: [
    { day: 'Montag', dayNumber: 0, isClosed: false, shifts: [{ open: '11:30', close: '23:00' }] },
    { day: 'Dienstag', dayNumber: 1, isClosed: false, shifts: [{ open: '11:30', close: '23:00' }] },
    { day: 'Mittwoch', dayNumber: 2, isClosed: false, shifts: [{ open: '11:30', close: '23:00' }] },
    { day: 'Donnerstag', dayNumber: 3, isClosed: false, shifts: [{ open: '11:30', close: '23:00' }] },
    { day: 'Freitag', dayNumber: 4, isClosed: false, shifts: [{ open: '11:30', close: '23:00' }] },
    { day: 'Samstag', dayNumber: 5, isClosed: false, shifts: [{ open: '11:30', close: '00:00' }] },
    { day: 'Sonntag', dayNumber: 6, isClosed: false, shifts: [{ open: '12:00', close: '23:00' }] },
  ],
  deliveryHours: { open: '17:00', close: '22:30' },
  pickupHours: { open: '11:30', close: '23:00' },
  deliveryMinOrder: 15.00,
  deliveryFee: 2.00,
};

const OPENING_HOURS_DOC_ID_V2 = 'openingHoursMain';  // V2: reservations config
const OPENING_HOURS_DOC_ID = 'opening-hours-main';   // V1: legacy

// ============================================================================
// V2 FUNCTIONS (NEW SCHEMA - FOR RESERVATIONS)
// ============================================================================

/**
 * Get opening hours V2 (reservations config) from Firebase
 */
export async function getOpeningHoursV2(): Promise<OpeningHoursV2> {
  try {
    const docRef = doc(db, 'settings', OPENING_HOURS_DOC_ID_V2);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as OpeningHoursV2;
    } else {
      console.log('No V2 opening hours found, using defaults');
      return DEFAULT_OPENING_HOURS_V2;
    }
  } catch (error) {
    console.error('Error fetching V2 opening hours:', error);
    return DEFAULT_OPENING_HOURS_V2;
  }
}

/**
 * Subscribe to real-time V2 opening hours updates
 */
export function subscribeToOpeningHoursV2(
  callback: (hours: OpeningHoursV2) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  try {
    const docRef = doc(db, 'settings', OPENING_HOURS_DOC_ID_V2);

    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as OpeningHoursV2);
        } else {
          callback(DEFAULT_OPENING_HOURS_V2);
        }
      },
      (error) => {
        console.error('Error in V2 opening hours listener:', error);
        if (onError) onError(error as Error);
        callback(DEFAULT_OPENING_HOURS_V2);
      }
    );
  } catch (error) {
    console.error('Error setting up V2 opening hours listener:', error);
    if (onError) onError(error as Error);
    callback(DEFAULT_OPENING_HOURS_V2);
    return () => {};
  }
}

/**
 * Save V2 opening hours to Firebase (admin only)
 */
export async function saveOpeningHoursV2(hours: OpeningHoursV2): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', OPENING_HOURS_DOC_ID_V2);
    await setDoc(docRef, {
      ...hours,
      updatedAt: serverTimestamp(),
      createdAt: hours.createdAt || serverTimestamp(),
    });
    console.log('✅ V2 Opening hours saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving V2 opening hours:', error);
    return false;
  }
}

/**
 * Get day name from date in given timezone
 */
function getDayName(dateStr: string, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  });
  const date = new Date(dateStr);
  return formatter.format(date).toLowerCase();
}

/**
 * Get current time in the given timezone (HH:MM format)
 */
function getCurrentTimeInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date());
}

/**
 * Get current date in the given timezone (YYYY-MM-DD format)
 */
function getCurrentDateInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const formatted = formatter.format(new Date());
  const [month, day, year] = formatted.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a specific date is closed (respects exceptions)
 * Returns { isClosed: boolean, ranges: TimeRange[] }
 */
export function checkDateAvailability(
  dateStr: string, // YYYY-MM-DD
  hoursV2: OpeningHoursV2
): { isClosed: boolean; ranges: TimeRange[] } {
  // Check for exception first
  if (hoursV2.exceptions) {
    const exception = hoursV2.exceptions.find(e => e.date === dateStr);
    if (exception) {
      return { isClosed: !exception.open, ranges: exception.ranges };
    }
  }

  // Use weekday config
  const dayName = getDayName(dateStr, hoursV2.timezone);
  const dayConfig = hoursV2.days[dayName as keyof typeof hoursV2.days];

  if (!dayConfig) {
    console.warn(`No config found for day: ${dayName}`);
    return { isClosed: true, ranges: [] };
  }

  return { isClosed: !dayConfig.open, ranges: dayConfig.ranges };
}

/**
 * Generate available time slots for a date
 * Respects lead time and timezone
 */
export function generateTimeSlots(
  dateStr: string, // YYYY-MM-DD
  hoursV2: OpeningHoursV2,
  today?: string   // Current date in YYYY-MM-DD (for testing)
): string[] {
  const availability = checkDateAvailability(dateStr, hoursV2);

  if (availability.isClosed || availability.ranges.length === 0) {
    return [];
  }

  const slots: string[] = [];
  const intervalMinutes = hoursV2.slot.intervalMinutes;
  const leadTimeMinutes = hoursV2.slot.leadTimeMinutes;

  // Determine "now" in restaurant timezone
  const now = new Date();
  const currentDateInTZ = getCurrentDateInTimezone(hoursV2.timezone);
  const isToday = today === dateStr || (today === undefined && dateStr === currentDateInTZ);

  // Get current time in restaurant timezone
  const currentTimeStr = getCurrentTimeInTimezone(hoursV2.timezone);
  const [nowHour, nowMin] = currentTimeStr.split(':').map(Number);
  const nowTotalMin = nowHour * 60 + nowMin;
  const leadTimeEndMin = nowTotalMin + leadTimeMinutes;

  // Generate slots from all ranges
  for (const range of availability.ranges) {
    const [startHour, startMin] = range.start.split(':').map(Number);
    const [endHour, endMin] = range.end.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin <= endMin)
    ) {
      const slotTotalMin = currentHour * 60 + currentMin;

      // Skip slots in the past or within lead time (today only)
      if (isToday && slotTotalMin < leadTimeEndMin) {
        currentMin += intervalMinutes;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
        continue;
      }

      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);

      currentMin += intervalMinutes;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }
  }

  return slots;
}

/**
 * Generate available dates for the next N days
 * Only returns dates where the restaurant is open
 */
export function generateAvailableDates(
  hoursV2: OpeningHoursV2,
  maxDays: number = 60
): string[] {
  const dates: string[] = [];
  const now = new Date();

  for (let i = 0; i < maxDays; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + i);
    const dateStr = checkDate.toISOString().split('T')[0];

    const availability = checkDateAvailability(dateStr, hoursV2);
    if (!availability.isClosed) {
      dates.push(dateStr);
    }
  }

  return dates;
}

/**
 * Validate a reservation against opening hours
 * Returns { valid: true/false, error?: string }
 */
export function validateReservationDateTime(
  dateStr: string,
  timeStr: string,
  hoursV2: OpeningHoursV2,
  now?: Date  // For testing
): { valid: boolean; error?: string } {
  // Check date is closed
  const availability = checkDateAvailability(dateStr, hoursV2);
  if (availability.isClosed) {
    return { valid: false, error: 'Das Restaurant ist an diesem Tag geschlossen' };
  }

  // Check time is in one of the ranges
  const timeInMinutes = parseInt(timeStr.split(':')[0]) * 60 + parseInt(timeStr.split(':')[1]);
  const validTime = availability.ranges.some(range => {
    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);
    const startTotalMin = startH * 60 + startM;
    const endTotalMin = endH * 60 + endM;
    return timeInMinutes >= startTotalMin && timeInMinutes <= endTotalMin;
  });

  if (!validTime) {
    return { valid: false, error: 'Diese Uhrzeit ist nicht verfügbar' };
  }

  // Check lead time
  const currentTime = now || new Date();
  const currentTimeStr = getCurrentTimeInTimezone(hoursV2.timezone);
  const currentDateStr = getCurrentDateInTimezone(hoursV2.timezone);
  const [nowH, nowM] = currentTimeStr.split(':').map(Number);
  const nowTotalMin = nowH * 60 + nowM;

  const isToday = dateStr === currentDateStr;
  if (isToday) {
    const leadTimeEndMin = nowTotalMin + hoursV2.slot.leadTimeMinutes;
    if (timeInMinutes < leadTimeEndMin) {
      return {
        valid: false,
        error: `Reservieren Sie mindestens ${hoursV2.slot.leadTimeMinutes} Minuten im Voraus`,
      };
    }
  }

  return { valid: true };
}

// ============================================================================
// V1 FUNCTIONS (OLD SCHEMA - BACKWARD COMPATIBILITY)
// ============================================================================

// Get opening hours from Firebase
export async function getOpeningHours(): Promise<OpeningHoursData> {
  try {
    const docRef = doc(db, 'settings', OPENING_HOURS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as OpeningHoursData;
    } else {
      console.log('No opening hours found, using defaults');
      return DEFAULT_OPENING_HOURS;
    }
  } catch (error) {
    console.error('Error fetching opening hours:', error);
    return DEFAULT_OPENING_HOURS;
  }
}

// Subscribe to real-time opening hours updates
export function subscribeToOpeningHours(
  callback: (hours: OpeningHoursData) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  try {
    const docRef = doc(db, 'settings', OPENING_HOURS_DOC_ID);

    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as OpeningHoursData);
        } else {
          callback(DEFAULT_OPENING_HOURS);
        }
      },
      (error) => {
        console.error('Error in opening hours listener:', error);
        if (onError) onError(error as Error);
        callback(DEFAULT_OPENING_HOURS);
      }
    );
  } catch (error) {
    console.error('Error setting up opening hours listener:', error);
    if (onError) onError(error as Error);
    callback(DEFAULT_OPENING_HOURS);
    return () => {};
  }
}

// Save opening hours to Firebase (admin only)
export async function saveOpeningHours(hours: OpeningHoursData): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', OPENING_HOURS_DOC_ID);
    await setDoc(docRef, {
      ...hours,
      updatedAt: serverTimestamp(),
      createdAt: hours.createdAt || serverTimestamp(),
    });
    console.log('✅ Opening hours saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving opening hours:', error);
    return false;
  }
}


// Get current day's hours
export function getTodayHours(hours: OpeningHoursData): DayHours | null {
  const today = new Date().getDay();
  // JavaScript's getDay() returns 0-6 (Sunday-Saturday), but we use Monday-Sunday
  const adjustedDay = today === 0 ? 6 : today - 1;

  const todayData = hours.weekHours.find(day => day.dayNumber === adjustedDay);
  return todayData || null;
}

// Check if restaurant is currently open
export function isCurrentlyOpen(hours: OpeningHoursData): boolean {
  const todayHours = getTodayHours(hours);
  if (!todayHours || todayHours.isClosed) return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return todayHours.shifts.some(shift => {
    return currentTime >= shift.open && currentTime <= shift.close;
  });
}

// Format time display
export function formatTimeRange(open: string, close: string): string {
  return `${open} - ${close}`;
}

// Backward compatibility with old interface
export interface OpeningHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
  specialClosures: Array<{ date: string; reason: string }>;
}

export const defaultOpeningHours: OpeningHours = {
  monday: { open: '11:30', close: '22:00', closed: false },
  tuesday: { open: '11:30', close: '22:00', closed: false },
  wednesday: { open: '11:30', close: '22:00', closed: false },
  thursday: { open: '11:30', close: '22:00', closed: false },
  friday: { open: '11:30', close: '23:00', closed: false },
  saturday: { open: '11:30', close: '23:00', closed: false },
  sunday: { open: '10:00', close: '21:00', closed: false },
  specialClosures: [],
};

// Backward compatibility functions
export const updateOpeningHours = async (hours: OpeningHours): Promise<void> => {
  try {
    const docRef = doc(db, 'settings', OPENING_HOURS_DOC_ID);
    await setDoc(docRef, hours);
  } catch (error) {
    console.error('Error updating opening hours:', error);
    throw error;
  }
};

export const isRestaurantOpen = async (): Promise<{
  isOpen: boolean;
  nextOpen?: string;
  nextClose?: string;
  dayName: string;
}> => {
  try {
    const hours = await getOpeningHours();
    const isOpen = isCurrentlyOpen(hours);
    const today = getTodayHours(hours);

    return {
      isOpen,
      nextOpen: today?.shifts[0]?.open,
      nextClose: today?.shifts[today.shifts.length - 1]?.close,
      dayName: today?.day || 'unknown',
    };
  } catch (error) {
    console.error('Error checking if restaurant is open:', error);
    return { isOpen: false, dayName: 'unknown' };
  }
};

export const getTodayHoursOld = async (): Promise<{ open: string; close: string; closed: boolean } | null> => {
  try {
    const hours = await getOpeningHours();
    const today = getTodayHours(hours);

    if (today) {
      return {
        open: today.shifts[0]?.open || '',
        close: today.shifts[today.shifts.length - 1]?.close || '',
        closed: today.isClosed,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting today hours:', error);
    return null;
  }
}
