'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

/** Filters and page kept in the URL. Callers must be rendered inside <Suspense>. */
export function useUrlState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const get = (key: string) => params.get(key) ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  /** Updates params; any change other than `page` resets to page 1. */
  const set = (updates: Record<string, string | number | null | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === undefined || v === '' || (k === 'page' && Number(v) <= 1)) next.delete(k);
      else next.set(k, String(v));
    }
    if (!('page' in updates)) next.delete('page');
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  return { get, set, page };
}

/** Debounced search box; calls onSearch 300ms after typing stops. */
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
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });
  useEffect(() => {
    if (text.trim() === value) return;
    const t = setTimeout(() => onSearchRef.current(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text, value]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-10 rounded-full border-0 bg-card pl-10 shadow-none"
      />
    </div>
  );
}
