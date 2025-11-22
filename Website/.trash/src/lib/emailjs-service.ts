/**
 * EmailJS Integration Service
 * Handles sending reservation confirmation and decline emails
 * With subscription quota management and automatic reset
 */

const EMAILJS_PUBLIC_KEY = 'bCcDATJJu9t-X9BPt';
const EMAILJS_PRIVATE_KEY = 'Y37xmhMGuIWRhh3P7k00o';
const TEMPLATE_ACCEPT = 'template_d2dvylr';
const TEMPLATE_DECLINE = 'template_hs19jvn';
const SERVICE_ID = 'service_z2v1kie';

// Subscription Details
const MONTHLY_LIMIT = 200;
const QUOTA_RESET_DATE = new Date('2025-11-15T00:00:00Z'); // Sat, 15 Nov 2025 UTC
const USAGE_STORAGE_KEY = 'emailjs_quota';
const USER_INFO_STORAGE_KEY = 'reservation_user_info';

// Restaurant Details (for email templates)
const RESTAURANT = {
  name: 'Seilerstubb',
  address: 'Seilerpfad 4, 65205 Wiesbaden, Deutschland',
  phone: '0611 36004940',
  email: 'seilerstubbwiesbaden@gmail.com',
  website: 'https://seilerstubb.com',
  mapsUrl: 'https://maps.google.com/?q=Seilerpfad+4,+65205+Wiesbaden',
};

interface ReservationDetails {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  bereich: string;
  rejectionReason?: string;
  notes?: string;
  reservationId?: string;
}

interface QuotaData {
  used: number;
  remaining: number;
  lastUpdated: string;
  nextResetDate: string;
}

/**
 * Initialize quota data with reset date
 */
function initializeQuota(): QuotaData {
  return {
    used: 15, // 200 - 185 remaining = 15 used
    remaining: 185,
    lastUpdated: new Date().toISOString(),
    nextResetDate: QUOTA_RESET_DATE.toISOString(),
  };
}

/**
 * Get current quota from localStorage, with automatic reset handling
 */
function getCurrentQuota(): QuotaData {
  if (typeof window === 'undefined') {
    return initializeQuota();
  }

  const stored = localStorage.getItem(USAGE_STORAGE_KEY);
  let quota: QuotaData;

  if (!stored) {
    quota = initializeQuota();
  } else {
    quota = JSON.parse(stored);
  }

  // Check if reset date has passed
  const now = new Date();
  const resetDate = new Date(quota.nextResetDate);

  if (now >= resetDate) {
    // Reset quota
    quota = {
      used: 0,
      remaining: MONTHLY_LIMIT,
      lastUpdated: now.toISOString(),
      nextResetDate: getNextResetDate().toISOString(),
    };
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(quota));
    console.log('✅ EmailJS quota reset to', MONTHLY_LIMIT);
  }

  return quota;
}

/**
 * Calculate next reset date (monthly on the 15th at UTC)
 */
function getNextResetDate(): Date {
  let nextReset = new Date(QUOTA_RESET_DATE);
  
  // If reset date has passed, set it to next month's 15th
  if (nextReset <= new Date()) {
    nextReset = new Date(nextReset);
    nextReset.setMonth(nextReset.getMonth() + 1);
  }
  
  return nextReset;
}

/**
 * Decrement quota after successful email send
 */
function decrementQuota(): void {
  if (typeof window === 'undefined') return;

  const quota = getCurrentQuota();
  quota.used += 1;
  quota.remaining = Math.max(0, MONTHLY_LIMIT - quota.used);
  quota.lastUpdated = new Date().toISOString();
  
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(quota));
  console.log(`📧 EmailJS quota updated: ${quota.remaining} remaining`);
}

/**
 * Check if quota is available
 */
export function hasEmailQuota(): boolean {
  const quota = getCurrentQuota();
  return quota.remaining > 0;
}

/**
 * Get current quota status
 */
export function getQuotaStatus() {
  const quota = getCurrentQuota();
  const resetDate = new Date(quota.nextResetDate);
  
  return {
    used: quota.used,
    remaining: quota.remaining,
    limit: MONTHLY_LIMIT,
    nextResetDate: resetDate.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    nextResetDateISO: quota.nextResetDate,
    quotaAvailable: quota.remaining > 0,
  };
}

/**
 * Get formatted message for quota limit reached
 */
export function getQuotaLimitMessage(): string {
  const status = getQuotaStatus();
  return `E-Mail-Benachrichtigungen sind derzeit deaktiviert, da das monatliche Limit erreicht wurde. Bitte versuchen Sie es nach dem Reset am ${status.nextResetDate} erneut.`;
}

/**
 * Save user reservation info to localStorage
 * Note: Only saves essential contact info (excludes notes and people count)
 */
export function saveUserReservationInfo(userInfo: {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  bereich: string;
}): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify({
      ...userInfo,
      savedAt: new Date().toISOString(),
    }));
    console.log('✅ User info saved to localStorage');
  } catch (error) {
    console.error('❌ Error saving user info to localStorage:', error);
  }
}

/**
 * Get user reservation info from localStorage
 */
export function getUserReservationInfo() {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(USER_INFO_STORAGE_KEY);
    if (!stored) return null;
    
    const userInfo = JSON.parse(stored);
    console.log('✅ User info retrieved from localStorage');
    return userInfo;
  } catch (error) {
    console.error('❌ Error retrieving user info from localStorage:', error);
    return null;
  }
}

/**
 * Clear user reservation info from localStorage
 */
export function clearUserReservationInfo(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(USER_INFO_STORAGE_KEY);
    console.log('✅ User info cleared from localStorage');
  } catch (error) {
    console.error('❌ Error clearing user info from localStorage:', error);
  }
}

/**
 * Format date for display in email
 */
function formatDateForEmail(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Sanitize text to prevent template injection
 */
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Send email via EmailJS using template parameters
 */
async function sendEmailWithTemplate(
  templateId: string,
  toEmail: string,
  templateParams: Record<string, string>
): Promise<boolean> {
  try {
    // Check if limit is reached
    if (!hasEmailQuota()) {
      console.warn('❌ EmailJS: Monthly limit reached -', getQuotaLimitMessage());
      return false;
    }

    const payload = {
      service_id: SERVICE_ID,
      template_id: templateId,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: toEmail,
        ...templateParams,
      },
    };

    console.log('📧 Sending email via EmailJS:');
    console.log('  Service:', SERVICE_ID);
    console.log('  Template:', templateId);
    console.log('  To Email:', toEmail);
    console.log('  Params:', templateParams);

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('📧 EmailJS Response Status:', response.status);
    console.log('📧 EmailJS Response Body:', responseText);

    if (response.ok) {
      decrementQuota();
      console.log(`✅ Email sent successfully via template ${templateId}`);
      return true;
    } else {
      console.error('❌ EmailJS API error - Status:', response.status);
      console.error('❌ Response:', responseText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * Send acceptance email
 */
export async function sendAcceptanceEmail(details: ReservationDetails): Promise<boolean> {
  try {
    console.log('📧 Preparing acceptance email for:', details.email);
    
    const templateParams = {
      name: sanitizeText(`${details.firstName} ${details.lastName || ''}`).trim(),
      email: sanitizeText(details.email),
      phone: sanitizeText(details.phone),
      date: formatDateForEmail(details.date),
      time: sanitizeText(details.time),
      people: String(details.people),
      area: sanitizeText(details.bereich),
      restaurantName: RESTAURANT.name,
      restaurantAddress: RESTAURANT.address,
      restaurantPhone: RESTAURANT.phone,
      restaurantEmail: RESTAURANT.email,
      websiteUrl: RESTAURANT.website,
      mapsUrl: RESTAURANT.mapsUrl,
      reservationId: sanitizeText(details.reservationId || `RES-${Date.now()}`),
      notes: details.notes ? sanitizeText(details.notes) : '',
    };

    console.log('📧 Template params:', templateParams);

    const result = await sendEmailWithTemplate(TEMPLATE_ACCEPT, details.email, templateParams);
    console.log('📧 Acceptance email result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error in sendAcceptanceEmail:', error);
    return false;
  }
}

/**
 * Send decline email
 */
export async function sendDeclineEmail(details: ReservationDetails): Promise<boolean> {
  try {
    console.log('📧 Preparing decline email for:', details.email);
    
    const templateParams = {
      name: sanitizeText(`${details.firstName} ${details.lastName || ''}`).trim(),
      email: sanitizeText(details.email),
      phone: sanitizeText(details.phone),
      date: formatDateForEmail(details.date),
      time: sanitizeText(details.time),
      people: String(details.people),
      area: sanitizeText(details.bereich),
      restaurantName: RESTAURANT.name,
      restaurantAddress: RESTAURANT.address,
      restaurantPhone: RESTAURANT.phone,
      restaurantEmail: RESTAURANT.email,
      websiteUrl: RESTAURANT.website,
      mapsUrl: RESTAURANT.mapsUrl,
      reservationId: sanitizeText(details.reservationId || `RES-${Date.now()}`),
      notes: details.notes ? sanitizeText(details.notes) : '',
      reason: sanitizeText(details.rejectionReason || ''),
    };

    console.log('📧 Template params:', templateParams);

    const result = await sendEmailWithTemplate(TEMPLATE_DECLINE, details.email, templateParams);
    console.log('📧 Decline email result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error in sendDeclineEmail:', error);
    return false;
  }
}
