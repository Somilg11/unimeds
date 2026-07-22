'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Save, Globe, Clock, Bell, Webhook, MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Phoenix',
  'America/Detroit',
  'America/Indiana/Indianapolis',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Australia/Sydney',
  'Pacific/Auckland',
];

interface ClinicSettings {
  clinicName?: string;
  timezone: string;
  bookingWindowDays: number;
  cancellationHours: number;
  voiceReminders: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  webhooks: {
    appointmentBooked: string;
    appointmentCancelled: string;
    recordUploaded: string;
    notificationBase: string;
  };
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: string;
  longitude: string;
}

const defaultSettings: ClinicSettings = {
  timezone: 'America/New_York',
  bookingWindowDays: 30,
  cancellationHours: 24,
  voiceReminders: false,
  emailNotifications: false,
  whatsappNotifications: false,
  webhooks: {
    appointmentBooked: '',
    appointmentCancelled: '',
    recordUploaded: '',
    notificationBase: '',
  },
  address: '',
  city: '',
  state: '',
  zipCode: '',
  latitude: '',
  longitude: '',
};

export default function ClinicAdminSettings() {
  const [settings, setSettings] = useState<ClinicSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/clinic-admin/settings');
      const raw = res.data;
      const clinic = raw?.clinic || raw?.data?.clinic || {};
      const s = clinic?.settings || {};
      const w = clinic?.n8nWebhookUrls || {};
      setSettings({
        clinicName: clinic?.name || '',
        timezone: s?.timezone || 'America/New_York',
        bookingWindowDays: s?.bookingWindowDays ?? 30,
        cancellationHours: s?.cancellationHours ?? 24,
        voiceReminders: s?.features?.voiceReminders ?? false,
        emailNotifications: s?.features?.emailNotifications ?? false,
        whatsappNotifications: s?.features?.whatsappNotifications ?? false,
        webhooks: {
          appointmentBooked: w?.appointmentBooked || '',
          appointmentCancelled: w?.appointmentCancelled || '',
          recordUploaded: w?.recordUploaded || '',
          notificationBase: w?.notificationBase || '',
        },
        address: clinic?.address || '',
        city: clinic?.city || '',
        state: clinic?.state || '',
        zipCode: clinic?.zipCode || '',
        latitude: clinic?.latitude != null ? String(clinic.latitude) : '',
        longitude: clinic?.longitude != null ? String(clinic.longitude) : '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      await apiClient.put('/clinic-admin/settings', {
        settings: {
          timezone: settings.timezone,
          bookingWindowDays: settings.bookingWindowDays,
          cancellationHours: settings.cancellationHours,
          features: {
            voiceReminders: settings.voiceReminders,
            emailNotifications: settings.emailNotifications,
            whatsappNotifications: settings.whatsappNotifications,
          },
        },
        n8nWebhookUrls: settings.webhooks,
        address: settings.address || undefined,
        city: settings.city || undefined,
        state: settings.state || undefined,
        zipCode: settings.zipCode || undefined,
        latitude: settings.latitude ? Number(settings.latitude) : undefined,
        longitude: settings.longitude ? Number(settings.longitude) : undefined,
      });
      setSuccessMessage('Settings saved successfully');
      toast.success('Settings saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function toggleFeature(key: keyof Pick<ClinicSettings, 'voiceReminders' | 'emailNotifications' | 'whatsappNotifications'>) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
        toast.success('Current location set');
      },
      (err) => {
        toast.error(`Failed to get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function updateWebhook(key: keyof ClinicSettings['webhooks'], value: string) {
    setSettings((prev) => ({
      ...prev,
      webhooks: { ...prev.webhooks, [key]: value },
    }));
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Clinic Settings</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[12px] font-medium uppercase text-gray-500 tracking-wider mb-2">Clinic Portal</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Clinic Settings</h1>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-[#36565F] hover:bg-[#36565F]/90 text-white shadow-sm h-10 px-5">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-sm text-green-600">
          {successMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#36565F]" />
              General
            </h2>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Clinic Name</Label>
              <Input
                value={settings.clinicName || ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, clinicName: e.target.value }))}
                placeholder="Clinic name"
                className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger className="w-full h-10 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#36565F]" />
              Location
            </h2>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-gray-700">Street Address</Label>
              <Input
                value={settings.address}
                onChange={(e) => setSettings((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Street address"
                className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-gray-700">City</Label>
                <Input
                  value={settings.city}
                  onChange={(e) => setSettings((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-gray-700">State</Label>
                <Input
                  value={settings.state}
                  onChange={(e) => setSettings((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                  className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-gray-700">Zip Code</Label>
                <Input
                  value={settings.zipCode}
                  onChange={(e) => setSettings((prev) => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="Zip"
                  className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-gray-700">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={settings.latitude}
                  onChange={(e) => setSettings((prev) => ({ ...prev, latitude: e.target.value }))}
                  placeholder="e.g. 40.7128"
                  className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-gray-700">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={settings.longitude}
                  onChange={(e) => setSettings((prev) => ({ ...prev, longitude: e.target.value }))}
                  placeholder="e.g. -74.0060"
                  className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              className="rounded-xl h-10 px-5 text-[13px] font-medium border-dashed border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <Navigation className="w-3.5 h-3.5 mr-2" />
              Use Current Location
            </Button>
          </div>
        </div>

        {/* Booking Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#36565F]" />
              Booking Rules
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-gray-700">Booking Window (days)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={settings.bookingWindowDays}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      bookingWindowDays: parseInt(e.target.value) || 30,
                    }))
                  }
                  className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-gray-700">Cancellation Window (hours)</Label>
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={settings.cancellationHours}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      cancellationHours: parseInt(e.target.value) || 24,
                    }))
                  }
                  className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Features */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#36565F]" />
              Notifications
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { key: 'voiceReminders' as const, label: 'Voice Reminders' },
              { key: 'emailNotifications' as const, label: 'Email Notifications' },
              { key: 'whatsappNotifications' as const, label: 'WhatsApp Notifications' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <span className="text-[14px] font-medium text-gray-700">{label}</span>
                <button
                  type="button"
                  onClick={() => toggleFeature(key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings[key] ? 'bg-[#36565F]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings[key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Webhooks */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-[#36565F]" />
              Webhooks
            </h2>
          </div>
          <div className="p-5 space-y-5">
            {[
              { key: 'appointmentBooked' as const, label: 'Appointment Booked URL' },
              { key: 'appointmentCancelled' as const, label: 'Appointment Cancelled URL' },
              { key: 'recordUploaded' as const, label: 'Record Uploaded URL' },
              { key: 'notificationBase' as const, label: 'Notification Base URL' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label className="text-[13px] font-medium text-gray-700">{label}</Label>
                <Input
                  value={settings.webhooks[key]}
                  onChange={(e) => updateWebhook(key, e.target.value)}
                  placeholder="https://..."
                  className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
