/**
 * POST /api/admin/test-email
 * 
 * Test endpoint to verify email sending works
 * No authentication required for testing
 * 
 * Body: {
 *   "to": "test@example.com",
 *   "testType": "acceptance" | "decline"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendReservationAcceptanceEmail, sendReservationDeclineEmail } from '@/lib/services/gmail-service';

export async function POST(request: NextRequest) {
  try {
    const { to, testType } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Missing "to" email address' },
        { status: 400 }
      );
    }

    if (!testType || !['acceptance', 'decline'].includes(testType)) {
      return NextResponse.json(
        { error: 'testType must be "acceptance" or "decline"' },
        { status: 400 }
      );
    }

    console.log(`📧 Test email request: sending ${testType} email to ${to}`);

    let result;

    if (testType === 'acceptance') {
      result = await sendReservationAcceptanceEmail({
        to: to,
        firstName: 'Test Guest',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        people: 4,
        bereich: 'Indoor',
        reservationId: 'TEST-' + Date.now(),
      });
    } else {
      result = await sendReservationDeclineEmail({
        to: to,
        firstName: 'Test Guest',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        people: 4,
        area: 'Indoor',
        reason: 'This is a test decline email to verify the email system is working correctly.',
        reservationId: 'TEST-' + Date.now(),
      });
    }

    if (!result.success) {
      console.error(`❌ Test email failed:`, result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: `Failed to send test ${testType} email`,
        },
        { status: 500 }
      );
    }

    console.log(`✅ Test email sent successfully to ${to}`);
    return NextResponse.json({
      success: true,
      message: `Test ${testType} email sent successfully to ${to}`,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
