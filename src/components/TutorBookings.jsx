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
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500' },
    confirmed: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500' },
    completed: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500' }
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

  const filteredBookings = selectedStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === selectedStatus);

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
      <div className="space-y-4">
        {filteredBookings.map((booking) => {
          const statusStyle = statusColors[booking.status];
          
          return (
            <div key={booking.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left side - Booking info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white">{booking.session}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} flex items-center gap-1`}>
                      {getStatusIcon(booking.status)}
                      {statusLabels[booking.status]}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-300">
                        <User className="w-4 h-4" />
                        <span>{booking.client}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-4 h-4" />
                        <span>{booking.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-4 h-4" />
                        <span>{booking.phone}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(booking.date).toLocaleDateString('da-DK', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="w-4 h-4" />
                        <span>{booking.time} ({booking.duration} min)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Building className="w-4 h-4" />
                        <span>{booking.company}</span>
                      </div>
                    </div>
                  </div>
                  
                  {booking.notes && (
                    <div className="mt-3 p-3 bg-slate-700 rounded-lg">
                      <p className="text-slate-300 text-sm"><strong>Noter:</strong> {booking.notes}</p>
                    </div>
                  )}
                </div>

                {/* Right side - Actions */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <div className="text-right mb-2">
                    <p className="text-2xl font-bold text-white">{booking.price.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr.</p>
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                        disabled={updating === booking.id}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        {updating === booking.id ? 'Updating...' : 'Bekræft'}
                      </button>
                      <button
                        onClick={() => handleStatusChange(booking.id, 'cancelled')}
                        disabled={updating === booking.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        {updating === booking.id ? 'Updating...' : 'Aflys'}
                      </button>
                    </div>
                  )}
                  
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(booking.id, 'completed')}
                      disabled={updating === booking.id}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {updating === booking.id ? 'Updating...' : 'Marker som gennemført'}
                    </button>
                  )}
                </div>
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