'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface ExtendedSession {
  data?: {
    accessToken?: string;
    user?: {
      id: string;
      name?: string;
      email?: string;
    };
  };
}

export default function AdminOnboardClinic() {
  const session = useSession() as ExtendedSession;
  
  const [formData, setFormData] = useState({
    name: '',
    n8nWebhookUrls: '',
    settings: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Record<string, unknown> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse the JSON fields
      const n8nWebhookUrls = formData.n8nWebhookUrls ? JSON.parse(formData.n8nWebhookUrls) : {};
      const settings = formData.settings ? JSON.parse(formData.settings) : {};

      const res = await fetch('/api/admin/tenants/onboard', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.data?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          n8nWebhookUrls,
          settings,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to onboard clinic');
      }

      const resJson = await res.json();
      setSuccess(resJson);
      // Reset form
      setFormData({ name: '', n8nWebhookUrls: '', settings: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error onboarding clinic:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Onboard New Clinic</h1>
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded mb-4">
          <p>Clinic onboarded successfully!</p>
          <pre className="mt-2 text-xs bg-green-100 p-2 rounded">{JSON.stringify(success, null, 2)}</pre>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-4">
          <p>Error: {error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-zinc-200 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Clinic Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">N8N Webhook URLs (JSON)</label>
            <textarea
              name="n8nWebhookUrls"
              value={formData.n8nWebhookUrls}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 h-32"
              placeholder='{"appointmentBooked": "https://example.com/webhook1", "appointmentCancelled": "https://example.com/webhook2"}'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Settings (JSON)</label>
            <textarea
              name="settings"
              value={formData.settings}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 h-32"
              placeholder='{"timezone": "UTC", "bookingWindowDays": 30, "cancellationHours": 24, "features": {"voiceReminders": true, "emailNotifications": true, "whatsappNotifications": false}}'
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Onboarding...' : 'Onboard Clinic'}
          </button>
        </div>
      </form>
    </div>
  );
}