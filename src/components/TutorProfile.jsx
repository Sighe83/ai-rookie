import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Briefcase, DollarSign, Save, Edit } from 'lucide-react';
import { tutorManagementApi } from '../services/api.js';

const TutorProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tutorManagementApi.getProfile();
      
      const tutorProfile = {
        name: response.data.user?.name || '',
        email: response.data.user?.email || '',
        phone: response.data.user?.phone || '',
        title: response.data.title || '',
        specialty: response.data.specialty || '',
        experience: response.data.experience || '',
        value_prop: response.data.value_prop || '',
        img: response.data.img || '',
        base_price: response.data.base_price || 0,
        price: response.data.price || 0
      };
      
      setProfile(tutorProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      
      // Update tutor profile
      const tutorData = {
        title: profile.title,
        specialty: profile.specialty,
        experience: profile.experience,
        value_prop: profile.value_prop,
        img: profile.img,
        base_price: profile.base_price,
        price: profile.price
      };
      
      await tutorManagementApi.updateProfile(tutorData);
      await loadProfile(); // Reload to get updated data
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => { setError(null); loadProfile(); }}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Profil information</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Rediger profil
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Gem'}
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
              <button className="text-purple-400 hover:text-purple-300 text-sm">
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

    </div>
  );
};

export default TutorProfile;