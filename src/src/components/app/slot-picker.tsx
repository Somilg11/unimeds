'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { isBrowserZone, isoDateInZone, zoneLabel } from '@/lib/format';
import type { Slot } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = {
  doctorId: string;
  clinicId: string;
  timezone: string;
  value: string | null;
  onChange: (slot: Slot | null) => void;
  days?: number;
};

/**
 * Date strip + time grid. Dates are clinic-local; the selected value is the
 * exact `startsAt` returned by the API, which is what booking endpoints expect.
 */
export function SlotPicker({ doctorId, clinicId, timezone, value, onChange, days = 14 }: Props) {
  const dates = Array.from({ length: days }, (_, i) => isoDateInZone(timezone, i));
  const [date, setDate] = useState(dates[0]!);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['slots', doctorId, clinicId, date],
    queryFn: () => api.get<{ timezone: string; slots: Slot[] }>('/public/slots', { doctorId, clinicId, date }),
  });

  const fmtDay = (d: string) => {
    // Noon UTC keeps the calendar day stable in any zone
    const dt = new Date(`${d}T12:00:00Z`);
    return {
      weekday: new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'UTC' }).format(dt),
      day: new Intl.DateTimeFormat('en-IN', { day: 'numeric', timeZone: 'UTC' }).format(dt),
      month: new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'UTC' }).format(dt),
    };
  };

  return (
    // min-w-0: inside grid/flex parents (dialogs, sheets) the date strip must scroll, not stretch the parent
    <div className="w-full min-w-0 space-y-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {dates.map((d) => {
          const f = fmtDay(d);
          const active = d === date;
          return (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDate(d);
                onChange(null);
              }}
              className={cn(
                'flex w-[4.25rem] shrink-0 flex-col items-center rounded-2xl bg-card px-2 py-3 text-xs ring-1 ring-border transition-colors',
                active ? 'bg-primary text-primary-foreground ring-primary' : 'hover:ring-foreground/20'
              )}
            >
              <span className={cn(!active && 'text-muted-foreground')}>{f.weekday}</span>
              <span className="text-xl leading-tight font-bold">{f.day}</span>
              <span className={cn(!active && 'text-muted-foreground')}>{f.month}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : isError ? (
        <p className="py-6 text-center text-sm text-destructive">Couldn&apos;t load times. Please try again.</p>
      ) : data?.slots.length ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {data.slots.map((s) => (
            <button
              key={s.startsAt}
              type="button"
              onClick={() => onChange(s)}
              className={cn(
                'min-h-11 rounded-full border bg-card px-2 py-2.5 text-sm font-medium tabular-nums transition-colors',
                value === s.startsAt ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/60'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card py-6 text-center text-sm text-muted-foreground">
          No free times on this day.
          {dates.indexOf(date) < dates.length - 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDate(dates[dates.indexOf(date) + 1]!);
                onChange(null);
              }}
            >
              Next day <ChevronRight />
            </Button>
          )}
        </div>
      )}

      {!isBrowserZone(timezone) && (
        <p className="text-xs text-muted-foreground">Times are shown in the clinic&apos;s local time ({zoneLabel(timezone)}).</p>
      )}
    </div>
  );
}
