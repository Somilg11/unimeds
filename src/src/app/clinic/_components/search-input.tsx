'use client';

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

/** Debounced search box; `onSearch` fires 300 ms after typing stops. */
export function SearchInput({
  value,
  onSearch,
  placeholder,
  label,
}: {
  value: string;
  onSearch: (q: string) => void;
  placeholder?: string;
  label: string;
}) {
  const [text, setText] = useState(value);
  const latest = useRef(onSearch);
  useEffect(() => {
    latest.current = onSearch;
  });

  useEffect(() => {
    if (text.trim() === value) return;
    const t = setTimeout(() => latest.current(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text, value]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={label} className="pl-9" />
    </div>
  );
}
