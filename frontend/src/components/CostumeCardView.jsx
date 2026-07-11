import { Link } from 'react-router-dom';
import { Card } from '@heroui/react';

const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};

const CostumeCardView = ({ costumes }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {costumes.map((costume) => (
        <Link to={`/catalogue/${costume.id}`} key={costume.id} className="block" aria-label={`Lihat detail ${costume.name}`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <Card.Content className="p-0">
              <div className="aspect-square bg-[var(--border)] relative">
                {costume.cover_image ? (
                  <img src={costume.cover_image} alt={costume.name} className="w-full h-full object-cover" loading="lazy" decoding="async" fetchPriority="low" />
                ) : (
                  <div className="flex items-center justify-center h-full text-[var(--muted)] text-xs">No Image</div>
                )}
              </div>
              <div className="p-2 sm:p-3">
                <h3 className="text-xs sm:text-sm font-medium truncate">{costume.name}</h3>
                <p className="text-xs text-[var(--muted)] truncate">
                  {costume.region} {costume.category && `• ${costume.category}`} {costume.size && `• ${costume.size}`}
                </p>
                <p className="text-xs font-semibold mt-1">{formatPrice(costume.rental_fee)}/hari</p>
                 <p className="text-xs text-[var(--muted)]">Tersedia: {costume.available_quantity ?? costume.total_quantity} / {costume.total_quantity}</p>
              </div>
            </Card.Content>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default CostumeCardView;
