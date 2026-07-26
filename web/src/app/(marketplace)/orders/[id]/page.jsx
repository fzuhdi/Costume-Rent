import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, CircleCheck, Clock3, MapPin, PackageCheck, ReceiptText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CancelBookingDialog } from '@/marketplace/components/CancelBookingDialog';
import { StatusBadge } from '@/marketplace/components/StatusBadge';
import { getOrder } from '@/marketplace/data';
import { formatRupiah } from '@/marketplace/format';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Pesanan ${id}` };
}

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  const order = getOrder(id);

  return (
    <div className="marketplace-container py-8 md:py-12">
      <Link href="/account/orders" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--mk-muted)] hover:text-[var(--mk-primary)]">
        <ChevronLeft aria-hidden="true" /> Semua pesanan
      </Link>
      <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold text-[var(--mk-primary)] tabular-nums">{order.id}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] md:text-5xl">Detail pesanan</h1>
          <p className="mt-3 text-[var(--mk-muted)]">Dibuat {order.createdAt}</p>
        </div>
        {order.rentalStatus === 'booked' && <CancelBookingDialog downpayment={order.downpayment} />}
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Status pesanan">
        <Card className="rounded-2xl bg-[var(--mk-surface)]">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-[var(--mk-muted)]">Status sewa</p>
            <StatusBadge status={order.rentalStatus} className="mt-3" />
            <p className="mt-3 text-sm leading-6 text-[var(--mk-muted)]">Kostum sudah diamankan untuk tanggal acaramu.</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-[var(--mk-surface)]">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-[var(--mk-muted)]">Status pembayaran</p>
            <StatusBadge status={order.paymentStatus} className="mt-3" />
            <p className="mt-3 text-sm leading-6 text-[var(--mk-muted)]">Downpayment telah tercatat pada pesanan.</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-[var(--mk-surface)]">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-[var(--mk-muted)]">Status pengantaran</p>
            <StatusBadge status={order.deliveryStatus} className="mt-3" />
            <p className="mt-3 text-sm leading-6 text-[var(--mk-muted)]">Pengambilan di toko tetap tersedia.</p>
          </CardContent>
        </Card>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="grid gap-6">
          <Card className="rounded-[20px] bg-[var(--mk-surface)]">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-xl font-bold">Kostum yang disewa</h2>
              <div className="mt-5 grid gap-4">
                {order.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[76px_1fr_auto] gap-4 border-t pt-4 first:border-t-0 first:pt-0">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#e7e8ec]">
                      <Image src={item.image} alt={item.name} fill sizes="76px" className="object-cover" />
                    </div>
                    <div>
                      <Link href={`/costumes/${item.id}`} className="font-bold hover:text-[var(--mk-primary)]">{item.name}</Link>
                      <p className="mt-1 text-sm text-[var(--mk-muted)]">{item.quantity} set / Ukuran {item.size}</p>
                    </div>
                    <p className="font-bold tabular-nums">{formatRupiah(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] bg-[var(--mk-surface)]">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-xl font-bold">Perjalanan pesanan</h2>
              <ol className="mt-6 grid gap-0">
                {[
                  { icon: ReceiptText, title: 'Pesanan dibuat', detail: order.createdAt, done: true },
                  { icon: CircleCheck, title: 'Downpayment terverifikasi', detail: formatRupiah(order.downpayment), done: true },
                  { icon: PackageCheck, title: 'Pengambilan kostum', detail: order.pickupDate, done: false },
                  { icon: Clock3, title: 'Pengembalian kostum', detail: order.returnDate, done: false },
                ].map(({ icon: Icon, title, detail, done }, index, entries) => (
                  <li key={title} className="grid grid-cols-[40px_1fr] gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`grid size-10 place-items-center rounded-xl ${done ? 'bg-[var(--mk-success-soft)] text-[var(--mk-success)]' : 'bg-[var(--mk-canvas)] text-[var(--mk-subtle)]'}`}>
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      {index < entries.length - 1 && <span className="min-h-8 w-px flex-1 bg-[var(--mk-line)]" />}
                    </div>
                    <div className="pb-6">
                      <p className="font-bold">{title}</p>
                      <p className="mt-1 text-sm text-[var(--mk-muted)] tabular-nums">{detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <aside className="grid gap-5 lg:sticky lg:top-24">
          <Card className="rounded-[20px] bg-[var(--mk-surface)]">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-xl font-bold">Tanggal penting</h2>
              <dl className="mt-5 grid gap-4 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-[var(--mk-muted)]">Ambil</dt><dd className="font-bold tabular-nums">{order.pickupDate}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[var(--mk-muted)]">Acara</dt><dd className="font-bold tabular-nums">{order.eventDate}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[var(--mk-muted)]">Kembali</dt><dd className="font-bold tabular-nums">{order.returnDate}</dd></div>
              </dl>
            </CardContent>
          </Card>
          <Card className="rounded-[20px] bg-[var(--mk-surface)]">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-xl font-bold">Pembayaran</h2>
              <dl className="mt-5 grid gap-4 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-[var(--mk-muted)]">Total sewa</dt><dd className="font-bold tabular-nums">{formatRupiah(order.total)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[var(--mk-muted)]">DP terbayar</dt><dd className="font-bold tabular-nums">{formatRupiah(order.downpayment)}</dd></div>
                <div className="flex justify-between gap-4 border-t pt-4"><dt className="font-bold">Sisa saat ambil</dt><dd className="font-bold tabular-nums">{formatRupiah(order.total - order.downpayment)}</dd></div>
              </dl>
            </CardContent>
          </Card>
          <div className="flex items-start gap-3 rounded-2xl bg-[var(--mk-primary-soft)] p-4 text-sm leading-6 text-[var(--mk-primary)]">
            <MapPin className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
            <p>Pengambilan di KBR Costume, Kramat Jati, Jakarta Timur.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
