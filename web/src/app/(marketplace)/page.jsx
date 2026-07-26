import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CostumeCard } from '@/marketplace/components/CostumeCard';
import { HeroSearch } from '@/marketplace/components/HeroSearch';
import { costumes, featuredCategories } from '@/marketplace/data';

export const metadata = {
  title: 'Sewa Kostum Tari Indonesia',
  description: 'Temukan kostum panggung, pilih tanggal acara, dan pesan dengan downpayment 50%.',
};

export default function MarketplaceHomePage() {
  return (
    <>
      <section className="marketplace-container grid min-h-[520px] items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:min-h-[500px] lg:py-8">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-bold text-[var(--mk-primary)]">Kostum panggung untuk momen penting</p>
          <h1 className="max-w-[15ch] text-balance text-[clamp(2.75rem,5vw,4.5rem)] font-bold leading-[0.98] tracking-[-0.045em]">
            Tampil utuh. Sewa dengan tenang.
          </h1>
          <p className="mt-6 max-w-[56ch] text-lg leading-8 text-[var(--mk-muted)]">
            Pilih kostum, tentukan tanggal acara, lalu amankan pesanan dengan downpayment 50%.
          </p>
          <div className="mt-8">
            <HeroSearch />
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[350px]">
          <div className="marketplace-image relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[var(--mk-media-placeholder)]">
            <Image
              src="/marketplace/tari-pendet.webp"
              alt="Kostum Tari Pendet Bali berwarna magenta, hijau, dan emas"
              fill
              priority
              sizes="(max-width: 1023px) 92vw, 46vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 left-4 right-4 rounded-2xl border border-[var(--mk-line)] bg-[color-mix(in_srgb,var(--mk-surface)_94%,transparent)] p-4 shadow-[var(--mk-shadow-float)] backdrop-blur-md sm:left-auto sm:right-[-16px] sm:w-64">
            <p className="text-xs font-bold text-[var(--mk-muted)]">Periode sewa standar</p>
            <p className="mt-1 text-sm font-bold">Ambil D-2, kembali D+1</p>
            <p className="mt-1 text-xs leading-5 text-[var(--mk-muted)]">Satu harga sewa untuk seluruh periode.</p>
          </div>
        </div>
      </section>

      <section className="marketplace-container py-14 md:py-16">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-bold tracking-[-0.03em] md:text-4xl">Pilihan yang siap ke panggung</h2>
          <p className="mt-4 text-[var(--mk-muted)]">Foto jelas, ukuran terlihat, dan harga tidak dihitung per hari.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-6">
          {costumes.map((costume) => (
            <CostumeCard key={costume.id} costume={costume} />
          ))}
        </div>
        <div className="mt-10">
          <Button asChild variant="outline" className="h-12 rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)] px-5">
            <Link href="/catalogue">Lihat semua kostum <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </div>
      </section>

      <section className="bg-[var(--mk-surface)] py-16 md:py-24">
        <div className="marketplace-container">
          <h2 className="max-w-xl text-3xl font-bold tracking-[-0.03em] md:text-4xl">Mulai dari kebutuhan acara</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
            <Link href={featuredCategories[0].href} className="group min-h-56 rounded-2xl bg-[var(--mk-primary)] p-7 text-[var(--mk-on-primary)] md:p-10">
              <p className="text-sm font-semibold text-[color-mix(in_srgb,var(--mk-on-primary)_75%,transparent)]">Koleksi utama</p>
              <h3 className="mt-12 max-w-sm text-3xl font-bold">{featuredCategories[0].name}</h3>
              <p className="mt-2 text-[color-mix(in_srgb,var(--mk-on-primary)_82%,transparent)]">{featuredCategories[0].description}</p>
              <ArrowRight className="mt-6 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <div className="grid gap-4">
              {featuredCategories.slice(1).map((category) => (
                <Link key={category.name} href={category.href} className="group rounded-2xl border border-[var(--mk-line)] bg-[var(--mk-canvas)] p-6 hover:border-[var(--mk-primary)]">
                  <h3 className="text-xl font-bold">{category.name}</h3>
                  <p className="mt-2 text-sm text-[var(--mk-muted)]">{category.description}</p>
                  <ArrowRight className="mt-5 size-5 text-[var(--mk-primary)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="cara-sewa" className="marketplace-container py-16 md:py-24">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">Tiga keputusan yang jelas</h2>
          <p className="mt-4 text-[var(--mk-muted)]">Tanggal acara menjadi dasar ketersediaan, periode sewa, dan pengambilan.</p>
        </div>
        <div className="mt-10 grid gap-8 border-t border-[var(--mk-line)] pt-8 md:grid-cols-3">
          {[
            { icon: CalendarCheck, title: 'Pilih tanggal acara', copy: 'Kami hitung tanggal ambil dan kembali secara otomatis.' },
            { icon: CheckCircle2, title: 'Periksa ketersediaan', copy: 'Ketersediaan diperiksa lagi sebelum pembayaran dimulai.' },
            { icon: ShieldCheck, title: 'Bayar downpayment', copy: 'Bayar 50% untuk mengamankan pesanan selama periode sewa.' },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title}>
              <span className="grid size-11 place-items-center rounded-xl bg-[var(--mk-primary-soft)] text-[var(--mk-primary)]">
                <Icon aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--mk-muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
