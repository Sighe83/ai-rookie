import React, { useState } from 'react';
import { Calendar, Users, Settings, BookOpen, Clock, DollarSign, TrendingUp } from 'lucide-react';
import TutorBookings from './TutorBookings';
import TutorAvailability from './TutorAvailability';
import TutorProfile from './TutorProfile';

const TutorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Oversigt', icon: TrendingUp },
    { id: 'bookings', label: 'Bookinger', icon: Calendar },
    { id: 'availability', label: 'Tider', icon: Clock },
    { id: 'profile', label: 'Profil', icon: Settings }
  ];

  const stats = [
    { label: 'Denne uge', value: '3', subtitle: 'Bookinger', icon: Calendar, color: 'blue' },
    { label: 'Næste uge', value: '5', subtitle: 'Ledige slots', icon: Clock, color: 'green' },
    { label: 'Denne måned', value: '12.450 kr', subtitle: 'Indtjening', icon: DollarSign, color: 'yellow' },
    { label: 'Total', value: '47', subtitle: 'Gennemførte sessioner', icon: Users, color: 'purple' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bookings':
        return <TutorBookings />;
      case 'availability':
        return <TutorAvailability />;
      case 'profile':
        return <TutorProfile />;
      default:
        return (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const colorClasses = {
                  blue: 'border-blue-500 bg-blue-500/10',
                  green: 'border-green-500 bg-green-500/10',
                  yellow: 'border-yellow-500 bg-yellow-500/10',
                  purple: 'border-purple-500 bg-purple-500/10'
                };
                
                const iconColorClasses = {
                  blue: 'text-blue-400',
                  green: 'text-green-400',
                  yellow: 'text-yellow-400',
                  purple: 'text-purple-400'
                };

                return (
                  <div key={index} className={`border-2 ${colorClasses[stat.color]} p-6 rounded-lg`}>
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`w-8 h-8 ${iconColorClasses[stat.color]}`} />
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-slate-300 text-sm">{stat.subtitle}</p>
                    <p className="text-slate-400 text-xs mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Seneste aktivitet
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Ny booking fra Morten K.</p>
                      <p className="text-slate-400 text-sm">AI for Marketing • I morgen kl. 14:00</p>
                    </div>
                  </div>
                  <span className="text-green-400 text-sm font-medium">Bekræftet</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Session gennemført</p>
                      <p className="text-slate-400 text-sm">Anne P. • AI-drevet salgsoptimering</p>
                    </div>
                  </div>
                  <span className="text-blue-400 text-sm font-medium">Afsluttet</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Nye tidsslots tilføjet</p>
                      <p className="text-slate-400 text-sm">Næste uge • 5 slots tilgængelige</p>
                    </div>
                  </div>
                  <span className="text-yellow-400 text-sm font-medium">Aktiv</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Tutor Dashboard</h1>
        <p className="text-slate-400">Administrer dine sessioner, tider og profil</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-green-600 text-white border-b-2 border-green-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default TutorDashboard;