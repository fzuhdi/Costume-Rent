import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@heroui/react';
import { ImageOff } from 'lucide-react';

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

const formatPrice = (price) => {
  return idrFormatter.format(price);
};

const CostumeCard = ({ costume, onClick, linkTo, showAvailabilityBadge, isDisabled }) => {
  const imageUrl = costume.cover_image && !costume.cover_image.startsWith('http') 
    ? `${import.meta.env.VITE_API_URL || ''}${costume.cover_image}`
    : costume.cover_image;

  const cardContent = (
    <Card 
      onClick={isDisabled ? undefined : onClick}
      className={`group overflow-hidden transition-all duration-300 w-full border ${isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:border-primary'}`}
    >
      <Card.Content className="p-0 flex flex-col">
        <div className="aspect-square bg-default-50 relative shrink-0 overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={costume.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              loading="lazy" 
              decoding="async" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-default-400 text-xs border-b border-default-100">
              <ImageOff size={24} className="mb-1 opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
              <span className="text-[10px] font-medium uppercase tracking-wider">No Image</span>
            </div>
          )}
          {showAvailabilityBadge && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
              Sisa: {costume.available_quantity ?? costume.total_quantity}
            </div>
          )}
        </div>
        <div className="p-2 sm:p-3 flex flex-col gap-1 text-left w-full">
          <h3 className="text-xs sm:text-sm font-medium truncate">{costume.name}</h3>
          <p className="text-xs text-default-500 truncate">
            {[costume.region, costume.category, costume.size].filter(Boolean).join(' • ')}
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            <p className="text-sm font-bold text-primary">{formatPrice(costume.rental_fee)}</p>
            {!showAvailabilityBadge && (
              <p className="text-xs text-default-400">
                Tersedia: {costume.available_quantity ?? costume.total_quantity} / {costume.total_quantity}
              </p>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );

  if (linkTo) {
    return <Link to={linkTo} className="block" aria-label={`Lihat detail ${costume.name}`}>{cardContent}</Link>;
  }

  return cardContent;
};

export default CostumeCard;
