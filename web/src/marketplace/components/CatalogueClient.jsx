"use client";

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CostumeCard } from '@/marketplace/components/CostumeCard';
import { useCart } from '@/marketplace/CartContext';
import { costumes } from '@/marketplace/data';
import { formatBusinessDate } from '@/marketplace/format';

const ALL = 'all';
const EMPTY_FILTERS = { region: ALL, category: ALL, size: ALL };

function getFilteredCostumes({ filters, query, sort }) {
  const normalized = query.trim().toLocaleLowerCase('id-ID');
  return costumes
    .filter((costume) => {
      const matchesQuery = !normalized || `${costume.name} ${costume.region} ${costume.category}`.toLocaleLowerCase('id-ID').includes(normalized);
      return matchesQuery
        && (filters.region === ALL || costume.region === filters.region)
        && (filters.category === ALL || costume.category === filters.category)
        && (filters.size === ALL || costume.size === filters.size);
    })
    .toSorted((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      return a.name.localeCompare(b.name, 'id-ID');
    });
}

function FilterFields({ filters, idPrefix, onChange }) {
  const update = (key) => (value) => onChange({ ...filters, [key]: value });

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-region`}>Daerah</Label>
        <Select value={filters.region} onValueChange={update('region')}>
          <SelectTrigger id={`${idPrefix}-region`} aria-label={`Daerah filter ${idPrefix}`} className="h-11 w-full rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)]">
            <SelectValue placeholder="Semua daerah" />
          </SelectTrigger>
          <SelectContent className="marketplace-theme">
            <SelectItem value={ALL}>Semua daerah</SelectItem>
            {[...new Set(costumes.map((costume) => costume.region))].map((value) => (
              <SelectItem key={value} value={value}>{value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-category`}>Kategori</Label>
        <Select value={filters.category} onValueChange={update('category')}>
          <SelectTrigger id={`${idPrefix}-category`} aria-label={`Kategori filter ${idPrefix}`} className="h-11 w-full rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)]">
            <SelectValue placeholder="Semua kategori" />
          </SelectTrigger>
          <SelectContent className="marketplace-theme">
            <SelectItem value={ALL}>Semua kategori</SelectItem>
            {[...new Set(costumes.map((costume) => costume.category))].map((value) => (
              <SelectItem key={value} value={value}>{value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-size`}>Ukuran</Label>
        <Select value={filters.size} onValueChange={update('size')}>
          <SelectTrigger id={`${idPrefix}-size`} aria-label={`Ukuran filter ${idPrefix}`} className="h-11 w-full rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)]">
            <SelectValue placeholder="Semua ukuran" />
          </SelectTrigger>
          <SelectContent className="marketplace-theme">
            <SelectItem value={ALL}>Semua ukuran</SelectItem>
            {[...new Set(costumes.map((costume) => costume.size))].map((value) => (
              <SelectItem key={value} value={value}>{value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function CatalogueClient() {
  const searchParams = useSearchParams();
  const { eventDate, setEventDate } = useCart();
  const [query, setQuery] = useState(() => searchParams.get('search') ?? '');
  const [appliedFilters, setAppliedFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    category: searchParams.get('category') ?? ALL,
  }));
  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState('featured');
  const [resultAnnouncement, setResultAnnouncement] = useState('');
  const [minimumDate] = useState(() => new Date().toISOString().slice(0, 10));

  const filtered = useMemo(
    () => getFilteredCostumes({ filters: appliedFilters, query, sort }),
    [appliedFilters, query, sort],
  );
  const draftCount = useMemo(
    () => getFilteredCostumes({ filters: draftFilters, query, sort }).length,
    [draftFilters, query, sort],
  );

  const clearFilters = () => {
    setQuery('');
    setAppliedFilters(EMPTY_FILTERS);
  };

  const changeFilterOpen = (open) => {
    if (open) setDraftFilters(appliedFilters);
    setFilterOpen(open);
  };

  const applyDraftFilters = () => {
    setAppliedFilters(draftFilters);
    setResultAnnouncement(`${draftCount} kostum ditampilkan.`);
    setFilterOpen(false);
  };

  return (
    <div className="marketplace-container py-10 md:py-14">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-[-0.04em] md:text-5xl">Katalog kostum</h1>
        <p className="mt-4 text-[var(--mk-muted)]">Pilih tanggal acara agar ketersediaan sesuai dengan kebutuhanmu.</p>
      </div>

      <div className="mt-8 grid gap-3 rounded-2xl border border-[var(--mk-line)] bg-[var(--mk-surface)] p-4 lg:grid-cols-[1fr_240px_auto] lg:items-end">
        <div className="grid gap-2">
          <Label htmlFor="catalogue-search">Cari kostum</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--mk-subtle)]" aria-hidden="true" />
            <Input
              id="catalogue-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nama, daerah, atau kategori"
              className="h-11 rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)] pl-10"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="catalogue-date">Tanggal acara</Label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--mk-subtle)]" aria-hidden="true" />
            <Input
              id="catalogue-date"
              type="date"
              value={eventDate}
              min={minimumDate}
              onChange={(event) => setEventDate(event.target.value)}
              className="h-11 rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)] pl-10 tabular-nums"
            />
          </div>
        </div>
        <Sheet open={filterOpen} onOpenChange={changeFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-11 rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)] lg:hidden">
              <SlidersHorizontal aria-hidden="true" /> Filter
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="marketplace-theme max-h-[75dvh] rounded-t-[20px] p-0">
            <SheetHeader className="border-b border-[var(--mk-line)] px-5 py-4">
              <SheetTitle>Filter katalog</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto px-5 py-4">
              <FilterFields filters={draftFilters} idPrefix="seluler" onChange={setDraftFilters} />
            </div>
            <SheetFooter className="sticky bottom-0 grid grid-cols-[auto_1fr] border-t border-[var(--mk-line)] bg-[var(--mk-surface)] p-4">
              <Button type="button" variant="outline" className="h-12 rounded-xl border-[var(--mk-line-strong)]" onClick={() => setDraftFilters(EMPTY_FILTERS)}>
                Reset
              </Button>
              <Button type="button" className="h-12 rounded-xl bg-[var(--mk-primary)] text-[var(--mk-on-primary)] hover:bg-[var(--mk-primary-hover)]" onClick={applyDraftFilters}>
                Tampilkan {draftCount} kostum
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{resultAnnouncement}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block" aria-label="Filter katalog">
          <div className="sticky top-28">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold"><Filter size={17} aria-hidden="true" /> Filter</h2>
              <Button type="button" variant="ghost" className="h-10 px-2 text-xs text-[var(--mk-primary)]" onClick={clearFilters}>Reset</Button>
            </div>
            <FilterFields filters={appliedFilters} idPrefix="desktop" onChange={setAppliedFilters} />
          </div>
        </aside>

        <section aria-labelledby="catalogue-results">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--mk-line)] pb-5">
            <div>
              <h2 id="catalogue-results" className="font-bold">{filtered.length} kostum ditemukan</h2>
              <p className="mt-1 text-sm text-[var(--mk-muted)]">Untuk acara {formatBusinessDate(eventDate)}</p>
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-11 w-[190px] rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)]" aria-label="Urutkan katalog">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="marketplace-theme">
                <SelectItem value="featured">Pilihan KBR</SelectItem>
                <SelectItem value="price-low">Harga terendah</SelectItem>
                <SelectItem value="price-high">Harga tertinggi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length > 0 ? (
            <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-3 lg:gap-x-4 xl:grid-cols-4 xl:gap-x-5">
              {filtered.map((costume, index) => (
                <CostumeCard key={costume.id} costume={costume} priority={index === 0} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-[var(--mk-line-strong)] bg-[var(--mk-surface)] px-6 py-16 text-center">
              <X className="mx-auto size-8 text-[var(--mk-subtle)]" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold">Belum ada kostum yang cocok</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--mk-muted)]">Ubah kata pencarian atau hapus beberapa filter untuk melihat pilihan lain.</p>
              <Button type="button" variant="outline" className="mt-6 h-11 rounded-xl border-[var(--mk-line-strong)]" onClick={clearFilters}>
                Hapus filter
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
