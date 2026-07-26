"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { marketplaceApi } from '@/marketplace/api';
import { formatRupiah } from '@/marketplace/format';
import { StatusBadge } from '@/marketplace/components/StatusBadge';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { marketplaceApi.order(id).then(setOrder).catch(() => setError('Pesanan tidak dapat ditemukan atau kamu tidak memiliki akses.')); }, [id]);
  if (error) return <div className="marketplace-container py-20 text-center"><p className="text-[var(--mk-danger)]">{error}</p><Link href="/account/orders" className="mt-5 inline-block font-bold text-[var(--mk-primary)]">Kembali ke pesanan</Link></div>;
  if (!order) return <div className="marketplace-container py-20 text-center text-[var(--mk-muted)]" role="status">Memuat pesanan...</div>;
  return <div className="marketplace-container py-8 md:py-12"><Link href="/account/orders" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--mk-muted)]"><ChevronLeft /> Semua pesanan</Link><div className="mt-3"><p className="text-sm font-bold text-[var(--mk-primary)]">{order.id}</p><h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">Detail pesanan</h1><p className="mt-3 text-[var(--mk-muted)]">Dibuat {order.createdAt}</p></div><section className="mt-8 grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><p className="text-xs font-bold text-[var(--mk-muted)]">Status sewa</p><StatusBadge status={order.rentalStatus} className="mt-3" /></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs font-bold text-[var(--mk-muted)]">Status pembayaran</p><StatusBadge status={order.paymentStatus} className="mt-3" /></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs font-bold text-[var(--mk-muted)]">Status pengantaran</p><StatusBadge status={order.delivery_request_status || 'pickup'} className="mt-3" /></CardContent></Card></section><div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><Card><CardContent className="p-5 sm:p-6"><h2 className="text-xl font-bold">Kostum yang disewa</h2><div className="mt-5 grid gap-4">{order.items.map((item) => <div key={item.id} className="grid grid-cols-[76px_1fr_auto] gap-4 border-t pt-4 first:border-t-0 first:pt-0"><div className="marketplace-image relative aspect-[4/5] overflow-hidden rounded-xl"><Image src={item.image} alt={item.name} fill sizes="76px" className="object-cover" /></div><div><Link href={`/costumes/${item.costume_id}`} className="font-bold">{item.name}</Link><p className="mt-1 text-sm text-[var(--mk-muted)]">{item.quantity} set / Ukuran {item.size}</p></div><p className="font-bold">{formatRupiah(item.rental_fee * item.quantity)}</p></div>)}</div></CardContent></Card><aside className="grid gap-5"><Card><CardContent className="p-5"><h2 className="text-xl font-bold">Tanggal penting</h2><dl className="mt-5 grid gap-4 text-sm"><div className="flex justify-between"><dt>Ambil</dt><dd>{order.pickup_date}</dd></div><div className="flex justify-between"><dt>Acara</dt><dd>{order.eventDate}</dd></div><div className="flex justify-between"><dt>Kembali</dt><dd>{order.expected_return_date}</dd></div></dl></CardContent></Card><Card><CardContent className="p-5"><h2 className="text-xl font-bold">Pembayaran</h2><dl className="mt-5 grid gap-4 text-sm"><div className="flex justify-between"><dt>Total sewa</dt><dd>{formatRupiah(order.total)}</dd></div><div className="flex justify-between"><dt>DP</dt><dd>{formatRupiah(order.downpayment_amount)}</dd></div></dl></CardContent></Card><div className="flex gap-3 rounded-2xl bg-[var(--mk-primary-soft)] p-4 text-sm"><MapPin /><p>Detail pengambilan tersedia setelah pembayaran terverifikasi.</p></div></aside></div></div>;
}
