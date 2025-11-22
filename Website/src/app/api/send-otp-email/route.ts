import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email HTML template for OTP (German version with professional design)
function generateOTPEmailHTML(email: string, otpCode: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dein OTP-Verifizierungscode - Seiler Stubb</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
      line-height: 1.6;
      color: #333;
      padding: 20px;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    
    .header {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      color: #ffffff;
      padding: 50px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      right: -50px;
      width: 200px;
      height: 200px;
      background: rgba(245, 158, 11, 0.05);
      border-radius: 50%;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    
    .logo {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 28px;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }
    
    .logo-text {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 1px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .header-title {
      font-size: 32px;
      font-weight: 800;
      margin: 10px 0;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .header-desc {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 8px;
      position: relative;
      z-index: 1;
    }
    
    .content {
      padding: 50px 35px;
    }
    
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 15px;
      font-weight: 600;
    }
    
    .description {
      font-size: 15px;
      color: #555;
      margin-bottom: 35px;
      line-height: 1.8;
    }
    
    .otp-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 16px;
      padding: 35px;
      margin: 35px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
    }
    
    .otp-label {
      font-size: 11px;
      color: #b45309;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 700;
      margin-bottom: 15px;
      display: block;
    }
    
    .otp-code {
      font-size: 42px;
      font-weight: 900;
      color: #d97706;
      letter-spacing: 6px;
      font-family: 'Courier New', monospace;
      background-color: rgba(255, 255, 255, 0.8);
      padding: 20px;
      border-radius: 12px;
      display: inline-block;
      min-width: 300px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    
    .otp-note {
      font-size: 13px;
      color: #b45309;
      margin-top: 15px;
      font-weight: 600;
    }
    
    .info-section {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border-left: 5px solid #10b981;
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
      border: 1px solid #d1fae5;
    }
    
    .info-title {
      font-size: 13px;
      font-weight: 700;
      color: #059669;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .info-text {
      font-size: 14px;
      color: #555;
      line-height: 1.9;
    }
    
    .security-section {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 2px solid #fecaca;
      padding: 20px;
      margin: 30px 0;
      border-radius: 12px;
    }
    
    .security-title {
      font-size: 13px;
      font-weight: 700;
      color: #dc2626;
      margin-bottom: 10px;
    }
    
    .security-text {
      font-size: 14px;
      color: #555;
      line-height: 1.9;
    }
    
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
      margin: 30px 0;
    }
    
    .contact-section {
      background: linear-gradient(135deg, #f3f4f6 0%, #f9fafb 100%);
      border: 1px solid #e5e7eb;
      padding: 25px;
      margin: 30px 0;
      border-radius: 12px;
    }
    
    .contact-title {
      font-size: 13px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .contact-item {
      font-size: 14px;
      color: #555;
      margin-bottom: 12px;
      line-height: 1.6;
    }
    
    .contact-label {
      font-weight: 600;
      color: #1f2937;
    }
    
    .contact-link {
      color: #f59e0b;
      text-decoration: none;
      font-weight: 600;
    }
    
    .meta-info {
      font-size: 13px;
      color: #999;
      text-align: center;
      margin: 25px 0;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .footer {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      padding: 35px 30px;
      text-align: center;
      border-top: 3px solid #f59e0b;
    }
    
    .footer-text {
      font-size: 13px;
      color: #d1d5db;
      margin-bottom: 12px;
      line-height: 1.8;
    }
    
    .footer-text strong {
      color: #fbbf24;
      font-weight: 700;
    }
    
    .footer-link {
      color: #f59e0b;
      text-decoration: none;
      font-weight: 600;
    }
    
    .copyright {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 15px;
    }
    
    @media (max-width: 600px) {
      .header { padding: 35px 20px; }
      .content { padding: 30px 20px; }
      .footer { padding: 25px 20px; }
      .header-title { font-size: 26px; }
      .otp-code { font-size: 32px; letter-spacing: 4px; min-width: 240px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo-section">
        <div class="logo">🍽️</div>
        <div class="logo-text">Seiler Stubb</div>
      </div>
      <div class="header-title">Verifizierung erforderlich</div>
      <div class="header-desc">Bestätige deinen Zugang mit diesem Code</div>
    </div>
    
    <div class="content">
      <p class="greeting">Hallo,</p>
      
      <p class="description">
        Du hast dich gerade in dein <strong>Seiler Stubb</strong> Konto angemeldet. Um deine Anmeldung zu bestätigen und dein Konto zu sichern, verwende bitte den folgenden Code:
      </p>
      
      <div class="otp-section">
        <span class="otp-label">Dein Verifizierungscode</span>
        <div class="otp-code">${otpCode}</div>
        <p class="otp-note">⏱️ Dieser Code verfällt in 10 Minuten</p>
      </div>
      
      <div class="info-section">
        <div class="info-title">✓ Nächste Schritte</div>
        <div class="info-text">
          1. Kopiere den Verifizierungscode oben<br>
          2. Gehe zurück zur Anmeldung<br>
          3. Gib den Code im Verifizierungsfeld ein<br>
          4. Abschluss deiner Anmeldung
        </div>
      </div>
      
      <div class="security-section">
        <div class="security-title">🔒 Sicherheitshinweis</div>
        <div class="security-text">
          <strong>Teile diesen Code niemals mit jemandem!</strong> Die Mitarbeiter von Seiler Stubb werden dich niemals um deinen Verifizierungscode per E-Mail, Telefon oder anderen Kanälen bitten. Solltest du diese Anfrage nicht gestellt haben, ignoriere diese E-Mail bitte.
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="contact-section">
        <div class="contact-title">📍 Kontaktiere uns</div>
        <div class="contact-item">
          <span class="contact-label">Adresse:</span><br>
          Seilerpfad 4, 65205 Wiesbaden, Deutschland
        </div>
        <div class="contact-item">
          <span class="contact-label">Telefon:</span><br>
          <a href="tel:061136004940" class="contact-link">0611 36004940</a>
        </div>
        <div class="contact-item">
          <span class="contact-label">E-Mail:</span><br>
          <a href="mailto:seilerstubbwiesbaden@gmail.com" class="contact-link">seilerstubbwiesbaden@gmail.com</a>
        </div>
      </div>
      
      <div class="meta-info">
        <strong>E-Mail:</strong> ${email}<br>
        <strong>Zeitstempel:</strong> ${new Date().toLocaleString('de-DE', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit'
        })}
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-text">
        <strong>🍽️ Seiler Stubb</strong><br>
        Dein Lieblingsrestaurant in Wiesbaden
      </div>
      
      <div class="footer-text" style="margin-top: 15px;">
        <a href="https://seilerstubb.de" class="footer-link">Besuche unsere Website</a> • 
        <a href="https://maps.google.com" class="footer-link">Auf Google Maps anschauen</a>
      </div>
      
      <div class="copyright">
        © 2025 Seiler Stubb. Alle Rechte vorbehalten.
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Configure Gmail transporter using Gmail OAuth credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email, otpCode } = await request.json();

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: 'Email and OTP code are required' },
        { status: 400 }
      );
    }

    // Check if Gmail credentials are configured
    if (!process.env.GMAIL_USER_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Gmail credentials not configured in environment variables');
      console.error('Missing: GMAIL_USER_EMAIL or GMAIL_APP_PASSWORD');
      return NextResponse.json(
        { error: 'Email service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Generate HTML template
    const htmlTemplate = generateOTPEmailHTML(email, otpCode);

    console.log(`📧 Attempting to send OTP email to: ${email}`);
    console.log(`Gmail from: ${process.env.GMAIL_USER_EMAIL}`);

    // Send email - only from and to, no reply-to
    const result = await transporter.sendMail({
      from: process.env.GMAIL_USER_EMAIL,
      to: email,
      subject: 'Dein OTP-Verifizierungscode - Seiler Stubb',
      html: htmlTemplate,
    });

    console.log(`✅ OTP email sent successfully to ${email}`);
    console.log(`Email message ID: ${result.messageId}`);

    return NextResponse.json(
      { 
        message: 'OTP email sent successfully',
        messageId: result.messageId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send OTP email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
