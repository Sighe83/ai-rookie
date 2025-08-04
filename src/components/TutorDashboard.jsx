import React, { useState, useEffect } from 'react';
import { Calendar, Users, Settings, BookOpen, Clock, DollarSign, TrendingUp, CalendarDays, AlertCircle } from 'lucide-react';
import { Button, Card, useToast } from './design-system';
import TutorBookings from './TutorBookings';
import TutorProfile from './TutorProfile';
import WeeklyAvailabilityManager from './WeeklyAvailabilityManager';
import SessionManager from './SessionManager';
import { useAuth } from '../hooks/useAuth';
import { useTutorStats, useTutorByUserId, useSupabaseQuery } from '../hooks/useApi';
import { supabase } from '../services/supabase';

const TutorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const { error: showError } = useToast();
  
  // Get tutor data first, then stats
  const { data: tutorData, loading: tutorLoading } = useTutorByUserId(user?.id);
  const { data: stats, loading: statsLoading, error: statsError } = useTutorStats(tutorData?.id);

  // Show error toast when stats error occurs
  useEffect(() => {
    if (statsError) {
      showError(`Kunne ikke indlæse statistikker: ${statsError}`);
    }
  }, [statsError, showError]);
  
  // Get next booking and pending bookings
  const { data: nextBooking } = useSupabaseQuery(async () => {
    if (!tutorData?.id) return null;
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        session:sessions(title),
        user:users(name)
      `)
      .eq('tutor_id', tutorData.id)
      .in('status', ['CONFIRMED'])
      .gte('selected_date_time', now)
      .order('selected_date_time', { ascending: true })
      .limit(1)
      .single();
    return data;
  }, [tutorData?.id]);

  const { data: pendingBookings } = useSupabaseQuery(async () => {
    if (!tutorData?.id) return [];
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        session:sessions(title),
        user:users(name)
      `)
      .eq('tutor_id', tutorData.id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(3);
    return data || [];
  }, [tutorData?.id]);

  const tabs = [
    { id: 'overview', label: 'Oversigt', icon: TrendingUp },
    { id: 'bookings', label: 'Bookinger', icon: Calendar },
    { id: 'availability', label: 'Tilgængelighed', icon: CalendarDays },
    { id: 'sessions', label: 'Sessioner', icon: BookOpen },
    { id: 'profile', label: 'Profil', icon: Settings }
  ];

  // Create stats array with real data
  const isLoading = tutorLoading || statsLoading || !tutorData?.id;
  const dashboardStats = [
    { 
      label: 'Kommende 7 dage', 
      value: isLoading ? '...' : (stats?.next7DaysBookings || '0'), 
      subtitle: 'Bookinger', 
      icon: Calendar, 
      color: 'purple' 
    },
    { 
      label: 'Næste uge', 
      value: isLoading ? '...' : (stats?.nextWeekAvailableSlots || '0'), 
      subtitle: 'Ledige slots', 
      icon: Clock, 
      color: 'purple' 
    },
    { 
      label: 'Denne måned', 
      value: isLoading ? '...' : `${Math.round(stats?.monthlyEarnings || 0)} kr`, 
      subtitle: 'Indtjening', 
      icon: DollarSign, 
      color: 'purple' 
    },
    { 
      label: 'Total', 
      value: isLoading ? '...' : (stats?.totalCompletedSessions || '0'), 
      subtitle: 'Gennemførte sessioner', 
      icon: Users, 
      color: 'purple' 
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bookings':
        return <TutorBookings />;
      case 'availability':
        return <WeeklyAvailabilityManager />;
      case 'sessions':
        return <SessionManager />;
      case 'profile':
        return <TutorProfile />;
      default:
        return (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {dashboardStats.map((stat, index) => (
                <Card key={index} className="p-3 sm:p-6 hover:border-purple-500/50 transition-colors">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium">{stat.subtitle}</p>
                  <p className="text-slate-400 text-xs mt-1 hidden sm:block">{stat.label}</p>
                </Card>
              ))}
            </div>

            {/* Important Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
              {/* Next Booking */}
              <Card className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  <span className="hidden sm:inline">Næste booking</span>
                  <span className="sm:hidden">Næste</span>
                </h3>
                {nextBooking ? (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-white font-medium text-sm sm:text-base leading-tight flex-1">{nextBooking.session?.title}</h4>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded flex-shrink-0">Bekræftet</span>
                    </div>
                    <p className="text-slate-300 text-xs sm:text-sm">{nextBooking.user?.name || nextBooking.contact_name}</p>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">
                        {new Date(nextBooking.selected_date_time).toLocaleDateString('da-DK', {
                          weekday: 'short',
                          day: 'numeric', 
                          month: 'short'
                        })} kl. {new Date(nextBooking.selected_date_time).toLocaleTimeString('da-DK', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <Button
                      onClick={() => setActiveTab('bookings')}
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 sm:mt-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-400/50"
                    >
                      Se alle
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-3 sm:py-4">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs sm:text-sm">Ingen kommende</p>
                  </div>
                )}
              </Card>

              {/* Pending Bookings */}
              <Card className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  <span className="hidden sm:inline">Afventer bekræftelse ({pendingBookings?.length || 0})</span>
                  <span className="sm:hidden">Afventer ({pendingBookings?.length || 0})</span>
                </h3>
                {pendingBookings && pendingBookings.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {pendingBookings.slice(0, 2).map((booking) => (
                      <Card key={booking.id} className="p-2 sm:p-3 bg-slate-700">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-white font-medium text-xs sm:text-sm leading-tight flex-1">{booking.session?.title}</h4>
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded flex-shrink-0">Afventer</span>
                        </div>
                        <p className="text-slate-300 text-xs">{booking.user?.name || booking.contact_name}</p>
                        <p className="text-slate-400 text-xs">
                          {new Date(booking.selected_date_time).toLocaleDateString('da-DK', {
                            day: 'numeric',
                            month: 'short'
                          })} kl. {new Date(booking.selected_date_time).toLocaleTimeString('da-DK', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </Card>
                    ))}
                    <Button
                      onClick={() => setActiveTab('bookings')}
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 sm:mt-3 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border-yellow-400/50"
                    >
                      Bekræft alle
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-3 sm:py-4">
                    <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs sm:text-sm">Ingen afventende</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Tutor Dashboard</h1>
            <p className="text-slate-400 text-sm sm:text-base">Administrer dine sessioner, tider og profil</p>
          </div>
          <div className="sm:text-right sm:flex-shrink-0">
            <p className="text-slate-400 text-xs sm:text-sm">Velkommen tilbage</p>
            <p className="text-white font-semibold text-sm sm:text-base">{user?.name}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 sm:mb-8">
        {/* Mobile Tab Navigation */}
        <div className="sm:hidden">
          <div className="flex overflow-x-auto gap-2 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden sm:flex overflow-x-auto gap-2 pb-2 border-b border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all text-base min-h-[44px] whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default TutorDashboard;