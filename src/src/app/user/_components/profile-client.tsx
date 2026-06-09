'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BentoCard } from './bento-card';
import { User, Save, Shield, Loader2 } from 'lucide-react';
import { PatientProfile } from '@/types/user';
import apiClient from '@/lib/api-client';

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
      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
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
      <div className="bg-zinc-50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Profile
              </h1>
              <p className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-0.5">
                Manage your personal information
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? 'outline' : 'default'}
                className={isEditing ? 'border-dashed' : 'bg-[#0a2540] text-white hover:bg-[#003366]'}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Profile Overview Card */}
          <BentoCard 
            title="Profile Overview"
            icon={<User className="w-5 h-5" />}
            className="lg:col-span-1"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-zinc-200 flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-zinc-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 tracking-tight mb-1">
                {profile.name}
              </h3>
              <p className="text-sm text-zinc-600">{profile.email}</p>
              <Badge 
                variant="secondary" 
                className="mt-3 text-[10px] tracking-widest uppercase font-bold bg-zinc-100 text-zinc-700 border border-zinc-200"
              >
                Patient
              </Badge>
            </div>
          </BentoCard>

          {/* Personal Information Card */}
          <BentoCard 
            title="Personal Information"
            icon={<User className="w-5 h-5" />}
            className="lg:col-span-2"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mb-2 block">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-3 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-zinc-50 rounded-lg border border-zinc-200 text-sm text-zinc-900">
                      {profile.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mb-2 block">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profile.email || ''}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-3 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-zinc-50 rounded-lg border border-zinc-200 text-sm text-zinc-900">
                      {profile.email}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mb-2 block">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-zinc-50 rounded-lg border border-zinc-200 text-sm text-zinc-900">
                      {profile.phone || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mb-2 block">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={profile.dateOfBirth || ''}
                      onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-3 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-zinc-50 rounded-lg border border-zinc-200 text-sm text-zinc-900">
                      {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mb-2 block">
                    Blood Type
                  </label>
                  {isEditing ? (
                    <select
                      value={profile.bloodType || ''}
                      onChange={(e) => setProfile({ ...profile, bloodType: e.target.value })}
                      className="w-full px-4 py-3 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
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
                    <div className="px-4 py-3 bg-zinc-50 rounded-lg border border-zinc-200 text-sm text-zinc-900">
                      {profile.bloodType || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <Button
                  onClick={handleSave}
                  className="w-full bg-[#0a2540] text-white hover:bg-[#003366]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </div>
          </BentoCard>

          {/* Medical Information Card */}
          <BentoCard 
            title="Medical Information"
            icon={<Shield className="w-5 h-5" />}
            className="lg:col-span-3"
          >
            <div className="space-y-4">
              <div>
                <label className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mb-2 block">
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
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                  {(!profile.allergies || profile.allergies.length === 0) && (
                    <p className="text-sm text-zinc-600">No known allergies</p>
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
                      className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
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
      </main>
    </div>
  );
}
