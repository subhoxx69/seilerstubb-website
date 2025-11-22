/**
 * Send Reservation Confirmation Email
 * POST /api/email/send-reservation-confirmation
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendReservationConfirmationEmail } from '@/lib/services/gmail-service';
import { auth } from '@/lib/firebase/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, firstName, date, time, people, bereich } = body;

    // Validate required fields
    if (!to || !firstName || !date || !time || !people || !bereich) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email
    const result = await sendReservationConfirmationEmail({
      to,
      firstName,
      date,
      time,
      people,
      bereich,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation confirmation email sent',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error in send-reservation-confirmation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
