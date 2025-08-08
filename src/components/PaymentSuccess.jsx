import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !bookingId) {
        setError('Missing payment information');
        setLoading(false);
        return;
      }

      try {
        // Fetch updated booking details (using public endpoint - no auth required)
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
        console.error('Error verifying payment:', err);
        setError('Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">
                Processing your payment...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we confirm your booking.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">Payment Error</h2>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Home
              </button>
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
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Payment Successful!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your booking has been confirmed and paid.
            </p>
          </div>

          {booking && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Details</h3>
              
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
                  <dt className="text-sm text-gray-600">Total Price:</dt>
                  <dd className="text-sm font-medium text-gray-900">{booking.totalPrice} DKK</dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Status:</dt>
                  <dd className="text-sm font-medium text-green-600">
                    {booking.status === 'CONFIRMED' ? 'Confirmed' : booking.status}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-6 space-y-2">
            <p className="text-sm text-gray-600 text-center">
              You will receive a confirmation email shortly with all the details.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View My Bookings
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Book Another Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;