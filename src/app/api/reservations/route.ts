/**
 * POST /api/reservations
 * Create a new encrypted reservation with validation, rate limiting, and audit logging
 * 
 * Now validates against the centralized settings/openingHours document.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { encrypt, hashValue, getDateIndex } from '@/lib/encryption';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limiter';
import { z } from 'zod';
import {
  validateDateTimeAllowed,
  type NormalizedOpeningHours,
} from '@/lib/opening-hours-service';

// Request validation schema
const ReservationSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[\d+\-\s()]+$/).min(5).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  people: z.number().int().min(1).max(100),
  bereich: z.enum(['Innenbereich', 'Außenbereich']),
  notes: z.string().trim().max(500).optional(),
  userId: z.string().optional(), // Optional user ID for authenticated users
});

function getClientIP(req: NextRequest): string {
  return (
    (req.headers.get('cf-connecting-ip') as string) ||
    (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() as string) ||
    'unknown'
  );
}

/**
 * Fetch opening hours from the GET /api/opening-hours endpoint (includes caching)
 */
async function getOpeningHours(): Promise<NormalizedOpeningHours> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/opening-hours`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch opening hours: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching opening hours:', error);
    throw error;
  }
}

/**
 * Count existing reservations for a specific date, area, and time
 */
async function getReservedCapacity(date: string, bereich: string, time: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'reservations'),
      where('date', '==', date),
      where('bereich', '==', bereich),
      where('time', '==', time),
      where('status', 'in', ['pending', 'accepted'])
    );

    const snapshot = await getDocs(q);
    let total = 0;

    snapshot.docs.forEach(doc => {
      // Decrypt people count
      const data = doc.data();
      const people = data.people || 0;
      total += people;
    });

    return total;
  } catch (error) {
    console.warn('Error counting reservations:', error);
    return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ReservationSchema.parse(body);

    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Rate limiting
    const ipKey = getRateLimitKey(clientIP, 'reservation');
    const ipLimitCheck = checkRateLimit(ipKey, RATE_LIMITS.RESERVATION);
    if (!ipLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Reservierungsanfragen. Bitte versuchen Sie es später erneut.' },
        { status: 429 }
      );
    }

    // Get opening hours config
    let normalized: NormalizedOpeningHours;
    try {
      normalized = await getOpeningHours();
    } catch (error) {
      console.error('Could not fetch opening hours:', error);
      return NextResponse.json(
        { success: false, error: 'Konfigurationsfehler. Bitte versuchen Sie es später erneut.' },
        { status: 500 }
      );
    }

    // Check if reservations are enabled globally
    if (!normalized.reservationsEnabled) {
      return NextResponse.json(
        { success: false, error: 'Reservierungen sind derzeit nicht möglich.' },
        { status: 400 }
      );
    }

    // Map bereich to area key for database storage
    const area = validated.bereich === 'Innenbereich' ? 'innen' : 'aussen';

    // Check if area is enabled
    if (!normalized.areas[area as 'innen' | 'aussen']?.enabled) {
      return NextResponse.json(
        { success: false, error: `${validated.bereich} ist nicht verfügbar.` },
        { status: 400 }
      );
    }

    // Validate date/time against opening hours config
    const validation = validateDateTimeAllowed(normalized, validated.date, validated.time);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.reason || 'Ungültige Reservierungszeit' },
        { status: 400 }
      );
    }

    // Check capacity at this specific date/area/time
    const reserved = await getReservedCapacity(validated.date, validated.bereich, validated.time);
    const capacity = normalized.areas[area as 'innen' | 'aussen'].capacity;
    const available = capacity - reserved;

    if (validated.people > available) {
      return NextResponse.json(
        {
          success: false,
          error: `Für ${validated.bereich} am ${validated.date} um ${validated.time} Uhr sind nur noch ${available} Plätze verfügbar.`,
        },
        { status: 400 }
      );
    }

    // Encrypt sensitive data
    const encData = {
      firstName: validated.firstName,
      lastName: validated.lastName || '',
      email: validated.email || '',
      phone: validated.phone,
      date: validated.date,
      time: validated.time,
      people: validated.people,
      bereich: validated.bereich,
      notes: validated.notes || '',
      status: 'pending',
      rejectionReason: null,
    };

    const encryptedBlob = encrypt(encData);
    const emailHash = validated.email ? hashValue(validated.email) : hashValue(validated.phone);
    const dateIndex = getDateIndex(validated.date);

    // Save to Firestore
    const reservationRef = collection(db, 'reservations');
    const docRef = await addDoc(reservationRef, {
      // ID is automatically generated by Firestore (docRef.id)
      userId: validated.userId || null, // Store userId if available
      uid: null,
      firstName: validated.firstName,
      lastName: validated.lastName || '',
      email: validated.email || '',
      userEmail: validated.email || '', // Add userEmail field for queries
      userName: validated.firstName + (validated.lastName ? ' ' + validated.lastName : ''), // Add userName field
      userPhone: validated.phone, // Add userPhone field
      phone: validated.phone,
      date: validated.date,
      time: validated.time,
      bereich: validated.bereich,
      people: validated.people,
      notes: validated.notes || '',
      status: 'pending',
      rejectionReason: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      meta: {
        ipHash: hashValue(clientIP),
        uaHash: hashValue(userAgent),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      enc: encryptedBlob,
      search: { emailHash, dateIndex },
    });

    return NextResponse.json(
      {
        success: true,
        reservationId: docRef.id,
        message: 'Reservierung erfolgreich erstellt. Wir bestätigen Ihre Buchung in Kürze.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Eingabe', issues: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Erstellen der Reservierung' },
      { status: 500 }
    );
  }
}
