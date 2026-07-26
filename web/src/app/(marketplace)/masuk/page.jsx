import { CustomerAuthCard } from '@/marketplace/components/CustomerAuthCard';

export const metadata = { title: 'Masuk Pelanggan' };

export default function CustomerLoginPage() {
  return (
    <div className="marketplace-container grid min-h-[calc(100dvh-72px)] place-items-center py-12">
      <CustomerAuthCard mode="login" />
    </div>
  );
}
