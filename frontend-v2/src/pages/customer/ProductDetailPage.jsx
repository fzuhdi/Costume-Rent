import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ProductDetail } from '../../components/customer/CustomerComponents.jsx';
import { defaultDates } from '../../mockData.js';
import {
  firstAvailableVariant,
  formatDateRange,
  getVariantAvailability,
} from '../../lib/rental-utils.js';
import CustomerFrame from './CustomerFrame.jsx';

function readDates(searchParams) {
  return {
    start: searchParams.get('start') || defaultDates.start,
    end: searchParams.get('end') || defaultDates.end,
  };
}

export default function ProductDetailPage({
  locale,
  setLocale,
  t,
  products,
  rentals,
  settings,
  cart,
  addCartItem,
  onOpenCart,
}) {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const product = products.find((entry) => entry.id === productId);
  const dates = readDates(searchParams);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const catalogueSearch = searchParams.toString();
  const catalogueTo = { pathname: '/', search: catalogueSearch ? `?${catalogueSearch}` : '' };

  useEffect(() => {
    if (!product) return;
    setSelectedVariantId(firstAvailableVariant(product, dates, rentals)?.id ?? product.variants[0]?.id ?? '');
  }, [product, dates.start, dates.end, rentals]);

  if (!product) {
    return <Navigate to={catalogueTo} replace />;
  }

  const selectedAvailability = selectedVariantId ? getVariantAvailability(product, selectedVariantId, dates, rentals) : 0;

  const handleAdd = () => {
    if (!selectedVariantId || selectedAvailability <= 0) return;
    addCartItem(product, selectedVariantId, dates, selectedAvailability);
    onOpenCart();
  };

  return (
    <CustomerFrame
      title={t('document.productTitle', { product: t(product.nameKey) })}
      skipTo="product-detail"
      settings={settings}
      locale={locale}
      setLocale={setLocale}
      t={t}
      cartCount={cart.length}
      onOpenCart={onOpenCart}
    >
      <section className="detail-route-header">
        <div className="shell detail-route-bar">
          <Link className="back-link" to={catalogueTo}>
            <ArrowLeft aria-hidden="true" />
            {t('customer.detail.back')}
          </Link>
          <span className="eyebrow">{formatDateRange(dates, locale)}</span>
        </div>
      </section>
      <ProductDetail
        product={product}
        selectedVariantId={selectedVariantId}
        setSelectedVariantId={setSelectedVariantId}
        dates={dates}
        locale={locale}
        t={t}
        onAdd={handleAdd}
        selectedAvailability={selectedAvailability}
        cart={cart}
        rentals={rentals}
      />
    </CustomerFrame>
  );
}
