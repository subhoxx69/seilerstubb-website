// This file provides email functionality using EmailJS
import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'service_z2v1kie';
const EMAILJS_PUBLIC_KEY = 'RYn_M6v88btpYZ5w6';
const EMAILJS_TEMPLATE_ACCEPTED = 'template_mo2cyut';
const EMAILJS_TEMPLATE_DECLINED = 'template_jne2in9';
const EMAILJS_TEMPLATE_RECEIVED = 'template_mo2cyut'; // Using same template but we'll modify the content

// Initialize EmailJS if on client side
if (typeof window !== 'undefined') {
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('EmailJS initialized in email-service.ts');
  } catch (error) {
    console.error('Failed to initialize EmailJS:', error);
  }
}

// Email deduplication tracking
// We'll store a map of already sent emails to prevent duplicates
// Key format: userEmail:reservationId:status:timestamp (within 5 minutes)
const sentEmailsCache = new Map<string, number>();

// Clear entries older than 5 minutes every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    sentEmailsCache.forEach((timestamp, key) => {
      // 5 minutes = 300000 milliseconds
      if (now - timestamp > 300000) {
        sentEmailsCache.delete(key);
      }
    });
  }, 3600000); // Run every hour
}

// Validate email address format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Types for email data
export type ReservationEmailData = {
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  people: number;
  reservationId?: string;
  reason?: string;
};

/**
 * Helper function to send reservation emails using EmailJS
 */
export async function sendReservationEmail(
  data: ReservationEmailData, 
  status: 'confirmed' | 'declined' | 'received'
) {
  try {
    const { userName, userEmail, date, time, people, reason, reservationId } = data;
    
    // Validate email first
    if (!userEmail || !isValidEmail(userEmail)) {
      console.error('Invalid or missing email address:', userEmail);
      return { success: false, id: `error-${Date.now()}-invalid-email` };
    }
    
    // Create a deduplication key using the email, reservationId, status, and date
    const dedupeKey = `${userEmail}:${reservationId || date+time}:${status}`;
    const now = Date.now();
    
    // Check if we've sent this exact email recently (within 5 minutes)
    if (sentEmailsCache.has(dedupeKey)) {
      const lastSent = sentEmailsCache.get(dedupeKey);
      // If sent within the last 5 minutes (300000 ms), don't send again
      if (now - lastSent! < 300000) {
        console.log(`Skipping duplicate email to ${userEmail} for ${status} status (sent ${Math.round((now - lastSent!) / 1000)}s ago)`);
        return {
          success: true,
          id: `dedupe-${Date.now()}`,
          status: 200,
          text: 'Duplicate email prevented'
        };
      }
    }
    
    // Select template based on status
    let templateId;
    if (status === 'confirmed') {
      templateId = EMAILJS_TEMPLATE_ACCEPTED;
    } else if (status === 'declined') {
      templateId = EMAILJS_TEMPLATE_DECLINED;
    } else { // received
      templateId = EMAILJS_TEMPLATE_RECEIVED;
    }
    
    // Prepare template parameters
    let title;
    let messageContent = '';
    
    if (status === 'confirmed') {
      title = 'Reservation Confirmed';
      messageContent = 'Your reservation has been confirmed. We look forward to seeing you!';
    } else if (status === 'declined') {
      title = 'Reservation Declined';
      messageContent = reason || 'Unfortunately, we were unable to accommodate your reservation request.';
    } else { // received
      title = 'Reservation Received - Pending Confirmation';
      messageContent = 'Thank you for your reservation request. Our staff will review it shortly and send you a confirmation email once approved.';
    }
    
    const templateParams = {
      name: userName,
      title: title,
      date: date,
      time: time,
      reason: messageContent,
      people: people,
      to_email: userEmail,
      email: userEmail,  // Add email as an alternative field in case template uses this
      status: status // Add status so template can conditionally show different content
    };
    
    // Log the template parameters for debugging
    console.log('EmailJS template parameters:', JSON.stringify(templateParams, null, 2));
    
    console.log(`Sending ${status} email to: ${userEmail}`);
    
    // Send email using EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      templateId,
      templateParams
    );
    
    console.log(`${status.charAt(0).toUpperCase() + status.slice(1)} email sent successfully:`, response);
    
    // Store in cache to prevent duplicates
    sentEmailsCache.set(dedupeKey, Date.now());
    console.log(`Email to ${userEmail} marked as sent in cache with key: ${dedupeKey}`);
    
    return { 
      success: true, 
      id: `emailjs-${Date.now()}`,
      status: response.status,
      text: response.text
    };
  } catch (error) {
    console.error(`Failed to send ${status} email:`, error);
    return { 
      success: false,
      id: `error-${Date.now()}`,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Send reservation confirmation email
 */
export async function sendReservationConfirmation(data: ReservationEmailData) {
  console.log('Sending confirmation email with EmailJS:', data);
  return sendReservationEmail(data, 'confirmed');
}

/**
 * Send reservation declined email
 */
export async function sendReservationDeclined(data: ReservationEmailData) {
  console.log('Sending declined email with EmailJS:', data);
  return sendReservationEmail(data, 'declined');
}

/**
 * Send reservation acknowledgment email - NOT CURRENTLY USED
 * This email would confirm the reservation was received and is pending review
 * We don't send this anymore as customers will only get emails for confirmed/declined status
 */
export async function sendReservationAcknowledgment(data: ReservationEmailData) {
  console.log('Acknowledgment emails disabled - not sending email for pending reservation');
  console.log('Would have sent to:', data.userEmail);
  // Return success without actually sending email
  return { success: true, id: 'disabled' };
}

/**
 * Send reservation cancellation email
 */
export async function sendReservationCancellation(data: ReservationEmailData) {
  console.log('Sending cancellation email with EmailJS:', data);
  // For cancellation, we'll use the declined template as EmailJS doesn't have a specific template for this
  return sendReservationEmail({
    ...data,
    reason: "Your reservation has been cancelled as requested."
  }, 'declined');
}

/**
 * Send a test email to verify the email service is working
 */
export async function sendTestEmail(email: string) {
  try {
    if (!email || !isValidEmail(email)) {
      console.error('Invalid or missing email address:', email);
      return { success: false, error: 'Invalid email address' };
    }
    
    console.log(`Sending test email to: ${email}`);
    
    // Create test data
    const testData: ReservationEmailData = {
      userName: 'Test User',
      userEmail: email,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      people: 2,
      reservationId: `test-${Date.now()}`
    };
    
    // Send a test email using the confirmation template
    const result = await sendReservationEmail(testData, 'confirmed');
    
    console.log('Test email result:', result);
    
    return {
      success: result.success,
      id: result.id,
      message: 'Test email sent successfully'
    };
  } catch (error) {
    console.error('Failed to send test email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
