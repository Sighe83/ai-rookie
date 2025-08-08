import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentCancelled = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    const loadBookingDetails = async () => {
      if (!bookingId) {
        setError('Missing booking information');
        setLoading(false);
        return;
      }

      try {
        // Fetch booking details to show what was cancelled (using public endpoint - no auth required)
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const response = await fetch(`${API_URL}/api/bookings/${bookingId}/public`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setBooking(data.data);
          } else {
            setError('Failed to load booking details');
          }
        } else {
          setError('Failed to load booking details');
        }
      } catch (err) {
        console.error('Error loading booking:', err);
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    loadBookingDetails();
  }, [bookingId]);

  const handleRetryPayment = async () => {
    if (!booking) return;
    
    try {
      // Create a new booking with the same details
      const bookingData = {
        tutorId: booking.tutorId,
        sessionId: booking.sessionId,
        format: booking.format,
        selectedDateTime: booking.selectedDateTime,
        participants: booking.participants,
        siteMode: booking.siteMode,
        contactName: booking.contactName,
        contactEmail: booking.contactEmail,
        contactPhone: booking.contactPhone,
        company: booking.company,
        department: booking.department,
        notes: booking.notes
      };

      const response = await api.post('/api/bookings', bookingData);
      
      if (response.success && response.data.paymentUrl) {
        // Redirect to the new Stripe checkout
        window.location.href = response.data.paymentUrl;
      } else {
        setError('Failed to create new booking. The time slot may no longer be available.');
      }
    } catch (err) {
      console.error('Error retrying payment:', err);
      setError('Failed to retry payment. Please try booking again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">
                Loading...
              </h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Payment Cancelled</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your payment was cancelled and your booking was not completed.
            </p>
          </div>

          {booking && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cancelled Booking</h3>
              
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Session:</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.session?.title}</dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Tutor:</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.tutor?.user?.name}</dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Date & Time:</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(booking.selectedDateTime).toLocaleString()}
                  </dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Format:</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.format}</dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Price:</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.totalPrice} DKK</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Time slot reserved:</strong> The time slot is temporarily reserved and will be automatically released within 5 minutes if payment is not completed.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              {booking && booking.status === 'AWAITING_PAYMENT' && (
                <button
                  onClick={handleRetryPayment}
                  className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Payment Again
                </button>
              )}
              
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Book Different Session
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact our support team for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;