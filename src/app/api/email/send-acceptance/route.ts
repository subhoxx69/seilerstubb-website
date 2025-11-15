/**
 * Send Reservation Acceptance Email
 * POST /api/email/send-acceptance
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendReservationAcceptanceEmail } from '@/lib/services/gmail-service';

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, firstName, date, time, people, bereich, phone, notes, reservationId } = body;

    // Validate required fields
    if (!to || !firstName || !date || !time || !people || !bereich || !reservationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email
    const result = await sendReservationAcceptanceEmail({
      to,
      firstName,
      date,
      time,
      people,
      bereich,
      phone,
      notes,
      reservationId,
    });

    if (!result.success) {
      console.error('Acceptance email send failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('✅ Acceptance email sent successfully:', result.messageId);
    return NextResponse.json({
      success: true,
      message: 'Acceptance email sent',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error in send-acceptance:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
