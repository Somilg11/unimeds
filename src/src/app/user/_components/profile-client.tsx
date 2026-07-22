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
    // eslint-disable-next-line react-hooks/immutability
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
          className={`rounded-xl transition-all h-10 px-5 font-medium ${isEditing ? 'border-gray-200 hover:bg-gray-50' : 'bg-primary text-white hover:bg-primary/90 shadow-sm'}`}
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
              <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center mb-5 shadow-sm border border-gray-100">
                <User className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 tracking-tight mb-1">
                {profile.name}
              </h3>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <Badge 
                variant="secondary" 
                className="mt-4 text-[11px] font-medium tracking-wide bg-gray-100/80 text-gray-600 border-none rounded-lg px-3 py-1"
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
                  <label className="text-[12px] font-medium text-gray-500 mb-2 block">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[14px] focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-[14px] text-gray-900 shadow-sm">
                      {profile.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-2 block">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profile.email || ''}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[14px] focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-[14px] text-gray-900 shadow-sm">
                      {profile.email}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-2 block">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[14px] focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-[14px] text-gray-900 shadow-sm">
                      {profile.phone || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-2 block">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={profile.dateOfBirth || ''}
                      onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[14px] focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-[14px] text-gray-900 shadow-sm">
                      {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-2 block">
                    Blood Type
                  </label>
                  {isEditing ? (
                    <select
                      value={profile.bloodType || ''}
                      onChange={(e) => setProfile({ ...profile, bloodType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[14px] focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
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
                    <div className="px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-[14px] text-gray-900 shadow-sm">
                      {profile.bloodType || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="pt-4">
                  <Button
                    onClick={handleSave}
                    className="w-full rounded-xl bg-primary text-white hover:bg-primary/90 h-11 text-[14px] font-semibold tracking-wide shadow-sm"
                  >
                    <Save className="w-4.5 h-4.5 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </BentoCard>
        </div>

        {/* Medical Information */}
        <div className="lg:col-span-12">
          <BentoCard title="Medical Information" icon={<Shield className="w-4 h-4" />}>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-gray-500 mb-3 block">
                  Allergies
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.allergies?.map((allergy) => (
                    <Badge
                      key={allergy}
                      variant="outline"
                      className="text-[13px] font-medium px-3 py-1.5 rounded-full border-gray-200 bg-gray-50 text-gray-700 flex items-center gap-1.5"
                    >
                      {allergy}
                      {isEditing && (
                        <button
                          onClick={() => removeAllergy(allergy)}
                          className="hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </Badge>
                  ))}
                  {(!profile.allergies || profile.allergies.length === 0) && (
                    <p className="text-[14px] text-gray-500 py-2">No known allergies</p>
                  )}
                </div>
                {isEditing && (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      placeholder="Add an allergy..."
                      onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white text-[14px] focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                    <Button
                      onClick={addAllergy}
                      variant="outline"
                      className="rounded-xl border-gray-200 h-12 px-6 font-medium hover:bg-gray-50 shadow-sm"
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
