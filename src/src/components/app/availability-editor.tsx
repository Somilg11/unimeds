'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { DAY_NAMES } from '@/lib/format';
import type { AvailabilityBlock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

type Block = Pick<AvailabilityBlock, 'dayOfWeek' | 'startTime' | 'endTime'>;

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first

function validate(blocks: Block[]): string | null {
  for (const day of ORDER) {
    const list = blocks.filter((b) => b.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 0; i < list.length; i++) {
      const b = list[i]!;
      if (b.startTime >= b.endTime) return `${DAY_NAMES[day]}: start time must be before end time`;
      if (i > 0 && b.startTime < list[i - 1]!.endTime) return `${DAY_NAMES[day]}: time blocks overlap`;
    }
  }
  return null;
}

/** Weekly schedule editor. Times are wall-clock in the clinic's timezone. */
export function AvailabilityEditor({
  initial,
  timezone,
  saving,
  onSave,
}: {
  initial: Block[];
  timezone: string;
  saving?: boolean;
  onSave: (schedule: Block[]) => void;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initial);
  // Reset only when the saved schedule actually changes, not on every new array identity
  const initialKey = JSON.stringify(initial);
  const [seenKey, setSeenKey] = useState(initialKey);
  if (seenKey !== initialKey) {
    setSeenKey(initialKey);
    setBlocks(initial);
  }
  const error = validate(blocks);

  const update = (idx: number, patch: Partial<Block>) => setBlocks((bs) => bs.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  const remove = (idx: number) => setBlocks((bs) => bs.filter((_, i) => i !== idx));
  const add = (day: number) => {
    const last = blocks.filter((b) => b.dayOfWeek === day).sort((a, b) => a.endTime.localeCompare(b.endTime)).at(-1);
    const start = last ? last.endTime : '09:00';
    const [h] = start.split(':').map(Number);
    const end = `${String(Math.min((h ?? 9) + 3, 23)).padStart(2, '0')}:${start.split(':')[1]}`;
    setBlocks((bs) => [...bs, { dayOfWeek: day, startTime: start, endTime: end > start ? end : '23:59' }]);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">All times are in the clinic&apos;s timezone ({timezone}).</p>
      <div className="divide-y rounded-xl border">
        {ORDER.map((day) => {
          const indexed = blocks.map((b, i) => ({ b, i })).filter(({ b }) => b.dayOfWeek === day);
          const on = indexed.length > 0;
          return (
            <div key={day} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
              <label className="flex w-40 items-center gap-3 pt-1.5 text-sm font-medium">
                <Switch
                  checked={on}
                  onCheckedChange={(v) => (v ? add(day) : setBlocks((bs) => bs.filter((b) => b.dayOfWeek !== day)))}
                  aria-label={`Available on ${DAY_NAMES[day]}`}
                />
                {DAY_NAMES[day]}
              </label>
              <div className="flex-1 space-y-2">
                {!on && <p className="pt-1.5 text-sm text-muted-foreground">Unavailable</p>}
                {indexed.map(({ b, i }) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input type="time" value={b.startTime} onChange={(e) => update(i, { startTime: e.target.value })} className="w-32" aria-label="Start time" />
                    <span className="text-muted-foreground">–</span>
                    <Input type="time" value={b.endTime} onChange={(e) => update(i, { endTime: e.target.value })} className="w-32" aria-label="End time" />
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(i)} aria-label="Remove block">
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                {on && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => add(day)}>
                    <Plus /> Add hours
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button disabled={Boolean(error) || saving} onClick={() => onSave(blocks)}>
          {saving && <Loader2 className="animate-spin" />}
          Save schedule
        </Button>
      </div>
    </div>
  );
}
