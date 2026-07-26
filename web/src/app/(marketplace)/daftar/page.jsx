import { CustomerAuthCard } from '@/marketplace/components/CustomerAuthCard';

export const metadata = { title: 'Daftar Pelanggan' };

export default function CustomerRegisterPage() {
  return (
    <div className="marketplace-container grid min-h-[calc(100dvh-72px)] place-items-center py-12">
      <CustomerAuthCard mode="register" />
    </div>
  );
}
