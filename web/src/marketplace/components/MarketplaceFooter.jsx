import Image from 'next/image';
import Link from 'next/link';
import { Instagram, MapPin, Phone } from 'lucide-react';

export function MarketplaceFooter() {
  return (
    <footer className="border-t border-[var(--mk-line)] bg-[var(--mk-surface)]">
      <div className="marketplace-container grid gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr] md:py-16">
        <div className="max-w-sm">
          <div className="mb-4 flex items-center gap-3">
            <Image src="/kbr-logo.svg" alt="" width={40} height={40} className="rounded-[10px]" />
            <strong>KBR Costume</strong>
          </div>
          <p className="text-sm leading-6 text-[var(--mk-muted)]">
            Kostum panggung yang terawat, tanggal sewa yang jelas, dan proses pemesanan yang mudah dipahami.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-bold">Jelajahi</h2>
          <div className="grid text-sm text-[var(--mk-muted)]">
            <Link href="/catalogue" className="inline-flex min-h-11 items-center hover:text-[var(--mk-primary)]">Katalog kostum</Link>
            <Link href="/account/orders" className="inline-flex min-h-11 items-center hover:text-[var(--mk-primary)]">Pesanan saya</Link>
            <Link href="/masuk" className="inline-flex min-h-11 items-center hover:text-[var(--mk-primary)]">Masuk akun</Link>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-bold">Hubungi toko</h2>
          <div className="grid gap-3 text-sm text-[var(--mk-muted)]">
            <span className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" /> Kramat Jati, Jakarta Timur</span>
            <span className="flex items-center gap-2"><Phone size={16} aria-hidden="true" /> 0812-3456-7890</span>
            <span className="flex items-center gap-2"><Instagram size={16} aria-hidden="true" /> @kbrcostume</span>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--mk-line)] py-5 text-center text-xs text-[var(--mk-muted)]">
        © 2026 KBR Costume. Informasi harga dapat berubah setelah pemeriksaan ketersediaan.
      </div>
    </footer>
  );
}
