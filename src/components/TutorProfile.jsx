import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Building, Briefcase, DollarSign, Save, Edit, Upload, Camera } from 'lucide-react';
import { tutorManagementApi } from '../services/api.js';
import { SessionUtils } from '../utils/sessionUtils.js';
import OptimizedImage from './OptimizedImage.jsx';
import { processProfileImage } from '../utils/imageCompression.js';

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
      setError('Kunne ikke indlæse profil');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Process and compress image before upload
      const compressedFile = await processProfileImage(file);
      
      console.log('Image processed for upload:', {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        reduction: ((file.size - compressedFile.size) / file.size * 100).toFixed(1) + '%'
      });

      // Upload compressed image
      const formData = new FormData();
      formData.append('image', compressedFile);
      
      const response = await tutorManagementApi.uploadProfileImage(formData);
      
      // Update profile with new image URL
      setProfile(prev => ({ ...prev, img: response.data.imageUrl }));
      
    } catch (error) {
      console.error('Failed to upload image:', error);
      setError(error.message || 'Kunne ikke uploade billedet. Prøv igen.');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Separate user data from tutor data
      const userData = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      };
      
      const tutorData = {
        title: profile.title,
        specialty: profile.specialty,
        experience: profile.experience,
        value_prop: profile.value_prop,
        img: profile.img,
      };
      
      // Update both user and tutor data
      await Promise.all([
        tutorManagementApi.updateUserData(userData),
        tutorManagementApi.updateProfile(tutorData)
      ]);
      
      await loadProfile(); // Reload to get updated data
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setError('Kunne ikke gemme profil. Prøv igen.');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-500 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-slate-400 text-sm sm:text-base">Indlæser profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 sm:p-6 text-center">
        <p className="text-red-400 text-sm sm:text-base">{error}</p>
        <button 
          onClick={() => { setError(null); loadProfile(); }}
          className="mt-3 sm:mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base"
        >
          Prøv igen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Information */}
      <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white">Profil information</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Image */}
          <div className="text-center lg:text-center flex flex-col items-center">
            <div className="relative inline-block mb-3 sm:mb-4">
              <OptimizedImage
                src={profile.img}
                alt={profile.name || 'Profil billede'}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-slate-700 object-cover"
                fallback={`data:image/svg+xml;base64,${btoa(`
                  <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
                    <rect width="128" height="128" fill="#7c3aed" rx="64"/>
                    <text x="64" y="78" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">${SessionUtils.generateInitials(profile.name)}</text>
                  </svg>
                `)}`}
                loading="eager"
                placeholder={true}
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-500"></div>
                </div>
              )}
            </div>
            {isEditing && (
              <div className="space-y-2 w-full">
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
                  className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm disabled:opacity-50 flex items-center gap-1 justify-center w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  {uploading ? 'Uploader...' : 'Skift billede'}
                </button>
                <p className="text-xs text-slate-500 text-center">Max 10MB, automatisk komprimering</p>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Navn
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-md px-3 py-2 sm:py-3 text-sm sm:text-base"
                  />
                ) : (
                  <p className="text-white text-sm sm:text-base py-1">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-md px-3 py-2 sm:py-3 text-sm sm:text-base"
                  />
                ) : (
                  <p className="text-white text-sm sm:text-base py-1 break-all">{profile.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefon
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-md px-3 py-2 sm:py-3 text-sm sm:text-base"
                  />
                ) : (
                  <p className="text-white text-sm sm:text-base py-1">{profile.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Titel
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-md px-3 py-2 sm:py-3 text-sm sm:text-base"
                  />
                ) : (
                  <p className="text-white text-sm sm:text-base py-1">{profile.title}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Specialeområde</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.specialty}
                  onChange={(e) => setProfile(prev => ({ ...prev, specialty: e.target.value }))}
                  className="w-full bg-slate-700 text-white rounded-md px-3 py-2 sm:py-3 text-sm sm:text-base"
                />
              ) : (
                <p className="text-white text-sm sm:text-base py-1">{profile.specialty}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Erfaring</label>
              {isEditing ? (
                <textarea
                  value={profile.experience}
                  onChange={(e) => setProfile(prev => ({ ...prev, experience: e.target.value }))}
                  rows={5}
                  className="w-full bg-slate-700 text-white rounded-md px-3 py-2 sm:py-3 text-sm sm:text-base resize-y min-h-[120px]"
                  placeholder="Beskriv din erfaring, baggrund og specialkompetencer..."
                />
              ) : (
                <p className="text-white text-sm sm:text-base py-1 leading-relaxed whitespace-pre-line">{profile.experience}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Værdiforslag</label>
              {isEditing ? (
                <textarea
                  value={profile.value_prop}
                  onChange={(e) => setProfile(prev => ({ ...prev, value_prop: e.target.value }))}
                  rows={4}
                  className="w-full bg-slate-700 text-white rounded-md px-3 py-2 sm:py-3 text-sm sm:text-base resize-y min-h-[100px]"
                  placeholder="Hvad kan du tilbyde dine kunder? Hvad gør dig unik?"
                />
              ) : (
                <p className="text-white text-sm sm:text-base py-1 leading-relaxed whitespace-pre-line">{profile.value_prop}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base justify-center w-full sm:w-auto"
            >
              <Edit className="w-4 h-4" />
              Rediger profil
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base justify-center"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Gemmer...' : 'Gem'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base justify-center"
              >
                Annuller
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TutorProfile;