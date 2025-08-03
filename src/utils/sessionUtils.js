/**
 * Session Business Logic Utilities (Frontend)
 * 
 * Implements the core business rules for sessions on the frontend:
 * 1. All sessions are exactly 1 hour (60 minutes)
 * 2. All sessions start on the hour (00 minutes)
 */

export class SessionUtils {
  /**
   * Session duration is always 60 minutes
   */
  static SESSION_DURATION_MINUTES = 60;

  /**
   * Validates that a session start time is on the hour
   * @param {Date|string} dateTime - The proposed session start time
   * @returns {boolean} - True if valid (starts on the hour)
   */
  static isValidSessionStartTime(dateTime) {
    const date = new Date(dateTime);
    
    // Check if minutes and seconds are zero
    return date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
  }

  /**
   * Rounds a date time to the nearest hour start (down)
   * @param {Date|string} dateTime - The input date time
   * @returns {Date} - The rounded date time to hour start
   */
  static roundToHourStart(dateTime) {
    const date = new Date(dateTime);
    date.setMinutes(0, 0, 0);
    return date;
  }

  /**
   * Calculates session end time based on start time
   * @param {Date|string} startTime - The session start time
   * @returns {Date} - The session end time (start + 1 hour)
   */
  static calculateSessionEndTime(startTime) {
    const start = new Date(startTime);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    return end;
  }

  /**
   * Validates a complete session time slot
   * @param {Date|string} startTime - The proposed session start time
   * @returns {object} - Validation result with isValid flag and error message
   */
  static validateSessionTime(startTime) {
    try {
      const start = new Date(startTime);
      
      // Check if date is valid
      if (isNaN(start.getTime())) {
        return {
          isValid: false,
          error: 'Ugyldig datoformat'
        };
      }

      // Check if session starts on the hour
      if (!this.isValidSessionStartTime(start)) {
        return {
          isValid: false,
          error: 'Sessioner skal starte på hele timer (f.eks. 10:00, 11:00, 14:00)'
        };
      }

      // Check if session is in the future
      const now = new Date();
      if (start <= now) {
        return {
          isValid: false,
          error: 'Sessionen skal planlægges til et fremtidigt tidspunkt'
        };
      }

      // Check business hours (8:00 - 18:00)
      const hour = start.getHours();
      if (hour < 8 || hour >= 18) {
        return {
          isValid: false,
          error: 'Sessioner skal planlægges mellem 8:00 og 18:00'
        };
      }

      return {
        isValid: true,
        startTime: start,
        endTime: this.calculateSessionEndTime(start),
        duration: this.SESSION_DURATION_MINUTES
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Fejl ved validering af sessionstid: ' + error.message
      };
    }
  }

  /**
   * Generates valid time slots for a given date
   * @param {Date|string} date - The date to generate slots for
   * @param {Array} excludeHours - Hours to exclude (e.g., [12] for lunch)
   * @returns {Array} - Array of valid time slot objects
   */
  static generateTimeSlots(date, excludeHours = [12]) {
    const targetDate = new Date(date);
    const slots = [];

    // Generate slots from 8:00 to 17:00 (last session starts at 17:00, ends at 18:00)
    for (let hour = 8; hour <= 17; hour++) {
      if (excludeHours.includes(hour)) {
        continue;
      }

      const slotTime = new Date(targetDate);
      slotTime.setHours(hour, 0, 0, 0);

      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        dateTime: slotTime,
        available: true,
        booked: false,
        duration: this.SESSION_DURATION_MINUTES,
        displayTime: `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`
      });
    }

    return slots;
  }

  /**
   * Formats a session time for display
   * @param {Date|string} startTime - The session start time
   * @returns {object} - Formatted time information
   */
  static formatSessionTime(startTime) {
    const start = new Date(startTime);
    const end = this.calculateSessionEndTime(start);

    return {
      startTime: start.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
      endTime: end.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
      duration: `${this.SESSION_DURATION_MINUTES} minutter`,
      fullDateTime: start.toLocaleString('da-DK'),
      timeRange: `${start.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}`
    };
  }

  /**
   * Creates a datetime picker value that ensures hour-only selection
   * @param {Date} date - The base date
   * @param {number} hour - The hour (0-23)
   * @returns {string} - ISO string for datetime-local input
   */
  static createHourOnlyDateTime(date, hour) {
    const dateTime = new Date(date);
    dateTime.setHours(hour, 0, 0, 0);
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = dateTime.getFullYear();
    const month = (dateTime.getMonth() + 1).toString().padStart(2, '0');
    const day = dateTime.getDate().toString().padStart(2, '0');
    const hourStr = hour.toString().padStart(2, '0');
    
    return `${year}-${month}-${day}T${hourStr}:00`;
  }

  /**
   * Validates if two sessions would conflict
   * @param {Date|string} startTime1 - First session start time
   * @param {Date|string} startTime2 - Second session start time
   * @returns {boolean} - True if sessions conflict
   */
  static sessionsConflict(startTime1, startTime2) {
    const start1 = new Date(startTime1);
    const end1 = this.calculateSessionEndTime(start1);
    const start2 = new Date(startTime2);
    const end2 = this.calculateSessionEndTime(start2);

    // Check for any overlap
    return (start1 < end2 && start2 < end1);
  }

  /**
   * Gets available hours for a specific date
   * @param {Date} date - The target date
   * @param {Array} bookedHours - Already booked hours
   * @param {Array} availableHours - Hours available for booking
   * @returns {Array} - Available hour slots
   */
  static getAvailableHours(date, bookedHours = [], availableHours = [8,9,10,11,13,14,15,16,17]) {
    return availableHours
      .filter(hour => !bookedHours.includes(hour))
      .map(hour => ({
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        displayTime: `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`,
        dateTime: this.createHourOnlyDateTime(date, hour),
        isValid: hour >= 8 && hour <= 17 && hour !== 12 // Business hours, no lunch
      }))
      .filter(slot => slot.isValid);
  }

  /**
   * Generates initials from a name
   * @param {string} name - The full name
   * @returns {string} - Initials (max 2 characters)
   */
  static generateInitials(name) {
    if (!name || typeof name !== 'string') {
      return 'T';
    }

    const words = name.trim().split(/\s+/);
    
    if (words.length === 1) {
      // Single word - take first 2 characters
      return words[0].substring(0, 2).toUpperCase();
    }
    
    // Multiple words - take first character of first two words
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
}
