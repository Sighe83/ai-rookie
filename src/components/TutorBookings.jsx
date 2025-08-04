import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { tutorManagementApi } from '../services/api.js';

// Design System Imports
import { 
  Card, 
  Container, 
  LoadingSpinner, 
  StatusBadge, 
  Button 
} from './design-system/DesignSystem.jsx';
import { DataTable } from './design-system/DataComponents.jsx';
import { Header, EmptyState } from './design-system/LayoutComponents.jsx';
import { NavigationTabs } from './design-system/NavigationComponents.jsx';
import { useToast } from './design-system/NotificationComponents.jsx';

const TutorBookings = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  
  // Use design system toast notifications
  const { success, error: showError } = useToast();

  const statusLabels = {
    pending: 'Afventer bekræftelse',
    confirmed: 'Bekræftet',
    completed: 'Gennemført',
    cancelled: 'Aflyst'
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
      setError('Kunne ikke indlæse bookinger');
      showError('Kunne ikke indlæse bookinger. Prøv igen senere.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      setUpdating(bookingId);
      await tutorManagementApi.updateBookingStatus(bookingId, newStatus);
      await loadBookings(); // Reload to get updated data
      
      // Show success toast based on the new status
      const statusMessages = {
        confirmed: 'Booking bekræftet',
        cancelled: 'Booking aflyst',
        completed: 'Booking markeret som gennemført'
      };
      success(statusMessages[newStatus] || 'Booking status opdateret');
    } catch (error) {
      console.error('Failed to update booking status:', error);
      showError('Kunne ikke opdatere booking status');
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
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-slate-400">Indlæser bookinger...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Card className="p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button 
            variant="danger"
            onClick={() => { setError(null); loadBookings(); }}
          >
            Prøv igen
          </Button>
        </Card>
      </Container>
    );
  }

  // Prepare tabs for NavigationTabs component
  const tabs = [
    {
      id: 'all',
      label: 'Alle',
      badge: bookings.length
    },
    {
      id: 'pending',
      label: 'Afventer',
      badge: bookings.filter(b => b.status === 'pending').length
    },
    {
      id: 'confirmed',
      label: 'Bekræftet',
      badge: bookings.filter(b => b.status === 'confirmed').length
    },
    {
      id: 'completed',
      label: 'Gennemført',
      badge: bookings.filter(b => b.status === 'completed').length
    },
    {
      id: 'cancelled',
      label: 'Aflyst',
      badge: bookings.filter(b => b.status === 'cancelled').length
    }
  ];

  // Define DataTable columns
  const columns = [
    {
      key: 'client',
      label: 'Klient',
      render: (value, booking) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
            {booking.client.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-xs sm:text-sm truncate">{booking.client}</p>
            <p className="text-slate-400 text-xs truncate">{booking.email}</p>
            {booking.company && (
              <p className="text-purple-400 text-xs truncate">{booking.company}</p>
            )}
            {booking.phone && (
              <p className="text-slate-500 text-xs sm:hidden">{booking.phone}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'session',
      label: 'Session',
      render: (value, booking) => (
        <div>
          <p className="text-white font-medium text-sm">{booking.session}</p>
          <p className="text-slate-400 text-xs">{booking.duration} min</p>
          {booking.notes && (
            <p className="text-slate-500 text-xs mt-1 italic">
              <span className="hidden sm:inline">Noter: </span>
              {booking.notes.length > 30 ? `${booking.notes.substring(0, 30)}...` : booking.notes}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'date',
      label: 'Dato & Tid',
      render: (value, booking) => (
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3 text-purple-400" />
            <p className="text-white text-sm">
              {new Date(booking.date).toLocaleDateString('da-DK', { 
                day: 'numeric', 
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-400" />
            <p className="text-slate-400 text-sm">{booking.time}</p>
          </div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Værdi',
      render: (value, booking) => (
        <div>
          <p className="text-white font-bold">
            {booking.price.toLocaleString('da-DK', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })} kr.
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, booking) => (
        <StatusBadge status={booking.status}>
          {statusLabels[booking.status]}
        </StatusBadge>
      )
    },
    {
      key: 'actions',
      label: 'Handlinger',
      sortable: false,
      render: (value, booking) => {
        if (booking.status === 'pending') {
          return (
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleStatusChange(booking.id, 'confirmed')}
                disabled={updating === booking.id}
                loading={updating === booking.id}
                className="text-xs"
              >
                <span className="hidden sm:inline">Bekræft</span>
                <span className="sm:hidden">✓</span>
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleStatusChange(booking.id, 'cancelled')}
                disabled={updating === booking.id}
                loading={updating === booking.id}
                className="text-xs"
              >
                <span className="hidden sm:inline">Aflys</span>
                <span className="sm:hidden">✕</span>
              </Button>
            </div>
          );
        }
        
        if (booking.status === 'confirmed') {
          const sessionDate = new Date(booking.date + 'T' + booking.time);
          const now = new Date();
          const canMarkCompleted = sessionDate <= now;
          
          return (
            <Button
              size="sm"
              variant={canMarkCompleted ? 'success' : 'secondary'}
              onClick={() => handleStatusChange(booking.id, 'completed')}
              disabled={updating === booking.id || !canMarkCompleted}
              loading={updating === booking.id}
              title={!canMarkCompleted ? 'Session kan kun markeres som gennemført efter starttidspunktet' : ''}
              className="text-xs"
            >
              <span className="hidden sm:inline">Marker gennemført</span>
              <span className="sm:hidden">✓ Done</span>
            </Button>
          );
        }
        
        return <span className="text-slate-500 text-xs">-</span>;
      }
    }
  ];

  return (
    <Container>
      <Header 
        title="Mine Bookinger" 
        subtitle="Administrer dine booking forespørgsler og sessions"
      />
      
      <div className="space-y-6">
        {/* Status Filter Tabs */}
        <NavigationTabs
          tabs={tabs}
          activeTab={selectedStatus}
          onTabChange={setSelectedStatus}
        />

        {/* Bookings DataTable */}
        {filteredBookings.length > 0 ? (
          <DataTable
            data={filteredBookings}
            columns={columns}
            sortable={true}
            searchable={true}
          />
        ) : (
          <EmptyState
            icon={Calendar}
            title="Ingen bookinger"
            description={
              selectedStatus === 'all' 
                ? 'Du har ingen bookinger endnu.' 
                : `Ingen bookinger med status: ${statusLabels[selectedStatus]}`
            }
          />
        )}
      </div>
    </Container>
  );
};

export default TutorBookings;