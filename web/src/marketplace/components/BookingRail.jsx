"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Check, MapPin, Truck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/marketplace/CartContext';
import { formatRupiah } from '@/marketplace/format';
import { MobileActionBar } from '@/marketplace/components/MobileActionBar';
import { QuantityStepper } from '@/marketplace/components/QuantityStepper';
import { RentalDates } from '@/marketplace/components/RentalDates';

export function BookingRail({ costume }) {
  const { addItem, eventDate, setEventDate } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [dateError, setDateError] = useState('');
  const [showMobileAction, setShowMobileAction] = useState(true);
  const [minimumDate] = useState(() => new Date().toISOString().slice(0, 10));
  const dateInputRef = useRef(null);
  const inlineActionRef = useRef(null);
  const downpayment = Math.ceil((costume.price * quantity) / 2);

  useEffect(() => {
    if (!inlineActionRef.current || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setShowMobileAction(!entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(inlineActionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleAdd = () => {
    if (!eventDate) {
      setDateError('Pilih tanggal acara sebelum menambahkan kostum.');
      dateInputRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
      dateInputRef.current?.focus({ preventScroll: true });
      return;
    }

    setDateError('');
    addItem(costume, quantity);
    setAdded(true);
  };

  return (
    <>
      <Card className="rounded-[20px] border-[var(--mk-line)] bg-[var(--mk-surface)] shadow-[var(--mk-shadow-float)]">
        <CardContent className="p-5 sm:p-6">
          <div className="grid gap-2">
            <Label htmlFor="booking-event-date">Tanggal acara</Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--mk-subtle)]" aria-hidden="true" />
              <Input
                ref={dateInputRef}
                id="booking-event-date"
                type="date"
                value={eventDate}
                min={minimumDate}
                aria-invalid={Boolean(dateError)}
                aria-describedby={dateError ? 'booking-date-error' : undefined}
                onChange={(event) => {
                  setEventDate(event.target.value);
                  setAdded(false);
                  setDateError('');
                }}
                className="h-12 rounded-xl border-[var(--mk-line-strong)] pl-10 tabular-nums"
              />
            </div>
            {dateError ? (
              <p id="booking-date-error" className="text-sm font-semibold text-[var(--mk-danger)]" role="alert">
                {dateError}
              </p>
            ) : null}
          </div>

          <div className="mt-5 rounded-2xl bg-[var(--mk-canvas)] p-4">
            <RentalDates eventDate={eventDate} />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">Jumlah</p>
              <p className="mt-1 text-xs text-[var(--mk-muted)]">Maksimal {costume.maxQuantity} untuk pesanan online</p>
            </div>
            {costume.maxQuantity === 1 ? (
              <span className="inline-flex h-11 items-center rounded-xl bg-[var(--mk-canvas)] px-4 text-sm font-bold">
                Jumlah 1
              </span>
            ) : (
              <QuantityStepper value={quantity} max={costume.maxQuantity} onChange={setQuantity} />
            )}
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-bold">Cara menerima kostum</p>
            <Tabs defaultValue="pickup">
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl bg-[var(--mk-canvas)] p-1">
                <TabsTrigger value="pickup" className="rounded-lg"><MapPin aria-hidden="true" /> Ambil</TabsTrigger>
                <TabsTrigger value="delivery" className="rounded-lg"><Truck aria-hidden="true" /> Minta antar</TabsTrigger>
              </TabsList>
              <TabsContent value="pickup" className="mt-3 text-xs leading-5 text-[var(--mk-muted)]">
                Pengambilan di toko tersedia sesuai tanggal yang tertera.
              </TabsContent>
              <TabsContent value="delivery" className="mt-3 text-xs leading-5 text-[var(--mk-muted)]">
                Pengantaran baru berlaku setelah dikonfirmasi staf. Ambil di toko tetap menjadi pilihan cadangan.
              </TabsContent>
            </Tabs>
          </div>

          <div className="mt-6 rounded-xl bg-[var(--mk-primary-soft)] p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-[var(--mk-muted)]">Downpayment 50%</span>
              <strong className="tabular-nums">{formatRupiah(downpayment)}</strong>
            </div>
          </div>

          {added ? (
            <Alert announcement="status" className="mt-5 border-[var(--mk-success)]/25 bg-[var(--mk-success-soft)] text-[var(--mk-success)]">
              <Check aria-hidden="true" />
              <AlertTitle>Ditambahkan ke keranjang</AlertTitle>
              <AlertDescription className="text-[var(--mk-success)]/90">Tanggal dan jumlah dapat diperiksa kembali sebelum checkout.</AlertDescription>
            </Alert>
          ) : null}

          <Button
            ref={inlineActionRef}
            type="button"
            onClick={handleAdd}
            className="mt-5 h-12 w-full rounded-xl bg-[var(--mk-primary)] text-[var(--mk-on-primary)] hover:bg-[var(--mk-primary-hover)]"
          >
            Tambah ke keranjang
          </Button>
          {added ? (
            <Button asChild variant="outline" className="mt-2 h-12 w-full rounded-xl border-[var(--mk-line-strong)]">
              <Link href="/cart">Lihat keranjang</Link>
            </Button>
          ) : null}
          <p className="mt-4 text-center text-xs leading-5 text-[var(--mk-muted)]">
            Keranjang belum menahan stok. Stok ditahan selama 60 menit setelah checkout dibuat.
          </p>
        </CardContent>
      </Card>

      <MobileActionBar
        visible={showMobileAction}
        label={`Pesan ${costume.name}`}
        context={(
          <>
            <p className="truncate text-xs text-[var(--mk-muted)]">{costume.name}</p>
            <p className="font-bold tabular-nums">{formatRupiah(costume.price)}</p>
          </>
        )}
        helper={!eventDate ? 'Pilih tanggal acara untuk melanjutkan.' : null}
      >
        <Button type="button" onClick={handleAdd} className="h-12 rounded-xl bg-[var(--mk-primary)] px-4 text-[var(--mk-on-primary)] hover:bg-[var(--mk-primary-hover)]">
          Tambah
        </Button>
      </MobileActionBar>
    </>
  );
}
