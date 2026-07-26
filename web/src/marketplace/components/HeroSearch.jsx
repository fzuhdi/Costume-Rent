"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/marketplace/CartContext';

export function HeroSearch() {
  const router = useRouter();
  const { eventDate, setEventDate } = useCart();
  const [query, setQuery] = useState('');
  const [minimumDate] = useState(() => new Date().toISOString().slice(0, 10));

  const submit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (eventDate) params.set('event_date', eventDate);
    router.push(`/catalogue?${params.toString()}`);
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-[var(--mk-line)] bg-[var(--mk-surface)] p-3 shadow-[0_8px_24px_rgb(16_24_40_/_0.08)] sm:grid-cols-[1.2fr_1fr_auto] sm:items-end">
      <div className="grid gap-2">
        <Label htmlFor="hero-search" className="px-1 text-xs font-bold">Cari kostum</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--mk-subtle)]" aria-hidden="true" />
          <Input
            id="hero-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nama tari atau kostum"
            className="h-12 rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)] pl-10"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="hero-date" className="px-1 text-xs font-bold">Tanggal acara</Label>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--mk-subtle)]" aria-hidden="true" />
          <Input
            id="hero-date"
            type="date"
            value={eventDate}
            min={minimumDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="h-12 rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)] pl-10 tabular-nums"
            required
          />
        </div>
      </div>
      <Button type="submit" className="h-12 rounded-xl bg-[var(--mk-primary)] px-6 text-[var(--mk-on-primary)] hover:bg-[var(--mk-primary-hover)]">
        Cek ketersediaan
      </Button>
    </form>
  );
}
