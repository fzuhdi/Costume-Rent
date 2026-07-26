"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { CalendarDays, ChevronLeft, ShoppingBag, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/marketplace/CartContext';
import { formatRupiah } from '@/marketplace/format';
import { MobileActionBar } from '@/marketplace/components/MobileActionBar';
import { QuantityStepper } from '@/marketplace/components/QuantityStepper';
import { RentalDates } from '@/marketplace/components/RentalDates';

export default function CartPage() {
  const { items, eventDate, setEventDate, updateQuantity, removeItem, subtotal, hydrated } = useCart();
  const [minimumDate] = useState(() => new Date().toISOString().slice(0, 10));

  if (!hydrated) {
    return (
      <div className="marketplace-container py-16" aria-live="polite">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--mk-line)]" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-[var(--mk-line)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="marketplace-container py-16 md:py-24">
        <div className="mx-auto max-w-lg rounded-[20px] border border-dashed border-[var(--mk-line-strong)] bg-[var(--mk-surface)] px-6 py-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--mk-primary-soft)] text-[var(--mk-primary)]">
            <ShoppingBag aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">Keranjangmu masih kosong</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--mk-muted)]">Pilih kostum dan tanggal acara. Menambahkan ke keranjang belum menahan stok.</p>
          <Button asChild className="mt-7 h-12 rounded-xl bg-[var(--mk-primary)] px-6 text-[var(--mk-on-primary)]">
            <Link href="/catalogue">Jelajahi katalog</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-container marketplace-mobile-action-space py-8 md:py-12">
      <Link href="/catalogue" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--mk-muted)] hover:text-[var(--mk-primary)]">
        <ChevronLeft aria-hidden="true" /> Lanjut pilih kostum
      </Link>
      <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] md:text-5xl">Keranjang sewa</h1>
      <p className="mt-3 text-[var(--mk-muted)]">Semua kostum menggunakan satu tanggal acara.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="grid gap-5">
          <Card className="rounded-[20px] border-[var(--mk-line)] bg-[var(--mk-surface)]">
            <CardContent className="p-5 sm:p-6">
              <div className="grid gap-2">
                <Label htmlFor="cart-event-date">Tanggal acara</Label>
                <div className="relative max-w-sm">
                  <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--mk-subtle)]" aria-hidden="true" />
                  <Input
                    id="cart-event-date"
                    type="date"
                    value={eventDate}
                    min={minimumDate}
                    onChange={(event) => setEventDate(event.target.value)}
                    className="h-12 rounded-xl border-[var(--mk-line-strong)] pl-10 tabular-nums"
                  />
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-[var(--mk-canvas)] p-4">
                <RentalDates eventDate={eventDate} compact />
              </div>
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-[20px] border border-[var(--mk-line)] bg-[var(--mk-surface)]">
            {items.map((item, index) => (
              <article key={item.id} className={`grid grid-cols-[92px_1fr] gap-4 p-4 sm:grid-cols-[120px_1fr_auto] sm:p-5 ${index > 0 ? 'border-t' : ''}`}>
                <Link href={`/costumes/${item.id}`} className="marketplace-image relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--mk-media-placeholder)]">
                  <Image src={item.image} alt={item.name} fill sizes="120px" className="object-cover" />
                </Link>
                <div className="min-w-0">
                  <Link href={`/costumes/${item.id}`} className="font-bold hover:text-[var(--mk-primary)]">{item.name}</Link>
                  <p className="mt-1 text-sm text-[var(--mk-muted)]">{item.region} / Ukuran {item.size}</p>
                  <p className="mt-3 font-bold tabular-nums">{formatRupiah(item.price)}</p>
                  <div className="mt-4 sm:hidden">
                    {item.maxQuantity === 1 ? (
                      <span className="inline-flex h-11 items-center rounded-xl bg-[var(--mk-canvas)] px-4 text-sm font-bold">Jumlah 1</span>
                    ) : (
                      <QuantityStepper value={item.quantity} max={item.maxQuantity} onChange={(value) => updateQuantity(item.id, value)} label={`Jumlah ${item.name}`} />
                    )}
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end">
                  <div className="hidden sm:block">
                    {item.maxQuantity === 1 ? (
                      <span className="inline-flex h-11 items-center rounded-xl bg-[var(--mk-canvas)] px-4 text-sm font-bold">Jumlah 1</span>
                    ) : (
                      <QuantityStepper value={item.quantity} max={item.maxQuantity} onChange={(value) => updateQuantity(item.id, value)} label={`Jumlah ${item.name}`} />
                    )}
                  </div>
                  <Button type="button" variant="ghost" className="h-11 px-3 text-[var(--mk-danger)] hover:bg-[var(--mk-danger-soft)] hover:text-[var(--mk-danger)]" onClick={() => removeItem(item.id)}>
                    <Trash2 aria-hidden="true" /> Hapus
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <Alert className="rounded-2xl border-[var(--mk-info)]/25 bg-[var(--mk-info-soft)] text-[var(--mk-info)]">
            <ShoppingBag aria-hidden="true" />
            <AlertTitle>Stok belum ditahan</AlertTitle>
            <AlertDescription className="text-[var(--mk-info)]/90">Harga dan ketersediaan diperiksa kembali saat kamu melanjutkan checkout.</AlertDescription>
          </Alert>
        </div>

        <aside className="lg:sticky lg:top-24">
          <Card className="rounded-[20px] border-[var(--mk-line)] bg-[var(--mk-surface)] shadow-[var(--mk-shadow-float)]">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-xl font-bold">Ringkasan biaya</h2>
              <dl className="mt-6 grid gap-4 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-[var(--mk-muted)]">Biaya sewa</dt><dd className="font-bold tabular-nums">{formatRupiah(subtotal)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[var(--mk-muted)]">Downpayment 50%</dt><dd className="font-bold tabular-nums">{formatRupiah(Math.ceil(subtotal / 2))}</dd></div>
              </dl>
              <div className="my-5 border-t border-[var(--mk-line)]" />
              <p className="text-xs leading-5 text-[var(--mk-muted)]">Biaya pengantaran tidak termasuk downpayment dan hanya berlaku setelah dikonfirmasi staf.</p>
              <Button asChild className="mt-6 hidden h-12 w-full rounded-xl bg-[var(--mk-primary)] text-[var(--mk-on-primary)] hover:bg-[var(--mk-primary-hover)] lg:flex">
                <Link href="/checkout">Lanjut ke checkout</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <MobileActionBar
        label="Lanjutkan ke checkout"
        context={(
          <>
            <p className="text-xs text-[var(--mk-muted)]">Downpayment 50%</p>
            <p className="font-bold tabular-nums">{formatRupiah(Math.ceil(subtotal / 2))}</p>
          </>
        )}
      >
        <Button asChild className="h-12 rounded-xl bg-[var(--mk-primary)] px-4 text-[var(--mk-on-primary)] hover:bg-[var(--mk-primary-hover)]">
          <Link href="/checkout">Lanjut</Link>
        </Button>
      </MobileActionBar>
    </div>
  );
}
