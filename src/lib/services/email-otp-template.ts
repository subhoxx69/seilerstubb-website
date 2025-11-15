/**
 * Email template service for OTP verification emails
 * Generates premium HTML email templates with restaurant branding
 */

export interface EmailOTPTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

/**
 * Generate premium HTML email template for OTP
 */
export function generateOTPEmailTemplate(
  email: string,
  otpCode: string,
  restaurantName: string = 'Seiler Stubb',
  expiryMinutes: number = 10
): EmailOTPTemplate {
  const expiryTime = new Date(Date.now() + expiryMinutes * 60 * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification - ${restaurantName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%);
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo-wrapper {
      background: #000;
      width: 80px;
      height: 80px;
      border-radius: 12px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    .logo-icon {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }
    .header-title {
      color: white;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }
    .header-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      margin-top: 8px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      color: #111;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .message {
      color: #555;
      font-size: 16px;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .otp-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fef08a 100%);
      border-left: 4px solid #d97706;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      text-align: center;
    }
    .otp-label {
      color: #92400e;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      display: block;
    }
    .otp-code {
      background: white;
      color: #b45309;
      font-size: 48px;
      font-weight: 800;
      font-family: 'Courier New', monospace;
      letter-spacing: 8px;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #d97706;
      display: inline-block;
      min-width: 280px;
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
    }
    .otp-info {
      color: #92400e;
      font-size: 13px;
      margin-top: 15px;
      font-weight: 500;
    }
    .security-note {
      background: #fef08a;
      border: 1px solid #fcd34d;
      padding: 12px 15px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 13px;
      color: #78350f;
    }
    .security-note strong {
      color: #b45309;
    }
    .footer-text {
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
    }
    .footer-link {
      color: #d97706;
      text-decoration: none;
      font-weight: 600;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .restaurant-name {
      color: #d97706;
      font-weight: 700;
    }
    .timer {
      display: inline-block;
      background: #fecaca;
      color: #991b1b;
      padding: 8px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 13px;
      margin-top: 10px;
    }
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .signature-name {
      color: #111;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .signature-role {
      color: #666;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-wrapper">
        <div class="logo-icon">🍽️</div>
      </div>
      <h1 class="header-title">Verify Your Email</h1>
      <p class="header-subtitle">One-Time Password (OTP) Verification</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hello! 👋</p>
      
      <p class="message">
        Welcome to <span class="restaurant-name">${restaurantName}</span>! 
        To complete your account setup and verify your email address, 
        please use the one-time password (OTP) below:
      </p>

      <!-- OTP Code -->
      <div class="otp-section">
        <span class="otp-label">Your One-Time Password</span>
        <div class="otp-code">${otpCode}</div>
        <p class="otp-info">
          This code is valid for <strong>${expiryMinutes} minutes</strong><br>
          (Expires at <strong>${expiryTime}</strong>)
        </p>
        <div class="timer">⏱️ 10 minute expiry</div>
      </div>

      <!-- Security Note -->
      <div class="security-note">
        <strong>🔒 Security Reminder:</strong> Never share this code with anyone. 
        Our staff will never ask for your OTP. If you didn't request this code, 
        please ignore this email.
      </div>

      <!-- Instructions -->
      <p class="message" style="margin-top: 20px;">
        <strong>Next Steps:</strong><br>
        1. Copy the OTP code above (${otpCode})<br>
        2. Return to the verification page<br>
        3. Paste the code into the verification field<br>
        4. Complete your account setup
      </p>

      <!-- Footer -->
      <div class="footer-text">
        <p>If you have any questions, please visit our 
          <a href="https://seilerstubb.ch/contact" class="footer-link">contact page</a> 
          or reply to this email.
        </p>
      </div>

      <!-- Signature -->
      <div class="signature">
        <div class="signature-name">Welcome to ${restaurantName}</div>
        <div class="signature-role">Account Verification Team</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
OTP Verification for ${restaurantName}

Hello!

Welcome to ${restaurantName}! To complete your account setup, please use the one-time password (OTP) below:

Your One-Time Password: ${otpCode}

Valid for: ${expiryMinutes} minutes (Expires at ${expiryTime})

SECURITY REMINDER: Never share this code with anyone. Our staff will never ask for your OTP. If you didn't request this code, please ignore this email.

Next Steps:
1. Copy the OTP code above: ${otpCode}
2. Return to the verification page
3. Paste the code into the verification field
4. Complete your account setup

If you have any questions, please visit: https://seilerstubb.ch/contact

---
Welcome to ${restaurantName}
Account Verification Team
  `;

  return {
    subject: `🔐 Your ${restaurantName} Verification Code: ${otpCode}`,
    htmlBody,
    textBody,
  };
}

/**
 * Generate plain text OTP email for login
 */
export function generateLoginOTPEmailTemplate(
  email: string,
  otpCode: string,
  restaurantName: string = 'Seiler Stubb',
  expiryMinutes: number = 10
): EmailOTPTemplate {
  const expiryTime = new Date(Date.now() + expiryMinutes * 60 * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Verification - ${restaurantName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%);
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo-wrapper {
      background: #000;
      width: 80px;
      height: 80px;
      border-radius: 12px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    .logo-icon {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }
    .header-title {
      color: white;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }
    .header-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      margin-top: 8px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      color: #111;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .message {
      color: #555;
      font-size: 16px;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .otp-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fef08a 100%);
      border-left: 4px solid #d97706;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      text-align: center;
    }
    .otp-label {
      color: #92400e;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      display: block;
    }
    .otp-code {
      background: white;
      color: #b45309;
      font-size: 48px;
      font-weight: 800;
      font-family: 'Courier New', monospace;
      letter-spacing: 8px;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #d97706;
      display: inline-block;
      min-width: 280px;
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
    }
    .otp-info {
      color: #92400e;
      font-size: 13px;
      margin-top: 15px;
      font-weight: 500;
    }
    .security-note {
      background: #fef08a;
      border: 1px solid #fcd34d;
      padding: 12px 15px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 13px;
      color: #78350f;
    }
    .security-note strong {
      color: #b45309;
    }
    .footer-text {
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
    }
    .footer-link {
      color: #d97706;
      text-decoration: none;
      font-weight: 600;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .restaurant-name {
      color: #d97706;
      font-weight: 700;
    }
    .timer {
      display: inline-block;
      background: #fecaca;
      color: #991b1b;
      padding: 8px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 13px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-wrapper">
        <div class="logo-icon">🔐</div>
      </div>
      <h1 class="header-title">Secure Login Verification</h1>
      <p class="header-subtitle">Complete Your Login</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Welcome back! 👋</p>
      
      <p class="message">
        To secure your login to <span class="restaurant-name">${restaurantName}</span>, 
        please use the one-time password (OTP) below:
      </p>

      <!-- OTP Code -->
      <div class="otp-section">
        <span class="otp-label">Your Login Code</span>
        <div class="otp-code">${otpCode}</div>
        <p class="otp-info">
          This code is valid for <strong>${expiryMinutes} minutes</strong><br>
          (Expires at <strong>${expiryTime}</strong>)
        </p>
        <div class="timer">⏱️ 10 minute expiry</div>
      </div>

      <!-- Security Note -->
      <div class="security-note">
        <strong>🔒 Security Alert:</strong> Never share this code with anyone. 
        If you didn't request this login, your account may be compromised. 
        <a href="https://seilerstubb.ch/contact" style="color: #b45309; font-weight: 600;">Contact us immediately</a>.
      </div>

      <!-- Footer -->
      <div class="footer-text">
        <p>This login attempt was made from a new device or browser. 
          If this wasn't you, please change your password immediately.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
Secure Login Verification - ${restaurantName}

Welcome back!

To secure your login to ${restaurantName}, please use the one-time password (OTP) below:

Your Login Code: ${otpCode}

Valid for: ${expiryMinutes} minutes (Expires at ${expiryTime})

SECURITY ALERT: Never share this code with anyone. If you didn't request this login, your account may be compromised. Please contact us immediately at https://seilerstubb.ch/contact

This login attempt was made from a new device or browser. If this wasn't you, please change your password immediately.

---
Account Security Team
${restaurantName}
  `;

  return {
    subject: `🔐 Your ${restaurantName} Login Code: ${otpCode}`,
    htmlBody,
    textBody,
  };
}
