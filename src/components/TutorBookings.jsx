import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Phone, Mail, Building } from 'lucide-react';
import { tutorManagementApi } from '../services/api.js';

const TutorBookings = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  const statusColors = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500', dot: 'bg-yellow-400' },
    confirmed: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500', dot: 'bg-purple-400' },
    completed: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500', dot: 'bg-blue-400' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500', dot: 'bg-red-400' }
  };

  const statusLabels = {
    pending: 'Afventer bekræftelse',
    confirmed: 'Bekræftet',
    completed: 'Gennemført',
    cancelled: 'Aflyst'
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tutorManagementApi.getTutorBookings();
      
      // Transform the data to match the expected format
      const transformedBookings = response.data.map(booking => ({
        id: booking.id,
        client: booking.user?.name || booking.contact_name,
        email: booking.user?.email || booking.contact_email,
        phone: booking.user?.phone || booking.contact_phone,
        company: booking.user?.company || booking.company,
        session: booking.session?.title || 'Unknown Session',
        date: booking.selected_date_time?.split('T')[0] || booking.selected_date_time,
        time: new Date(booking.selected_date_time).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
        duration: booking.session?.duration || 60,
        status: booking.status?.toLowerCase() || 'pending',
        price: booking.total_price || 0,
        notes: booking.notes || ''
      }));
      
      setBookings(transformedBookings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      setUpdating(bookingId);
      await tutorManagementApi.updateBookingStatus(bookingId, newStatus);
      await loadBookings(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to update booking status:', error);
      setError('Failed to update booking status');
    } finally {
      setUpdating(null);
    }
  };

  const filteredBookings = (selectedStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === selectedStatus))
    .sort((a, b) => {
      // Define priority order: pending (highest), confirmed, completed, cancelled (lowest)
      const statusPriority = {
        'pending': 1,
        'confirmed': 2, 
        'completed': 3,
        'cancelled': 4
      };
      
      const priorityA = statusPriority[a.status] || 999;
      const priorityB = statusPriority[b.status] || 999;
      
      // If same status, sort by date (newest first)
      if (priorityA === priorityB) {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      }
      
      return priorityA - priorityB;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => { setError(null); loadBookings(); }}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedStatus === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Alle ({bookings.length})
        </button>
        <button
          onClick={() => setSelectedStatus('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedStatus === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Afventer ({bookings.filter(b => b.status === 'pending').length})
        </button>
        <button
          onClick={() => setSelectedStatus('confirmed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedStatus === 'confirmed'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Bekræftet ({bookings.filter(b => b.status === 'confirmed').length})
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-6">
        {filteredBookings.map((booking) => {
          const statusStyle = statusColors[booking.status];
          
          return (
            <div key={booking.id} className="bg-slate-700 rounded-xl p-4 sm:p-6 border border-slate-600 hover:border-slate-500 transition-colors">
              {/* Header - Session + Status */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">{booking.session}</h3>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} flex-shrink-0`}>
                    <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></div>
                    <span>{statusLabels[booking.status]}</span>
                  </div>
                </div>
                
                {/* Price and timing compact row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="text-left">
                    <p className="text-xl sm:text-2xl font-bold text-white">{booking.price.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr.</p>
                    <p className="text-slate-400 text-xs sm:text-sm">Booking værdi</p>
                  </div>
                  <div className="text-right text-xs sm:text-sm">
                    <p className="text-white font-medium">
                      {new Date(booking.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-slate-400">{booking.time}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3 sm:space-y-4">
                {/* Client Information - Compact */}
                <div className="bg-slate-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0">
                      {booking.client.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm sm:text-base truncate">{booking.client}</p>
                      <p className="text-slate-400 text-xs sm:text-sm truncate">{booking.email}</p>
                      {booking.company && (
                        <p className="text-purple-400 text-xs mt-1 truncate">{booking.company}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-slate-400 text-xs">{booking.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                <div className="bg-slate-800 rounded-lg p-3 sm:p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <p className="text-white font-medium text-sm sm:text-base">
                        {new Date(booking.date).toLocaleDateString('da-DK', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <p className="text-white font-medium text-sm sm:text-base">
                        {booking.time} - {new Date(new Date(booking.date + 'T' + booking.time).getTime() + 60*60*1000).toLocaleTimeString('da-DK', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} ({booking.duration} min)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                  <div className="bg-slate-800 rounded-lg p-3 sm:p-4">
                    <p className="text-slate-300 text-sm"><strong>Noter:</strong> {booking.notes}</p>
                  </div>
                )}

                {/* Actions */}
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <div className="bg-slate-800 rounded-lg p-3 sm:p-4">
                    {booking.status === 'pending' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleStatusChange(booking.id, 'confirmed')}
                          disabled={updating === booking.id}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          {updating === booking.id ? 'Opdaterer...' : 'Bekræft booking'}
                        </button>
                        <button
                          onClick={() => handleStatusChange(booking.id, 'cancelled')}
                          disabled={updating === booking.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          {updating === booking.id ? 'Opdaterer...' : 'Aflys booking'}
                        </button>
                      </div>
                    )}
                    
                    {booking.status === 'confirmed' && (() => {
                      // Check if session start time has passed
                      const sessionDate = new Date(booking.date + 'T' + booking.time);
                      const now = new Date();
                      const canMarkCompleted = sessionDate <= now;
                      
                      return (
                        <button
                          onClick={() => handleStatusChange(booking.id, 'completed')}
                          disabled={updating === booking.id || !canMarkCompleted}
                          className={`w-full ${canMarkCompleted ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'} disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors`}
                          title={!canMarkCompleted ? 'Session kan kun markeres som gennemført efter starttidspunktet' : ''}
                        >
                          {updating === booking.id ? 'Opdaterer...' : 'Marker som gennemført'}
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">Ingen bookinger</h3>
          <p className="text-slate-500">
            {selectedStatus === 'all' 
              ? 'Du har ingen bookinger endnu.' 
              : `Ingen bookinger med status: ${statusLabels[selectedStatus]}`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TutorBookings;