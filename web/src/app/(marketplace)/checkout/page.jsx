"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, LockKeyhole, MapPin, Truck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/marketplace/CartContext';
import { useCustomerAuth } from '@/marketplace/CustomerAuthContext';
import { marketplaceApi } from '@/marketplace/api';
import { MARKETPLACE_BRAND } from '@/marketplace/brand';
import { formatRupiah } from '@/marketplace/format';
import { MobileActionBar } from '@/marketplace/components/MobileActionBar';
import { RentalDates } from '@/marketplace/components/RentalDates';

function OrderSummary({ items, subtotal }) {
  return (
    <div>
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[64px_1fr_auto] gap-3">
            <div className="marketplace-image relative aspect-[4/5] overflow-hidden rounded-lg bg-[var(--mk-media-placeholder)]">
              <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold">{item.name}</p>
              <p className="mt-1 text-xs text-[var(--mk-muted)]">{item.quantity} set / {item.size}</p>
            </div>
            <p className="text-sm font-bold tabular-nums">{formatRupiah(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>
      <div className="my-5 border-t" />
      <dl className="grid gap-3 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-[var(--mk-muted)]">Biaya sewa</dt><dd className="font-bold tabular-nums">{formatRupiah(subtotal)}</dd></div>
        <div className="flex justify-between gap-4 text-base"><dt className="font-bold">Bayar sekarang</dt><dd className="font-bold tabular-nums">{formatRupiah(Math.ceil(subtotal / 2))}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-[var(--mk-muted)]">Sisa saat pengambilan</dt><dd className="font-semibold tabular-nums">{formatRupiah(subtotal - Math.ceil(subtotal / 2))}</dd></div>
      </dl>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, eventDate, subtotal, hydrated } = useCart();
  const { customer, loading: customerLoading } = useCustomerAuth();
  const [fulfillment, setFulfillment] = useState('pickup');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const termsCardRef = useRef(null);
  const termsCheckboxRef = useRef(null);
  const payable = Math.ceil(subtotal / 2);

  const submit = async (event) => {
    event.preventDefault();
    if (!termsAccepted) {
      setError('Baca dan setujui ketentuan pembatalan sebelum melanjutkan.');
      termsCardRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
      termsCheckboxRef.current?.focus({ preventScroll: true });
      return;
    }
    if (!customer) {
      router.push('/masuk?returnTo=/checkout');
      return;
    }
    const formData = new FormData(event.currentTarget);
    setError('');
    setSubmitting(true);
    try {
      const checkout = await marketplaceApi.checkout({
        event_date: eventDate,
        name: formData.get('name'),
        phone: formData.get('phone'),
        fulfillment_type: fulfillment === 'delivery' ? 'delivery_request' : 'pickup',
        shipping_address: fulfillment === 'delivery' ? formData.get('address') : '',
        terms_version: '2026-07',
        terms_accepted: true,
        items: items.map((item) => ({ costume_id: Number(item.id), quantity: item.quantity, rental_fee: item.price })),
      });
      const redirectUrl = checkout.payment_attempt?.redirect_url;
      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }
      router.push(`/checkout/processing?order=${checkout.order?.id}`);
    } catch (checkoutError) {
      setError(checkoutError.code === 'ERR_TERMS_VERSION_INVALID'
        ? 'Ketentuan checkout telah berubah. Muat ulang halaman lalu setujui kembali.'
        : 'Checkout tidak dapat dibuat. Periksa data dan ketersediaan kostum, lalu coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) return <div className="marketplace-container min-h-[50dvh] py-16" />;

  if (items.length === 0) {
    return (
      <div className="marketplace-container py-20 text-center">
        <h1 className="text-3xl font-bold">Belum ada item untuk checkout</h1>
        <p className="mt-3 text-[var(--mk-muted)]">Tambahkan kostum ke keranjang terlebih dahulu.</p>
        <Button asChild className="mt-6 h-12 rounded-xl"><Link href="/catalogue">Buka katalog</Link></Button>
      </div>
    );
  }

  if (customerLoading) return <div className="marketplace-container min-h-[50dvh] py-16" />;

  if (!customer) {
    return (
      <div className="marketplace-container py-20 text-center">
        <h1 className="text-3xl font-bold">Masuk untuk melanjutkan checkout</h1>
        <p className="mt-3 text-[var(--mk-muted)]">Akun diperlukan untuk menyimpan pesanan dan mengamankan pembayaran.</p>
        <Button asChild className="mt-6 h-12 rounded-xl"><Link href="/masuk?returnTo=/checkout">Masuk atau daftar</Link></Button>
      </div>
    );
  }

  return (
    <div className="marketplace-container marketplace-mobile-action-space py-8 md:py-12">
      <Link href="/cart" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--mk-muted)] hover:text-[var(--mk-primary)]">
        <ChevronLeft aria-hidden="true" /> Kembali ke keranjang
      </Link>
      <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] md:text-5xl">Selesaikan checkout</h1>
      <p className="mt-3 text-[var(--mk-muted)]">Periksa data, periode sewa, dan downpayment sebelum pembayaran.</p>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
        <div className="grid gap-5">
          <Alert className="rounded-2xl border-[var(--mk-info)]/25 bg-[var(--mk-info-soft)] text-[var(--mk-info)]">
            <LockKeyhole aria-hidden="true" />
            <AlertTitle>Masuk sebagai {customer.name}</AlertTitle>
            <AlertDescription className="text-[var(--mk-info)]/90">{customer.email} / <Link href="/masuk" className="font-bold underline">Ganti akun</Link></AlertDescription>
          </Alert>

          <Card className="rounded-[20px] border-[var(--mk-line)] bg-[var(--mk-surface)]">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-xl font-bold">Data penyewa</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="customer-name">Nama lengkap</Label>
                  <Input id="customer-name" name="name" defaultValue={customer.name} className="h-11 rounded-xl border-[var(--mk-line-strong)]" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customer-phone">Nomor WhatsApp</Label>
                  <Input id="customer-phone" name="phone" type="tel" defaultValue={customer.phone || ''} className="h-11 rounded-xl border-[var(--mk-line-strong)]" required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[var(--mk-line)] bg-[var(--mk-surface)]">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-xl font-bold">Periode sewa</h2>
              <div className="mt-5 rounded-2xl bg-[var(--mk-canvas)] p-4">
                <RentalDates eventDate={eventDate} compact />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[var(--mk-line)] bg-[var(--mk-surface)]">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-xl font-bold">Cara menerima kostum</h2>
              <Tabs value={fulfillment} onValueChange={setFulfillment} className="mt-5">
                <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl bg-[var(--mk-canvas)] p-1">
                  <TabsTrigger value="pickup" className="rounded-lg"><MapPin aria-hidden="true" /> Ambil di toko</TabsTrigger>
                  <TabsTrigger value="delivery" className="rounded-lg"><Truck aria-hidden="true" /> Minta antar</TabsTrigger>
                </TabsList>
                <TabsContent value="pickup" className="mt-4 rounded-xl border border-[var(--mk-line)] p-4 text-sm leading-6 text-[var(--mk-muted)]">
                  Ambil di {MARKETPLACE_BRAND.pickupLocationName}, Kramat Jati, Jakarta Timur. Detail jam pengambilan tersedia setelah pesanan dikonfirmasi.
                </TabsContent>
                <TabsContent value="delivery" className="mt-4 grid gap-4">
                  <Alert className="border-[var(--mk-warning)]/25 bg-[var(--mk-warning-soft)] text-[var(--mk-warning)]">
                    <Truck aria-hidden="true" />
                    <AlertTitle>Pengantaran adalah permintaan</AlertTitle>
                    <AlertDescription className="text-[var(--mk-warning)]/90">Pesanan tetap dapat diambil di toko jika staf belum mengonfirmasi pengantaran.</AlertDescription>
                  </Alert>
                  <div className="grid gap-2">
                    <Label htmlFor="delivery-address">Alamat pengantaran</Label>
                    <Textarea id="delivery-address" name="address" placeholder="Tulis alamat lengkap dan patokan lokasi" className="min-h-28 rounded-xl border-[var(--mk-line-strong)]" required={fulfillment === 'delivery'} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card ref={termsCardRef} className="rounded-[20px] border-[var(--mk-line)] bg-[var(--mk-surface)]">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  ref={termsCheckboxRef}
                  id="terms"
                  checked={termsAccepted}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'checkout-constraint checkout-terms-error' : 'checkout-constraint'}
                  onCheckedChange={(checked) => {
                    setTermsAccepted(checked === true);
                    setError('');
                  }}
                  className="mt-0.5 size-5"
                />
                <Label htmlFor="terms" className="cursor-pointer text-sm leading-6">
                  Saya memahami bahwa downpayment 50% tidak dikembalikan jika saya membatalkan pesanan, dan stok hanya ditahan selama 60 menit setelah checkout dibuat.
                </Label>
              </div>
              <p id="checkout-constraint" className="mt-3 text-sm text-[var(--mk-muted)]">
                Setujui ketentuan pembatalan untuk melanjutkan.
              </p>
              {error && (
                <p id="checkout-terms-error" className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--mk-danger)]" role="alert">
                  <AlertCircle size={16} aria-hidden="true" /> {error}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="lg:hidden">
            <Accordion type="single" collapsible defaultValue="summary" className="rounded-[20px] border bg-[var(--mk-surface)] px-5">
              <AccordionItem value="summary" className="border-0">
                <AccordionTrigger className="text-lg">Ringkasan pesanan</AccordionTrigger>
                <AccordionContent><OrderSummary items={items} subtotal={subtotal} /></AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <Card className="hidden rounded-[20px] border-[var(--mk-line)] bg-[var(--mk-surface)] shadow-[var(--mk-shadow-float)] lg:block">
            <CardContent className="p-6">
              <h2 className="mb-5 text-xl font-bold">Ringkasan pesanan</h2>
              <OrderSummary items={items} subtotal={subtotal} />
            </CardContent>
          </Card>
          <Button
            type="submit"
            disabled={submitting}
            aria-disabled={!termsAccepted || submitting}
            aria-describedby="checkout-constraint"
            className="mt-4 hidden h-13 w-full rounded-xl bg-[var(--mk-primary)] text-base text-[var(--mk-on-primary)] hover:bg-[var(--mk-primary-hover)] lg:flex"
          >
            {submitting ? 'Membuat checkout...' : `Bayar ${formatRupiah(payable)}`}
          </Button>
          <p className="mt-3 text-center text-xs leading-5 text-[var(--mk-muted)]">Kamu akan diarahkan ke halaman pembayaran Midtrans yang aman.</p>
        </aside>

        <MobileActionBar
          label="Lanjutkan ke pembayaran"
          context={(
            <>
              <p className="text-xs text-[var(--mk-muted)]">Bayar sekarang</p>
              <p className="font-bold tabular-nums">{formatRupiah(payable)}</p>
            </>
          )}
          helper={!termsAccepted ? 'Setujui ketentuan pembatalan untuk melanjutkan.' : null}
        >
          <Button
            type="submit"
            disabled={submitting}
            aria-disabled={!termsAccepted || submitting}
            aria-describedby="checkout-constraint"
            className="h-12 rounded-xl bg-[var(--mk-primary)] px-4 text-[var(--mk-on-primary)] hover:bg-[var(--mk-primary-hover)]"
          >
            {submitting ? 'Memproses...' : 'Bayar'}
          </Button>
        </MobileActionBar>
      </form>
    </div>
  );
}
