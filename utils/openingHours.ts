import { OpeningHours } from '@/types/venue';

export type BusinessHours = {
  byDay: {
    [key: number]: { open: string; close: string } | null; // 1=Monday, 7=Sunday
  };
};

export function convertOpeningHoursToBusinessHours(openingHours: OpeningHours | string | null): BusinessHours | null {
  if (!openingHours) {
    console.log('[OpeningHours] No opening hours provided');
    return null;
  }

  console.log('[OpeningHours] Converting opening hours:', JSON.stringify(openingHours, null, 2));
  console.log('[OpeningHours] Type of openingHours:', typeof openingHours);
  console.log('[OpeningHours] Is array:', Array.isArray(openingHours));
  console.log('[OpeningHours] Keys:', Object.keys(openingHours));

  // Handle case where openingHours might be a string (JSON)
  let parsedHours = openingHours;
  if (typeof openingHours === 'string') {
    // Check if it's a valid JSON string
    const trimmed = openingHours.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsedHours = JSON.parse(openingHours);
        console.log('[OpeningHours] Parsed from string:', JSON.stringify(parsedHours, null, 2));
      } catch (e) {
        console.error('[OpeningHours] Failed to parse opening hours string:', e, 'String was:', trimmed.substring(0, 100));
        return null;
      }
    } else {
      console.error('[OpeningHours] Invalid JSON string format:', trimmed.substring(0, 100));
      return null;
    }
  }

  if (!parsedHours || typeof parsedHours !== 'object') {
    console.log('[OpeningHours] Invalid opening hours format');
    return null;
  }

  const dayMapping = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
  };

  const byDay: BusinessHours['byDay'] = {};

  Object.entries(dayMapping).forEach(([dayName, dayNumber]) => {
    const dayHours = parsedHours[dayName as keyof OpeningHours];
    console.log(`[OpeningHours] ${dayName} (${dayNumber}):`, JSON.stringify(dayHours, null, 2));
    
    // Handle null or undefined
    if (!dayHours) {
      console.log(`[OpeningHours] ${dayName} is null/undefined, treating as closed`);
      byDay[dayNumber] = null;
      return;
    }
    
    // Check if the day is explicitly closed
    if (typeof dayHours === 'object' && 'closed' in dayHours && dayHours.closed === true) {
      console.log(`[OpeningHours] ${dayName} is explicitly closed`);
      byDay[dayNumber] = null;
    } else if (typeof dayHours === 'object' && dayHours.open && dayHours.close) {
      console.log(`[OpeningHours] ${dayName} is open: ${dayHours.open} - ${dayHours.close}`);
      byDay[dayNumber] = {
        open: String(dayHours.open),
        close: String(dayHours.close),
      };
    } else {
      console.log(`[OpeningHours] ${dayName} has no valid hours, treating as closed`);
      byDay[dayNumber] = null;
    }
  });

  const result = { byDay };
  console.log('[OpeningHours] Converted result:', JSON.stringify(result, null, 2));
  return result;
}

export function isVenueOpenNow(venue: { business_hours?: BusinessHours | null }, now: Date = new Date()): boolean {
  if (!venue.business_hours) return false;

  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, etc.
  const mondayBasedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to Monday=1, Sunday=7

  const todayHours = venue.business_hours.byDay[mondayBasedDay];
  if (!todayHours) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  let closeTime = closeHour * 60 + closeMin;

  // Handle venues that close after midnight
  if (closeTime <= openTime) {
    closeTime += 24 * 60; // Add 24 hours
    if (currentTime < openTime) {
      // We're in the early hours of the next day
      return currentTime + 24 * 60 >= openTime && currentTime + 24 * 60 < closeTime;
    }
  }

  return currentTime >= openTime && currentTime < closeTime;
}

export function getClosingTimeToday(venue: { business_hours?: BusinessHours | null }, now: Date = new Date()): string | null {
  if (!venue.business_hours) return null;

  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, etc.
  const mondayBasedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to Monday=1, Sunday=7

  const todayHours = venue.business_hours.byDay[mondayBasedDay];
  if (!todayHours) return null;

  return todayHours.close;
}

export function formatOpeningHours(businessHours: BusinessHours | null): { day: string; hours: string }[] {
  if (!businessHours) return [];

  const dayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
  
  return dayNames.map((dayName, index) => {
    const dayNumber = index + 1; // Monday=1, Sunday=7
    const dayHours = businessHours.byDay[dayNumber];
    
    return {
      day: dayName,
      hours: dayHours ? `${dayHours.open} - ${dayHours.close}` : 'Zárva'
    };
  });
}

export function groupConsecutiveHours(businessHours: BusinessHours | null): { days: string; hours: string }[] {
  if (!businessHours) return [];

  const dayNames = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
  const fullDayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
  
  const hoursMap: { [hours: string]: number[] } = {};
  
  // Group days by their hours
  for (let i = 1; i <= 7; i++) {
    const dayHours = businessHours.byDay[i];
    const hoursString = dayHours ? `${dayHours.open} - ${dayHours.close}` : 'Zárva';
    
    if (!hoursMap[hoursString]) {
      hoursMap[hoursString] = [];
    }
    hoursMap[hoursString].push(i);
  }
  
  const result: { days: string; hours: string }[] = [];
  
  Object.entries(hoursMap).forEach(([hours, days]) => {
    if (hours === 'Zárva') {
      // Handle closed days individually or in groups
      const sortedDays = days.sort();
      let dayRanges: string[] = [];
      let start = 0;
      
      while (start < sortedDays.length) {
        let end = start;
        while (end + 1 < sortedDays.length && sortedDays[end + 1] === sortedDays[end] + 1) {
          end++;
        }
        
        if (start === end) {
          dayRanges.push(fullDayNames[sortedDays[start] - 1]);
        } else {
          dayRanges.push(`${dayNames[sortedDays[start] - 1]}-${dayNames[sortedDays[end] - 1]}`);
        }
        
        start = end + 1;
      }
      
      result.push({
        days: dayRanges.join(', '),
        hours: 'Zárva'
      });
    } else {
      // Handle open days
      const sortedDays = days.sort();
      
      // Check for common patterns
      if (sortedDays.length === 7) {
        result.push({ days: 'H-V', hours });
      } else if (sortedDays.length === 5 && sortedDays.every((d, i) => d === i + 1)) {
        result.push({ days: 'H-P', hours });
      } else if (sortedDays.length === 2 && sortedDays[0] === 6 && sortedDays[1] === 7) {
        result.push({ days: 'Szo-V', hours });
      } else {
        // Create ranges for consecutive days
        let dayRanges: string[] = [];
        let start = 0;
        
        while (start < sortedDays.length) {
          let end = start;
          while (end + 1 < sortedDays.length && sortedDays[end + 1] === sortedDays[end] + 1) {
            end++;
          }
          
          if (start === end) {
            dayRanges.push(dayNames[sortedDays[start] - 1]);
          } else {
            dayRanges.push(`${dayNames[sortedDays[start] - 1]}-${dayNames[sortedDays[end] - 1]}`);
          }
          
          start = end + 1;
        }
        
        result.push({
          days: dayRanges.join(', '),
          hours
        });
      }
    }
  });
  
  return result;
}

// Debug function to test opening hours conversion
export function debugOpeningHours(openingHours: any) {
  console.log('=== DEBUG OPENING HOURS ===');
  console.log('Input:', JSON.stringify(openingHours, null, 2));
  console.log('Type:', typeof openingHours);
  console.log('Is null:', openingHours === null);
  console.log('Is undefined:', openingHours === undefined);
  
  if (openingHours) {
    console.log('Keys:', Object.keys(openingHours));
    console.log('Monday value:', openingHours.monday);
    console.log('Tuesday value:', openingHours.tuesday);
  }
  
  const converted = convertOpeningHoursToBusinessHours(openingHours);
  console.log('Converted result:', JSON.stringify(converted, null, 2));
  console.log('=== END DEBUG ===');
  
  return converted;
}