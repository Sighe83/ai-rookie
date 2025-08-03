import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, BookOpen, Clock, DollarSign } from 'lucide-react';
import { tutorManagementApi, sessionsApi } from '../services/api.js';

const SessionManager = () => {
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
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSave = async (sessionId, updatedSession) => {
    try {
      await sessionsApi.updateSession(sessionId, updatedSession);
      await loadData(); // Reload to get updated data
      setEditingSessions(prev => ({ ...prev, [sessionId]: false }));
    } catch (error) {
      console.error('Failed to save session:', error);
      setError('Failed to save session');
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
    } catch (error) {
      console.error('Failed to add session:', error);
      setError('Failed to add session');
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
      
    } catch (error) {
      console.error('❌ Failed to delete session:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      setError(`Failed to delete session: ${error.message || 'Unknown error'}`);
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
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => { setError(null); loadData(); }}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Prøv igen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-purple-400" />
              Sessions & Emner
            </h2>
            <p className="text-slate-400 mt-2">Administrer dine undervisningssessioner og kurser</p>
          </div>
          <button
            onClick={() => setIsAddingSession(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tilføj Session
          </button>
        </div>

        {/* Add Session Form */}
        {isAddingSession && (
          <div className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
            <h4 className="text-lg font-semibold text-white mb-4">Ny Session</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Titel</label>
                <input
                  type="text"
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-600 text-white rounded-md px-3 py-2"
                  placeholder="F.eks. Introduktion til AI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Beskrivelse</label>
                <textarea
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-600 text-white rounded-md px-3 py-2 h-24 resize-none"
                  placeholder="Beskrivelse af sessionen..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Sessionspris (obligatorisk)
                </label>
                <input
                  type="number"
                  value={newSession.price}
                  onChange={(e) => setNewSession(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full bg-slate-600 text-white rounded-md px-3 py-2"
                  placeholder="Pris i kroner (fx 850)"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Angiv prisen for denne session i kroner (obligatorisk)
                </p>
              </div>
              <div className="bg-slate-600 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Varighed: 1 time (standard)</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddSession}
                  disabled={!newSession.title || !newSession.description || !newSession.price}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Gem Session
                </button>
                <button
                  onClick={() => {
                    setIsAddingSession(false);
                    setNewSession({ title: '', description: '', price: '' });
                  }}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Annuller
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">Ingen sessioner endnu</p>
              <p className="text-slate-500 text-sm">Tilføj din første session for at komme i gang</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingSessions[session.id] ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          defaultValue={session.title}
                          className="w-full bg-slate-600 text-white rounded-md px-3 py-2 font-semibold"
                          onChange={(e) => session.title = e.target.value}
                        />
                        <textarea
                          defaultValue={session.description}
                          className="w-full bg-slate-600 text-white rounded-md px-3 py-2 h-24 resize-none"
                          onChange={(e) => session.description = e.target.value}
                        />
                        <input
                          type="number"
                          defaultValue={session.price || ''}
                          onChange={(e) => session.price = e.target.value ? parseFloat(e.target.value) : null}
                          className="w-32 bg-slate-600 text-white rounded-md px-3 py-2"
                          placeholder="Pris i kr"
                        />
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">{session.title}</h4>
                        <p className="text-slate-300 mb-3">{session.description}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            1 time
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            Pris: {session.price || 0} kr
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {editingSessions[session.id] ? (
                      <>
                        <button
                          onClick={() => handleSessionSave(session.id, session)}
                          className="text-green-400 hover:text-green-300 p-1"
                          title="Gem ændringer"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingSessions(prev => ({ ...prev, [session.id]: false }))}
                          className="text-gray-400 hover:text-gray-300 p-1"
                          title="Annuller"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingSessions(prev => ({ ...prev, [session.id]: true }))}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Rediger session"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Slet session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionManager;