'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, LocateFixed, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL = '__all__';

export type DirectoryFilterValues = {
  q: string;
  city: string;
  specialization?: string;
  near: boolean;
};

/**
 * Filter bar for the public directories. Current values come from the server page;
 * changes are written back to the URL, which re-renders the server component.
 */
export function DirectoryFilters({
  values,
  specializations,
  searchLabel,
  searchPlaceholder,
}: {
  values: DirectoryFilterValues;
  specializations?: string[];
  searchLabel: string;
  searchPlaceholder: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [q, setQ] = useState(values.q);
  const [city, setCity] = useState(values.city);

  const push = (next: Partial<Record<'q' | 'city' | 'specialization' | 'lat' | 'lng', string | null>>) => {
    const params = new URLSearchParams(window.location.search);
    params.delete('page');
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const s = params.toString();
    startTransition(() => router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  };

  const nearMe = () => {
    if (values.near) {
      push({ lat: null, lng: null });
      return;
    }
    if (!('geolocation' in navigator)) {
      toast.error('Your browser does not support location.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        push({ lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4) });
      },
      () => {
        setLocating(false);
        toast.error('We could not get your location. Check your browser permissions.');
      },
      { timeout: 10_000, maximumAge: 300_000 }
    );
  };

  const hasFilters = values.q || values.city || values.specialization || values.near;

  return (
    <form
      role="search"
      className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_180px_200px_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        push({ q: q.trim() || null, city: city.trim() || null });
      }}
    >
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="dir-q">{searchLabel}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="dir-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} className="pl-9" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dir-city">City</Label>
        <Input id="dir-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Any city" />
      </div>
      {specializations ? (
        <div className="space-y-1.5">
          <Label htmlFor="dir-spec">Specialization</Label>
          <Select
            value={values.specialization || ALL}
            onValueChange={(v) => push({ specialization: v === ALL ? null : v })}
          >
            <SelectTrigger id="dir-spec" className="w-full">
              <SelectValue placeholder="All specializations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All specializations</SelectItem>
              {specializations.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="hidden lg:block" />
      )}
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-1">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Search />} Search
        </Button>
        <Button type="button" variant={values.near ? 'secondary' : 'outline'} onClick={nearMe} disabled={locating} aria-pressed={values.near}>
          {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />} Near me
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQ('');
              setCity('');
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
          >
            <X /> Clear
          </Button>
        )}
      </div>
    </form>
  );
}
