"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, Check } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookingRail } from '@/marketplace/components/BookingRail';
import { CostumeCard } from '@/marketplace/components/CostumeCard';
import { StatusBadge } from '@/marketplace/components/StatusBadge';
import { formatRupiah } from '@/marketplace/format';
import { marketplaceApi } from '@/marketplace/api';
import { useCart } from '@/marketplace/CartContext';

function ProductSummary({ costume, className = '' }) {
  return (
    <header className={`border-b border-[var(--mk-line)] pb-7 ${className}`}>
      <p className="text-sm font-bold text-[var(--mk-primary)]">{costume.region}</p>
      <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <h1 className="text-balance text-4xl font-bold tracking-[-0.04em] md:text-5xl">{costume.name}</h1>
          <p className="mt-4 max-w-[65ch] text-base leading-7 text-[var(--mk-muted)] md:text-lg md:leading-8">{costume.description}</p>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 md:flex-col md:items-end">
          <p className="text-2xl font-bold tabular-nums">{formatRupiah(costume.price)}</p>
          <StatusBadge status={costume.availability} />
        </div>
      </div>
    </header>
  );
}

export default function CostumeDetailPage() {
  const { id } = useParams();
  const { eventDate } = useCart();
  const [costume, setCostume] = useState(null);
  const [related, setRelated] = useState([]);
  useEffect(() => {
    marketplaceApi.costume(id, eventDate).then((value) => {
      setCostume(value);
      return marketplaceApi.catalogue({ event_date: eventDate, limit: 4 });
    }).then((response) => setRelated((response.data || []).filter((item) => item.id !== String(id)).slice(0, 3))).catch(() => setCostume(false));
  }, [eventDate, id]);
  if (costume === false) return <div className="marketplace-container py-20 text-center">Kostum tidak ditemukan.</div>;
  if (!costume) return <div className="marketplace-container py-20 text-center text-[var(--mk-muted)]" role="status">Memuat kostum...</div>;

  return (
    <div className="marketplace-mobile-action-space">
      <div className="marketplace-container py-7 md:py-10">
        <Link href="/catalogue" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--mk-muted)] hover:text-[var(--mk-primary)]">
          <ChevronLeft aria-hidden="true" /> Kembali ke katalog
        </Link>

        <ProductSummary costume={costume} className="mt-4 hidden lg:block" />

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)] lg:items-start">
          <div className="grid gap-3 sm:grid-cols-[1.35fr_0.65fr]">
            <div className="marketplace-image relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[var(--mk-media-placeholder)] sm:row-span-2">
              <Image src={costume.image} alt={`${costume.name}, tampak penuh`} fill priority sizes="(max-width: 1023px) 100vw, 55vw" className="object-cover" />
            </div>
            <div className="marketplace-image relative hidden min-h-0 overflow-hidden rounded-2xl bg-[var(--mk-media-placeholder)] sm:block">
              <Image src={costume.image} alt={`${costume.name}, detail bagian atas`} fill sizes="20vw" className="scale-[1.65] object-cover object-top" />
            </div>
            <div className="marketplace-image relative hidden min-h-0 overflow-hidden rounded-2xl bg-[var(--mk-media-placeholder)] sm:block">
              <Image src={costume.image} alt={`${costume.name}, detail kain`} fill sizes="20vw" className="scale-[1.7] object-cover object-bottom" />
            </div>
          </div>

          <ProductSummary costume={costume} className="lg:hidden" />

          <aside className="lg:sticky lg:top-24">
            <BookingRail costume={costume} />
          </aside>
        </div>

        <section className="mt-8 grid gap-8 border-t border-[var(--mk-line)] pt-8 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-bold">Detail kostum</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-[var(--mk-muted)]">Kategori</dt><dd className="font-semibold">{costume.category}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--mk-muted)]">Ukuran</dt><dd className="font-semibold">{costume.size}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--mk-muted)]">Daerah</dt><dd className="font-semibold">{costume.region}</dd></div>
            </dl>
          </div>
          <div>
            <h2 className="text-lg font-bold">Termasuk dalam set</h2>
            <ul className="mt-4 grid gap-3 text-sm">
              {['Kostum utama', 'Aksesori sesuai ketersediaan', 'Pemeriksaan sebelum sewa'].map((item) => (
                <li key={item} className="flex items-center gap-2"><Check className="size-4 text-[var(--mk-success)]" aria-hidden="true" /> {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <Accordion type="single" collapsible className="mt-8 border-t border-[var(--mk-line)]">
          <AccordionItem value="policy">
            <AccordionTrigger className="min-h-14 text-base">Periode sewa dan keterlambatan</AccordionTrigger>
            <AccordionContent className="max-w-[65ch] text-sm leading-6 text-[var(--mk-muted)]">
              Harga berlaku untuk pengambilan dua hari sebelum acara sampai pengembalian satu hari sesudah acara. Biaya keterlambatan atau kerusakan dicatat terpisah setelah pemeriksaan.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cancel">
            <AccordionTrigger className="min-h-14 text-base">Pembatalan pesanan</AccordionTrigger>
            <AccordionContent className="max-w-[65ch] text-sm leading-6 text-[var(--mk-muted)]">
              Pesanan yang sudah dibayar dapat dibatalkan, tetapi downpayment tidak dikembalikan. Stok dilepas segera setelah pembatalan dikonfirmasi.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <section className="mt-14 border-t border-[var(--mk-line)] py-14 md:mt-20 md:py-20">
          <h2 className="text-2xl font-bold tracking-[-0.03em] md:text-3xl">Pilihan lain untuk panggungmu</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-3 lg:gap-6">
            {related.map((item) => <CostumeCard key={item.id} costume={item} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
