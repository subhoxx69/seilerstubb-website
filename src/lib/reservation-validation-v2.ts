/**
 * Reservation Validation V2
 * Uses the new OpeningHoursV2 schema with proper timezone and exception handling
 */

import {
  OpeningHoursV2,
  checkDateAvailability,
  generateTimeSlots,
  generateAvailableDates,
  validateReservationDateTime,
} from '@/lib/firebase/opening-hours-service';

export type { OpeningHoursV2 } from '@/lib/firebase/opening-hours-service';

// Bereich capacity (from old system, still used for this)
export const BEREICH_OPTIONS = [
  { name: 'Innenbereich', key: 'innen', capacity: 60 },
  { name: 'Außenbereich', key: 'aussen', capacity: 40 },
];

/**
 * Get capacity for a bereich from opening hours config
 */
export function getBereichCapacity(bereich: string, hoursV2: OpeningHoursV2): number {
  if (bereich === 'Innenbereich' || bereich === 'innen') {
    return hoursV2.capacity.innen;
  } else if (bereich === 'Außenbereich' || bereich === 'aussen') {
    return hoursV2.capacity.aussen;
  }
  return 0;
}

/**
 * Validate people count against capacity
 */
export function validatePeopleCount(
  people: number,
  bereich: string,
  hoursV2: OpeningHoursV2
): { valid: boolean; error?: string } {
  if (people < 1) {
    return { valid: false, error: 'Mindestens 1 Person erforderlich' };
  }

  const capacity = getBereichCapacity(bereich, hoursV2);
  if (people > capacity) {
    return {
      valid: false,
      error: `Maximale Kapazität für ${bereich}: ${capacity} Personen`,
    };
  }

  return { valid: true };
}

/**
 * Get available dates (no date in the past, must be open)
 */
export function getAvailableDates(hoursV2: OpeningHoursV2, maxDays: number = 60): string[] {
  return generateAvailableDates(hoursV2, maxDays);
}

/**
 * Get time slots for a selected date
 */
export function getAvailableTimeSlots(dateStr: string, hoursV2: OpeningHoursV2): string[] {
  return generateTimeSlots(dateStr, hoursV2);
}

/**
 * Check if a date is closed
 */
export function isDateClosed(dateStr: string, hoursV2: OpeningHoursV2): boolean {
  const availability = checkDateAvailability(dateStr, hoursV2);
  return availability.isClosed;
}

/**
 * Validate entire reservation form
 */
export interface ReservationFormData {
  bereich: string;
  date: string;
  time: string;
  firstName: string;
  phone: string;
  people: number;
  hoursV2: OpeningHoursV2;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateReservationForm(data: ReservationFormData): {
  valid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  // Bereich
  if (!data.bereich) {
    errors.push({ field: 'bereich', message: 'Bitte wählen Sie einen Bereich' });
  }

  // Date
  if (!data.date) {
    errors.push({ field: 'date', message: 'Bitte wählen Sie ein Datum' });
  } else {
    // Check date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(data.date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      errors.push({ field: 'date', message: 'Das Datum muss in der Zukunft liegen' });
    } else if (isDateClosed(data.date, data.hoursV2)) {
      errors.push({
        field: 'date',
        message: 'Das Restaurant ist an diesem Tag geschlossen',
      });
    }
  }

  // Time
  if (!data.time) {
    errors.push({ field: 'time', message: 'Bitte wählen Sie eine Uhrzeit' });
  } else if (data.date) {
    // Validate date/time combination
    const validation = validateReservationDateTime(data.date, data.time, data.hoursV2);
    if (!validation.valid) {
      errors.push({ field: 'time', message: validation.error || 'Ungültige Uhrzeit' });
    }
  }

  // First name
  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.push({ field: 'firstName', message: 'Vorname ist erforderlich' });
  }

  // Phone
  if (!data.phone || data.phone.trim().length < 5) {
    errors.push({ field: 'phone', message: 'Telefonnummer ist erforderlich' });
  }

  // People count
  if (data.people < 1) {
    errors.push({ field: 'people', message: 'Mindestens 1 Person erforderlich' });
  }

  const capacityValidation = validatePeopleCount(data.people, data.bereich, data.hoursV2);
  if (!capacityValidation.valid) {
    errors.push({ field: 'people', message: capacityValidation.error || '' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
