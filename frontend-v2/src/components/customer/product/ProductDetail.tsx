import { Heart, ShoppingCart } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { StatusPill } from '../../shared';
import { ProductAvailabilityCalendar } from './ProductAvailabilityCalendar';
import {
  findNextAvailableWindow,
  formatDate,
  formatDateRange,
  formatRupiah,
  getMaintenanceReason,
  getProductAvailability,
  getVariantAvailability,
  productAlt,
  productDescription,
  productGallery,
  productMeta,
  productName,
  selectedVariantNotes,
  variantLabel,
} from '../../../lib/rental-utils';
import type { CartItem, DataAdapter, DateRange, Locale, Product, Rental, TFunction } from '../../../types/domain';

export function ProductDetail({
  product,
  selectedVariantId,
  setSelectedVariantId,
  dates,
  locale,
  t,
  onAdd,
  selectedAvailability,
  cart,
  rentals,
  dataAdapter,
  isFavorite,
  onFavoriteToggle,
}: {
  product: Product;
  selectedVariantId: string;
  setSelectedVariantId: Dispatch<SetStateAction<string>>;
  dates: DateRange;
  locale: Locale;
  t: TFunction;
  onAdd: () => void;
  selectedAvailability: number;
  cart: CartItem[];
  rentals: Rental[];
  dataAdapter?: DataAdapter;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}) {
  const availability = getProductAvailability(product, dates, rentals);
  const maintenanceReason = availability === 'unavailable' ? getMaintenanceReason(product, dates) : '';
  const isInCart = cart.some((item) => item.productId === product.id && item.variantId === selectedVariantId);
  const canAdd = selectedVariantId && selectedAvailability > 0;
  const nextWindow = selectedVariantId && selectedAvailability <= 0 ? findNextAvailableWindow(product, selectedVariantId, dates, rentals) : null;
  const images = useMemo(() => productGallery(product, t), [product, t]);
  const [selectedImageId, setSelectedImageId] = useState(images[0]?.id ?? '');
  const [favoriteNotice, setFavoriteNotice] = useState(false);
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? images[0];
  const description = productDescription(product, locale, t);
  const variantNotes = selectedVariantNotes(product, selectedVariantId, locale, t);

  useEffect(() => {
    setSelectedImageId(images[0]?.id ?? '');
  }, [product.id, images]);

  useEffect(() => {
    if (!favoriteNotice) return undefined;
    const timeoutId = window.setTimeout(() => setFavoriteNotice(false), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [favoriteNotice]);

  const handleFavoriteToggle = () => {
    onFavoriteToggle();
    setFavoriteNotice(true);
  };

  return (
    <section className="product-detail product-detail-shell" id="product-detail">
      <div className="shell product-detail-layout product-detail-layout-shell">
        <div className={`detail-gallery product-media-gallery ${images.length > 1 ? '' : 'single-image'}`} aria-label={t('customer.detail.galleryAria')}>
          <div className="detail-photo">
            <img src={selectedImage?.src ?? product.image} alt={selectedImage?.alt ?? productAlt(product, t)} />
          </div>
          {images.length > 1 ? (
            <div className="thumb-rail" aria-label={t('customer.detail.thumbsAria')}>
              {images.map((thumb) => (
                <button
                  className={`thumb-button ${selectedImage?.id === thumb.id ? 'selected' : ''}`}
                  type="button"
                  key={thumb.id}
                  aria-label={t('customer.detail.thumbSelect', { item: thumb.label })}
                  aria-pressed={selectedImage?.id === thumb.id}
                  onClick={() => setSelectedImageId(thumb.id)}
                >
                  <img src={thumb.src} alt={thumb.alt} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="detail-purchase detail-purchase-panel" aria-label={t('customer.detail.panelAria')}>
          <div className="detail-heading">
            <StatusPill type="availability" value={availability} t={t} />
            <p className="product-meta">{productMeta(product, t)}</p>
            <h2>{productName(product, t)}</h2>
            <strong className="detail-price">
              {formatRupiah(product.price)}
              <span>{t(product.unitKey)}</span>
            </strong>
          </div>

          <div className="detail-description-block">
            <span className="option-label">{t('customer.detail.description')}</span>
            <p className="detail-copy">{description}</p>
          </div>

          <div className="option-group">
            <span className="option-label">{t('customer.detail.variantLabel')}</span>
            <div className="variant-grid variant-selector" aria-label={t('customer.detail.variantAria')}>
              {product.variants.map((variant) => {
                const available = getVariantAvailability(product, variant.id, dates, rentals);
                return (
                  <button
                    className={`${selectedVariantId === variant.id ? 'selected' : ''} ${available <= 0 ? 'disabled' : ''}`}
                    type="button"
                    key={variant.id}
                    disabled={available <= 0}
                    onClick={() => setSelectedVariantId(variant.id)}
                  >
                    {variantLabel(t, variant.label)}
                    <small>{available}</small>
                  </button>
                );
              })}
            </div>
            <p className={canAdd ? 'helper-text' : 'validation-message'}>
              {canAdd
                ? t('customer.detail.variantHelp')
                : maintenanceReason
                  ? t('customer.detail.unavailableReason', { reason: maintenanceReason })
                  : t('customer.detail.unavailable')}
            </p>
            {selectedVariantId && selectedAvailability <= 0 ? (
              <p className="helper-text availability-suggestion">
                {nextWindow
                  ? t('customer.calendar.nextWindow', { range: formatDateRange(nextWindow, locale) })
                  : t('customer.calendar.noNextWindow')}
              </p>
            ) : null}
          </div>

          <div className="detail-description-block variant-note-block" aria-live="polite">
            <span className="option-label">{t('customer.detail.variantNotes')}</span>
            <p className="detail-copy">{variantNotes}</p>
          </div>

          <div className="option-group">
            <span className="option-label">{t('customer.detail.dateLabel')}</span>
            <div className="date-summary date-range-control">
              <span>{formatDate(dates.start, locale)}</span>
              <b>{t('customer.detail.until')}</b>
              <span>{formatDate(dates.end, locale)}</span>
            </div>
          </div>

          <div className="detail-quick-actions">
            <button className={`outline-button full favorite-button ${isFavorite ? 'selected' : ''}`} type="button" aria-pressed={isFavorite} onClick={handleFavoriteToggle}>
              <Heart aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
              {isFavorite ? t('customer.detail.favoriteSaved') : t('customer.detail.favorite')}
            </button>
            {favoriteNotice ? <p className="success-message favorite-feedback">{t('customer.detail.favoriteUndo')}</p> : null}
            <div className="detail-cta-bar detail-action-bar">
              <button className="secondary-button full" type="button" disabled={!canAdd} onClick={onAdd}>
                <ShoppingCart aria-hidden="true" />
                {isInCart ? t('customer.status.added') : t('customer.detail.add')}
              </button>
            </div>
          </div>

          <ProductAvailabilityCalendar
            product={product}
            selectedVariantId={selectedVariantId}
            dates={dates}
            locale={locale}
            t={t}
            rentals={rentals}
            dataAdapter={dataAdapter}
          />
        </aside>
      </div>
    </section>
  );
}
