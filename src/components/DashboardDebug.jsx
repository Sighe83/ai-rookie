import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTutorByUserId } from '../hooks/useApi';

const DashboardDebug = () => {
  const { user } = useAuth();
  const { data: tutorData } = useTutorByUserId(user?.id);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    if (!tutorData?.id) {
      alert('Tutor ID not found');
      return;
    }

    setLoading(true);
    const tutorId = tutorData.id;
    const now = new Date();
    const results = {};

    try {
      // Test 1: Check if tutor_time_slots table exists
      try {
        const { data: timeSlotsTest, error: timeSlotsError } = await supabase
          .from('tutor_time_slots')
          .select('id')
          .limit(1);
        
        results.timeSlotsTableExists = !timeSlotsError;
        results.timeSlotsError = timeSlotsError?.message;
      } catch (e) {
        results.timeSlotsTableExists = false;
        results.timeSlotsError = e.message;
      }

      // Test 2: Count tutor's available slots
      if (results.timeSlotsTableExists) {
        const startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(now);
        endDate.setDate(now.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        
        const { data: allAvailableSlots, error: availableError } = await supabase
          .from('tutor_time_slots')
          .select('id, date, start_time, status')
          .eq('tutor_id', tutorId)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);

        // Filter to only future slots
        const availableSlots = allAvailableSlots?.filter(slot => {
          const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);
          return slotDateTime > now;
        }) || [];

        // Group by date for detailed breakdown
        const slotsByDate = {};
        availableSlots?.forEach(slot => {
          const date = slot.date;
          if (!slotsByDate[date]) {
            slotsByDate[date] = {
              total: 0,
              available: 0,
              booked: 0,
              unavailable: 0
            };
          }
          slotsByDate[date].total++;
          
          if (slot.status === 'BOOKED' || slot.status === 'PENDING') {
            slotsByDate[date].booked++;
          } else if (slot.status === 'AVAILABLE') {
            slotsByDate[date].available++;
          } else {
            slotsByDate[date].unavailable++;
          }
        });

        results.availableSlots = {
          total: availableSlots?.length || 0,
          available: availableSlots?.filter(s => s.status === 'AVAILABLE').length || 0,
          booked: availableSlots?.filter(s => s.status === 'BOOKED' || s.status === 'PENDING').length || 0,
          unavailable: availableSlots?.filter(s => s.status === 'UNAVAILABLE').length || 0,
          byDate: slotsByDate,
          data: availableSlots,
          error: availableError?.message
        };
      }

      // Test 3: Count next 7 days bookings (i dag + 6 dage frem)
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const endOfNext7Days = new Date(now);
      endOfNext7Days.setDate(now.getDate() + 6);
      endOfNext7Days.setHours(23, 59, 59, 999);
      
      const { data: allNext7DaysBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status, selected_date_time, total_price')
        .eq('tutor_id', tutorId)
        .gte('selected_date_time', startOfToday.toISOString())
        .lte('selected_date_time', endOfNext7Days.toISOString());

      // Filter to only future bookings
      const next7DaysBookings = allNext7DaysBookings?.filter(booking => {
        const bookingDateTime = new Date(booking.selected_date_time);
        return bookingDateTime > now;
      }) || [];

      // Group bookings by date and status for detailed breakdown
      const bookingsByDate = {};
      next7DaysBookings?.forEach(booking => {
        const bookingDate = new Date(booking.selected_date_time);
        const dateKey = bookingDate.toISOString().split('T')[0];
        
        if (!bookingsByDate[dateKey]) {
          bookingsByDate[dateKey] = {
            total: 0,
            confirmed: 0,
            pending: 0,
            completed: 0,
            cancelled: 0,
            other: 0
          };
        }
        bookingsByDate[dateKey].total++;
        
        const status = booking.status?.toLowerCase() || 'unknown';
        if (bookingsByDate[dateKey][status] !== undefined) {
          bookingsByDate[dateKey][status]++;
        } else {
          bookingsByDate[dateKey].other++;
        }
      });

      results.next7DaysBookings = {
        total: next7DaysBookings?.length || 0,
        confirmed: next7DaysBookings?.filter(b => b.status === 'CONFIRMED').length || 0,
        pending: next7DaysBookings?.filter(b => b.status === 'PENDING').length || 0,
        completed: next7DaysBookings?.filter(b => b.status === 'COMPLETED').length || 0,
        cancelled: next7DaysBookings?.filter(b => b.status === 'CANCELLED').length || 0,
        byDate: bookingsByDate,
        data: next7DaysBookings,
        error: bookingsError?.message
      };

      // Test 4: Monthly earnings
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      
      const { data: monthlyBookings, error: monthlyError } = await supabase
        .from('bookings')
        .select('total_price, status, selected_date_time')
        .eq('tutor_id', tutorId)
        .eq('status', 'COMPLETED') // Only completed sessions count for earnings
        .gte('selected_date_time', startOfMonth)
        .lte('selected_date_time', endOfMonth);

      const monthlyEarnings = monthlyBookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;

      results.monthlyEarnings = {
        bookingsCount: monthlyBookings?.length || 0,
        totalEarnings: monthlyEarnings,
        data: monthlyBookings,
        error: monthlyError?.message
      };

      // Test 5: Total completed sessions
      const { data: completedSessions, error: completedError } = await supabase
        .from('bookings')
        .select('id, selected_date_time')
        .eq('tutor_id', tutorId)
        .eq('status', 'COMPLETED');

      results.completedSessions = {
        total: completedSessions?.length || 0,
        data: completedSessions,
        error: completedError?.message
      };

      // Test 6: Daily comparison if time slots table exists
      if (results.timeSlotsTableExists && results.availableSlots.byDate && results.next7DaysBookings.byDate) {
        const dailyComparison = {};
        const next7Days = [];
        
        // Generate next 7 days (i dag + 6 dage frem)
        for (let i = 0; i <= 6; i++) {
          const date = new Date(now);
          date.setDate(now.getDate() + i);
          const dateKey = date.toISOString().split('T')[0];
          next7Days.push(dateKey);
        }
        
        next7Days.forEach(dateKey => {
          const slots = results.availableSlots.byDate[dateKey] || { total: 0, available: 0, booked: 0, unavailable: 0 };
          const bookings = results.next7DaysBookings.byDate[dateKey] || { total: 0, confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
          
          dailyComparison[dateKey] = {
            date: new Date(dateKey).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' }),
            timeSlots: slots,
            bookings: bookings,
            discrepancy: {
              bookedSlots: slots.booked,
              confirmedBookings: bookings.confirmed,
              match: slots.booked === bookings.confirmed
            }
          };
        });
        
        results.dailyComparison = dailyComparison;
      }

      // Test 7: Check old table
      try {
        const { data: oldAvailability, error: oldError } = await supabase
          .from('tutor_availability')
          .select('id')
          .eq('tutor_id', tutorId)
          .limit(5);
          
        results.oldAvailabilityTable = {
          exists: !oldError,
          count: oldAvailability?.length || 0,
          error: oldError?.message
        };
      } catch (e) {
        results.oldAvailabilityTable = {
          exists: false,
          error: e.message
        };
      }

    } catch (error) {
      results.generalError = error.message;
    }

    setResults(results);
    setLoading(false);
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">Dashboard Debug</h3>
      
      <button
        onClick={runTests}
        disabled={loading || !tutorData?.id}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg mb-4"
      >
        {loading ? 'Testing...' : 'Run Debug Tests'}
      </button>

      {tutorData && (
        <div className="text-white mb-4">
          <strong>Tutor ID:</strong> {tutorData.id}
        </div>
      )}

      {Object.keys(results).length > 0 && (
        <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto text-xs">
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default DashboardDebug;