import { Heart, Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../product/ProductCard.jsx';
import { EmptyState } from '../../shared.jsx';
import { formatDateRange } from '../../../lib/rental-utils.js';

export function CatalogueResults({
  hasSearched,
  t,
  locale,
  appliedDates,
  visibleProducts,
  displayedProducts,
  catalogueLoading,
  favoritesOnly,
  buildDetailTo,
  rentals,
  availabilityByProduct,
  hasMoreProducts,
  sentinelRef,
}) {
  if (!hasSearched) {
    return <EmptyState title={t('customer.catalogue.preSearchTitle')} copy={t('customer.catalogue.preSearchCopy')} icon={SlidersHorizontal} />;
  }

  return (
    <>
      <div className="catalogue-result-status" aria-live="polite">
        <span>{t('customer.catalogue.resultCount', { count: visibleProducts.length })}</span>
        <strong>{formatDateRange(appliedDates, locale)}</strong>
      </div>
      {catalogueLoading ? <p className="helper-text">{t('customer.catalogue.loading')}</p> : null}
      {!catalogueLoading && visibleProducts.length === 0 ? (
        <EmptyState
          title={favoritesOnly ? t('customer.favorites.emptyTitle') : t('customer.catalogue.emptyTitle')}
          copy={favoritesOnly ? t('customer.favorites.emptyCopy') : t('customer.catalogue.emptyCopy')}
          icon={favoritesOnly ? Heart : Search}
        />
      ) : (
        <>
          <div className="product-grid" aria-label={t('customer.grid.aria')}>
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                dates={appliedDates}
                locale={locale}
                t={t}
                detailTo={buildDetailTo(product.id)}
                rentals={rentals}
                availabilityOverride={availabilityByProduct[product.id]}
              />
            ))}
          </div>
          {hasMoreProducts ? (
            <div className="load-more-sentinel" ref={sentinelRef}>
              <span>{t('customer.catalogue.loadingMore')}</span>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
