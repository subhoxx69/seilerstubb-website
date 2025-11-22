import { RestaurantInfo } from '@/types';

/**
 * Format opening hours for display
 */
export const formatOpeningHours = (restaurantInfo: RestaurantInfo | null) => {
  if (!restaurantInfo?.openingHours) {
    console.warn('No opening hours data found in restaurant info');
    return null;
  }
  
  console.log('🔄 Opening hours data received:', restaurantInfo.openingHours);
  
  // For backward compatibility - map any English day names to German ones
  const openingHours = {...restaurantInfo.openingHours};
  // Handle potential English day names in data
  const dayMapping: Record<string, string> = {
    'sunday': 'sonntag',
    'monday': 'montag',
    'tuesday': 'dienstag',
    'wednesday': 'mittwoch',
    'thursday': 'donnerstag',
    'friday': 'freitag',
    'saturday': 'samstag'
  };
  
  // Copy data from English day names to German day names if German is missing
  Object.entries(dayMapping).forEach(([englishDay, germanDay]) => {
    if ((restaurantInfo.openingHours as any)[englishDay] && !restaurantInfo.openingHours[germanDay as keyof typeof restaurantInfo.openingHours]) {
      (openingHours as any)[germanDay] = (restaurantInfo.openingHours as any)[englishDay];
      console.log(`🔄 Mapped ${englishDay} data to ${germanDay}:`, (openingHours as any)[germanDay]);
    }
  });
  
  // Special check for Sunday since it's the problem day
  if (!openingHours.sonntag && !(openingHours as any).sunday) {
    console.warn('⚠️ Both sonntag and sunday data are missing! Using default closed value.');
    // Set default value for Sunday as closed
    openingHours.sonntag = { isClosed: true };
  }

  const daysOrder = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
  const dayLabels: { [key: string]: string } = {
    montag: 'Montag',
    dienstag: 'Dienstag',
    mittwoch: 'Mittwoch',
    donnerstag: 'Donnerstag',
    freitag: 'Freitag',
    samstag: 'Samstag',
    sonntag: 'Sonntag',
    // Add English day names for backward compatibility
    monday: 'Montag',
    tuesday: 'Dienstag',
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag',
  };

  console.log('Formatting opening hours with data:', openingHours);

  const formattedHours = daysOrder.map((dayName) => {
    // Check for both German and English day names (for backward compatibility)
    const germanDayName = dayName;
    const englishDayName = {
      'montag': 'monday',
      'dienstag': 'tuesday',
      'mittwoch': 'wednesday',
      'donnerstag': 'thursday',
      'freitag': 'friday',
      'samstag': 'saturday',
      'sonntag': 'sunday'
    }[dayName];

    // Use the mapped opening hours that has both English and German day data
    const dayHours = openingHours[germanDayName as keyof typeof openingHours];
    
    console.log(`Processing day ${dayName} (${englishDayName}):`, dayHours);
    
    if (!dayHours) {
      console.warn(`No data for day: ${dayName} or ${englishDayName}`);
      return {
        day: dayLabels[dayName],
        status: 'Geschlossen',
        times: [],
      };
    }

    // Check if day is closed
    if ('isClosed' in dayHours && dayHours.isClosed === true) {
      console.log(`Day ${dayName} is closed`);
      return {
        day: dayLabels[dayName],
        status: 'Geschlossen',
        times: [],
      };
    }

    // Check if day has shifts
    if ('shifts' in dayHours && Array.isArray(dayHours.shifts) && dayHours.shifts.length > 0) {
      const times = dayHours.shifts.map((shift) => `${shift.open} - ${shift.close}`);
      console.log(`Day ${dayName} has shifts:`, times);
      return {
        day: dayLabels[dayName],
        status: 'Geöffnet',
        times,
      };
    }

    console.warn(`Day ${dayName} has no valid shifts`);
    return {
      day: dayLabels[dayName],
      status: 'Geschlossen',
      times: [],
    };
  });

  console.log('Final formatted hours:', formattedHours);
  return formattedHours;
};

/**
 * Check if a specific date is available for reservations
 */
export const isDateAvailableForReservation = (
  dateString: string,
  restaurantInfo: RestaurantInfo | null,
  openingHours: any
): boolean => {
  if (!openingHours || !restaurantInfo) return false;

  const date = new Date(dateString);
  const dayName = date
    .toLocaleDateString('de-DE', { weekday: 'long' })
    .toLowerCase();

  const dayHours = openingHours[dayName];

  // Check if day is closed
  if (dayHours && 'isClosed' in dayHours && dayHours.isClosed === true) {
    return false;
  }

  // Check if day has shifts
  if (!dayHours || !('shifts' in dayHours) || !Array.isArray(dayHours.shifts) || dayHours.shifts.length === 0) {
    return false;
  }

  return true;
};

/**
 * Get available time slots for a specific date
 */
export const getAvailableTimeSlots = (
  dateString: string,
  restaurantInfo: RestaurantInfo | null,
  openingHours: any
): string[] => {
  if (!isDateAvailableForReservation(dateString, restaurantInfo, openingHours)) {
    return [];
  }

  const date = new Date(dateString);
  const dayName = date
    .toLocaleDateString('de-DE', { weekday: 'long' })
    .toLowerCase();

  const dayHours = openingHours[dayName];

  if (!dayHours || !('shifts' in dayHours)) {
    return [];
  }

  const intervalMinutes = restaurantInfo?.reservationTimeSlots?.intervalMinutes || 30;
  const firstSlot = restaurantInfo?.reservationTimeSlots?.firstSlot || '17:00';
  const lastSlot = restaurantInfo?.reservationTimeSlots?.lastSlot || '21:30';

  const times: string[] = [];

  // Get the dinner shift (typically the second shift)
  const shifts = dayHours.shifts as { open: string; close: string }[];
  const dinnerShift = shifts.length > 1 ? shifts[1] : shifts[0];

  if (dinnerShift) {
    const [configStartHour, configStartMin] = firstSlot.split(':').map(Number);
    const [configEndHour, configEndMin] = lastSlot.split(':').map(Number);

    const [openHour, openMin] = dinnerShift.open.split(':').map(Number);
    const [closeHour, closeMin] = dinnerShift.close.split(':').map(Number);

    // Use the later of the opening hour and the configured first slot
    const startHour = openHour > configStartHour ? openHour : configStartHour;
    const startMin =
      openHour > configStartHour
        ? openMin
        : openHour === configStartHour && openMin > configStartMin
        ? openMin
        : configStartMin;

    // Use the earlier of the closing hour and the configured last slot
    const endHour = closeHour < configEndHour ? closeHour : configEndHour;
    const endMin =
      closeHour < configEndHour
        ? closeMin
        : closeHour === configEndHour && closeMin < configEndMin
        ? closeMin
        : configEndMin;

    // Generate time slots based on the interval
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
 * Get the next available date for reservations
 */
export const getNextAvailableDate = (restaurantInfo: RestaurantInfo | null, openingHours: any): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check up to 60 days in the future
  for (let i = 0; i < 60; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() + i);

    const dateString = checkDate.toISOString().split('T')[0];
    if (isDateAvailableForReservation(dateString, restaurantInfo, openingHours)) {
      return dateString;
    }
  }

  return today.toISOString().split('T')[0];
};
