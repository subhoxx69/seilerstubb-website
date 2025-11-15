import { RestaurantInfo } from '@/types';

export interface BereichInfo {
  name: 'Innenbereich' | 'Außenbereich';
  capacity: number;
  key: 'innenbereich' | 'außenbereich';
}

export const BEREICH_OPTIONS: BereichInfo[] = [
  { name: 'Innenbereich', capacity: 60, key: 'innenbereich' },
  { name: 'Außenbereich', capacity: 40, key: 'außenbereich' },
];

export interface ReservationValidationError {
  field: string;
  message: string;
}

/**
 * Get max capacity for a bereich
 */
export const getBereichCapacity = (bereich: string): number => {
  const option = BEREICH_OPTIONS.find(b => b.name === bereich || b.key === bereich);
  return option?.capacity || 0;
};

/**
 * Validate people count against bereich capacity
 */
export const validatePeopleCount = (
  people: number,
  bereich: string
): { valid: boolean; error?: string } => {
  if (people < 1) {
    return { valid: false, error: 'Mindestens 1 Person erforderlich' };
  }

  const capacity = getBereichCapacity(bereich);
  if (people > capacity) {
    return {
      valid: false,
      error: `Maximale Kapazität für ${bereich}: ${capacity} Personen`,
    };
  }

  return { valid: true };
};

/**
 * Check if a date is today or in the future
 */
export const isValidReservationDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date >= today;
};

/**
 * Check if date is closed (using opening hours from restaurantInfo)
 */
export const isDateClosed = (
  dateString: string,
  openingHours: Record<string, any>
): boolean => {
  if (!openingHours || Object.keys(openingHours).length === 0) {
    console.warn('No opening hours data provided');
    return false; // Assume open if no data
  }

  const date = new Date(dateString);
  
  // Get day name in English format (for object key lookup)
  const dayName = date
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  console.log(`🔍 Checking day: ${dayName} for date: ${dateString}`);
  
  const dayHours = openingHours[dayName];
  
  if (!dayHours) {
    console.warn(`No hours found for ${dayName}`);
    return true; // Assume closed if no entry
  }

  // Check if explicitly closed
  if (dayHours.closed === true || dayHours.isClosed === true) {
    console.log(`${dayName} is marked as closed`);
    return true;
  }

  // Check for shifts array
  if (dayHours.shifts && Array.isArray(dayHours.shifts) && dayHours.shifts.length > 0) {
    console.log(`${dayName} has ${dayHours.shifts.length} shift(s)`);
    return false; // Has shifts, so not closed
  }

  // Check for open/close times
  if (dayHours.open && dayHours.close) {
    console.log(`${dayName} has times: ${dayHours.open} - ${dayHours.close}`);
    return false; // Has times, so not closed
  }

  console.warn(`${dayName} has unknown structure:`, dayHours);
  return true; // Assume closed if structure unknown
};

/**
 * Get available time slots for a date based on opening hours
 */
export const getAvailableTimeSlotsForReservation = (
  dateString: string,
  openingHours: Record<string, any>,
  restaurantInfo: RestaurantInfo | null
): string[] => {
  if (isDateClosed(dateString, openingHours)) return [];

  const date = new Date(dateString);
  // Get day name in English format (for object key lookup)
  const dayName = date
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  const dayHours = openingHours[dayName];

  if (!dayHours || !('shifts' in dayHours)) return [];

  const intervalMinutes = restaurantInfo?.reservationTimeSlots?.intervalMinutes || 30;
  const firstSlot = restaurantInfo?.reservationTimeSlots?.firstSlot || '17:00';
  const lastSlot = restaurantInfo?.reservationTimeSlots?.lastSlot || '21:30';

  const times: string[] = [];

  // Get the dinner shift (typically the second shift if it exists)
  const shifts = dayHours.shifts as { open: string; close: string }[];
  const dinnerShift = shifts.length > 1 ? shifts[1] : shifts[0];

  if (dinnerShift) {
    const [configStartHour, configStartMin] = firstSlot.split(':').map(Number);
    const [configEndHour, configEndMin] = lastSlot.split(':').map(Number);

    const [openHour, openMin] = dinnerShift.open.split(':').map(Number);
    const [closeHour, closeMin] = dinnerShift.close.split(':').map(Number);

    const startHour = openHour > configStartHour ? openHour : configStartHour;
    const startMin =
      openHour > configStartHour
        ? openMin
        : openHour === configStartHour && openMin > configStartMin
        ? openMin
        : configStartMin;

    const endHour = closeHour < configEndHour ? closeHour : configEndHour;
    const endMin =
      closeHour < configEndHour
        ? closeMin
        : closeHour === configEndHour && closeMin < configEndMin
        ? closeMin
        : configEndMin;

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin)) {
      times.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);

      currentMin += intervalMinutes;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }
  }

  return times;
};

/**
 * Validate all reservation form data
 */
export const validateReservationForm = (data: {
  bereich: string;
  date: string;
  time: string;
  firstName: string;
  phone: string;
  people: number;
  openingHours?: Record<string, any>;
}): { valid: boolean; errors: ReservationValidationError[] } => {
  const errors: ReservationValidationError[] = [];

  if (!data.bereich) {
    errors.push({ field: 'bereich', message: 'Bitte wählen Sie einen Bereich' });
  }

  if (!data.date) {
    errors.push({ field: 'date', message: 'Bitte wählen Sie ein Datum' });
  } else if (!isValidReservationDate(data.date)) {
    errors.push({ field: 'date', message: 'Das Datum muss in der Zukunft liegen' });
  } else if (data.openingHours && isDateClosed(data.date, data.openingHours)) {
    errors.push({
      field: 'date',
      message: 'Das Restaurant ist an diesem Tag geschlossen',
    });
  }

  if (!data.time) {
    errors.push({ field: 'time', message: 'Bitte wählen Sie eine Uhrzeit' });
  }

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.push({ field: 'firstName', message: 'Vorname ist erforderlich' });
  }

  if (!data.phone || data.phone.trim().length < 5) {
    errors.push({ field: 'phone', message: 'Telefonnummer ist erforderlich' });
  }

  if (data.people < 1) {
    errors.push({ field: 'people', message: 'Mindestens 1 Person erforderlich' });
  }

  const capacityValidation = validatePeopleCount(data.people, data.bereich);
  if (!capacityValidation.valid) {
    errors.push({ field: 'people', message: capacityValidation.error || '' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Get next 60 days available for reservation
 */
export const getAvailableDates = (
  openingHours: Record<string, any>,
  maxDays: number = 60
): string[] => {
  const dates: string[] = [];
  
  if (!openingHours || Object.keys(openingHours).length === 0) {
    console.warn('No opening hours provided to getAvailableDates');
    return dates;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < maxDays; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() + i);

    const dateString = checkDate.toISOString().split('T')[0];
    
    // Skip closed dates
    if (!isDateClosed(dateString, openingHours)) {
      dates.push(dateString);
    }
  }

  return dates;
};
