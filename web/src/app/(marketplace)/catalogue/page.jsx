import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogueClient } from '@/marketplace/components/CatalogueClient';

export const metadata = {
  title: 'Katalog Kostum',
  description: 'Cari kostum tari berdasarkan daerah, kategori, ukuran, dan tanggal acara.',
};

function CatalogueFallback() {
  return (
    <div className="marketplace-container py-12">
      <Skeleton className="h-12 w-72 rounded-xl" />
      <Skeleton className="mt-8 h-24 w-full rounded-2xl" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function CataloguePage() {
  return (
    <Suspense fallback={<CatalogueFallback />}>
      <CatalogueClient />
    </Suspense>
  );
}
