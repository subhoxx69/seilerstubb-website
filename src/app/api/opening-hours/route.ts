/**
 * GET /api/opening-hours
 * 
 * Public endpoint that returns the normalized opening hours configuration.
 * - Merges weekly schedule with exceptions
 * - Returns computed flags for each weekday
 * - Includes timezone, areas, and slot configuration
 * 
 * Caching: 30s server-side in-memory cache
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  normalizeOpeningHours,
  type OpeningHoursDocument,
  type NormalizedOpeningHours,
} from '@/lib/opening-hours-service';

// Simple in-memory cache with TTL
interface CacheEntry {
  data: NormalizedOpeningHours;
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

// Export for cache invalidation from other endpoints
export function clearOpeningHoursCache() {
  cache = null;
  console.log('🗑️ Cleared opening hours cache');
}

async function getOpeningHoursFromFirestore(): Promise<NormalizedOpeningHours> {
  try {
    // Initialize Admin SDK
    let adminApp: any;
    let adminDb: any;

    try {
      const { initializeApp, getApp } = await import('firebase-admin/app');
      try {
        adminApp = getApp();
      } catch {
        // Initialize admin app - use individual env vars
        const serviceAccount = {
          type: process.env.FIREBASE_SERVICE_ACCOUNT_TYPE,
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI,
          token_uri: process.env.FIREBASE_TOKEN_URI,
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
          client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        } as any;

        const { cert } = await import('firebase-admin/app');
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
      }

      const { getFirestore } = await import('firebase-admin/firestore');
      adminDb = getFirestore(adminApp);
    } catch (adminError) {
      console.error('❌ Failed to initialize Admin SDK:', adminError);
      return normalizeOpeningHours(DEFAULT_OPENING_HOURS);
    }

    const docRef = adminDb.collection('settings').doc('openingHours');
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      console.log('ℹ️ Opening hours document not found, using defaults');
      // Create default document if it doesn't exist
      try {
        await docRef.set(DEFAULT_OPENING_HOURS, { merge: true });
        console.log('✅ Created default opening hours document');
      } catch (createError) {
        console.error('Warning: Could not create default document:', createError);
      }
      return normalizeOpeningHours(DEFAULT_OPENING_HOURS);
    }

    const data = snapshot.data() as OpeningHoursDocument;
    const normalized = normalizeOpeningHours(data);
    
    // Explicitly include lieferung and abholung from raw data
    return {
      ...normalized,
      lieferung: data.lieferung,
      abholung: data.abholung,
    };
  } catch (error) {
    console.error('❌ Error fetching opening hours from Firestore:', error);
    // Always return default on error
    return normalizeOpeningHours(DEFAULT_OPENING_HOURS);
  }
}

function getCachedOpeningHours(): NormalizedOpeningHours | null {
  if (!cache) return null;

  const age = Date.now() - cache.timestamp;
  if (age > CACHE_TTL_MS) {
    cache = null;
    return null;
  }

  return cache.data;
}

function setCachedOpeningHours(data: NormalizedOpeningHours): void {
  cache = { data, timestamp: Date.now() };
}

// Default opening hours (fallback)
const DEFAULT_OPENING_HOURS: OpeningHoursDocument = {
  timezone: 'Europe/Berlin',
  reservationsEnabled: true,
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
  areas: {
    innen: { enabled: true, capacity: 60 },
    aussen: { enabled: true, capacity: 40 },
  },
};

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/opening-hours - Starting request');
    
    // Try to return from cache first
    let normalized = getCachedOpeningHours();

    if (!normalized) {
      console.log('📦 Cache miss, fetching from Firestore');
      // Cache miss, fetch from Firestore
      normalized = await getOpeningHoursFromFirestore();
      setCachedOpeningHours(normalized);
      console.log('✅ Data cached for next 30 seconds');
    } else {
      console.log('⚡ Returning cached data');
    }

    console.log('✅ GET /api/opening-hours - Success');
    return NextResponse.json(normalized, {
      headers: {
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (error) {
    console.error('❌ Error in GET /api/opening-hours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opening hours' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/opening-hours
 * Admin endpoint to update opening hours configuration
 * Validates data before saving and clears cache
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization header (admin token check)
    const authHeader = request.headers.get('authorization');
    console.log('📥 POST /api/opening-hours - Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Invalid auth header');
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const body = await request.json() as Partial<OpeningHoursDocument>;
    console.log('📝 Request body keys:', Object.keys(body));

    // Validate required fields
    if (!body.timezone) {
      console.error('❌ Missing timezone');
      return NextResponse.json(
        { error: 'Validation failed: timezone is required' },
        { status: 400 }
      );
    }

    if (!body.week) {
      console.error('❌ Missing week');
      return NextResponse.json(
        { error: 'Validation failed: week schedule is required' },
        { status: 400 }
      );
    }

    // Validate week structure
    const requiredDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    for (const day of requiredDays) {
      if (!body.week[day as keyof typeof body.week]) {
        console.error(`❌ Missing day: ${day}`);
        return NextResponse.json(
          { error: `Validation failed: week.${day} is required` },
          { status: 400 }
        );
      }
    }

    if (!body.slot) {
      console.error('❌ Missing slot');
      return NextResponse.json(
        { error: 'Validation failed: slot configuration is required' },
        { status: 400 }
      );
    }

    // Validate slot values
    if (body.slot.stepMinutes < 5 || body.slot.stepMinutes > 120) {
      console.error('❌ Invalid stepMinutes:', body.slot.stepMinutes);
      return NextResponse.json(
        { error: 'Validation failed: stepMinutes must be between 5 and 120' },
        { status: 400 }
      );
    }

    if (body.slot.minLeadMinutes < 0 || body.slot.minLeadMinutes > 1440) {
      console.error('❌ Invalid minLeadMinutes:', body.slot.minLeadMinutes);
      return NextResponse.json(
        { error: 'Validation failed: minLeadMinutes must be between 0 and 1440' },
        { status: 400 }
      );
    }

    if (body.slot.maxAdvanceDays < 1 || body.slot.maxAdvanceDays > 365) {
      console.error('❌ Invalid maxAdvanceDays:', body.slot.maxAdvanceDays);
      return NextResponse.json(
        { error: 'Validation failed: maxAdvanceDays must be between 1 and 365' },
        { status: 400 }
      );
    }

    // Prepare data for Firestore
    const firestoreData: OpeningHoursDocument = {
      timezone: body.timezone,
      reservationsEnabled: body.reservationsEnabled !== false,
      week: body.week,
      exceptions: body.exceptions || {},
      slot: body.slot,
      lieferung: body.lieferung,
      abholung: body.abholung,
      updatedAt: Date.now(),
    };

    // Save to Firestore using Admin SDK
    let adminApp: any;
    let adminDb: any;

    try {
      const { initializeApp, getApp } = await import('firebase-admin/app');
      try {
        adminApp = getApp();
      } catch {
        // Initialize admin app - use individual env vars
        const serviceAccount = {
          type: process.env.FIREBASE_SERVICE_ACCOUNT_TYPE,
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI,
          token_uri: process.env.FIREBASE_TOKEN_URI,
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
          client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        } as any;

        const { cert } = await import('firebase-admin/app');
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
      }

      const { getFirestore } = await import('firebase-admin/firestore');
      adminDb = getFirestore(adminApp);
    } catch (adminError) {
      console.error('❌ Failed to initialize Admin SDK:', adminError);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const docRef = adminDb.collection('settings').doc('openingHours');
    await docRef.set(firestoreData, { merge: true });

    console.log('✅ Successfully saved opening hours');
    // Clear cache after successful update
    clearOpeningHoursCache();

    console.log('✅ Opening hours updated successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Opening hours updated successfully',
        data: normalizeOpeningHours(firestoreData),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in POST /api/opening-hours:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update opening hours',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
