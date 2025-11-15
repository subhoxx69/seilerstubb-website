/**
 * Gmail Service
 * Handles email sending via Google Gmail API
 */

import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const gmail = google.gmail('v1');

interface GmailToken {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

/**
 * Get OAuth2 client for Gmail
 */
function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Get authorization URL for user to grant permission
 */
export function getGmailAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  
  const scopes = ['https://www.googleapis.com/auth/gmail.send'];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getGmailTokens(code: string): Promise<GmailToken> {
  const oauth2Client = getOAuth2Client();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get access and refresh tokens');
    }

    // Save tokens to Firestore for later use
    await saveGmailTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date || Date.now() + 3600000, // 1 hour default
    });

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date || Date.now() + 3600000,
    };
  } catch (error) {
    console.error('Error exchanging authorization code for tokens:', error);
    throw error;
  }
}

/**
 * Save Gmail tokens to Firestore
 */
export async function saveGmailTokens(token: GmailToken): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'gmail_tokens'), {
      ...token,
      updatedAt: new Date(),
    });
    console.log('✅ Gmail tokens saved');
  } catch (error) {
    console.error('Error saving Gmail tokens:', error);
    throw error;
  }
}

/**
 * Get Gmail tokens from Firestore
 */
export async function getStoredGmailTokens(): Promise<GmailToken | null> {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'gmail_tokens'));
    
    if (docSnap.exists()) {
      return docSnap.data() as GmailToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting Gmail tokens:', error);
    return null;
  }
}

/**
 * Refresh access token if needed
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    // Update stored tokens with new access token
    const tokens = await getStoredGmailTokens();
    if (tokens) {
      await saveGmailTokens({
        ...tokens,
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date || Date.now() + 3600000,
      });
    }

    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

/**
 * Send email via Gmail SMTP using app password
 */
export async function sendGmailEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const gmailUser = process.env.GMAIL_USER_EMAIL;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      return {
        success: false,
        error: 'Gmail credentials not configured (GMAIL_USER_EMAIL or GMAIL_APP_PASSWORD missing)',
      };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const info = await transporter.sendMail({
      from: options.from || gmailUser,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('✅ Email sent via Gmail SMTP:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending email via Gmail SMTP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send reservation confirmation email
 */
export async function sendReservationConfirmationEmail(options: {
  to: string;
  firstName: string;
  date: string;
  time: string;
  people: number;
  bereich: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const date = new Date(options.date).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #d4a574 0%, #8b6f47 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Seilerstubb</h1>
        <p style="margin: 10px 0 0 0;">Restaurant & Bar</p>
      </div>
      
      <div style="padding: 30px; background: #f9f7f4;">
        <h2 style="color: #333; margin-top: 0;">Ihre Reservierung wurde erhalten!</h2>
        
        <p style="color: #555;">Hallo ${options.firstName},</p>
        
        <p style="color: #555;">
          vielen Dank für Ihre Reservierung! Wir haben folgende Reservierung erhalten:
        </p>
        
        <div style="background: white; border-left: 4px solid #d4a574; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0; color: #333;">
            <strong>Datum:</strong> ${date}
          </p>
          <p style="margin: 0 0 10px 0; color: #333;">
            <strong>Uhrzeit:</strong> ${options.time} Uhr
          </p>
          <p style="margin: 0 0 10px 0; color: #333;">
            <strong>Anzahl Personen:</strong> ${options.people}
          </p>
          <p style="margin: 0; color: #333;">
            <strong>Bereich:</strong> ${options.bereich}
          </p>
        </div>
        
        <p style="color: #555;">
          Wir werden Sie in Kürze kontaktieren, um Ihre Reservierung zu bestätigen.
        </p>
        
        <p style="color: #555;">
          Falls Sie Fragen haben, kontaktieren Sie uns bitte direkt.
        </p>
        
        <p style="color: #555; margin-top: 30px;">
          Viele Grüße,<br>
          <strong>Team Seilerstubb</strong>
        </p>
      </div>
      
      <div style="background: #333; color: #ccc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
        <p style="margin: 0;">
          Seilerstubb Restaurant & Bar<br>
          Kontakt: noreplyseilerstubb@gmail.com
        </p>
      </div>
    </div>
  `;

  return sendGmailEmail({
    to: options.to,
    subject: `Reservierungsbestätigung - ${date}`,
    html,
    text: `Reservierung für ${options.people} Personen am ${date} um ${options.time} Uhr`,
  });
}

/**
 * Send contact form reply email
 */
export async function sendContactReplyEmail(options: {
  to: string;
  senderName: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #d4a574 0%, #8b6f47 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Seilerstubb</h1>
        <p style="margin: 10px 0 0 0;">Restaurant & Bar</p>
      </div>
      
      <div style="padding: 30px; background: #f9f7f4;">
        <h2 style="color: #333; margin-top: 0;">${options.subject}</h2>
        
        <p style="color: #555;">Hallo,</p>
        
        <div style="background: white; border-left: 4px solid #d4a574; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #555; white-space: pre-wrap;">${options.message}</p>
        </div>
        
        <p style="color: #555; margin-top: 30px;">
          Viele Grüße,<br>
          <strong>Team Seilerstubb</strong>
        </p>
      </div>
      
      <div style="background: #333; color: #ccc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
        <p style="margin: 0;">
          Seilerstubb Restaurant & Bar<br>
          Kontakt: noreplyseilerstubb@gmail.com
        </p>
      </div>
    </div>
  `;

  return sendGmailEmail({
    to: options.to,
    subject: `Re: ${options.subject}`,
    html,
    text: options.message,
  });
}

/**
 * Send reservation acceptance email
 */
export async function sendReservationAcceptanceEmail(options: {
  to: string;
  firstName: string;
  date: string;
  time: string;
  people: number;
  bereich: string;
  phone?: string;
  notes?: string;
  reservationId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const parsedDate = new Date(options.date);
  const dateStr = parsedDate.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const restaurantName = 'Seilerstubb';
  const restaurantAddress = 'Seilerpfad 4, 65205 Wiesbaden';
  const restaurantPhone = '+49 611 123456';
  const restaurantEmail = 'noreplyseilerstubb@gmail.com';
  const mapsUrl = 'https://maps.google.com/?q=Seilerpfad+4,+65205+Wiesbaden';
  const websiteUrl = 'https://seilerstubb.com';

  const html = `<div style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;padding:16px;">
    <tr>
      <td>
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#da671f 0%,#c55819 100%);color:#ffffff;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">✓ Reservierung bestätigt</h1>
          <p style="margin:8px 0 0 0;font-size:16px;opacity:0.95;">${restaurantName}</p>
        </div>

        <!-- Content -->
        <div style="background:#ffffff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;">
          <p style="margin:0 0 20px 0;font-size:16px;color:#1f2937;">Hallo ${options.firstName},</p>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#374151;">
            wir freuen uns, Ihre Reservierung erfolgreich zu bestätigen! 
            Wir erwarten Sie zu folgendem Termin:
          </p>

          <!-- Reservation Details Card -->
          <div style="background:linear-gradient(135deg,#f3f4f6 0%,#ffffff 100%);border:2px solid #da671f;border-radius:12px;padding:24px;margin:24px 0;overflow:hidden;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Reservierungsnummer</div>
                  <div style="font-size:16px;font-weight:700;color:#da671f;margin-top:4px;">${options.reservationId}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">📅 Datum</div>
                  <div style="font-size:15px;font-weight:600;color:#111827;margin-top:4px;">${dateStr}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">🕐 Uhrzeit</div>
                  <div style="font-size:15px;font-weight:600;color:#111827;margin-top:4px;">${options.time} Uhr</div>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">👥 Personen</div>
                  <div style="font-size:15px;font-weight:600;color:#111827;margin-top:4px;">${options.people} ${options.people === 1 ? 'Person' : 'Personen'}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">🍽️ Bereich</div>
                  <div style="font-size:15px;font-weight:600;color:#111827;margin-top:4px;">${options.bereich}</div>
                </td>
              </tr>
              ${options.notes ? `<tr>
                <td style="padding:12px 0;">
                  <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">📝 Hinweise</div>
                  <div style="font-size:14px;color:#374151;margin-top:4px;">${options.notes}</div>
                </td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Info Box -->
          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:24px 0;">
            <p style="margin:0;font-size:14px;color:#78350f;font-weight:500;">
              ⏰ Bitte kommen Sie pünktlich. Bei Verspätungen bitten wir um Bescheid.
            </p>
          </div>

          <!-- Restaurant Info -->
          <div style="background:#f9fafb;border-radius:12px;padding:24px;margin:24px 0;">
            <h3 style="margin:0 0 16px 0;font-size:14px;font-weight:700;color:#111827;">📍 ${restaurantName}</h3>
            <p style="margin:0 0 12px 0;font-size:14px;color:#374151;line-height:1.6;">
              <strong>Adresse:</strong><br>
              ${restaurantAddress}
            </p>
            <p style="margin:0 0 12px 0;font-size:14px;color:#374151;">
              <strong>Telefon:</strong><br>
              <a href="tel:${restaurantPhone.replace(/\\s/g, '')}" style="color:#da671f;text-decoration:none;font-weight:600;">${restaurantPhone}</a>
            </p>
            <p style="margin:0;font-size:14px;color:#374151;">
              <strong>E-Mail:</strong><br>
              <a href="mailto:${restaurantEmail}" style="color:#da671f;text-decoration:none;font-weight:600;">${restaurantEmail}</a>
            </p>
          </div>

          <!-- Action Buttons -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
            <tr>
              <td style="padding:8px;">
                <a href="${mapsUrl}" target="_blank" style="display:inline-block;background:#da671f;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                  📍 Auf Google Maps
                </a>
              </td>
              <td style="padding:8px;">
                <a href="tel:${restaurantPhone.replace(/\\s/g, '')}" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                  📞 Anrufen
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
            Wir freuen uns auf Ihren Besuch!<br>
            <strong>Viele Grüße,<br>Ihr Team ${restaurantName}</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#111827;color:#f3f4f6;padding:24px;border-radius:0 0 12px 12px;text-align:center;font-size:12px;line-height:1.6;">
          <p style="margin:0;font-weight:600;color:#ffffff;">${restaurantName}</p>
          <p style="margin:8px 0 0 0;color:#d1d5db;">
            ${restaurantAddress}<br>
            Telefon: ${restaurantPhone}<br>
            <a href="mailto:${restaurantEmail}" style="color:#da671f;text-decoration:none;">${restaurantEmail}</a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</div>`;

  return sendGmailEmail({
    to: options.to,
    subject: `✓ Ihre Reservierung wurde bestätigt - ${dateStr}`,
    html,
    text: `Ihre Reservierung für ${options.people} Personen am ${dateStr} um ${options.time} Uhr wurde bestätigt.`,
  });
}

/**
 * Send reservation decline email
 */
export async function sendReservationDeclineEmail(options: {
  to: string;
  firstName: string;
  date: string;
  time: string;
  people: number;
  area?: string;
  reason?: string;
  reservationId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const parsedDate = new Date(options.date);
  const dateStr = parsedDate.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const restaurantName = 'Seilerstubb';
  const restaurantAddress = 'Seilerpfad 4, 65205 Wiesbaden';
  const restaurantPhone = '+49 611 123456';
  const restaurantEmail = 'noreplyseilerstubb@gmail.com';
  const mapsUrl = 'https://maps.google.com/?q=Seilerpfad+4,+65205+Wiesbaden';
  const websiteUrl = 'https://seilerstubb.com';

  const html = `<div style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;padding:16px;">
    <tr>
      <td>
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#7f1d1d 0%,#991b1b 100%);color:#ffffff;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">⚠️ Reservierung nicht möglich</h1>
          <p style="margin:8px 0 0 0;font-size:16px;opacity:0.95;">${restaurantName}</p>
        </div>

        <!-- Content -->
        <div style="background:#ffffff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;">
          <p style="margin:0 0 20px 0;font-size:16px;color:#1f2937;">Hallo ${options.firstName},</p>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#374151;">
            leider können wir Ihre Reservierung für den angefragten Termin nicht annehmen. 
            Gern helfen wir Ihnen, einen alternativen Termin zu finden.
          </p>

          <!-- Reservation Details Card -->
          <div style="background:linear-gradient(135deg,#f3f4f6 0%,#ffffff 100%);border:2px solid #dc2626;border-radius:12px;padding:24px;margin:24px 0;overflow:hidden;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Reservierungsnummer</div>
                  <div style="font-size:16px;font-weight:700;color:#dc2626;margin-top:4px;">${options.reservationId}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">📅 Datum</div>
                  <div style="font-size:15px;font-weight:600;color:#111827;margin-top:4px;">${dateStr}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">🕐 Uhrzeit</div>
                  <div style="font-size:15px;font-weight:600;color:#111827;margin-top:4px;">${options.time} Uhr</div>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">👥 Personen</div>
                  <div style="font-size:15px;font-weight:600;color:#111827;margin-top:4px;">${options.people} ${options.people === 1 ? 'Person' : 'Personen'}</div>
                </td>
              </tr>
              ${options.area ? `<tr>
                <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">🍽️ Bereich</div>
                  <div style="font-size:15px;font-weight:600;color:#111827;margin-top:4px;">${options.area}</div>
                </td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Reason Box -->
          ${options.reason ? `<div style="background:#fee2e2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin:24px 0;">
            <p style="margin:0;font-size:14px;color:#7f1d1d;font-weight:600;margin-bottom:8px;">Grund der Absage:</p>
            <p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;">${options.reason}</p>
          </div>` : ''}

          <!-- Restaurant Info -->
          <div style="background:#f9fafb;border-radius:12px;padding:24px;margin:24px 0;">
            <h3 style="margin:0 0 16px 0;font-size:14px;font-weight:700;color:#111827;">📍 ${restaurantName}</h3>
            <p style="margin:0 0 12px 0;font-size:14px;color:#374151;line-height:1.6;">
              <strong>Adresse:</strong><br>
              ${restaurantAddress}
            </p>
            <p style="margin:0 0 12px 0;font-size:14px;color:#374151;">
              <strong>Telefon:</strong><br>
              <a href="tel:${restaurantPhone.replace(/\\s/g, '')}" style="color:#dc2626;text-decoration:none;font-weight:600;">${restaurantPhone}</a>
            </p>
            <p style="margin:0;font-size:14px;color:#374151;">
              <strong>E-Mail:</strong><br>
              <a href="mailto:${restaurantEmail}" style="color:#dc2626;text-decoration:none;font-weight:600;">${restaurantEmail}</a>
            </p>
          </div>

          <!-- Action Buttons -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
            <tr>
              <td style="padding:8px;">
                <a href="${websiteUrl}" target="_blank" style="display:inline-block;background:#dc2626;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                  📅 Neuen Termin wählen
                </a>
              </td>
              <td style="padding:8px;">
                <a href="tel:${restaurantPhone.replace(/\\s/g, '')}" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                  📞 Anrufen
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
            Kontaktieren Sie uns gerne, um einen alternativen Termin zu finden!<br>
            <strong>Viele Grüße,<br>Ihr Team ${restaurantName}</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#111827;color:#f3f4f6;padding:24px;border-radius:0 0 12px 12px;text-align:center;font-size:12px;line-height:1.6;">
          <p style="margin:0;font-weight:600;color:#ffffff;">${restaurantName}</p>
          <p style="margin:8px 0 0 0;color:#d1d5db;">
            ${restaurantAddress}<br>
            Telefon: ${restaurantPhone}<br>
            <a href="mailto:${restaurantEmail}" style="color:#dc2626;text-decoration:none;">${restaurantEmail}</a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</div>`;

  return sendGmailEmail({
    to: options.to,
    subject: `⚠️ Reservierung nicht möglich - Alternativtermin?`,
    html,
    text: `Leider können wir Ihre Reservierung für ${options.people} Personen am ${dateStr} um ${options.time} Uhr nicht annehmen. Grund: ${options.reason || 'Tisch nicht verfügbar'}. Kontaktieren Sie uns bitte für einen alternativen Termin.`,
  });
}
