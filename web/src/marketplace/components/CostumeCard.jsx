"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/marketplace/components/StatusBadge';
import { useCart } from '@/marketplace/CartContext';
import { formatRupiah } from '@/marketplace/format';

export function CostumeCard({ costume, priority = false }) {
  const { addItem } = useCart();

  return (
    <article className="group min-w-0">
      <Link href={`/costumes/${costume.id}`} className="marketplace-image relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--mk-media-placeholder)]">
        <Image
          src={costume.image}
          alt={`${costume.name}, kostum dari ${costume.region}`}
          fill
          priority={priority}
          sizes="(max-width: 639px) 50vw, (max-width: 899px) 45vw, (max-width: 1199px) 30vw, 24vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]"
        />
        {costume.availability === 'limited' && (
          <StatusBadge status="limited" className="absolute left-3 top-3 shadow-sm" />
        )}
      </Link>
      <div className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/costumes/${costume.id}`} className="inline-flex items-start gap-1 font-bold leading-5 hover:text-[var(--mk-primary)]">
              <span className="line-clamp-2">{costume.name}</span>
              <ArrowUpRight className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            </Link>
            <p className="mt-1 text-sm text-[var(--mk-muted)]">{costume.region} / Ukuran {costume.size}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-11 shrink-0 rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)]"
            onClick={() => addItem(costume)}
            aria-label={`Tambah ${costume.name} ke keranjang`}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
        <p className="mt-2 tabular-nums font-bold">{formatRupiah(costume.price)}</p>
        <p className="text-xs text-[var(--mk-muted)]">untuk periode sewa standar</p>
      </div>
    </article>
  );
}
