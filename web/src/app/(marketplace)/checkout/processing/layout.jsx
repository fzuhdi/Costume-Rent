import { MARKETPLACE_BRAND } from '@/marketplace/brand';

export const metadata = {
  title: 'Status Pembayaran',
  description: `Periksa status pembayaran pesanan ${MARKETPLACE_BRAND.name}.`,
};

export default function ProcessingLayout({ children }) {
  return children;
}
