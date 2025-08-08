/**
 * Frontend timezone utility functions for Denmark/Copenhagen timezone
 */

/**
 * Get Denmark timezone offset for a given date (accounts for DST)
 * @param {Date} date - Date to check timezone for
 * @returns {string} - Timezone offset string like '+02:00' or '+01:00'
 */
export function getDenmarkTimezoneOffset(date = new Date()) {
  // Use Intl.DateTimeFormat to get the timezone offset
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Copenhagen',
    timeZoneName: 'longOffset'
  });
  
  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find(part => part.type === 'timeZoneName');
  
  if (offsetPart && offsetPart.value.match(/GMT[+-]\d{1,2}/)) {
    // Convert GMT+2 to +02:00 format
    const match = offsetPart.value.match(/GMT([+-])(\d{1,2})/);
    if (match) {
      const sign = match[1];
      const hours = match[2].padStart(2, '0');
      return `${sign}${hours}:00`;
    }
  }
  
  // Fallback: Use Denmark summer/winter time based on month
  // This is a simple heuristic - Denmark uses CEST (UTC+2) from late March to late October
  const month = date.getMonth(); // 0-based
  const isSummerTime = month >= 2 && month <= 9; // March to October (approximate)
  
  return isSummerTime ? '+02:00' : '+01:00';
}

/**
 * Create timezone-aware datetime string for Denmark
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} timeString - Time in HH:MM format
 * @returns {string} - ISO datetime string with Denmark timezone
 */
export function createDenmarkDateTime(dateString, timeString) {
  // Create a datetime string with seconds
  const baseDateTime = `${dateString}T${timeString}:00`;
  
  // Get Denmark timezone offset for this date
  const testDate = new Date(`${dateString}T12:00:00Z`); // Use noon UTC to avoid DST edge cases
  const timezoneOffset = getDenmarkTimezoneOffset(testDate);
  
  // Return timezone-aware datetime string
  return `${baseDateTime}${timezoneOffset}`;
}

/**
 * Format time for display in Denmark timezone
 * @param {Date} date - UTC date to format
 * @returns {string} - Formatted time string
 */
export function formatDenmarkTime(date) {
  return date.toLocaleString('da-DK', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if we're currently in Denmark summer time (CEST)
 * @returns {boolean} - True if currently in summer time
 */
export function isDenmarkSummerTime() {
  const now = new Date();
  const january = new Date(now.getFullYear(), 0, 1);
  const july = new Date(now.getFullYear(), 6, 1);
  
  const janOffset = january.getTimezoneOffset();
  const julOffset = july.getTimezoneOffset();
  
  // In Denmark, summer time has a smaller offset (UTC+2) than winter time (UTC+1)
  return now.getTimezoneOffset() === Math.min(janOffset, julOffset);
}