import React, { useState, useEffect } from 'react';
import { Clock, Save, RotateCcw, ArrowLeft, ArrowRight, CalendarCheck, CheckCircle } from 'lucide-react';
import { availabilityApi, tutorManagementApi } from '../services/api.js';

const WeeklyAvailabilityManager = () => {
  // Generate time slots using SessionUtils business rules (8:00-17:00, excluding lunch)
  const generateValidTimeSlots = () => {
    const slots = [];
    // Use SessionUtils for consistent business rules
    for (let hour = 8; hour <= 17; hour++) {
      if (hour === 12) continue; // Skip lunch hour (12:00-13:00)
      const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
      slots.push(timeSlot);
    }
    return slots;
  };

  const timeSlots = generateValidTimeSlots();
  const dayNames = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const [currentWeekView, setCurrentWeekView] = useState(0);
  const [weeklyTemplates, setWeeklyTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tutorId, setTutorId] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isSelecting, setIsSelecting] = useState(true); // true = select, false = deselect

  // Initialize empty template
  const createEmptyTemplate = () => ({
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
  });

  // Check if a date is in the past - prevents scheduling backward in time
  const isDateInPast = (weekOffset, dayIndex) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentWeekStart = getWeekStart(weekOffset);
    const checkDate = new Date(currentWeekStart);
    checkDate.setDate(checkDate.getDate() + dayIndex);
    return checkDate < today;
  };

  const getWeekStart = (weekOffset) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days to subtract to get to Monday
    // For Sunday (0): go back 6 days to previous Monday
    // For Monday (1): go back 0 days  
    // For Tuesday (2): go back 1 day
    // etc.
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(today.getDate() - daysToSubtract + (weekOffset * 7));
    return startOfWeek;
  };

  useEffect(() => {
    loadTutorProfile();
  }, []);

  useEffect(() => {
    if (tutorId) {
      loadExistingAvailability();
    }
  }, [tutorId, currentWeekView]);

  const loadTutorProfile = async () => {
    try {
      const response = await tutorManagementApi.getProfile();
      if (!response.data || !response.data.id) {
        throw new Error('Tutor ID not found in profile response.');
      }
      setTutorId(response.data.id);
    } catch (error) {
      console.error('Failed to load tutor profile:', error);
      setError('Kunne ikke indlæse din tutor-profil. Sørg for at du er logget korrekt ind.');
    }
  };

  const loadExistingAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const weekStart = getWeekStart(currentWeekView);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const response = await availabilityApi.getAvailability(
        tutorId, 
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      );

      if (response.data && response.data.length > 0) {
        const template = createEmptyTemplate();
        console.log('Loading availability data:', response.data);
        
        response.data.forEach(slot => {
          console.log('Processing slot:', slot);
          
          // Ensure required fields exist
          if (!slot.date) {
            console.warn('Skipping slot with missing date:', slot);
            return;
          }
          
          const date = new Date(slot.date);
          const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
          const dayKey = dayKeys[dayIndex];
          
          // Handle different data structures
          if (slot.time_slots && Array.isArray(slot.time_slots)) {
            // New structure with time_slots array
            slot.time_slots.forEach(timeSlot => {
              if (timeSlot.time && timeSlot.available) {
                const hour = parseInt(timeSlot.time.split(':')[0]);
                const timeSlotStr = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
                if (!template[dayKey].includes(timeSlotStr)) {
                  template[dayKey].push(timeSlotStr);
                }
              }
            });
          } else if (slot.start_time && slot.end_time) {
            // Old structure with start_time/end_time
            const startTime = slot.start_time.includes(':') ? slot.start_time.slice(0, 5) : slot.start_time;
            const endTime = slot.end_time.includes(':') ? slot.end_time.slice(0, 5) : slot.end_time;
            const timeSlot = `${startTime}-${endTime}`;
            
            if (!template[dayKey].includes(timeSlot)) {
              template[dayKey].push(timeSlot);
            }
          }
        });

        setWeeklyTemplates(prev => ({
          ...prev,
          [currentWeekView]: template
        }));
        setSavedTemplates(prev => ({
          ...prev,
          [currentWeekView]: template
        }));
      } else {
        // Initialize empty template if no data
        if (!weeklyTemplates[currentWeekView]) {
          const emptyTemplate = createEmptyTemplate();
          setWeeklyTemplates(prev => ({
            ...prev,
            [currentWeekView]: emptyTemplate
          }));
          setSavedTemplates(prev => ({
            ...prev,
            [currentWeekView]: emptyTemplate
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
      setError('Kunne ikke indlæse tilgængelighed');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTemplate = () => {
    return weeklyTemplates[currentWeekView] || createEmptyTemplate();
  };

  const getSavedTemplate = () => {
    return savedTemplates[currentWeekView] || createEmptyTemplate();
  };


  const clearWeek = () => {
    setWeeklyTemplates(prev => {
      const currentTemplate = { ...getCurrentTemplate() };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Only clear future slots
      dayKeys.forEach((dayKey, dayIndex) => {
        const dayDate = getDateForDay(currentWeekView, dayIndex);
        if (dayDate >= today) {
          currentTemplate[dayKey] = [];
        }
      });
      
      return {
        ...prev,
        [currentWeekView]: currentTemplate
      };
    });
  };

  // Helper functions for interval selection
  const getHourFromTimeSlot = (timeSlot) => {
    return parseInt(timeSlot.split('-')[0].split(':')[0]);
  };

  const createTimeSlotFromHour = (hour) => {
    return `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
  };

  const handleIntervalStart = (dayKey, timeSlot, event) => {
    event.preventDefault();
    
    const hour = getHourFromTimeSlot(timeSlot);
    const currentTemplate = getCurrentTemplate();
    const isCurrentlySelected = currentTemplate[dayKey]?.includes(timeSlot) || false;
    
    setIsDragging(true);
    setDragStart({ dayKey, hour });
    setDragEnd({ dayKey, hour });
    setIsSelecting(!isCurrentlySelected); // If currently selected, we'll deselect; if not, we'll select
  };

  const handleIntervalMove = (dayKey, timeSlot) => {
    if (!isDragging || !dragStart) return;
    
    // Only allow dragging within the same day
    if (dayKey !== dragStart.dayKey) return;
    
    const hour = getHourFromTimeSlot(timeSlot);
    setDragEnd({ dayKey, hour });
  };

  const handleIntervalEnd = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const { dayKey } = dragStart;
    const startHour = Math.min(dragStart.hour, dragEnd.hour);
    const endHour = Math.max(dragStart.hour, dragEnd.hour);
    
    setWeeklyTemplates(prev => {
      const currentTemplate = { ...getCurrentTemplate() };
      const daySlots = [...(currentTemplate[dayKey] || [])];
      
      // Create array of slots in the selected range
      const rangeSlotsToChange = [];
      for (let hour = startHour; hour <= endHour; hour++) {
        const slot = createTimeSlotFromHour(hour);
        rangeSlotsToChange.push(slot);
      }
      
      if (isSelecting) {
        // Add slots that aren't already selected
        rangeSlotsToChange.forEach(slot => {
          if (!daySlots.includes(slot)) {
            daySlots.push(slot);
          }
        });
        currentTemplate[dayKey] = daySlots.sort();
      } else {
        // Remove slots in the range
        currentTemplate[dayKey] = daySlots.filter(slot => !rangeSlotsToChange.includes(slot));
      }
      
      return {
        ...prev,
        [currentWeekView]: currentTemplate
      };
    });

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const isInDragRange = (dayKey, timeSlot) => {
    if (!isDragging || !dragStart || !dragEnd || dayKey !== dragStart.dayKey) return false;
    
    const hour = getHourFromTimeSlot(timeSlot);
    const startHour = Math.min(dragStart.hour, dragEnd.hour);
    const endHour = Math.max(dragStart.hour, dragEnd.hour);
    
    return hour >= startHour && hour <= endHour;
  };

  const getWeekLabel = (weekOffset) => {
    const weekStart = getWeekStart(weekOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return `${weekStart.toLocaleDateString('da-DK')} - ${weekEnd.toLocaleDateString('da-DK')}`;
  };

  const getDateForDay = (weekOffset, dayIndex) => {
    const weekStart = getWeekStart(weekOffset);
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + dayIndex);
    return dayDate;
  };

  const saveTemplates = async () => {
    if (!tutorId) {
      setError('Tutor ID ikke fundet');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const currentTemplate = getCurrentTemplate();
      const weekStart = getWeekStart(currentWeekView);

      // Send the template structure directly to updateWeeklyAvailability
      await availabilityApi.updateWeeklyAvailability(
        tutorId, 
        weekStart.toISOString().split('T')[0], 
        currentTemplate
      );
      
      // Update saved template to reflect what was just saved
      setSavedTemplates(prev => ({
        ...prev,
        [currentWeekView]: currentTemplate
      }));
      
      setSuccess('Tilgængelighed gemt!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Failed to save availability:', error);
      setError('Kunne ikke gemme tilgængelighed');
    } finally {
      setSaving(false);
    }
  };

  // Calculate stats for future/available slots only (using saved data)
  const getFutureAvailableStats = () => {
    const savedTemplate = getSavedTemplate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let totalFutureSlots = 0;
    let activeFutureDays = 0;
    
    dayKeys.forEach((dayKey, dayIndex) => {
      const dayDate = getDateForDay(currentWeekView, dayIndex);
      if (dayDate >= today) {
        const daySlots = savedTemplate[dayKey] || [];
        if (daySlots.length > 0) {
          totalFutureSlots += daySlots.length;
          activeFutureDays += 1;
        }
      }
    });
    
    return { totalSlots: totalFutureSlots, activeDays: activeFutureDays };
  };
  
  const stats = getFutureAvailableStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Indlæser tilgængelighed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => { setError(null); loadExistingAvailability(); }}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Prøv igen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 text-center">
          <p className="text-green-400 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </p>
        </div>
      )}

      {/* Week Navigation */}
      <div className="border-2 border-slate-700 bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-purple-400" />
            Planlæg tilgængelighed
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeekView(currentWeekView - 1)}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              disabled={currentWeekView <= 0}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-300 font-medium px-4">
              {getWeekLabel(currentWeekView)}
            </span>
            <button
              onClick={() => setCurrentWeekView(currentWeekView + 1)}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>


        {/* Desktop Interval Selection View */}
          <div 
            className="select-none"
            onMouseUp={handleIntervalEnd}
            onMouseLeave={handleIntervalEnd}
          >
            {/* Header */}
            <div className="grid grid-cols-8 gap-3 mb-6">
              <div className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tid
              </div>
              {dayNames.map((day, index) => {
                const isPastDay = isDateInPast(currentWeekView, index);
                const dayKey = dayKeys[index];
                // Only count future saved slots
                const dayDate = getDateForDay(currentWeekView, index);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const savedSlots = dayDate >= today ? (getSavedTemplate()[dayKey]?.length || 0) : 0;
                
                return (
                  <div 
                    key={day} 
                    className={`text-slate-300 text-center border-2 border-slate-700 rounded-xl p-3 ${
                      isPastDay ? 'opacity-50 bg-slate-800' : 'bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-white">{day}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {getDateForDay(currentWeekView, index).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                    </div>
                    {savedSlots > 0 && (
                      <div className="text-xs text-purple-400 mt-2 bg-purple-500/10 px-2 py-1 rounded-full">
                        {savedSlots} ledige tider
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mb-4 p-4 bg-slate-700/30 border border-slate-600 rounded-xl">
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-600 rounded border border-purple-500"></div>
                  <span className="text-slate-300">Gemt tilgængelighed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded border border-blue-500"></div>
                  <span className="text-slate-300">Nye ændringer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600/50 rounded border border-red-500"></div>
                  <span className="text-slate-300">Fjernet (ikke gemt)</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-blue-300 text-sm flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                <strong>Sådan markerer du tidsintervaller:</strong> Træk ned/op for at markere flere timer i træk. Klik og træk for at vælge/fravælge intervaller.
              </p>
            </div>

            {/* Time slots with interval selection */}
            <div className="grid grid-cols-8 gap-3">
              {/* Time labels column */}
              <div className="space-y-1">
                {timeSlots.map((timeSlot) => (
                  <div key={timeSlot} className="h-12 flex items-center text-slate-400 text-sm font-medium px-2">
                    {timeSlot}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {dayKeys.map((dayKey, dayIndex) => {
                const isPastDay = isDateInPast(currentWeekView, dayIndex);
                
                return (
                  <div key={dayKey} className="space-y-1">
                    {timeSlots.map((timeSlot) => {
                      const isSelected = getCurrentTemplate()[dayKey]?.includes(timeSlot) || false;
                      const isSaved = getSavedTemplate()[dayKey]?.includes(timeSlot) || false;
                      const isPastSlot = isDateInPast(currentWeekView, dayIndex);
                      const inDragRange = isInDragRange(dayKey, timeSlot);
                      
                      // Determine slot state for visual distinction
                      const isNewlySelected = isSelected && !isSaved; // Selected but not saved
                      const isNewlyDeselected = !isSelected && isSaved; // Was saved but now deselected
                      
                      return (
                        <div
                          key={timeSlot}
                          className={`h-12 rounded-lg border-2 transition-all cursor-pointer ${
                            isPastSlot
                              ? 'bg-slate-700/30 border-slate-600 cursor-not-allowed opacity-50'
                              : inDragRange && isSelecting
                                ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/25'
                                : inDragRange && !isSelecting
                                  ? 'bg-slate-600 border-slate-500'
                                  : isNewlySelected
                                    ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/25' // New selections in blue
                                    : isNewlyDeselected
                                      ? 'bg-red-600/50 border-red-500 shadow-lg shadow-red-500/25' // Deselected in red
                                      : isSelected && isSaved
                                        ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/25' // Saved selections in purple
                                        : 'bg-slate-800 border-slate-600 hover:border-slate-500 hover:bg-slate-700'
                          }`}
                          onMouseDown={(e) => !isPastSlot && handleIntervalStart(dayKey, timeSlot, e)}
                          onMouseEnter={() => !isPastSlot && handleIntervalMove(dayKey, timeSlot)}
                          title={`${timeSlot} - ${isPastSlot ? 'Fortid' : isSelected ? 'Tilgængelig' : 'Ikke tilgængelig'}`}
                        >
                          {(isSelected || inDragRange || isNewlyDeselected) && !isPastSlot && (
                            <div className="h-full flex items-center justify-center text-white text-xs font-bold">
                              {isNewlySelected ? 'NY' : isNewlyDeselected ? 'FJERNET' : 'LEDIG'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

        {/* Summary and Actions */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-sm text-slate-400">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span>
                  <span className="font-medium text-slate-300">{stats.totalSlots}</span> ledige tider
                </span>
                <span className="hidden sm:inline text-slate-500">•</span>
                <span>
                  <span className="font-medium text-slate-300">{stats.activeDays}</span> dage fremover
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={clearWeek}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Nulstil fremtidige
              </button>
              
              <button
                onClick={saveTemplates}
                disabled={saving}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Gemmer...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Gem tilgængelighed
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview of configured weeks */}
      {Object.keys(weeklyTemplates).length > 1 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Alle konfigurerede uger</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(weeklyTemplates).map(([weekIndex, template]) => {
              const weekSlots = Object.values(template).flat().length;
              const weekDays = Object.values(template).filter(slots => slots.length > 0).length;
              
              return (
                <div
                  key={weekIndex}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    parseInt(weekIndex) === currentWeekView
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-700'
                  }`}
                  onClick={() => setCurrentWeekView(parseInt(weekIndex))}
                >
                  <div className="font-medium text-white mb-2">
                    {getWeekLabel(parseInt(weekIndex))}
                  </div>
                  <div className="text-sm text-slate-400">
                    <div>{weekSlots} timeslots</div>
                    <div>{weekDays} aktive dage</div>
                  </div>
                  {parseInt(weekIndex) === currentWeekView && (
                    <div className="text-xs text-purple-400 mt-2 font-medium">
                      Redigerer nu
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyAvailabilityManager;
