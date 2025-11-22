/**
 * Send Reservation Decline Email
 * POST /api/email/send-decline
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendReservationDeclineEmail } from '@/lib/services/gmail-service';

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
    const { to, firstName, date, time, people, area, reason, reservationId } = body;

    // Validate required fields
    if (!to || !firstName || !date || !time || !people || !reservationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email
    const result = await sendReservationDeclineEmail({
      to,
      firstName,
      date,
      time,
      people,
      area,
      reason,
      reservationId,
    });

    if (!result.success) {
      console.error('Decline email send failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('✅ Decline email sent successfully:', result.messageId);
    return NextResponse.json({
      success: true,
      message: 'Decline email sent',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error in send-decline:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
