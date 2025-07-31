import React, { useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Phone, Mail, Building } from 'lucide-react';

const TutorBookings = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock data - in real app this would come from API
  const bookings = [
    {
      id: 1,
      client: 'Morten Kristensen',
      email: 'morten@company.dk',
      phone: '+45 20 30 40 50',
      company: 'TechStart ApS',
      session: 'AI for Marketing & Kommunikation',
      date: '2024-02-15',
      time: '14:00',
      duration: 60,
      status: 'confirmed',
      price: 950,
      notes: 'Fokus på social media automation'
    },
    {
      id: 2,
      client: 'Anne Pedersen',
      email: 'anne.p@bigcorp.dk',
      phone: '+45 30 40 50 60',
      company: 'BigCorp A/S',
      session: 'AI-drevet salgsoptimering',
      date: '2024-02-14',
      time: '10:00',
      duration: 90,
      status: 'completed',
      price: 1200,
      notes: 'Gennemgået CRM integration'
    },
    {
      id: 3,
      client: 'Lars Hansen',
      email: 'lars@startup.dk',
      phone: '+45 40 50 60 70',
      company: 'Startup Ltd.',
      session: 'Introduktion til ChatGPT for ledere',
      date: '2024-02-16',
      time: '16:00',
      duration: 60,
      status: 'pending',
      price: 850,
      notes: 'Første gang med AI tools'
    }
  ];

  const statusColors = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500' },
    confirmed: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500' },
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

  const handleStatusChange = (bookingId, newStatus) => {
    // In real app, this would update via API
    console.log(`Updating booking ${bookingId} to status: ${newStatus}`);
  };

  const filteredBookings = selectedStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === selectedStatus);

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedStatus === 'all'
              ? 'bg-green-600 text-white'
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
              ? 'bg-green-600 text-white'
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
                    <p className="text-2xl font-bold text-white">{booking.price.toLocaleString('da-DK')} kr</p>
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Bekræft
                      </button>
                      <button
                        onClick={() => handleStatusChange(booking.id, 'cancelled')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Aflys
                      </button>
                    </div>
                  )}
                  
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(booking.id, 'completed')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Marker som gennemført
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