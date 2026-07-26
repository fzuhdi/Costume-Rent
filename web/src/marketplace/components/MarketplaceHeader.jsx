"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Menu, Moon, ShoppingBag, Sun, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/marketplace/CartContext';
import { MARKETPLACE_ASSETS, MARKETPLACE_BRAND, marketplaceHomeLabel } from '@/marketplace/brand';

const navigation = [
  { href: '/catalogue', label: 'Katalog' },
  { href: '/#cara-sewa', label: 'Cara sewa' },
  { href: '/account/orders', label: 'Pesanan' },
];

function toggleTheme() {
  const root = document.documentElement;
  const nextTheme = root.classList.contains('dark') ? 'light' : 'dark';

  root.classList.remove('dark', 'light');
  root.classList.add(nextTheme);
  root.dataset.theme = nextTheme;

  try {
    localStorage.setItem('heroui-theme', nextTheme);
  } catch {
    // Cookies still preserve the preference when browser storage is unavailable.
  }

  document.cookie = `heroui-theme=${nextTheme}; path=/; SameSite=Lax`;
}

function ThemeToggle() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="hidden size-11 text-[var(--mk-muted)] hover:text-[var(--mk-ink)] md:inline-flex"
      aria-label="Ganti mode terang atau gelap"
      title="Ganti mode terang atau gelap"
    >
      <span className="relative grid size-5 place-items-center" aria-hidden="true">
        <Moon className="absolute size-5 scale-100 opacity-100 blur-none transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.2,0,0,1)] dark:scale-25 dark:opacity-0 dark:blur-[4px]" />
        <Sun className="absolute size-5 scale-25 opacity-0 blur-[4px] transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.2,0,0,1)] dark:scale-100 dark:opacity-100 dark:blur-none" />
      </span>
    </Button>
  );
}

function CartLink({ compact = false }) {
  const { itemCount, hydrated } = useCart();

  return (
    <Button asChild variant="outline" size={compact ? 'icon' : 'default'} className="relative h-11 min-w-11 border-[var(--mk-line-strong)] bg-[var(--mk-surface)]">
      <Link
        href="/cart"
        aria-label={`Keranjang, ${hydrated ? itemCount : 0} item`}
        data-cart-hydrated={hydrated ? 'true' : 'false'}
      >
        <ShoppingBag aria-hidden="true" />
        {!compact && <span>Keranjang</span>}
        {hydrated && itemCount > 0 && (
          <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-[var(--mk-primary)] text-xs font-bold text-[var(--mk-on-primary)] tabular-nums">
            {itemCount}
          </span>
        )}
      </Link>
    </Button>
  );
}

export function MarketplaceHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--mk-line)] bg-[color-mix(in_srgb,var(--mk-canvas)_90%,transparent)] backdrop-blur-xl">
      <div className="marketplace-container flex h-[72px] items-center justify-between gap-4">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3"
          aria-label={marketplaceHomeLabel}
        >
          <span className="relative size-12 shrink-0" aria-hidden="true">
            <Image
              src={MARKETPLACE_ASSETS.compactMark}
              alt=""
              width={48}
              height={48}
              className="marketplace-brand-mark-color size-12 rounded-full object-cover"
              data-brand-mark="color"
              priority
            />
            <Image
              src={MARKETPLACE_ASSETS.monochromeMark}
              alt=""
              width={48}
              height={48}
              className="marketplace-brand-mark-monochrome absolute inset-0 size-12"
              data-brand-mark="monochrome"
            />
          </span>
          <span className="leading-tight">
            <strong className="block text-[15px] font-bold">{MARKETPLACE_BRAND.name}</strong>
            <span className="hidden text-[11px] font-medium text-[var(--mk-muted)] sm:block">
              {MARKETPLACE_BRAND.descriptor}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {navigation.map((item) => (
            <Button key={item.href} asChild variant="ghost" className="h-11 px-4 text-[var(--mk-muted)] hover:text-[var(--mk-ink)]">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" className="hidden size-11 sm:inline-flex">
            <Link href="/masuk" aria-label="Masuk ke akun">
              <UserRound aria-hidden="true" />
            </Link>
          </Button>
          <CartLink compact />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-11 md:hidden" aria-label="Buka menu">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="marketplace-theme w-[min(88vw,360px)] p-0">
              <SheetHeader className="border-b px-6 py-5 text-left">
                <SheetTitle>Menu {MARKETPLACE_BRAND.name}</SheetTitle>
              </SheetHeader>
              <nav className="grid p-4" aria-label="Navigasi seluler">
                {navigation.map((item) => (
                  <Button key={item.href} asChild variant="ghost" className="h-12 justify-start px-3 text-base">
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
                <Button asChild variant="ghost" className="h-12 justify-start px-3 text-base">
                  <Link href="/masuk">Masuk</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
