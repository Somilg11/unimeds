import type { MetadataRoute } from 'next';
import { API_URL } from '@/lib/auth';
import { absoluteUrl } from '@/lib/site';

// Rebuilt at most hourly so new doctors and clinics get indexed
export const revalidate = 3600;

const STATIC: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/doctors', priority: 0.9, changeFrequency: 'daily' },
  { path: '/clinics', priority: 0.9, changeFrequency: 'daily' },
  { path: '/for-clinics', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/signup', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/legal/terms', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/security', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/compliance', priority: 0.2, changeFrequency: 'yearly' },
];

/** Walks a paginated public endpoint (max 100 per page, capped for safety). */
async function all<T>(path: string, maxPages = 50): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`${API_URL}/api/v1${path}?page=${page}&pageSize=100`, { next: { revalidate } }).catch(() => null);
    if (!res?.ok) break;
    const data = (await res.json()) as { items: T[]; totalPages: number };
    out.push(...data.items);
    if (page >= data.totalPages) break;
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [doctors, clinics] = await Promise.all([all<{ id: string }>('/public/doctors'), all<{ slug: string }>('/public/clinics')]);
  return [
    ...STATIC.map((s) => ({ url: absoluteUrl(s.path), lastModified: now, changeFrequency: s.changeFrequency, priority: s.priority })),
    ...doctors.map((d) => ({ url: absoluteUrl(`/doctors/${d.id}`), lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...clinics.map((c) => ({ url: absoluteUrl(`/clinics/${c.slug}`), lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ];
}
