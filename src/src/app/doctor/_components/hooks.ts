'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ClinicSettings, EmergencyContact } from '@/lib/types';

export type DoctorClinic = {
  id: string;
  name: string;
  timezone: string;
  city: string | null;
  address: string | null;
  settings: ClinicSettings;
};

/** Clinical view of a patient returned by the doctor endpoints. */
export type ClinicalPatient = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string;
  emergencyContact?: EmergencyContact;
};

export type DoctorPatientRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  visits: number;
  lastVisit: string | null;
  nextVisit: string | null;
};

export function useDoctorClinics() {
  return useQuery({
    queryKey: ['doctor', 'clinics'],
    queryFn: () => api.get<{ items: DoctorClinic[] }>('/doctor/clinics'),
    staleTime: 5 * 60_000,
  });
}

/** Every doctor query key starts with 'doctor', so one invalidation refreshes the portal after a change. */
export const invalidateDoctor = (qc: QueryClient) => qc.invalidateQueries({ queryKey: ['doctor'] });

/** Current time, refreshed periodically; keeps render pure (no Date.now() during render). */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Read/write list filters in the URL. Changing any filter other than `page` resets to page 1. */
export function useUrlFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const set = useCallback(
    (patch: Record<string, string | number | null | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === '' || v === 'all') next.delete(k);
        else next.set(k, String(v));
      }
      if (!('page' in patch)) next.delete('page');
      if (next.get('page') === '1') next.delete('page');
      const s = next.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );
  const page = Math.max(1, Number(params.get('page')) || 1);
  return { params, set, page };
}

/** Whole years since a YYYY-MM-DD date of birth. */
export function ageFrom(dob: string | undefined | null, now: number): number | null {
  if (!dob) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dob);
  if (!m) return null;
  const today = new Date(now);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age--;
  return age >= 0 && age < 150 ? age : null;
}
