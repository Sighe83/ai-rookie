import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { availabilityApi, tutorManagementApi } from '../services/api.js';

const TutorAvailability = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [newSlot, setNewSlot] = useState({ startTime: '', endTime: '' });
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [tutorId, setTutorId] = useState(null);
  const [error, setError] = useState(null);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    loadTutorProfile();
  }, []);

  useEffect(() => {
    if (tutorId) {
      loadAvailability();
    }
  }, [tutorId, selectedDate]);

  const loadTutorProfile = async () => {
    try {
      const response = await tutorManagementApi.getProfile();
      setTutorId(response.data.id);
    } catch (error) {
      console.error('Failed to load tutor profile:', error);
      setError('Failed to load tutor profile');
    }
  };

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const startOfWeek = new Date(selectedDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const response = await availabilityApi.getAvailability(
        tutorId, 
        formatDate(startOfWeek), 
        formatDate(endOfWeek)
      );
      
      const availabilityMap = {};
      response.data.forEach(item => {
        const slots = Array.isArray(item.time_slots) ? item.time_slots : [];
        availabilityMap[item.date] = slots.map((slot, index) => ({
          id: `${item.date}-${index}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: slot.isBooked || false,
          clientName: slot.clientName
        }));
      });
      
      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Failed to load availability:', error);
      setError('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (date) => {
    return date.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const checkTimeSlotOverlap = (startTime, endTime, existingSlots) => {
    const newStart = new Date(`1970-01-01T${startTime}:00`);
    const newEnd = new Date(`1970-01-01T${endTime}:00`);
    
    if (newStart >= newEnd) {
      return 'Sluttid skal være efter starttid';
    }
    
    for (const slot of existingSlots) {
      const existingStart = new Date(`1970-01-01T${slot.startTime}:00`);
      const existingEnd = new Date(`1970-01-01T${slot.endTime}:00`);
      
      // Check for overlap
      if (newStart < existingEnd && newEnd > existingStart) {
        return `Overlapper med eksisterende slot ${slot.startTime} - ${slot.endTime}`;
      }
    }
    
    return null;
  };

  const addTimeSlot = async () => {
    if (!newSlot.startTime || !newSlot.endTime || !tutorId) return;
    
    try {
      const dateKey = formatDate(selectedDate);
      const existingSlots = availability[dateKey] || [];
      
      // Check for overlap
      const overlapError = checkTimeSlotOverlap(newSlot.startTime, newSlot.endTime, existingSlots);
      if (overlapError) {
        setError(overlapError);
        return;
      }
      
      const updatedSlots = [
        ...existingSlots,
        {
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          isBooked: false
        }
      ].sort((a, b) => a.startTime.localeCompare(b.startTime));

      await availabilityApi.updateAvailability(tutorId, dateKey, updatedSlots);
      await loadAvailability();
      
      setNewSlot({ startTime: '', endTime: '' });
      setIsAddingSlot(false);
    } catch (error) {
      console.error('Failed to add time slot:', error);
      setError('Failed to add time slot');
    }
  };

  const deleteTimeSlot = async (slotId) => {
    if (!tutorId) return;
    
    try {
      const dateKey = formatDate(selectedDate);
      const existingSlots = availability[dateKey] || [];
      const updatedSlots = existingSlots.filter(slot => slot.id !== slotId);

      await availabilityApi.updateAvailability(tutorId, dateKey, updatedSlots);
      await loadAvailability();
    } catch (error) {
      console.error('Failed to delete time slot:', error);
      setError('Failed to delete time slot');
    }
  };

  const updateTimeSlot = async (slotId, updatedSlot) => {
    if (!tutorId) return;
    
    try {
      const dateKey = formatDate(selectedDate);
      const existingSlots = availability[dateKey] || [];
      
      // Check for overlap (exclude the slot being edited)
      const otherSlots = existingSlots.filter(slot => slot.id !== slotId);
      const overlapError = checkTimeSlotOverlap(updatedSlot.startTime, updatedSlot.endTime, otherSlots);
      if (overlapError) {
        setError(overlapError);
        return;
      }
      
      const updatedSlots = existingSlots.map(slot => 
        slot.id === slotId ? { ...slot, ...updatedSlot } : slot
      );

      await availabilityApi.updateAvailability(tutorId, dateKey, updatedSlots);
      await loadAvailability();
      setEditingSlot(null);
    } catch (error) {
      console.error('Failed to update time slot:', error);
      setError('Failed to update time slot');
    }
  };

  const weekDates = getWeekDates();
  const selectedDateKey = formatDate(selectedDate);
  const daySlots = availability[selectedDateKey] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading availability...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => { setError(null); loadTutorProfile(); }}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Vælg dag
        </h3>
        
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const dateKey = formatDate(date);
            const slotsCount = availability[dateKey]?.length || 0;
            const bookedCount = availability[dateKey]?.filter(slot => slot.isBooked).length || 0;
            const isSelected = dateKey === selectedDateKey;
            const isToday = dateKey === formatDate(new Date());
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`p-3 rounded-lg text-center transition-colors ${
                  isSelected
                    ? 'bg-green-600 text-white'
                    : isToday
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <div className="text-xs mb-1">
                  {date.toLocaleDateString('da-DK', { weekday: 'short' })}
                </div>
                <div className="font-semibold">
                  {date.getDate()}
                </div>
                {slotsCount > 0 && (
                  <div className="text-xs mt-1">
                    {slotsCount - bookedCount}/{slotsCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {getDayName(selectedDate)}
          </h3>
          <button
            onClick={() => setIsAddingSlot(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tilføj tidsslot
          </button>
        </div>

        {/* Add New Slot Form */}
        {isAddingSlot && (
          <div className="mb-6 p-4 bg-slate-700 rounded-lg">
            <h4 className="text-white font-medium mb-3">Nyt tidsslot</h4>
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Fra</label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                  className="bg-slate-600 text-white rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Til</label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                  className="bg-slate-600 text-white rounded-md px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addTimeSlot}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  Gem
                </button>
                <button
                  onClick={() => {
                    setIsAddingSlot(false);
                    setNewSlot({ startTime: '', endTime: '' });
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Annuller
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Time Slots */}
        <div className="space-y-3">
          {daySlots.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">Ingen tidsslots for denne dag</p>
              <p className="text-slate-500 text-sm">Tilføj nogle tidsslots for at modtage bookinger</p>
            </div>
          ) : (
            daySlots.map((slot) => (
              <div
                key={slot.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  slot.isBooked
                    ? 'bg-blue-500/10 border-blue-500'
                    : 'bg-green-500/10 border-green-500'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    slot.isBooked ? 'bg-blue-400' : 'bg-green-400'
                  }`} />
                  
                  {editingSlot === slot.id ? (
                    <div className="flex gap-2">
                      <input
                        type="time"
                        defaultValue={slot.startTime}
                        className="bg-slate-600 text-white rounded px-2 py-1 text-sm"
                        onChange={(e) => slot.startTime = e.target.value}
                      />
                      <span className="text-slate-300 self-center">-</span>
                      <input
                        type="time"
                        defaultValue={slot.endTime}
                        className="bg-slate-600 text-white rounded px-2 py-1 text-sm"
                        onChange={(e) => slot.endTime = e.target.value}
                      />
                    </div>
                  ) : (
                    <div>
                      <span className="text-white font-medium">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      {slot.isBooked && slot.clientName && (
                        <p className="text-blue-400 text-sm">Booket af {slot.clientName}</p>
                      )}
                    </div>
                  )}
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    slot.isBooked
                      ? 'bg-blue-600 text-blue-100'
                      : 'bg-green-600 text-green-100'
                  }`}>
                    {slot.isBooked ? 'Booket' : 'Ledig'}
                  </span>
                </div>

                <div className="flex gap-2">
                  {editingSlot === slot.id ? (
                    <>
                      <button
                        onClick={() => updateTimeSlot(slot.id, slot)}
                        className="text-green-400 hover:text-green-300 p-1"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingSlot(null)}
                        className="text-gray-400 hover:text-gray-300 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      {!slot.isBooked && (
                        <button
                          onClick={() => setEditingSlot(slot.id)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {!slot.isBooked && (
                        <button
                          onClick={() => deleteTimeSlot(slot.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorAvailability;