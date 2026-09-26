'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Clinic, Team } from './types';

export const clinicKeys = {
  profile: ['clinic', 'profile'] as const,
  overview: ['clinic', 'overview'] as const,
  team: ['clinic', 'team'] as const,
  appointments: ['clinic', 'appointments'] as const,
  appointment: (id: string) => ['clinic', 'appointment', id] as const,
  patients: ['clinic', 'patients'] as const,
  records: ['clinic', 'records'] as const,
  analytics: ['clinic', 'analytics'] as const,
  audit: ['clinic', 'audit'] as const,
};

/** The admin's clinic (GET /clinic). Shared by the layout and every page. */
export function useClinic() {
  return useQuery({
    queryKey: clinicKeys.profile,
    queryFn: async () => (await api.get<{ clinic: Clinic }>('/clinic')).clinic,
    staleTime: 5 * 60_000,
  });
}

export function useTeam() {
  return useQuery({ queryKey: clinicKeys.team, queryFn: () => api.get<Team>('/clinic/team') });
}

/** Read/write URL search params (filters, page) without adding history entries. */
export function useUrlState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const set = useCallback(
    (patch: Record<string, string | number | null | undefined>, opts: { resetPage?: boolean } = { resetPage: true }) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === '') next.delete(k);
        else next.set(k, String(v));
      }
      if (opts.resetPage && !('page' in patch)) next.delete('page');
      const s = next.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  const page = Math.max(1, Number(params.get('page')) || 1);
  return { params, set, page };
}
