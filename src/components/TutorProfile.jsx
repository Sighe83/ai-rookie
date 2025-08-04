import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Building, Briefcase, DollarSign, Save, Edit, Upload, Camera } from 'lucide-react';
import { tutorManagementApi } from '../services/api.js';
import { SessionUtils } from '../utils/sessionUtils.js';
import { processProfileImage } from '../utils/imageCompression.js';

// Design System imports
import {
  Card,
  Button,
  Input,
  Textarea,
  FormField,
  Container,
  Header,
  OptimizedImage,
  ImageUpload,
  Avatar,
  useToast,
  LoadingSpinner
} from './design-system';

const TutorProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { success, error: showError } = useToast();


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
      showError('Kunne ikke indlæse profil');
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
      success('Profilbillede uploadet!');
      
    } catch (error) {
      console.error('Failed to upload image:', error);
      setError(error.message || 'Kunne ikke uploade billedet. Prøv igen.');
      showError(error.message || 'Kunne ikke uploade billedet. Prøv igen.');
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
      success('Profil gemt!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      setError('Kunne ikke gemme profil. Prøv igen.');
      showError('Kunne ikke gemme profil. Prøv igen.');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-slate-400">Indlæser profil...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Card className="text-center">
          <div className="p-6">
            <p className="text-red-400 mb-4">{error}</p>
            <Button 
              variant="danger"
              onClick={() => { setError(null); loadProfile(); }}
            >
              Prøv igen
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Header 
        title="Min Profil" 
        subtitle="Administrer dine profiloplysninger og indstillinger"
        actions={
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    loadProfile(); // Reset changes
                  }}
                >
                  Annuller
                </Button>
                <Button 
                  variant="primary" 
                  icon={Save}
                  loading={saving}
                  onClick={handleProfileSave}
                >
                  Gem
                </Button>
              </>
            ) : (
              <Button 
                variant="primary" 
                icon={Edit}
                onClick={() => setIsEditing(true)}
              >
                Rediger
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {/* Profile Image Section */}
        <Card className="mb-6">
          <div className="p-6">
            <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-400" />
              Profilbillede
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative flex-shrink-0">
                <Avatar
                  src={profile.img}
                  name={profile.name}
                  size="xl"
                  className="border-4 border-slate-600"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="flex-1 space-y-2">
                  <ImageUpload
                    onUpload={handleImageUpload}
                    accept="image/*"
                    maxSize={10485760}
                    currentImage={profile.img}
                    className="w-full sm:w-auto"
                  />
                  <p className="text-xs text-slate-400 text-center sm:text-left">
                    Max 10MB, automatisk komprimeret til optimal størrelse
                  </p>
                </div>
              )}
              
              {!isEditing && (
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-slate-300 text-sm">Profilbillede</p>
                  <p className="text-slate-400 text-xs mt-1">Vises på din tutor profil</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Contact Information Section */}
        <Card>
          <div className="p-6">
            <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" />
              Kontakt information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Navn"
                icon={User}
                required
              >
                {isEditing ? (
                  <Input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Dit fulde navn"
                  />
                ) : (
                  <div className="text-white py-2">{profile.name}</div>
                )}
              </FormField>

              <FormField
                label="Email"
                icon={Mail}
                required
              >
                {isEditing ? (
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="din@email.com"
                  />
                ) : (
                  <div className="text-white py-2 break-all">{profile.email}</div>
                )}
              </FormField>

              <FormField
                label="Telefon"
                icon={Phone}
              >
                {isEditing ? (
                  <Input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+45 12 34 56 78"
                  />
                ) : (
                  <div className="text-white py-2">{profile.phone}</div>
                )}
              </FormField>

              <FormField
                label="Titel"
                icon={Briefcase}
              >
                {isEditing ? (
                  <Input
                    type="text"
                    value={profile.title}
                    onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Din professionelle titel"
                  />
                ) : (
                  <div className="text-white py-2">{profile.title}</div>
                )}
              </FormField>
            </div>
          </div>
        </Card>

        {/* Professional Information Section */}
        <Card>
          <div className="p-6">
            <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" />
              Professionel information
            </h4>
            <div className="space-y-4">
              <FormField
                label="Specialeområde"
                icon={Building}
              >
                {isEditing ? (
                  <Input
                    type="text"
                    value={profile.specialty}
                    onChange={(e) => setProfile(prev => ({ ...prev, specialty: e.target.value }))}
                    placeholder="Dit hovedspeciale eller fagområde"
                  />
                ) : (
                  <div className="text-white py-2">{profile.specialty}</div>
                )}
              </FormField>

              <FormField
                label="Erfaring"
                description="Beskriv din baggrund, erfaring og specialkompetencer"
              >
                {isEditing ? (
                  <Textarea
                    value={profile.experience}
                    onChange={(e) => setProfile(prev => ({ ...prev, experience: e.target.value }))}
                    rows={5}
                    placeholder="Beskriv din erfaring, baggrund og specialkompetencer..."
                    className="min-h-[120px]"
                  />
                ) : (
                  <div className="text-white py-2 leading-relaxed whitespace-pre-line">{profile.experience}</div>
                )}
              </FormField>

              <FormField
                label="Værdiforslag"
                description="Hvad kan du tilbyde dine kunder? Hvad gør dig unik?"
              >
                {isEditing ? (
                  <Textarea
                    value={profile.value_prop}
                    onChange={(e) => setProfile(prev => ({ ...prev, value_prop: e.target.value }))}
                    rows={4}
                    placeholder="Hvad kan du tilbyde dine kunder? Hvad gør dig unik?"
                    className="min-h-[100px]"
                  />
                ) : (
                  <div className="text-white py-2 leading-relaxed whitespace-pre-line">{profile.value_prop}</div>
                )}
              </FormField>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          {!isEditing ? (
            <Button
              variant="primary"
              icon={Edit}
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto"
            >
              Rediger profil
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                icon={Save}
                loading={saving}
                onClick={handleProfileSave}
                className="flex-1 sm:flex-initial"
              >
                {saving ? 'Gemmer...' : 'Gem'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  loadProfile(); // Reset changes
                }}
                className="flex-1 sm:flex-initial"
              >
                Annuller
              </Button>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default TutorProfile;