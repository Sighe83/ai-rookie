/**
 * Timezone utility functions for handling Denmark/Copenhagen timezone conversions
 */

/**
 * Convert a datetime string to UTC, handling Denmark timezone properly
 * @param {string} datetimeString - DateTime string from frontend
 * @returns {Object} - Object with converted Date and metadata
 */
function convertToUTC(datetimeString) {
  const result = {
    originalInput: datetimeString,
    convertedDate: null,
    timeOnly: null,
    conversionApplied: false,
    denmarkOffset: '+02:00' // Summer time (CEST), should be dynamic in production
  };

  try {
    // Check if timezone info is missing
    if (datetimeString.includes('T') && !datetimeString.includes('+') && !datetimeString.includes('Z')) {
      // No timezone specified, treat as Denmark local time
      const denmarkDateTime = datetimeString + result.denmarkOffset;
      result.convertedDate = new Date(denmarkDateTime);
      result.conversionApplied = true;
      
      console.log('⏰ Timezone conversion applied:', {
        original: datetimeString,
        withTimezone: denmarkDateTime,
        utc: result.convertedDate.toISOString()
      });
    } else {
      // Timezone already specified or is UTC
      result.convertedDate = new Date(datetimeString);
      result.conversionApplied = false;
    }
    
    result.timeOnly = result.convertedDate.toISOString().slice(11, 19);
    
  } catch (error) {
    console.error('❌ Error converting timezone:', error.message);
    throw new Error(`Invalid datetime format: ${datetimeString}`);
  }

  return result;
}

/**
 * Get Denmark timezone offset dynamically (accounting for DST)
 * @param {Date} date - Date to check timezone for
 * @returns {string} - Timezone offset string like '+02:00' or '+01:00'
 */
function getDenmarkTimezoneOffset(date = new Date()) {
  // Create a date in Denmark timezone
  const denmarkTime = new Date(date.toLocaleString("en-US", {timeZone: "Europe/Copenhagen"}));
  const utcTime = new Date(date.toISOString());
  
  // Calculate offset in minutes
  const offsetMinutes = (denmarkTime.getTime() - utcTime.getTime()) / (1000 * 60);
  const offsetHours = Math.abs(offsetMinutes / 60);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  
  return `${sign}${String(Math.floor(offsetHours)).padStart(2, '0')}:${String(offsetMinutes % 60).padStart(2, '0')}`;
}

/**
 * Check if a time falls within a time slot range
 * @param {string} selectedTime - Time in HH:MM:SS format
 * @param {string} slotStart - Start time in HH:MM:SS format
 * @param {string} slotEnd - End time in HH:MM:SS format
 * @returns {boolean} - True if time is within range
 */
function timeIsInRange(selectedTime, slotStart, slotEnd) {
  // Use <= for end time to include exact end time (e.g., 12:00 matches 11:00-12:00)
  return selectedTime >= slotStart && selectedTime <= slotEnd;
}

/**
 * Format time for display in Denmark timezone
 * @param {Date} date - UTC date to format
 * @returns {string} - Formatted time string
 */
function formatDenmarkTime(date) {
  return date.toLocaleString('da-DK', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

module.exports = {
  convertToUTC,
  getDenmarkTimezoneOffset,
  timeIsInRange,
  formatDenmarkTime
};