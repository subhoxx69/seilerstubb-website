/**
 * Send Contact Form Reply Email
 * POST /api/email/send-contact-reply
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendContactReplyEmail } from '@/lib/services/gmail-service';

export async function POST(request: NextRequest) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, senderName, subject, message } = body;

    // Validate required fields
    if (!to || !senderName || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email
    const result = await sendContactReplyEmail({
      to,
      senderName,
      subject,
      message,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact reply email sent',
    });
  } catch (error) {
    console.error('Error in send-contact-reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
