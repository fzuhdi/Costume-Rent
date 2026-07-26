"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Clock3, RotateCw, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function ProcessingState() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order') ?? 'KBR-240725-018';
  const [checked, setChecked] = useState(false);

  return (
    <div className="marketplace-container py-16 md:py-24">
      <Card className="mx-auto max-w-2xl rounded-[20px] border-[var(--mk-line)] bg-[var(--mk-surface)]">
        <CardContent className="p-6 text-center sm:p-10">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[var(--mk-warning-soft)] text-[var(--mk-warning)]">
            <Clock3 className="size-8" aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-bold text-[var(--mk-muted)] tabular-nums">{orderId}</p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Pembayaran masih diproses</h1>
          <p className="mx-auto mt-4 max-w-lg leading-7 text-[var(--mk-muted)]">
            Kami menunggu konfirmasi langsung dari Midtrans. Jangan tutup pesanan atau membuat checkout baru.
          </p>
          <Alert className="mt-7 text-left">
            <ShieldCheck aria-hidden="true" />
            <AlertTitle>Status berasal dari server</AlertTitle>
            <AlertDescription>Halaman kembali dari Midtrans tidak otomatis berarti pembayaran berhasil.</AlertDescription>
          </Alert>
          {checked && (
            <p className="mt-5 text-sm font-semibold text-[var(--mk-warning)]" role="status">Belum ada konfirmasi baru. Coba lagi beberapa saat.</p>
          )}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button" onClick={() => setChecked(true)} className="h-12 rounded-xl bg-[var(--mk-primary)] px-6 text-[var(--mk-on-primary)]">
              <RotateCw aria-hidden="true" /> Periksa lagi
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-xl border-[var(--mk-line-strong)] px-6">
              <Link href={`/orders/${orderId}`}>Lihat detail pesanan</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense>
      <ProcessingState />
    </Suspense>
  );
}
