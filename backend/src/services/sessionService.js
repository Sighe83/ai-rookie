/**
 * Session Business Logic Service
 * 
 * Implements the core business rules for sessions:
 * 1. All sessions are exactly 1 hour (60 minutes)
 * 2. All sessions start on the hour (00 minutes)
 */

class SessionService {
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
          error: 'Invalid date format'
        };
      }

      // Check if session starts on the hour
      if (!this.isValidSessionStartTime(start)) {
        return {
          isValid: false,
          error: 'Sessions must start on the hour (e.g., 10:00, 11:00, 14:00)'
        };
      }

      // Check if session is in the future
      const now = new Date();
      if (start <= now) {
        return {
          isValid: false,
          error: 'Session must be scheduled for a future time'
        };
      }

      // Check business hours (8:00 - 18:00)
      const hour = start.getHours();
      if (hour < 8 || hour >= 18) {
        return {
          isValid: false,
          error: 'Sessions must be scheduled between 8:00 and 18:00'
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
        error: 'Error validating session time: ' + error.message
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
        status: 'AVAILABLE',
        duration: this.SESSION_DURATION_MINUTES
      });
    }

    return slots;
  }

  /**
   * Validates that a booking doesn't conflict with existing bookings
   * @param {Date} startTime - The proposed booking start time
   * @param {Array} existingBookings - Array of existing bookings for the tutor
   * @returns {object} - Validation result
   */
  static validateNoTimeConflict(startTime, existingBookings = []) {
    const start = new Date(startTime);
    const end = this.calculateSessionEndTime(start);

    for (const booking of existingBookings) {
      const bookingStart = new Date(booking.selectedDateTime);
      const bookingEnd = this.calculateSessionEndTime(bookingStart);

      // Check for overlap
      if ((start >= bookingStart && start < bookingEnd) || 
          (end > bookingStart && end <= bookingEnd) ||
          (start <= bookingStart && end >= bookingEnd)) {
        return {
          isValid: false,
          error: `Time slot conflicts with existing booking at ${bookingStart.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}`
        };
      }
    }

    return {
      isValid: true
    };
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
      fullDateTime: start.toLocaleString('da-DK')
    };
  }
}

module.exports = SessionService;
