'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Save, Globe, Clock, Bell, Webhook } from 'lucide-react';
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
};

export default function ClinicAdminSettings() {
  const [settings, setSettings] = useState<ClinicSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
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

  function updateWebhook(key: keyof ClinicSettings['webhooks'], value: string) {
    setSettings((prev) => ({
      ...prev,
      webhooks: { ...prev.webhooks, [key]: value },
    }));
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Clinic Settings</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Clinic Settings
        </h1>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
          {successMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* General Settings */}
        <Card className="bg-white border border-zinc-200">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-600">Clinic Name</Label>
              <Input
                value={settings.clinicName || ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, clinicName: e.target.value }))}
                placeholder="Clinic name"
                className="bg-zinc-50 border border-zinc-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-600">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger className="w-full bg-zinc-50 border border-zinc-200">
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
          </CardContent>
        </Card>

        {/* Booking Settings */}
        <Card className="bg-white border border-zinc-200">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Booking Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-zinc-600">Booking Window (days)</Label>
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
                  className="bg-zinc-50 border border-zinc-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-600">Cancellation Window (hours)</Label>
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
                  className="bg-zinc-50 border border-zinc-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Features */}
        <Card className="bg-white border border-zinc-200">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {[
              { key: 'voiceReminders' as const, label: 'Voice Reminders' },
              { key: 'emailNotifications' as const, label: 'Email Notifications' },
              { key: 'whatsappNotifications' as const, label: 'WhatsApp Notifications' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-b-0">
                <span className="text-sm text-zinc-700">{label}</span>
                <button
                  type="button"
                  onClick={() => toggleFeature(key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings[key] ? 'bg-zinc-900' : 'bg-zinc-200'
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
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card className="bg-white border border-zinc-200">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Webhooks
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {[
              { key: 'appointmentBooked' as const, label: 'Appointment Booked URL' },
              { key: 'appointmentCancelled' as const, label: 'Appointment Cancelled URL' },
              { key: 'recordUploaded' as const, label: 'Record Uploaded URL' },
              { key: 'notificationBase' as const, label: 'Notification Base URL' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs text-zinc-600">{label}</Label>
                <Input
                  value={settings.webhooks[key]}
                  onChange={(e) => updateWebhook(key, e.target.value)}
                  placeholder="https://..."
                  className="bg-zinc-50 border border-zinc-200"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
