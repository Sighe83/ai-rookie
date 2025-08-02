import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Edit, Save, X, Copy, RotateCcw, CalendarDays } from 'lucide-react';
import { availabilityApi, tutorManagementApi } from '../services/api.js';
import { SessionUtils } from '../utils/sessionUtils.js';

const TutorAvailability = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [newSlot, setNewSlot] = useState({ hour: '' });
  const [bulkPattern, setBulkPattern] = useState({ 
    dayOfWeek: '', 
    hour: '', 
    weeks: 4 
  });
  const [copySource, setCopySource] = useState(null);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [tutorId, setTutorId] = useState(null);
  const [error, setError] = useState(null);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Generate hour options for session slots (8:00 - 17:00, excluding lunch)
  const generateHourOptions = () => {
    const availableHours = SessionUtils.getAvailableHours(new Date());
    return availableHours.map(slot => ({
      value: slot.hour.toString(),
      label: slot.displayTime
    }));
  };

  // Validate time slot (always 1 hour, starting on the hour)
  const validateTimeSlot = (hour, existingSlots = []) => {
    const validation = SessionUtils.validateSessionTime(
      SessionUtils.createHourOnlyDateTime(selectedDate, parseInt(hour))
    );
    
    if (!validation.isValid) {
      return validation.error;
    }

    // Check for conflicts with existing slots
    const bookedHours = existingSlots.map(slot => {
      const time = slot.time || slot.startTime;
      return parseInt(time.split(':')[0]);
    });

    if (bookedHours.includes(parseInt(hour))) {
      return 'Dette tidsrum er allerede optaget';
    }

    return null;
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
        // Convert existing time_slots to new format
        const slots = Array.isArray(item.time_slots) ? item.time_slots : [];
        availabilityMap[item.date] = slots.map((slot, index) => {
          // Handle both old format (startTime/endTime) and new format (time)
          const time = slot.time || slot.startTime;
          const hour = time ? parseInt(time.split(':')[0]) : null;
          
          return {
            id: `${item.date}-${index}`,
            time: time,
            hour: hour,
            available: slot.available !== false,
            booked: slot.booked || slot.isBooked || false,
            clientName: slot.clientName,
            duration: SessionUtils.SESSION_DURATION_MINUTES,
            displayTime: hour ? SessionUtils.formatSessionTime(
              SessionUtils.createHourOnlyDateTime(new Date(item.date), hour)
            ).timeRange : time
          };
        });
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
    if (!startTime || !endTime) {
      return 'Start- og sluttid er påkrævet';
    }

    // Validate 15-minute increments
    if (!validateTimeIncrement(startTime) || !validateTimeIncrement(endTime)) {
      return 'Tidspunkter skal være i 15-minutters intervaller (00, 15, 30, 45)';
    }

    const newStart = new Date(`1970-01-01T${startTime}:00`);
    const newEnd = new Date(`1970-01-01T${endTime}:00`);
    
    if (newStart >= newEnd) {
      return 'Sluttid skal være efter starttid';
    }

    // Validate minimum duration (30 minutes)
    if (!validateTimeSlotDuration(startTime, endTime)) {
      return 'Minimum varighed er 30 minutter';
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
    if (!newSlot.hour || !tutorId) return;
    
    try {
      const dateKey = formatDate(selectedDate);
      const existingSlots = availability[dateKey] || [];
      
      // Validate the time slot
      const validationError = validateTimeSlot(newSlot.hour, existingSlots);
      if (validationError) {
        setError(validationError);
        return;
      }
      
      const hour = parseInt(newSlot.hour);
      const timeSlot = {
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: true,
        booked: false
      };
      
      const updatedSlots = [
        ...existingSlots.map(slot => ({
          time: slot.time,
          available: slot.available,
          booked: slot.booked
        })),
        timeSlot
      ].sort((a, b) => a.time.localeCompare(b.time));

      await availabilityApi.updateAvailability(tutorId, dateKey, updatedSlots);
      await loadAvailability();
      
      setNewSlot({ hour: '' });
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

  // Copy availability functions
  const copyAvailabilityToDay = async (sourceDate, targetDate) => {
    if (!tutorId) return;
    
    try {
      const sourceDateKey = formatDate(sourceDate);
      const targetDateKey = formatDate(targetDate);
      const sourceSlots = availability[sourceDateKey] || [];
      
      if (sourceSlots.length === 0) {
        setError('Ingen tidsslots at kopiere fra den valgte dag');
        return;
      }

      // Create clean slots (remove id and booking info)
      const cleanSlots = sourceSlots.map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: false
      }));

      await availabilityApi.updateAvailability(tutorId, targetDateKey, cleanSlots);
      await loadAvailability();
      setShowCopyModal(false);
      setCopySource(null);
    } catch (error) {
      console.error('Failed to copy availability:', error);
      setError('Kunne ikke kopiere tilgængelighed');
    }
  };

  const copyAvailabilityToWeek = async (sourceDate, targetWeekStart) => {
    if (!tutorId) return;
    
    try {
      const sourceDateKey = formatDate(sourceDate);
      const sourceSlots = availability[sourceDateKey] || [];
      
      if (sourceSlots.length === 0) {
        setError('Ingen tidsslots at kopiere fra den valgte dag');
        return;
      }

      const dayOfWeek = sourceDate.getDay();
      const targetDate = new Date(targetWeekStart);
      targetDate.setDate(targetWeekStart.getDate() + dayOfWeek);
      
      await copyAvailabilityToDay(sourceDate, targetDate);
    } catch (error) {
      console.error('Failed to copy availability to week:', error);
      setError('Kunne ikke kopiere tilgængelighed til ugen');
    }
  };

  // Bulk creation function
  const createBulkAvailability = async () => {
    if (!tutorId || !bulkPattern.dayOfWeek || !bulkPattern.startTime || !bulkPattern.endTime) {
      setError('Alle felter er påkrævet for masseoprettelse');
      return;
    }

    // Validate time slot
    const timeError = checkTimeSlotOverlap(bulkPattern.startTime, bulkPattern.endTime, []);
    if (timeError) {
      setError(timeError);
      return;
    }

    try {
      const promises = [];
      const today = new Date();
      
      for (let week = 0; week < bulkPattern.weeks; week++) {
        const targetDate = new Date(today);
        const daysToAdd = (parseInt(bulkPattern.dayOfWeek) - today.getDay() + 7) % 7 + (week * 7);
        targetDate.setDate(today.getDate() + daysToAdd);
        
        const dateKey = formatDate(targetDate);
        const existingSlots = availability[dateKey] || [];
        
        // Check if this would overlap with existing slots
        const overlapError = checkTimeSlotOverlap(bulkPattern.startTime, bulkPattern.endTime, existingSlots);
        if (!overlapError) {
          const newSlot = {
            startTime: bulkPattern.startTime,
            endTime: bulkPattern.endTime,
            isBooked: false
          };
          
          const updatedSlots = [...existingSlots, newSlot]
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          
          promises.push(
            availabilityApi.updateAvailability(tutorId, dateKey, updatedSlots)
          );
        }
      }

      await Promise.all(promises);
      await loadAvailability();
      setShowBulkCreate(false);
      setBulkPattern({ dayOfWeek: '', startTime: '', endTime: '', weeks: 4 });
    } catch (error) {
      console.error('Failed to create bulk availability:', error);
      setError('Kunne ikke oprette massedisponibilitet');
    }
  };

  const weekDates = getWeekDates();
  const selectedDateKey = formatDate(selectedDate);
  const daySlots = availability[selectedDateKey] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
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
      {/* Header with view controls */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Tilgængelighed
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkCreate(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Masseopret
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              {viewMode === 'week' ? 'Månedsvisning' : 'Ugevisning'}
            </button>
          </div>
        </div>
        
        <h4 className="text-sm text-slate-300 mb-4">Vælg dag</h4>
        
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
                className={`group relative p-3 rounded-lg text-center transition-colors ${
                  isSelected
                    ? 'bg-purple-600 text-white'
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
                {slotsCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCopySource(date);
                      setShowCopyModal(true);
                    }}
                    className="absolute top-1 right-1 bg-slate-600 hover:bg-slate-500 p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
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
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tilføj tidsslot
          </button>
        </div>

        {/* Add New Slot Form */}
        {isAddingSlot && (
          <div className="mb-6 p-4 bg-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Nyt tidsslot</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewSlot({ startTime: '09:00', endTime: '12:00' })}
                  className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                >
                  9-12
                </button>
                <button
                  onClick={() => setNewSlot({ startTime: '13:00', endTime: '16:00' })}
                  className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                >
                  13-16
                </button>
                <button
                  onClick={() => setNewSlot({ startTime: '10:00', endTime: '11:00' })}
                  className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                >
                  10-11
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Starttid</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <select
                      value={parseTime(newSlot.startTime).hour}
                      onChange={(e) => {
                        const hour = e.target.value;
                        const minute = parseTime(newSlot.startTime).minute || '00';
                        const startTime = formatTime(hour, minute);
                        setNewSlot(prev => ({ 
                          ...prev, 
                          startTime,
                          endTime: '' // Reset end time when start time changes
                        }));
                      }}
                      className="w-full bg-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Time</option>
                      <optgroup label="Normal arbejdstid (9-17)">
                        {generateHourOptions('business').map(hour => (
                          <option key={hour.value} value={hour.value}>{hour.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Andre timer">
                        {generateHourOptions().filter(hour => {
                          const h = parseInt(hour.value);
                          return h < 9 || h >= 17;
                        }).map(hour => (
                          <option key={hour.value} value={hour.value}>{hour.label}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <span className="text-slate-300 font-medium">:</span>
                  <div className="flex-1">
                    <select
                      value={parseTime(newSlot.startTime).minute}
                      onChange={(e) => {
                        const minute = e.target.value;
                        const hour = parseTime(newSlot.startTime).hour;
                        if (hour) {
                          const startTime = formatTime(hour, minute);
                          setNewSlot(prev => ({ 
                            ...prev, 
                            startTime,
                            endTime: '' // Reset end time when start time changes
                          }));
                        }
                      }}
                      className="w-full bg-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!parseTime(newSlot.startTime).hour}
                    >
                      <option value="">Min</option>
                      {generateMinuteOptions().map(minute => (
                        <option key={minute.value} value={minute.value}>{minute.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Sluttid 
                  {newSlot.startTime && (
                    <span className="text-xs text-slate-400 ml-1">(min. 30 min)</span>
                  )}
                </label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <select
                      value={parseTime(newSlot.endTime).hour}
                      onChange={(e) => {
                        const hour = e.target.value;
                        const minute = parseTime(newSlot.endTime).minute || '00';
                        const endTime = formatTime(hour, minute);
                        setNewSlot(prev => ({ ...prev, endTime }));
                      }}
                      className="w-full bg-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!newSlot.startTime}
                    >
                      <option value="">Time</option>
                      <optgroup label="Normal arbejdstid (9-17)">
                        {generateHourOptions('business').map(hour => (
                          <option key={hour.value} value={hour.value}>{hour.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Andre timer">
                        {generateHourOptions().filter(hour => {
                          const h = parseInt(hour.value);
                          return h < 9 || h >= 17;
                        }).map(hour => (
                          <option key={hour.value} value={hour.value}>{hour.label}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <span className="text-slate-300 font-medium">:</span>
                  <div className="flex-1">
                    <select
                      value={parseTime(newSlot.endTime).minute}
                      onChange={(e) => {
                        const minute = e.target.value;
                        const hour = parseTime(newSlot.endTime).hour;
                        if (hour) {
                          const endTime = formatTime(hour, minute);
                          setNewSlot(prev => ({ ...prev, endTime }));
                        }
                      }}
                      className="w-full bg-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!newSlot.startTime || !parseTime(newSlot.endTime).hour}
                    >
                      <option value="">Min</option>
                      {generateMinuteOptions().map(minute => (
                        <option key={minute.value} value={minute.value}>{minute.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {newSlot.startTime && newSlot.endTime && (
                  <div className="mt-1 text-xs text-slate-400">
                    Varighed: {(() => {
                      const [startHour, startMinute] = newSlot.startTime.split(':').map(Number);
                      const [endHour, endMinute] = newSlot.endTime.split(':').map(Number);
                      const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
                      const hours = Math.floor(duration / 60);
                      const minutes = duration % 60;
                      return hours > 0 
                        ? `${hours} time${hours > 1 ? 'r' : ''}${minutes > 0 ? ` og ${minutes} min` : ''}` 
                        : `${minutes} minutter`;
                    })()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
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
              <button
                onClick={addTimeSlot}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Gem
              </button>
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
                    : 'bg-purple-500/10 border-purple-500'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    slot.isBooked ? 'bg-blue-400' : 'bg-purple-400'
                  }`} />
                  
                  {editingSlot === slot.id ? (
                    <div className="flex gap-1 items-center">
                      <select
                        defaultValue={parseTime(slot.startTime).hour}
                        className="bg-slate-600 text-white rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500"
                        onChange={(e) => {
                          const hour = e.target.value;
                          const minute = parseTime(slot.startTime).minute;
                          slot.startTime = formatTime(hour, minute);
                        }}
                      >
                        <optgroup label="Normal">
                          {generateHourOptions('business').map(hour => (
                            <option key={hour.value} value={hour.value}>{hour.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Andre">
                          {generateHourOptions().filter(hour => {
                            const h = parseInt(hour.value);
                            return h < 9 || h >= 17;
                          }).map(hour => (
                            <option key={hour.value} value={hour.value}>{hour.label}</option>
                          ))}
                        </optgroup>
                      </select>
                      <span className="text-slate-300">:</span>
                      <select
                        defaultValue={parseTime(slot.startTime).minute}
                        className="bg-slate-600 text-white rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500"
                        onChange={(e) => {
                          const minute = e.target.value;
                          const hour = parseTime(slot.startTime).hour;
                          slot.startTime = formatTime(hour, minute);
                        }}
                      >
                        {generateMinuteOptions().map(minute => (
                          <option key={minute.value} value={minute.value}>{minute.label}</option>
                        ))}
                      </select>
                      <span className="text-slate-300 mx-1">-</span>
                      <select
                        defaultValue={parseTime(slot.endTime).hour}
                        className="bg-slate-600 text-white rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500"
                        onChange={(e) => {
                          const hour = e.target.value;
                          const minute = parseTime(slot.endTime).minute;
                          slot.endTime = formatTime(hour, minute);
                        }}
                      >
                        <optgroup label="Normal">
                          {generateHourOptions('business').map(hour => (
                            <option key={hour.value} value={hour.value}>{hour.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Andre">
                          {generateHourOptions().filter(hour => {
                            const h = parseInt(hour.value);
                            return h < 9 || h >= 17;
                          }).map(hour => (
                            <option key={hour.value} value={hour.value}>{hour.label}</option>
                          ))}
                        </optgroup>
                      </select>
                      <span className="text-slate-300">:</span>
                      <select
                        defaultValue={parseTime(slot.endTime).minute}
                        className="bg-slate-600 text-white rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500"
                        onChange={(e) => {
                          const minute = e.target.value;
                          const hour = parseTime(slot.endTime).hour;
                          slot.endTime = formatTime(hour, minute);
                        }}
                      >
                        {generateMinuteOptions().map(minute => (
                          <option key={minute.value} value={minute.value}>{minute.label}</option>
                        ))}
                      </select>
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
                      : 'bg-purple-600 text-purple-100'
                  }`}>
                    {slot.isBooked ? 'Booket' : 'Ledig'}
                  </span>
                </div>

                <div className="flex gap-2">
                  {editingSlot === slot.id ? (
                    <>
                      <button
                        onClick={() => updateTimeSlot(slot.id, slot)}
                        className="text-purple-400 hover:text-purple-300 p-1"
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
                          className="text-purple-400 hover:text-purple-300 p-1"
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

      {/* Bulk Create Modal */}
      {showBulkCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Masseopret tilgængelighed</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Ugedag</label>
                <select
                  value={bulkPattern.dayOfWeek}
                  onChange={(e) => setBulkPattern(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                  className="w-full bg-slate-600 text-white rounded-md px-3 py-2"
                >
                  <option value="">Vælg ugedag</option>
                  <option value="1">Mandag</option>
                  <option value="2">Tirsdag</option>
                  <option value="3">Onsdag</option>
                  <option value="4">Torsdag</option>
                  <option value="5">Fredag</option>
                  <option value="6">Lørdag</option>
                  <option value="0">Søndag</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Starttid</label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <select
                        value={parseTime(bulkPattern.startTime).hour}
                        onChange={(e) => {
                          const hour = e.target.value;
                          const minute = parseTime(bulkPattern.startTime).minute || '00';
                          const startTime = formatTime(hour, minute);
                          setBulkPattern(prev => ({ 
                            ...prev, 
                            startTime,
                            endTime: '' // Reset end time when start time changes
                          }));
                        }}
                        className="w-full bg-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Time</option>
                        <optgroup label="Normal arbejdstid (9-17)">
                          {generateHourOptions('business').map(hour => (
                            <option key={hour.value} value={hour.value}>{hour.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Andre timer">
                          {generateHourOptions().filter(hour => {
                            const h = parseInt(hour.value);
                            return h < 9 || h >= 17;
                          }).map(hour => (
                            <option key={hour.value} value={hour.value}>{hour.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <span className="text-slate-300 font-medium">:</span>
                    <div className="flex-1">
                      <select
                        value={parseTime(bulkPattern.startTime).minute}
                        onChange={(e) => {
                          const minute = e.target.value;
                          const hour = parseTime(bulkPattern.startTime).hour;
                          if (hour) {
                            const startTime = formatTime(hour, minute);
                            setBulkPattern(prev => ({ 
                              ...prev, 
                              startTime,
                              endTime: '' // Reset end time when start time changes
                            }));
                          }
                        }}
                        className="w-full bg-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!parseTime(bulkPattern.startTime).hour}
                      >
                        <option value="">Min</option>
                        {generateMinuteOptions().map(minute => (
                          <option key={minute.value} value={minute.value}>{minute.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Sluttid
                    {bulkPattern.startTime && (
                      <span className="text-xs text-slate-400 ml-1">(min. 30 min)</span>
                    )}
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <select
                        value={parseTime(bulkPattern.endTime).hour}
                        onChange={(e) => {
                          const hour = e.target.value;
                          const minute = parseTime(bulkPattern.endTime).minute || '00';
                          const endTime = formatTime(hour, minute);
                          setBulkPattern(prev => ({ ...prev, endTime }));
                        }}
                        className="w-full bg-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!bulkPattern.startTime}
                      >
                        <option value="">Time</option>
                        <optgroup label="Normal arbejdstid (9-17)">
                          {generateHourOptions('business').map(hour => (
                            <option key={hour.value} value={hour.value}>{hour.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Andre timer">
                          {generateHourOptions().filter(hour => {
                            const h = parseInt(hour.value);
                            return h < 9 || h >= 17;
                          }).map(hour => (
                            <option key={hour.value} value={hour.value}>{hour.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <span className="text-slate-300 font-medium">:</span>
                    <div className="flex-1">
                      <select
                        value={parseTime(bulkPattern.endTime).minute}
                        onChange={(e) => {
                          const minute = e.target.value;
                          const hour = parseTime(bulkPattern.endTime).hour;
                          if (hour) {
                            const endTime = formatTime(hour, minute);
                            setBulkPattern(prev => ({ ...prev, endTime }));
                          }
                        }}
                        className="w-full bg-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!bulkPattern.startTime || !parseTime(bulkPattern.endTime).hour}
                      >
                        <option value="">Min</option>
                        {generateMinuteOptions().map(minute => (
                          <option key={minute.value} value={minute.value}>{minute.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {bulkPattern.startTime && bulkPattern.endTime && (
                    <div className="mt-1 text-xs text-slate-400">
                      Varighed: {(() => {
                        const [startHour, startMinute] = bulkPattern.startTime.split(':').map(Number);
                        const [endHour, endMinute] = bulkPattern.endTime.split(':').map(Number);
                        const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
                        const hours = Math.floor(duration / 60);
                        const minutes = duration % 60;
                        return hours > 0 
                          ? `${hours} time${hours > 1 ? 'r' : ''}${minutes > 0 ? ` og ${minutes} min` : ''}` 
                          : `${minutes} minutter`;
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Antal uger</label>
                <select
                  value={bulkPattern.weeks}
                  onChange={(e) => setBulkPattern(prev => ({ ...prev, weeks: parseInt(e.target.value) }))}
                  className="w-full bg-slate-600 text-white rounded-md px-3 py-2"
                >
                  <option value={1}>1 uge</option>
                  <option value={2}>2 uger</option>
                  <option value={4}>4 uger</option>
                  <option value={8}>8 uger</option>
                  <option value={12}>12 uger</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createBulkAvailability}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Opret
              </button>
              <button
                onClick={() => {
                  setShowBulkCreate(false);
                  setBulkPattern({ dayOfWeek: '', startTime: '', endTime: '', weeks: 4 });
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Annuller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Modal */}
      {showCopyModal && copySource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Kopier tilgængelighed fra {copySource.toLocaleDateString('da-DK')}
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => copyAvailabilityToDay(copySource, selectedDate)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-left"
              >
                Kopier til valgte dag ({selectedDate.toLocaleDateString('da-DK')})
              </button>
              <button
                onClick={() => {
                  const nextWeek = new Date(selectedDate);
                  nextWeek.setDate(selectedDate.getDate() + 7);
                  copyAvailabilityToWeek(copySource, nextWeek);
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-left"
              >
                Kopier til næste uge (samme ugedag)
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCopyModal(false);
                  setCopySource(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Annuller
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorAvailability;