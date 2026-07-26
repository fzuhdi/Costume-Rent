"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/marketplace/components/StatusBadge';
import { formatRupiah } from '@/marketplace/format';
import { marketplaceApi } from '@/marketplace/api';
import { useCustomerAuth } from '@/marketplace/CustomerAuthContext';

export default function AccountOrdersPage() {
  const { customer, loading: customerLoading } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!customer) return;
    marketplaceApi.orders().then((response) => setOrders(response.data || [])).catch(() => setError('Pesanan tidak dapat dimuat.')).finally(() => setLoading(false));
  }, [customer, customerLoading]);

  return <div className="marketplace-container py-10 md:py-14">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-[var(--mk-primary)]">Akun {customer?.name || ''}</p><h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] md:text-5xl">Pesanan saya</h1><p className="mt-3 text-[var(--mk-muted)]">Lihat status sewa, pembayaran, dan pengantaran secara terpisah.</p></div><Button asChild variant="outline" className="h-11 rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)]"><Link href="/catalogue">Sewa kostum lagi</Link></Button></div>
    {customerLoading ? <p className="mt-10 text-center text-[var(--mk-muted)]" role="status">Memuat akun...</p> : !customer ? <div className="mt-10 text-center"><p className="text-[var(--mk-muted)]">Masuk untuk melihat pesananmu.</p><Button asChild className="mt-5"><Link href="/masuk">Masuk</Link></Button></div> : loading ? <p className="mt-10 text-center text-[var(--mk-muted)]" role="status">Memuat pesanan...</p> : error ? <p className="mt-10 text-center text-[var(--mk-danger)]" role="alert">{error}</p> : orders.length === 0 ? <div className="mt-10 rounded-[20px] border border-dashed bg-[var(--mk-surface)] px-6 py-16 text-center"><PackageOpen className="mx-auto size-10 text-[var(--mk-subtle)]" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold">Belum ada pesanan</h2><p className="mt-2 text-sm text-[var(--mk-muted)]">Pesanan yang sudah dibuat akan muncul di sini.</p></div> : <div className="mt-10 grid gap-5">{orders.map((order) => <Link key={order.id} href={`/orders/${order.apiId}`} className="group block rounded-[20px] border border-[var(--mk-line)] bg-[var(--mk-surface)] p-5 sm:p-6"><article><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold tabular-nums">{order.id}</p><p className="mt-1 text-xs text-[var(--mk-muted)]">Dibuat {order.createdAt}</p></div><StatusBadge status={order.rentalStatus} /></div><div className="mt-5 grid gap-5 border-t pt-5 md:grid-cols-[1fr_auto] md:items-center"><div className="flex items-center gap-4"><div className="flex -space-x-3">{order.items.slice(0, 2).map((item) => <div key={item.id} className="marketplace-image relative size-16 overflow-hidden rounded-xl border-2 border-[var(--mk-surface)] bg-[var(--mk-media-placeholder)]"><Image src={item.image} alt="" fill sizes="64px" className="object-cover" /></div>)}</div><div><p className="font-bold">{order.items.map((item) => item.name).join(', ')}</p><p className="mt-1 text-sm text-[var(--mk-muted)]">Acara {order.eventDate}</p></div></div><div className="flex items-center justify-between gap-5 md:justify-end"><div><p className="text-xs text-[var(--mk-muted)]">Total sewa</p><p className="mt-1 font-bold tabular-nums">{formatRupiah(order.total)}</p></div><span className="grid size-11 place-items-center rounded-xl border border-[var(--mk-line-strong)]"><ArrowRight aria-hidden="true" /></span></div></div></article></Link>)}</div>}
  </div>;
}
