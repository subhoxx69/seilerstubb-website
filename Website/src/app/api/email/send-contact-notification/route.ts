/**
 * Send Contact Reply Notification Email
 * POST /api/email/send-contact-notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendGmailEmail } from '@/lib/services/gmail-service';

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
    const { to, userName, subject } = body;

    // Validate required fields
    if (!to || !userName || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const restaurantName = 'Seilerstubb';
    const websiteUrl = 'https://seilerstubb.com';
    const messagesPageUrl = `${websiteUrl}/contact`;

    const html = `<div style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;padding:16px;">
    <tr>
      <td>
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#3b82f6 0%,#1e40af 100%);color:#ffffff;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">📬 Neue Nachricht erhalten</h1>
          <p style="margin:8px 0 0 0;font-size:16px;opacity:0.95;">${restaurantName}</p>
        </div>

        <!-- Content -->
        <div style="background:#ffffff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;">
          <p style="margin:0 0 20px 0;font-size:16px;color:#1f2937;">Hallo ${userName},</p>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#374151;">
            Sie haben eine neue Antwort zu Ihrer Nachricht erhalten: <strong>"${subject}"</strong>
          </p>

          <!-- Notification Box -->
          <div style="background:linear-gradient(135deg,#dbeafe 0%,#e0f2fe 100%);border:2px solid #3b82f6;border-radius:12px;padding:24px;margin:24px 0;overflow:hidden;text-align:center;">
            <p style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:#1e40af;">
              💬 Sie haben eine neue Antwort!
            </p>
            <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">
              Besuchen Sie Ihre Nachrichten, um die vollständige Antwort des Admin-Teams zu lesen.
            </p>
          </div>

          <!-- Call to Action -->
          <div style="margin:24px 0;text-align:center;">
            <a href="${messagesPageUrl}" target="_blank" style="display:inline-block;background:#3b82f6;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;transition:all 0.2s ease;">
              📖 Nachrichten anschauen
            </a>
          </div>

          <!-- Info Section -->
          <div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:16px;border-radius:8px;margin:24px 0;">
            <p style="margin:0;font-size:14px;color:#0c4a6e;font-weight:600;">ℹ️ Info:</p>
            <p style="margin:8px 0 0 0;font-size:13px;color:#164e63;line-height:1.6;">
              Melden Sie sich auf unserer Website an, um auf alle Ihre Nachrichten zuzugreifen und vollständig mit unserem Team zu kommunizieren.
            </p>
          </div>

          <p style="margin:24px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
            Beste Grüße,<br>
            <strong>Ihr Team ${restaurantName}</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#111827;color:#f3f4f6;padding:24px;border-radius:0 0 12px 12px;text-align:center;font-size:12px;line-height:1.6;">
          <p style="margin:0;font-weight:600;color:#ffffff;">${restaurantName}</p>
          <p style="margin:8px 0 0 0;color:#d1d5db;">
            <a href="${websiteUrl}" target="_blank" style="color:#3b82f6;text-decoration:none;">Website besuchen</a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</div>`;

    // Send email
    const result = await sendGmailEmail({
      to,
      subject: `📬 Neue Antwort: ${subject}`,
      html,
      text: `Sie haben eine neue Antwort zu Ihrer Nachricht "${subject}" erhalten. Besuchen Sie Ihre Nachrichten, um die vollständige Antwort zu lesen.`,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification email sent successfully',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error in send-contact-notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
