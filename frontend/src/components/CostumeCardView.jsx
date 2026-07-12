import { Link } from 'react-router-dom';
import { Card } from '@heroui/react';
import { ImageOff } from 'lucide-react';

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

const formatPrice = (price) => {
  return idrFormatter.format(price);
};

const CostumeCardView = ({ costumes }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {costumes.map((costume) => (
        <Link to={`/catalogue/${costume.id}`} key={costume.id} className="block" aria-label={`Lihat detail ${costume.name}`}>
          <Card className="cursor-pointer hover:shadow-lg hover:border-[var(--primary)] transition-all duration-300 group overflow-hidden">
            <Card.Content className="p-0">
              <div className="aspect-square bg-default-50 relative overflow-hidden">
                {costume.cover_image ? (
                  <img src={costume.cover_image} alt={costume.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" decoding="async" fetchPriority="low" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--muted)] text-xs border-b border-default-100">
                    <ImageOff size={24} className="mb-1 opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">No Image</span>
                  </div>
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
