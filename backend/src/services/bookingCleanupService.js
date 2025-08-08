const { databaseService } = require('../config/database');

class BookingCleanupService {
  constructor() {
    this.isRunning = false;
  }

  // Start the cleanup service
  start() {
    if (this.isRunning) {
      console.log('Booking cleanup service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting booking cleanup service...');
    
    // Run cleanup immediately
    this.cleanup();
    
    // Set up interval to run every minute
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, 60000); // 60 seconds
  }

  // Stop the cleanup service
  stop() {
    if (!this.isRunning) {
      console.log('Booking cleanup service is not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Stopped booking cleanup service');
  }

  // Main cleanup function
  async cleanup() {
    try {
      console.log('Running booking cleanup...');
      
      // Find all expired bookings that are still awaiting payment
      const expiredBookings = await databaseService.findMany('booking', {
        where: {
          unifiedStatus: 'AWAITING_PAYMENT',
          paymentExpiresAt: {
            lt: new Date() // Less than current time = expired
          }
        },
        include: {
          tutor: true,
          session: true
        }
      });

      console.log(`Found ${expiredBookings.length} expired bookings to clean up`);

      // Process each expired booking
      for (const booking of expiredBookings) {
        await this.cancelExpiredBooking(booking);
      }

      if (expiredBookings.length > 0) {
        console.log(`Successfully cleaned up ${expiredBookings.length} expired bookings`);
      }

    } catch (error) {
      console.error('Error during booking cleanup:', error);
    }
  }

  // Cancel an individual expired booking
  async cancelExpiredBooking(booking) {
    try {
      console.log(`Cancelling expired booking: ${booking.id}`);

      // Update booking status
      await databaseService.update('booking', {
        where: { id: booking.id },
        data: {
          unifiedStatus: 'EXPIRED',
          cancelledAt: new Date()
        }
      });

      // No need to free time slots - booking cancellation is sufficient
      // Time slot availability is now determined by absence of active booking

      console.log(`Successfully cancelled expired booking: ${booking.id}`);

    } catch (error) {
      console.error(`Error cancelling expired booking ${booking.id}:`, error);
    }
  }

  // NOTE: freeTimeSlot method removed - no longer needed
  // Time slot availability is now determined by booking table status only

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    };
  }
}

// Create and export a singleton instance
const bookingCleanupService = new BookingCleanupService();
module.exports = bookingCleanupService;