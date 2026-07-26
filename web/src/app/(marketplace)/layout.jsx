import { Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/marketplace.css';
import { CartProvider } from '@/marketplace/CartContext';
import { CustomerAuthProvider } from '@/marketplace/CustomerAuthContext';
import { MarketplaceHeader } from '@/marketplace/components/MarketplaceHeader';
import { MarketplaceFooter } from '@/marketplace/components/MarketplaceFooter';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-market',
  display: 'swap',
});

export default function MarketplaceLayout({ children }) {
  return (
    <div className={`marketplace-theme ${plusJakarta.variable}`}>
      <CustomerAuthProvider>
        <CartProvider>
          <a href="#main-content" className="marketplace-skip-link">
            Lewati ke konten utama
          </a>
          <MarketplaceHeader />
          <main id="main-content" tabIndex={-1}>{children}</main>
          <MarketplaceFooter />
        </CartProvider>
      </CustomerAuthProvider>
    </div>
  );
}
