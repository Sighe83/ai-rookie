import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Building, Briefcase, DollarSign, Save, Edit, Upload, Camera } from 'lucide-react';
import { tutorManagementApi } from '../services/api.js';
import { SessionUtils } from '../utils/sessionUtils.js';

const TutorProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);


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
      };
      
      setProfile(tutorProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vælg venligst en billedfil');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Billedet må ikke være større end 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload image
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await tutorManagementApi.uploadProfileImage(formData);
      
      // Update profile with new image URL
      setProfile(prev => ({ ...prev, img: response.data.imageUrl }));
      
    } catch (error) {
      console.error('Failed to upload image:', error);
      setError('Kunne ikke uploade billedet. Prøv igen.');
    } finally {
      setUploading(false);
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
            <div className="relative inline-block">
              {profile.img ? (
                <img
                  src={profile.img}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-slate-700 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-32 h-32 bg-purple-600 rounded-full mx-auto mb-4 border-4 border-slate-700 flex items-center justify-center text-white font-bold text-4xl"
                style={{ display: profile.img ? 'none' : 'flex' }}
              >
                {SessionUtils.generateInitials(profile.name)}
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              )}
            </div>
            {isEditing && (
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-purple-400 hover:text-purple-300 text-sm disabled:opacity-50 flex items-center gap-1 mx-auto"
                >
                  <Camera className="w-4 h-4" />
                  {uploading ? 'Uploader...' : 'Skift billede'}
                </button>
                <p className="text-xs text-slate-500">Max 5MB, JPG/PNG</p>
              </div>
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
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TutorProfile;