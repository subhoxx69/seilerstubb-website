/**
 * GET /api/availability
 * 
 * Query parameters: date=YYYY-MM-DD&area=innen|aussen
 * 
 * Returns available time slots for a specific date and area:
 * - Checks if date is closed
 * - Generates slots respecting interval granularity and lead time
 * - Queries existing reservations to compute remaining capacity
 * - Returns: { closed: boolean, slots: [ { time: "HH:MM", remaining: N }, ... ] }
 * 
 * Caching: ~15s per (date, area) combination
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { NormalizedOpeningHours } from '@/lib/opening-hours-service';

// Simple in-memory cache with TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 1000; // 15 seconds

function getCacheKey(date: string, area: string): string {
  return `${date}:${area}`;
}

function getCached(date: string, area: string): any | null {
  const key = getCacheKey(date, area);
  const entry = cache.get(key);

  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCached(date: string, area: string, data: any): void {
  const key = getCacheKey(date, area);
  cache.set(key, { data, timestamp: Date.now() });
}

// Default opening hours
const DEFAULT_OPENING_HOURS: any = {
  timezone: 'Europe/Berlin',
  areas: {
    innen: { capacity: 60, enabled: true },
    aussen: { capacity: 40, enabled: true },
  },
  week: {
    mon: { closed: true, intervals: [] },
    tue: { closed: false, intervals: [{ start: '11:00', end: '14:00' }, { start: '17:00', end: '22:00' }] },
    wed: { closed: false, intervals: [{ start: '11:00', end: '14:00' }, { start: '17:00', end: '22:00' }] },
    thu: { closed: false, intervals: [{ start: '11:00', end: '14:00' }, { start: '17:00', end: '22:00' }] },
    fri: { closed: false, intervals: [{ start: '11:00', end: '14:00' }, { start: '17:00', end: '22:00' }] },
    sat: { closed: false, intervals: [{ start: '11:00', end: '14:00' }, { start: '17:00', end: '22:00' }] },
    sun: { closed: true, intervals: [] },
  },
  exceptions: {},
  slot: {
    stepMinutes: 30,
    minLeadMinutes: 60,
    maxAdvanceDays: 60,
  },
};

/**
 * Fetch opening hours config from Firestore
 */
async function getOpeningHours(): Promise<any> {
  try {
    const docRef = doc(db, 'settings', 'openingHours');
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return DEFAULT_OPENING_HOURS;
    }

    const data = snapshot.data();
    return {
      timezone: data.timezone || DEFAULT_OPENING_HOURS.timezone,
      areas: data.areas || DEFAULT_OPENING_HOURS.areas,
      week: data.week || DEFAULT_OPENING_HOURS.week,
      exceptions: data.exceptions || {},
      slot: data.slot || DEFAULT_OPENING_HOURS.slot,
    };
  } catch (error) {
    console.error('Error fetching opening hours:', error);
    return DEFAULT_OPENING_HOURS;
  }
}

function getDayKeyFromDate(dateStr: string, timezone: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const formatter = new Intl.DateTimeFormat('en-US', { 
    weekday: 'long',
    timeZone: timezone 
  });
  const dayName = formatter.format(date).toLowerCase().substring(0, 3);
  
  const dayMap: Record<string, string> = {
    mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu',
    fri: 'fri', sat: 'sat', sun: 'sun'
  };
  return dayMap[dayName] || 'mon';
}

function getCurrentTimeInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  });
  return formatter.format(new Date());
}

function getTodayInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hour, min] = time.split(':').map(Number);
  let totalMin = hour * 60 + min + minutes;
  const newHour = Math.floor(totalMin / 60) % 24;
  const newMin = totalMin % 60;
  return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
}

function compareTime(a: string, b: string): number {
  const [aH, aM] = a.split(':').map(Number);
  const [bH, bM] = b.split(':').map(Number);
  const aTotal = aH * 60 + aM;
  const bTotal = bH * 60 + bM;
  return aTotal < bTotal ? -1 : aTotal > bTotal ? 1 : 0;
}

/**
 * Count existing reservations for a date, area, and time
 * area: normalized key ('innen' or 'aussen')
 */
async function countReservations(date: string, area: string, time: string): Promise<number> {
  try {
    // Map normalized area key back to display name for database query
    const bereiche = area === 'innen' ? 'Innenbereich' : 'Außenbereich';
    
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('date', '==', date),
      where('bereich', '==', bereiche),
      where('time', '==', time),
      where('status', 'in', ['pending', 'accepted'])
    );
    
    const snapshot = await getDocs(q);
    let total = 0;
    snapshot.docs.forEach(doc => {
      total += (doc.data().people || 0);
    });
    return total;
  } catch (error) {
    console.error('Error counting reservations:', error);
    return 0;
  }
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const area = searchParams.get('area');

  // Validate parameters
  if (!date || !area) {
    return NextResponse.json(
      { error: 'Missing required parameters: date (YYYY-MM-DD) and area (innen|aussen)' },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date format. Use YYYY-MM-DD' },
      { status: 400 }
    );
  }

  if (!['innen', 'aussen'].includes(area)) {
    return NextResponse.json(
      { error: 'Invalid area. Use innen or aussen' },
      { status: 400 }
    );
  }

  try {
    // Check cache first
    const cached = getCached(date, area);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, max-age=15' },
      });
    }

    // Fetch opening hours config
    const hours = await getOpeningHours();

    // Check if area is enabled
    const areaConfig = hours.areas[area as 'innen' | 'aussen'];
    if (!areaConfig?.enabled) {
      const result = {
        closed: true,
        slots: [],
        date,
        area,
      };
      setCached(date, area, result);
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, max-age=15' },
      });
    }

    // Get day key and schedule
    const dayKey = getDayKeyFromDate(date, hours.timezone);
    let daySchedule = hours.week[dayKey];

    // Check exceptions first
    if (hours.exceptions && hours.exceptions[date]) {
      daySchedule = hours.exceptions[date];
    }

    // Check if closed
    if (!daySchedule || daySchedule.closed) {
      const result = {
        closed: true,
        slots: [],
        date,
        area,
      };
      setCached(date, area, result);
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, max-age=15' },
      });
    }

    // Generate time slots
    const slots: any[] = [];
    const today = getTodayInTimezone(hours.timezone);
    const now = getCurrentTimeInTimezone(hours.timezone);
    const isToday = date === today;

    for (const interval of daySchedule.intervals) {
      let currentTime = interval.start;
      const endTime = interval.end;

      while (compareTime(currentTime, endTime) < 0) {
        // Check lead time
        if (isToday) {
          const earliestAllowed = addMinutesToTime(now, hours.slot.minLeadMinutes);
          if (compareTime(currentTime, earliestAllowed) < 0) {
            currentTime = addMinutesToTime(currentTime, hours.slot.stepMinutes);
            continue;
          }
        }

        // Get remaining capacity
        const reserved = await countReservations(date, area, currentTime);
        const remaining = Math.max(0, areaConfig.capacity - reserved);

        slots.push({
          time: currentTime,
          remaining,
        });

        currentTime = addMinutesToTime(currentTime, hours.slot.stepMinutes);
      }
    }

    const result = {
      closed: false,
      slots,
      date,
      area,
    };

    setCached(date, area, result);

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=15' },
    });
  } catch (error) {
    console.error('Error in GET /api/availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
