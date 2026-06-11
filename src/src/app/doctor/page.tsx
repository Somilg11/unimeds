'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DoctorLoginPage() {
  const router = useRouter();
  const [authId, setAuthId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('doctor_token');
    if (token) {
      router.push('/doctor/dashboard');
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!authId.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/doctor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authId: authId.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('doctor_token', data.token);
      localStorage.setItem('doctor_user', JSON.stringify(data.user));
      router.push('/doctor/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border border-zinc-200">
        <CardHeader className="text-center p-6">
          <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-6 h-6 text-zinc-600" />
          </div>
          <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">
            Doctor Portal
          </CardTitle>
          <p className="text-sm text-zinc-500 mt-1">
            Sign in with your credentials
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs text-zinc-600">Auth ID</Label>
              <Input
                type="text"
                placeholder="Enter your auth ID"
                value={authId}
                onChange={(e) => setAuthId(e.target.value)}
                className="bg-zinc-50 border border-zinc-200"
                autoFocus
              />
              <p className="text-[10px] text-zinc-400">
                This is the identifier provided by your clinic administrator.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
              disabled={loading || !authId.trim()}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
