/**
 * Opening Hours Service
 * 
 * Unified business logic for parsing, validating, and generating availability from
 * the centralized openingHours Firestore document. Server-side only.
 * 
 * Data model: settings/openingHours
 */

export interface TimeInterval {
  start: string; // HH:MM
  end: string;   // HH:MM
}

export interface AreaConfig {
  capacity: number;
  enabled: boolean;
}

export interface SlotConfig {
  stepMinutes: number;      // e.g., 30 (slot granularity)
  minLeadMinutes: number;   // e.g., 60 (earliest lead time)
  maxAdvanceDays: number;   // e.g., 60 (latest bookable date)
}

export interface DaySchedule {
  closed: boolean;
  intervals: TimeInterval[];
}

export interface OpeningHoursDocument {
  timezone: string; // e.g., "Europe/Berlin"
  reservationsEnabled?: boolean; // e.g., true (defaults to true if not specified)
  week: {
    mon: DaySchedule;
    tue: DaySchedule;
    wed: DaySchedule;
    thu: DaySchedule;
    fri: DaySchedule;
    sat: DaySchedule;
    sun: DaySchedule;
  };
  exceptions?: Record<string, DaySchedule>; // "YYYY-MM-DD": { closed, intervals }
  slot: SlotConfig;
  areas?: {
    innen?: AreaConfig;
    aussen?: AreaConfig;
  };
  // Support both legacy format (start/end) and new multi-window format
  lieferung?: 
    | { start: string; end: string }
    | { windows: TimeInterval[]; closed?: boolean; minOrder?: number; fee?: number };
  abholung?:
    | { start: string; end: string }
    | { windows: TimeInterval[]; closed?: boolean; minOrder?: number };
  updatedAt?: number; // serverTimestamp
}

export interface TimeSlot {
  time: string;
  remaining: number;
}

export interface AvailabilityResult {
  closed: boolean;
  slots: TimeSlot[];
  date: string;
  area: string;
}

export interface NormalizedOpeningHours {
  timezone: string;
  reservationsEnabled: boolean;
  week: Record<string, DaySchedule>;
  exceptions: Record<string, DaySchedule>;
  slot: SlotConfig;
  areas: {
    innen: AreaConfig;
    aussen: AreaConfig;
  };
  // Support both legacy format (start/end) and new multi-window format
  lieferung?:
    | { start: string; end: string }
    | { windows: TimeInterval[]; closed?: boolean; minOrder?: number; fee?: number };
  abholung?:
    | { start: string; end: string }
    | { windows: TimeInterval[]; closed?: boolean; minOrder?: number };
  weekdayFlags: Array<{
    dayKey: string;
    dayLabel: string;
    closed: boolean;
    intervals: TimeInterval[];
  }>;
}

// ==================== HELPERS ====================

/**
 * Get day key (mon-sun) from Date object in a specific timezone
 */
export function getDayKey(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' });
  const dayName = formatter.format(date).toLowerCase().substring(0, 3); // e.g., "Mon"
  const dayMap: Record<string, string> = {
    mon: 'mon',
    tue: 'tue',
    wed: 'wed',
    thu: 'thu',
    fri: 'fri',
    sat: 'sat',
    sun: 'sun',
  };
  return dayMap[dayName] || 'mon';
}

/**
 * Get current time in a specific timezone as HH:MM string
 */
export function getCurrentTimeInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date());
}

/**
 * Get current date in a specific timezone as YYYY-MM-DD
 */
export function getTodayInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Compare two time strings (HH:MM). Returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareTime(a: string, b: string): number {
  const [aHour, aMin] = a.split(':').map(Number);
  const [bHour, bMin] = b.split(':').map(Number);
  const aTotal = aHour * 60 + aMin;
  const bTotal = bHour * 60 + bMin;
  return aTotal < bTotal ? -1 : aTotal > bTotal ? 1 : 0;
}

/**
 * Add minutes to a time string (HH:MM). Returns HH:MM.
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hour, min] = time.split(':').map(Number);
  let totalMin = hour * 60 + min + minutes;
  const newHour = Math.floor(totalMin / 60) % 24;
  const newMin = totalMin % 60;
  return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
}

/**
 * Check if a date (YYYY-MM-DD) is in the past relative to today in a timezone
 */
export function isDateInPast(dateStr: string, timezone: string): boolean {
  const today = getTodayInTimezone(timezone);
  return dateStr < today;
}

/**
 * Normalize opening hours document: merge week + exceptions, compute flags
 */
export function normalizeOpeningHours(doc: OpeningHoursDocument): NormalizedOpeningHours {
  const exceptions = doc.exceptions || {};
  
  const weekdayFlags = [
    { dayKey: 'mon', dayLabel: 'Monday', schedule: doc.week.mon },
    { dayKey: 'tue', dayLabel: 'Tuesday', schedule: doc.week.tue },
    { dayKey: 'wed', dayLabel: 'Wednesday', schedule: doc.week.wed },
    { dayKey: 'thu', dayLabel: 'Thursday', schedule: doc.week.thu },
    { dayKey: 'fri', dayLabel: 'Friday', schedule: doc.week.fri },
    { dayKey: 'sat', dayLabel: 'Saturday', schedule: doc.week.sat },
    { dayKey: 'sun', dayLabel: 'Sunday', schedule: doc.week.sun },
  ].map(({ dayKey, dayLabel, schedule }) => ({
    dayKey,
    dayLabel,
    closed: schedule.closed,
    intervals: schedule.intervals,
  }));

  return {
    timezone: doc.timezone,
    reservationsEnabled: doc.reservationsEnabled !== false,
    week: doc.week,
    exceptions,
    slot: doc.slot,
    areas: {
      innen: doc.areas?.innen || { enabled: true, capacity: 60 },
      aussen: doc.areas?.aussen || { enabled: true, capacity: 40 },
    },
    lieferung: doc.lieferung,
    abholung: doc.abholung,
    weekdayFlags,
  };
}

/**
 * Get schedule for a specific date: check exceptions first, then fallback to weekly
 */
export function getScheduleForDate(
  normalized: NormalizedOpeningHours,
  dateStr: string // YYYY-MM-DD
): DaySchedule {
  // Check if exception exists
  if (normalized.exceptions[dateStr]) {
    return normalized.exceptions[dateStr];
  }

  // Fallback to weekday
  const date = new Date(`${dateStr}T00:00:00`);
  const dayKey = getDayKey(date, normalized.timezone);
  return normalized.week[dayKey as keyof typeof normalized.week];
}

/**
 * Check if a date is closed
 */
export function isDateClosed(
  normalized: NormalizedOpeningHours,
  dateStr: string
): boolean {
  const schedule = getScheduleForDate(normalized, dateStr);
  return schedule.closed;
}

/**
 * Generate all time slots for a date, respecting lead time and interval
 */
export function generateTimeSlots(
  normalized: NormalizedOpeningHours,
  dateStr: string,
  currentTime?: string,
  currentDate?: string
): string[] {
  const schedule = getScheduleForDate(normalized, dateStr);
  if (schedule.closed) {
    return [];
  }

  const slots: string[] = [];
  const { stepMinutes, minLeadMinutes } = normalized.slot;

  // Determine earliest allowed time
  let earliestTime = '00:00';
  const today = currentDate || getTodayInTimezone(normalized.timezone);
  const now = currentTime || getCurrentTimeInTimezone(normalized.timezone);

  if (dateStr === today) {
    // For today, apply lead time
    earliestTime = addMinutesToTime(now, minLeadMinutes);
  }

  // Generate slots for each interval
  for (const interval of schedule.intervals) {
    let current = interval.start;
    const end = interval.end;

    while (compareTime(current, end) < 0) {
      // Only include slots >= earliestTime
      if (compareTime(current, earliestTime) >= 0) {
        slots.push(current);
      }
      current = addMinutesToTime(current, stepMinutes);
    }
  }

  return slots;
}

/**
 * Check if a time is within any interval for a schedule
 */
export function isTimeInIntervals(
  time: string,
  intervals: TimeInterval[]
): boolean {
  for (const interval of intervals) {
    if (compareTime(time, interval.start) >= 0 && compareTime(time, interval.end) < 0) {
      return true;
    }
  }
  return false;
}

/**
 * Validate if a datetime is allowed (not closed, time in interval, respects lead time, not in past)
 */
export function validateDateTimeAllowed(
  normalized: NormalizedOpeningHours,
  dateStr: string,
  timeStr: string,
  currentTime?: string,
  currentDate?: string
): { valid: boolean; reason?: string } {
  // Check if in past
  const today = currentDate || getTodayInTimezone(normalized.timezone);
  if (dateStr < today) {
    return { valid: false, reason: 'Date is in the past' };
  }

  // Check if date is beyond max advance days
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + normalized.slot.maxAdvanceDays);
  const maxDateStr = maxDate.toISOString().split('T')[0];
  if (dateStr > maxDateStr) {
    return { valid: false, reason: 'Date exceeds maximum advance booking window' };
  }

  // Check if date is closed
  if (isDateClosed(normalized, dateStr)) {
    return { valid: false, reason: 'Restaurant is closed on this date' };
  }

  const schedule = getScheduleForDate(normalized, dateStr);

  // Check if time is in any interval
  if (!isTimeInIntervals(timeStr, schedule.intervals)) {
    return { valid: false, reason: 'Time is outside operating hours' };
  }

  // Check lead time (only for today)
  if (dateStr === today) {
    const now = currentTime || getCurrentTimeInTimezone(normalized.timezone);
    const earliestAllowed = addMinutesToTime(now, normalized.slot.minLeadMinutes);
    if (compareTime(timeStr, earliestAllowed) < 0) {
      return { valid: false, reason: `Booking requires ${normalized.slot.minLeadMinutes} minutes advance notice` };
    }
  }

  return { valid: true };
}

/**
 * Format normalized opening hours for display
 * Returns array like:
 * [
 *   { day: 'Monday', closed: false, hours: '11:00–14:00, 17:00–23:00' },
 *   ...
 * ]
 */
export function formatForDisplay(
  normalized: NormalizedOpeningHours
): Array<{ day: string; closed: boolean; hours: string }> {
  return normalized.weekdayFlags.map(flag => {
    if (flag.closed) {
      return { day: flag.dayLabel, closed: true, hours: 'Closed' };
    }
    const hours = flag.intervals
      .map(iv => `${iv.start}–${iv.end}`)
      .join(', ');
    return { day: flag.dayLabel, closed: false, hours };
  });
}

export default {
  getDayKey,
  getCurrentTimeInTimezone,
  getTodayInTimezone,
  compareTime,
  addMinutesToTime,
  isDateInPast,
  normalizeOpeningHours,
  getScheduleForDate,
  isDateClosed,
  generateTimeSlots,
  isTimeInIntervals,
  validateDateTimeAllowed,
  formatForDisplay,
};
