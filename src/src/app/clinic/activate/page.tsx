'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Building2, Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

function ActivateClinicContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'ready' | 'activating' | 'success' | 'error'>('loading');
  const [clinicName, setClinicName] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No activation token provided');
      return;
    }

    fetchClinicInfo();
  }, [token]);

  async function fetchClinicInfo() {
    try {
      const res = await fetch(`/api/admin/clinic-by-token?token=${encodeURIComponent(token!)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid token');
      }
      const data = await res.json();
      const clinic = data.clinic;

      if (clinic.isActive) {
        setStatus('success');
        setClinicName(clinic.name);
        return;
      }

      setClinicName(clinic.name);
      setClinicEmail(clinic.email || '');
      setStatus('ready');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load clinic info';
      setErrorMessage(message);
      setStatus('error');
    }
  }

  async function handleActivate() {
    try {
      setStatus('activating');
      const res = await fetch('/api/admin/activate-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Activation failed');
      }

      setStatus('success');
      toast.success('Clinic activated successfully!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Activation failed';
      setErrorMessage(message);
      setStatus('error');
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border border-zinc-200">
        <CardHeader className="text-center p-6">
          <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6 text-zinc-600" />
          </div>
          <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">
            Clinic Activation
          </CardTitle>
          <p className="text-sm text-zinc-500 mt-1">
            Activate your clinic account
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {status === 'loading' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mb-3" />
              <p className="text-sm text-zinc-500">Loading clinic information...</p>
            </div>
          )}

          {status === 'ready' && (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <p className="text-xs text-zinc-500">Clinic Name</p>
                <p className="text-sm font-medium text-zinc-900">{clinicName}</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <p className="text-xs text-zinc-500">Admin Email</p>
                <p className="text-sm font-medium text-zinc-900">{clinicEmail}</p>
              </div>
              <p className="text-xs text-zinc-500">
                By activating, you confirm that <strong>{clinicEmail}</strong> is your Google account email.
                You will use this email to login via Google Sign-In.
              </p>
              <Button
                onClick={handleActivate}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Activate Clinic
              </Button>
            </div>
          )}

          {status === 'activating' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mb-3" />
              <p className="text-sm text-zinc-500">Activating your clinic...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                {clinicName} Activated!
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Your clinic has been activated. You can now login using your Google account (<strong>{clinicEmail}</strong>).
              </p>
              <Button
                onClick={() => router.push('/clinic')}
                className="bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Go to Clinic Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Activation Failed</h3>
              <p className="text-sm text-zinc-500 mb-4">{errorMessage}</p>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
              >
                Go Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ActivateClinicPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    }>
      <ActivateClinicContent />
    </Suspense>
  );
}
