import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, BookOpen, Clock, DollarSign } from 'lucide-react';
import { Button, Card, useToast } from './design-system';
import { tutorManagementApi, sessionsApi } from '../services/api.js';

const SessionManager = () => {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  const [editingSessions, setEditingSessions] = useState({});
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    price: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tutorManagementApi.getProfile();
      
      const tutorProfile = {};
      
      setProfile(tutorProfile);
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      const errorMessage = 'Kunne ikke indlæse sessioner';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSave = async (sessionId, updatedSession) => {
    try {
      await sessionsApi.updateSession(sessionId, updatedSession);
      await loadData(); // Reload to get updated data
      setEditingSessions(prev => ({ ...prev, [sessionId]: false }));
      showSuccessToast('Session opdateret succesfuldt');
    } catch (error) {
      console.error('Failed to save session:', error);
      const errorMessage = 'Kunne ikke gemme session';
      setError(errorMessage);
      showErrorToast(errorMessage);
    }
  };

  const handleAddSession = async () => {
    if (!newSession.title || !newSession.description || !newSession.price) return;
    
    try {
      const sessionData = {
        title: newSession.title,
        description: newSession.description,
        duration: 60, // Always 1 hour
        price: parseFloat(newSession.price)
      };
      
      await sessionsApi.createSession(sessionData);
      await loadData(); // Reload to get updated data
      setNewSession({ title: '', description: '', price: '' });
      setIsAddingSession(false);
      showSuccessToast('Session tilføjet succesfuldt');
    } catch (error) {
      console.error('Failed to add session:', error);
      const errorMessage = 'Kunne ikke tilføje session';
      setError(errorMessage);
      showErrorToast(errorMessage);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      console.log('🗑️ Attempting to delete session:', sessionId);
      
      console.log('🔄 Calling deleteSession API...');
      const result = await sessionsApi.deleteSession(sessionId);
      console.log('✅ Delete API result:', result);
      
      console.log('🔄 Reloading data...');
      await loadData(); // Reload to get updated data
      console.log('✅ Session deletion completed successfully');
      showSuccessToast('Session slettet succesfuldt');
      
    } catch (error) {
      console.error('❌ Failed to delete session:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      const errorMessage = `Kunne ikke slette session: ${error.message || 'Ukendt fejl'}`;
      setError(errorMessage);
      showErrorToast(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Indlæser sessioner...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Button 
          onClick={() => { setError(null); loadData(); }}
          variant="primary"
          className="mt-4"
        >
          Prøv igen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
              Sessions & Emner
            </h2>
            <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">Administrer dine undervisningssessioner og kurser</p>
          </div>
          <button
            onClick={() => setIsAddingSession(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Tilføj Session
          </button>
        </div>

        {/* Add Session Form */}
        {isAddingSession && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-700 rounded-lg border border-slate-600">
            <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Ny Session</h4>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Titel</label>
                <input
                  type="text"
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-600 text-white rounded-md px-3 py-2 sm:py-3 text-sm sm:text-base"
                  placeholder="F.eks. Introduktion til AI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Beskrivelse</label>
                <textarea
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-600 text-white rounded-md px-3 py-2 sm:py-3 h-20 sm:h-24 resize-none text-sm sm:text-base"
                  placeholder="Beskrivelse af sessionen..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Sessionspris
                </label>
                <input
                  type="number"
                  value={newSession.price}
                  onChange={(e) => setNewSession(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full bg-slate-600 text-white rounded-md px-3 py-2 sm:py-3 text-sm sm:text-base"
                  placeholder="Pris i kroner (fx 850)"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Angiv prisen for denne session i kroner
                </p>
              </div>
              <div className="bg-slate-600 p-2 sm:p-3 rounded-lg">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Varighed: 1 time (standard)</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleAddSession}
                  disabled={!newSession.title || !newSession.description || !newSession.price}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 justify-center text-sm sm:text-base"
                >
                  <Save className="w-4 h-4" />
                  Gem Session
                </button>
                <button
                  onClick={() => {
                    setIsAddingSession(false);
                    setNewSession({ title: '', description: '', price: '' });
                  }}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 justify-center text-sm sm:text-base"
                >
                  <X className="w-4 h-4" />
                  Annuller
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-3 sm:space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-sm sm:text-base">Ingen sessioner endnu</p>
              <p className="text-slate-500 text-xs sm:text-sm">Tilføj din første session for at komme i gang</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="bg-slate-700 rounded-xl p-3 sm:p-4 border border-slate-600 hover:border-slate-500 transition-colors">
                <div className="flex flex-col gap-3">
                  {/* Header with title and actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {editingSessions[session.id] ? (
                        <input
                          type="text"
                          defaultValue={session.title}
                          className="w-full bg-slate-600 text-white rounded-md px-3 py-2 font-semibold text-sm sm:text-base"
                          onChange={(e) => session.title = e.target.value}
                        />
                      ) : (
                        <h4 className="text-base sm:text-lg font-semibold text-white truncate">{session.title}</h4>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-1 flex-shrink-0">
                      {editingSessions[session.id] ? (
                        <>
                          <button
                            onClick={() => handleSessionSave(session.id, session)}
                            className="text-green-400 hover:text-green-300 p-2 rounded-lg hover:bg-slate-600 transition-colors"
                            title="Gem ændringer"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingSessions(prev => ({ ...prev, [session.id]: false }))}
                            className="text-gray-400 hover:text-gray-300 p-2 rounded-lg hover:bg-slate-600 transition-colors"
                            title="Annuller"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingSessions(prev => ({ ...prev, [session.id]: true }))}
                            className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-slate-600 transition-colors"
                            title="Rediger session"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-slate-600 transition-colors"
                            title="Slet session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    {editingSessions[session.id] ? (
                      <>
                        <textarea
                          defaultValue={session.description}
                          className="w-full bg-slate-600 text-white rounded-md px-3 py-2 h-20 sm:h-24 resize-none text-sm sm:text-base"
                          onChange={(e) => session.description = e.target.value}
                        />
                        <input
                          type="number"
                          defaultValue={session.price || ''}
                          onChange={(e) => session.price = e.target.value ? parseFloat(e.target.value) : null}
                          className="w-full sm:w-32 bg-slate-600 text-white rounded-md px-3 py-2 text-sm sm:text-base"
                          placeholder="Pris i kr"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{session.description}</p>
                        
                        {/* Session details */}
                        <div className="bg-slate-800 rounded-lg p-2 sm:p-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-purple-400" />
                              <span>1 time</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-purple-400" />
                              <span className="font-medium text-white">{session.price || 0} kr</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default SessionManager;