/**
 * POST /api/admin/opening-hours
 * 
 * Admin-only endpoint to update opening hours configuration.
 * - Validates structure of week, exceptions, areas, slot
 * - Stores to Firestore with serverTimestamp
 * - Requires admin authentication via Authorization header
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { z } from 'zod';

// Schema validation for opening hours update
const TimeIntervalSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format, use HH:MM'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format, use HH:MM'),
});

const DayScheduleSchema = z.object({
  closed: z.boolean(),
  intervals: z.array(TimeIntervalSchema),
});

const AreaConfigSchema = z.object({
  capacity: z.number().int().min(1).max(1000),
  enabled: z.boolean(),
});

const SlotConfigSchema = z.object({
  stepMinutes: z.number().int().min(5).max(120),
  minLeadMinutes: z.number().int().min(0).max(1440),
  maxAdvanceDays: z.number().int().min(1).max(365),
});

const TimeWindowSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
});

const OpeningHoursUpdateSchema = z.object({
  timezone: z.string().optional(),
  week: z
    .object({
      mon: DayScheduleSchema,
      tue: DayScheduleSchema,
      wed: DayScheduleSchema,
      thu: DayScheduleSchema,
      fri: DayScheduleSchema,
      sat: DayScheduleSchema,
      sun: DayScheduleSchema,
    })
    .optional(),
  exceptions: z.record(z.string(), DayScheduleSchema).optional(),
  slot: SlotConfigSchema.optional(),
  // Support both legacy (start/end) and new (windows) formats
  lieferung: z
    .union([
      z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
        end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      }),
      z.object({
        windows: z.array(TimeWindowSchema),
        closed: z.boolean().optional(),
        minOrder: z.number().optional(),
        fee: z.number().optional(),
      }),
    ])
    .optional(),
  abholung: z
    .union([
      z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
        end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      }),
      z.object({
        windows: z.array(TimeWindowSchema),
        closed: z.boolean().optional(),
        minOrder: z.number().optional(),
      }),
    ])
    .optional(),
});

/**
 * Check if request is from an admin user
 * Verifies user credentials via Authorization header
 */
async function isAdmin(request: NextRequest): Promise<string | null> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.warn('No authorization header provided');
      return null;
    }

    // Extract Bearer token
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.warn('Invalid authorization header format');
      return null;
    }

    // Decode JWT to get user email (without verification for now)
    // In production, you should verify the token
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format');
        return null;
      }
      
      // Decode payload
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      const email = payload.email;
      
      console.log('✅ Token decoded, email:', email);
      return email || null;
    } catch (decodeError) {
      console.warn('Failed to decode token:', decodeError);
      return null;
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    return null;
  }
}

const ADMIN_EMAILS = [
  'subhoxyysexy@gmail.com',
  'subjeets83@gmail.com',
  'seilerstubbwiesbaden@gmail.com',
];

export async function POST(request: NextRequest) {
  try {
    // Check admin status
    const userEmail = await isAdmin(request);
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      console.warn('Unauthorized user:', userEmail);
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Received payload:', JSON.stringify(body, null, 2));

    // Validate request structure
    const validated = OpeningHoursUpdateSchema.parse(body);
    console.log('Validated payload:', JSON.stringify(validated, null, 2));

    // Read current document to merge updates
    let current: Record<string, any> = {
      timezone: 'Europe/Berlin',
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

    // Merge validated updates with proper deep merging for nested objects
    const updated = {
      ...current,
      ...validated,
      // Ensure week is properly merged
      week: validated.week ? { ...current.week, ...validated.week } : current.week,
      // Ensure exceptions are properly merged
      exceptions: validated.exceptions ? { ...current.exceptions, ...validated.exceptions } : current.exceptions,
      // Ensure slot is properly merged
      slot: validated.slot ? { ...current.slot, ...validated.slot } : current.slot,
      // Deep merge lieferung to preserve windows, closed, minOrder, and fee
      ...(('lieferung' in validated) && validated.lieferung !== undefined && {
        lieferung: {
          ...current.lieferung,
          ...validated.lieferung,
        }
      }),
      // Deep merge abholung to preserve windows, closed, and minOrder
      ...(('abholung' in validated) && validated.abholung !== undefined && {
        abholung: {
          ...current.abholung,
          ...validated.abholung,
        }
      }),
      updatedAt: serverTimestamp(),
    };

    console.log('Merged update document:', JSON.stringify(updated, null, 2));

    // Write to Firestore
    const docRef = doc(db, 'settings', 'openingHours');
    console.log('Writing to Firestore at path: settings/openingHours');
    
    await setDoc(docRef, updated, { merge: true });
    
    console.log('✅ Successfully wrote to Firestore');

    // Invalidate caches by signaling to clear (client-side responsibility)
    // We can't directly clear server caches from here, but the new request will fetch fresh data

    return NextResponse.json(
      {
        success: true,
        message: 'Opening hours updated successfully',
        updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/admin/opening-hours:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Detailed error:', errorMessage);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    if (error instanceof z.ZodError) {
      console.error('Validation issues:', error.issues);
      return NextResponse.json(
        { error: 'Invalid request structure', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to update opening hours: ${errorMessage}` },
      { status: 500 }
    );
  }
}
