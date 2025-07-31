import React, { useState } from 'react';
import { User, Mail, Phone, Building, Briefcase, DollarSign, Save, Plus, Trash2, Edit } from 'lucide-react';

const TutorProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingSessions, setEditingSessions] = useState({});
  const [isAddingSession, setIsAddingSession] = useState(false);
  
  const [profile, setProfile] = useState({
    name: 'Daniel Elkjær',
    email: 'daniel@airookie.dk',
    phone: '+45 20 30 40 50',
    title: 'Senior AI Consultant & Automation Specialist',
    specialty: 'AI for Business Process Optimization',
    experience: 'Over 5 års erfaring med at implementere AI-løsninger i danske virksomheder. Specialist i automatisering af workflows og business intelligence.',
    value_prop: 'Hjælper virksomheder med at identificere og implementere AI-løsninger der reducerer manuelle processer med op til 60%.',
    img: 'https://placehold.co/200x200/22C55E/FFFFFF?text=DE',
    base_price: 1200,
    price: 950
  });

  const [sessions, setSessions] = useState([
    {
      id: 1,
      title: 'AI-drevne business processer',
      description: 'Lær at identificere og automatisere repetitive processer med AI-værktøjer som Zapier, Make og custom solutions.',
      duration: 90,
      price_override: null
    },
    {
      id: 2,
      title: 'Intelligent dokumenthåndtering',
      description: 'Implementér AI-baserede systemer til at behandle, kategorisere og analysere dokumenter automatisk.',
      duration: 60,
      price_override: 800
    },
    {
      id: 3,
      title: 'Data-drevet beslutningstagning',
      description: 'Brug AI til at analysere business data og generere actionable insights for bedre beslutninger.',
      duration: 120,
      price_override: 1500
    }
  ]);

  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    duration: 60,
    price_override: null
  });

  const handleProfileSave = () => {
    // In real app, this would save to API
    console.log('Saving profile:', profile);
    setIsEditing(false);
  };

  const handleSessionSave = (sessionId, updatedSession) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId ? { ...session, ...updatedSession } : session
    ));
    setEditingSessions(prev => ({ ...prev, [sessionId]: false }));
  };

  const handleAddSession = () => {
    if (!newSession.title || !newSession.description) return;
    
    const sessionToAdd = {
      ...newSession,
      id: Date.now(),
      price_override: newSession.price_override || null
    };
    
    setSessions(prev => [...prev, sessionToAdd]);
    setNewSession({ title: '', description: '', duration: 60, price_override: null });
    setIsAddingSession(false);
  };

  const handleDeleteSession = (sessionId) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Profil information</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Rediger profil
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleProfileSave}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Gem
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Annuller
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Image */}
          <div className="text-center">
            <img
              src={profile.img}
              alt={profile.name}
              className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-slate-700"
            />
            {isEditing && (
              <button className="text-green-400 hover:text-green-300 text-sm">
                Skift billede
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Navn
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-md px-3 py-2"
                  />
                ) : (
                  <p className="text-white">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-md px-3 py-2"
                  />
                ) : (
                  <p className="text-white">{profile.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefon
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-md px-3 py-2"
                  />
                ) : (
                  <p className="text-white">{profile.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Titel
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-md px-3 py-2"
                  />
                ) : (
                  <p className="text-white">{profile.title}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Specialeområde</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.specialty}
                  onChange={(e) => setProfile(prev => ({ ...prev, specialty: e.target.value }))}
                  className="w-full bg-slate-700 text-white rounded-md px-3 py-2"
                />
              ) : (
                <p className="text-white">{profile.specialty}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Erfaring</label>
              {isEditing ? (
                <textarea
                  value={profile.experience}
                  onChange={(e) => setProfile(prev => ({ ...prev, experience: e.target.value }))}
                  rows={3}
                  className="w-full bg-slate-700 text-white rounded-md px-3 py-2"
                />
              ) : (
                <p className="text-white">{profile.experience}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Værdiforslag</label>
              {isEditing ? (
                <textarea
                  value={profile.value_prop}
                  onChange={(e) => setProfile(prev => ({ ...prev, value_prop: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-700 text-white rounded-md px-3 py-2"
                />
              ) : (
                <p className="text-white">{profile.value_prop}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  B2B Basispris (kr/time)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.base_price}
                    onChange={(e) => setProfile(prev => ({ ...prev, base_price: parseInt(e.target.value) }))}
                    className="w-full bg-slate-700 text-white rounded-md px-3 py-2"
                  />
                ) : (
                  <p className="text-white">{profile.base_price} kr</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  B2C Pris (kr/session)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.price}
                    onChange={(e) => setProfile(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                    className="w-full bg-slate-700 text-white rounded-md px-3 py-2"
                  />
                ) : (
                  <p className="text-white">{profile.price} kr</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions/Topics */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Sessions & Emner</h3>
          <button
            onClick={() => setIsAddingSession(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tilføj session
          </button>
        </div>

        {/* Add New Session Form */}
        {isAddingSession && (
          <div className="mb-6 p-4 bg-slate-700 rounded-lg">
            <h4 className="text-white font-medium mb-4">Ny session</h4>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Session titel"
                value={newSession.title}
                onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-slate-600 text-white rounded-md px-3 py-2"
              />
              <textarea
                placeholder="Session beskrivelse"
                value={newSession.description}
                onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-slate-600 text-white rounded-md px-3 py-2"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Varighed (minutter)"
                  value={newSession.duration}
                  onChange={(e) => setNewSession(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="bg-slate-600 text-white rounded-md px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Særlig pris (valgfrit)"
                  value={newSession.price_override || ''}
                  onChange={(e) => setNewSession(prev => ({ ...prev, price_override: e.target.value ? parseInt(e.target.value) : null }))}
                  className="bg-slate-600 text-white rounded-md px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddSession}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Gem session
                </button>
                <button
                  onClick={() => {
                    setIsAddingSession(false);
                    setNewSession({ title: '', description: '', duration: 60, price_override: null });
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Annuller
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="bg-slate-700 rounded-lg p-4">
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
                        rows={3}
                        className="w-full bg-slate-600 text-white rounded-md px-3 py-2"
                        onChange={(e) => session.description = e.target.value}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="number"
                          defaultValue={session.duration}
                          className="bg-slate-600 text-white rounded-md px-3 py-2"
                          onChange={(e) => session.duration = parseInt(e.target.value)}
                        />
                        <input
                          type="number"
                          defaultValue={session.price_override || ''}
                          placeholder="Særlig pris (valgfrit)"
                          className="bg-slate-600 text-white rounded-md px-3 py-2"
                          onChange={(e) => session.price_override = e.target.value ? parseInt(e.target.value) : null}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">{session.title}</h4>
                      <p className="text-slate-300 mb-3">{session.description}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>Varighed: {session.duration} min</span>
                        <span>
                          Pris: {session.price_override || (session.duration > 60 ? profile.base_price : profile.price)} kr
                        </span>
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
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingSessions(prev => ({ ...prev, [session.id]: false }))}
                        className="text-gray-400 hover:text-gray-300 p-1"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingSessions(prev => ({ ...prev, [session.id]: true }))}
                        className="text-blue-400 hover:text-blue-300 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TutorProfile;