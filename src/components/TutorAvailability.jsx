import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Save, X, Copy, RotateCcw, CalendarDays } from 'lucide-react';
import { availabilityApi, tutorManagementApi } from '../services/api.js';
import { SessionUtils } from '../utils/sessionUtils.js';
import { useToast } from './design-system';

const TutorAvailability = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  // Removed editing functionality to simplify code
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
  
  const { success, error: showError } = useToast();

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Generate hour options for session slots (8:00 - 17:00)
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
      const errorMessage = 'Kunne ikke indlæse tutor profil';
      console.error('Failed to load tutor profile:', error);
      setError(errorMessage);
      showError(errorMessage);
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
            status: slot.status || 'AVAILABLE', // Use new status field
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
      const errorMessage = 'Kunne ikke indlæse tilgængelighed';
      console.error('Failed to load availability:', error);
      setError(errorMessage);
      showError(errorMessage);
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
        showError(validationError);
        return;
      }
      
      const hour = parseInt(newSlot.hour);
      const timeSlot = {
        time: `${hour.toString().padStart(2, '0')}:00`,
        status: 'AVAILABLE'
      };
      
      const updatedSlots = [
        ...existingSlots.map(slot => ({
          time: slot.time,
          status: slot.status || 'AVAILABLE'
        })),
        timeSlot
      ].sort((a, b) => a.time.localeCompare(b.time));

      await availabilityApi.updateAvailability(tutorId, dateKey, updatedSlots);
      await loadAvailability();
      
      setNewSlot({ hour: '' });
      setIsAddingSlot(false);
      success('Tidslot tilføjet succesfuldt');
    } catch (error) {
      const errorMessage = 'Kunne ikke tilføje tidslot';
      console.error('Failed to add time slot:', error);
      setError(errorMessage);
      showError(errorMessage);
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
      success('Tidslot slettet succesfuldt');
    } catch (error) {
      const errorMessage = 'Kunne ikke slette tidslot';
      console.error('Failed to delete time slot:', error);
      setError(errorMessage);
      showError(errorMessage);
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
        showError(overlapError);
        return;
      }
      
      const updatedSlots = existingSlots.map(slot => 
        slot.id === slotId ? { ...slot, ...updatedSlot } : slot
      );

      await availabilityApi.updateAvailability(tutorId, dateKey, updatedSlots);
      await loadAvailability();
      setEditingSlot(null);
      success('Tidslot opdateret succesfuldt');
    } catch (error) {
      const errorMessage = 'Kunne ikke opdatere tidslot';
      console.error('Failed to update time slot:', error);
      setError(errorMessage);
      showError(errorMessage);
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
        const errorMessage = 'Ingen tidsslots at kopiere fra den valgte dag';
        setError(errorMessage);
        showError(errorMessage);
        return;
      }

      // Create clean slots (remove id and booking info)
      const cleanSlots = sourceSlots.map(slot => ({
        time: slot.time,
        status: 'AVAILABLE'
      }));

      await availabilityApi.updateAvailability(tutorId, targetDateKey, cleanSlots);
      await loadAvailability();
      setShowCopyModal(false);
      setCopySource(null);
      success('Tilgængelighed kopieret succesfuldt');
    } catch (error) {
      const errorMessage = 'Kunne ikke kopiere tilgængelighed';
      console.error('Failed to copy availability:', error);
      setError(errorMessage);
      showError(errorMessage);
    }
  };

  const copyAvailabilityToWeek = async (sourceDate, targetWeekStart) => {
    if (!tutorId) return;
    
    try {
      const sourceDateKey = formatDate(sourceDate);
      const sourceSlots = availability[sourceDateKey] || [];
      
      if (sourceSlots.length === 0) {
        const errorMessage = 'Ingen tidsslots at kopiere fra den valgte dag';
        setError(errorMessage);
        showError(errorMessage);
        return;
      }

      const dayOfWeek = sourceDate.getDay();
      const targetDate = new Date(targetWeekStart);
      targetDate.setDate(targetWeekStart.getDate() + dayOfWeek);
      
      await copyAvailabilityToDay(sourceDate, targetDate);
    } catch (error) {
      const errorMessage = 'Kunne ikke kopiere tilgængelighed til ugen';
      console.error('Failed to copy availability to week:', error);
      setError(errorMessage);
      showError(errorMessage);
    }
  };

  // Bulk creation function
  const createBulkAvailability = async () => {
    if (!tutorId || !bulkPattern.dayOfWeek || !bulkPattern.hour) {
      const errorMessage = 'Alle felter er påkrævet for masseoprettelse';
      setError(errorMessage);
      showError(errorMessage);
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
        
        // Create time slot based on hour pattern (similar to addTimeSlot)
        const hour = parseInt(bulkPattern.hour);
        const timeSlot = {
          time: `${hour.toString().padStart(2, '0')}:00`,
          status: 'AVAILABLE'
        };
        
        // Check if this hour already exists
        const existsAlready = existingSlots.some(slot => slot.time === timeSlot.time);
        if (!existsAlready) {
          const updatedSlots = [...existingSlots, timeSlot]
            .sort((a, b) => a.time.localeCompare(b.time));
          
          promises.push(
            availabilityApi.updateAvailability(tutorId, dateKey, updatedSlots)
          );
        }
      }

      await Promise.all(promises);
      await loadAvailability();
      setShowBulkCreate(false);
      setBulkPattern({ dayOfWeek: '', hour: '', weeks: 4 });
      success(`Masseoprettelse fuldført! ${promises.length} tidslots oprettet.`);
    } catch (error) {
      const errorMessage = 'Kunne ikke oprette massedisponibilitet';
      console.error('Failed to create bulk availability:', error);
      setError(errorMessage);
      showError(errorMessage);
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
      <div className="text-center py-12">
        <button 
          onClick={() => { setError(null); loadTutorProfile(); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
        >
          Prøv igen
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
            const bookedCount = availability[dateKey]?.filter(slot => slot.status === 'BOOKED' || slot.status === 'PENDING').length || 0;
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
                  onClick={() => setNewSlot({ hour: '9' })}
                  className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                >
                  9:00
                </button>
                <button
                  onClick={() => setNewSlot({ hour: '13' })}
                  className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                >
                  13:00
                </button>
                <button
                  onClick={() => setNewSlot({ hour: '10' })}
                  className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                >
                  10:00
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Vælg starttidspunkt (1 times slot)</label>
              <select
                value={newSlot.hour || ''}
                onChange={(e) => setNewSlot({ hour: e.target.value })}
                className="w-full bg-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Vælg tidspunkt</option>
                <optgroup label="Formiddag">
                  {[8, 9, 10, 11].map(hour => (
                    <option key={hour} value={hour.toString()}>{hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00</option>
                  ))}
                </optgroup>
                <optgroup label="Eftermiddag">
                  {[13, 14, 15, 16, 17].map(hour => (
                    <option key={hour} value={hour.toString()}>{hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setIsAddingSlot(false);
                  setNewSlot({ hour: '' });
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
                  (slot.status === 'BOOKED' || slot.status === 'PENDING')
                    ? 'bg-blue-500/10 border-blue-500'
                    : 'bg-purple-500/10 border-purple-500'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    (slot.status === 'BOOKED' || slot.status === 'PENDING') ? 'bg-blue-400' : 'bg-purple-400'
                  }`} />
                  
                  {/* Editing disabled for now */}
                  {false ? null : (
                    <div>
                      <span className="text-white font-medium">
                        {slot.displayTime || slot.time}
                      </span>
                      {(slot.status === 'BOOKED' || slot.status === 'PENDING') && slot.clientName && (
                        <p className="text-blue-400 text-sm">Booket af {slot.clientName}</p>
                      )}
                    </div>
                  )}
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (slot.status === 'BOOKED')
                      ? 'bg-blue-600 text-blue-100'
                      : (slot.status === 'PENDING')
                      ? 'bg-orange-600 text-orange-100'
                      : 'bg-purple-600 text-purple-100'
                  }`}>
                    {slot.status === 'BOOKED' ? 'Booket' : slot.status === 'PENDING' ? 'Afventer' : 'Ledig'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => deleteTimeSlot(slot.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    disabled={slot.status === 'BOOKED' || slot.status === 'PENDING'}
                    title={(slot.status === 'BOOKED' || slot.status === 'PENDING') ? 'Kan ikke slette booket tid' : 'Slet tidsslot'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              <div>
                <label className="block text-sm text-slate-300 mb-2">Tidspunkt (1 times slot)</label>
                <select
                  value={bulkPattern.hour || ''}
                  onChange={(e) => setBulkPattern(prev => ({ ...prev, hour: e.target.value }))}
                  className="w-full bg-slate-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Vælg tidspunkt</option>
                  <optgroup label="Formiddag">
                    {[8, 9, 10, 11].map(hour => (
                      <option key={hour} value={hour.toString()}>{hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00</option>
                    ))}
                  </optgroup>
                  <optgroup label="Eftermiddag">
                    {[13, 14, 15, 16, 17].map(hour => (
                      <option key={hour} value={hour.toString()}>{hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00</option>
                    ))}
                  </optgroup>
                </select>
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
                  setBulkPattern({ dayOfWeek: '', hour: '', weeks: 4 });
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