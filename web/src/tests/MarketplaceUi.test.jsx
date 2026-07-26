import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert } from '@/components/ui/alert';
import { CartProvider } from '@/marketplace/CartContext';
import { marketplaceHomeLabel } from '@/marketplace/brand';
import { MarketplaceFooter } from '@/marketplace/components/MarketplaceFooter';
import { MarketplaceHeader } from '@/marketplace/components/MarketplaceHeader';

describe('marketplace announcement semantics', () => {
  it('keeps static notices out of assertive live regions', () => {
    render(<Alert>Stok belum ditahan</Alert>);

    expect(screen.getByText('Stok belum ditahan')).not.toHaveAttribute('role');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('allows call sites to request polite and assertive announcements', () => {
    const { rerender } = render(<Alert announcement="status">Ditambahkan</Alert>);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');

    rerender(<Alert announcement="alert">Pilih tanggal acara</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Pilih tanggal acara');
  });
});

describe('marketplace brand shell', () => {
  it('uses the full Bu Risna seal at a readable footer size with an adjacent text identity', () => {
    const { container } = render(<MarketplaceFooter />);
    const seal = container.querySelector('img');

    expect(seal).toHaveAttribute('src', expect.stringContaining('bu-risna-seal.webp'));
    expect(seal).toHaveAttribute('alt', '');
    expect(screen.getByText('KBR Costume')).toBeInTheDocument();
    expect(screen.getByText('Kostum Tari Bu Risna')).toBeInTheDocument();
  });

  it('uses the real seal and monochrome fallback behind one consistent home label', () => {
    const { container } = render(
      <CartProvider>
        <MarketplaceHeader />
      </CartProvider>,
    );
    const homeLink = screen.getByRole('link', { name: marketplaceHomeLabel });
    const marks = [...homeLink.querySelectorAll('img')];

    expect(homeLink).toBeInTheDocument();
    expect(marks).toHaveLength(2);
    expect(marks[0]).toHaveAttribute('src', expect.stringContaining('bu-risna-seal.webp'));
    expect(marks[1]).toHaveAttribute('src', expect.stringContaining('kbr-marketplace-mark-mono.svg'));
    expect(container.querySelector('[data-cart-hydrated]')).toBeInTheDocument();
  });
});
