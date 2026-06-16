'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BentoCard } from './bento-card';
import { User, Save, Shield, Loader2 } from 'lucide-react';
import { PatientProfile } from '@/types/user';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface ProfileClientProps {
  userName: string;
  email: string;
}

export function ProfileClient({ userName, email }: ProfileClientProps) {
  const [profile, setProfile] = useState<Partial<PatientProfile>>({
    name: userName,
    email,
    phone: '',
    dateOfBirth: '',
    bloodType: '',
    allergies: [],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [allergyInput, setAllergyInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/user/profile');
      const user = response.data.user;
      if (user?.profileData) {
        setProfile({
          name: user.profileData.name || userName,
          email: user.profileData.email || email,
          phone: user.profileData.phone || '',
          dateOfBirth: user.profileData.dateOfBirth || '',
          bloodType: user.profileData.bloodType || '',
          allergies: user.profileData.allergies || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await apiClient.put('/user/profile', { profileData: profile });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !profile.allergies?.includes(allergyInput.trim())) {
      setProfile({
        ...profile,
        allergies: [...(profile.allergies || []), allergyInput.trim()],
      });
      setAllergyInput('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setProfile({
      ...profile,
      allergies: profile.allergies?.filter((a) => a !== allergy),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
            Patient Portal
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal information
          </p>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? 'outline' : 'default'}
          className={isEditing ? 'border-dashed' : 'bg-gray-900 text-white hover:bg-gray-800'}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-4">
          <BentoCard title="Profile Overview" icon={<User className="w-4 h-4" />}>
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-20 h-20 bg-gray-200 flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 tracking-tight mb-1">
                {profile.name}
              </h3>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <Badge 
                variant="secondary" 
                className="mt-3 text-[10px] font-mono uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200"
              >
                Patient
              </Badge>
            </div>
          </BentoCard>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-8">
          <BentoCard title="Personal Information" icon={<User className="w-4 h-4" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900">
                      {profile.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profile.email || ''}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900">
                      {profile.email}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2.5 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900">
                      {profile.phone || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={profile.dateOfBirth || ''}
                      onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900">
                      {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                    Blood Type
                  </label>
                  {isEditing ? (
                    <select
                      value={profile.bloodType || ''}
                      onChange={(e) => setProfile({ ...profile, bloodType: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    >
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900">
                      {profile.bloodType || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <Button
                  onClick={handleSave}
                  className="w-full bg-gray-900 text-white hover:bg-gray-800"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </div>
          </BentoCard>
        </div>

        {/* Medical Information */}
        <div className="lg:col-span-12">
          <BentoCard title="Medical Information" icon={<Shield className="w-4 h-4" />}>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 block">
                  Allergies
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.allergies?.map((allergy) => (
                    <Badge
                      key={allergy}
                      variant="outline"
                      className="text-xs border-dashed flex items-center gap-2"
                    >
                      {allergy}
                      {isEditing && (
                        <button
                          onClick={() => removeAllergy(allergy)}
                          className="ml-1 hover:text-red-600"
                        >
                          &times;
                        </button>
                      )}
                    </Badge>
                  ))}
                  {(!profile.allergies || profile.allergies.length === 0) && (
                    <p className="text-sm text-gray-500">No known allergies</p>
                  )}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      placeholder="Add allergy..."
                      onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                      className="flex-1 px-4 py-2.5 border border-gray-300 bg-white text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                    <Button
                      onClick={addAllergy}
                      variant="outline"
                      className="border-dashed"
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
