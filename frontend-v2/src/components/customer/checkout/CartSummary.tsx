import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { EmptyState } from '../../shared';
import {
  formatDate,
  formatRupiah,
  productAlt,
  productCoverImage,
  productName,
  variantLabel,
} from '../../../lib/rental-utils';
import type { CartItem, CartLineItem, Locale, TFunction } from '../../../types/domain';

export function CartSummary({
  cartItems,
  cartTotal,
  t,
  locale,
  onQty,
  onRemove,
}: {
  cartItems: CartLineItem[];
  cartTotal: number;
  t: TFunction;
  locale: Locale;
  onQty: (target: CartItem, delta: number) => void;
  onRemove: (target: CartItem) => void;
}) {
  return (
    <aside className="summary-card cart-card order-summary" aria-label={t('customer.summary.aria')}>
      <div className="summary-header">
        <span className="eyebrow">{t('customer.cart.title')}</span>
        <strong>{formatRupiah(cartTotal)}</strong>
      </div>
      <p>{t('customer.cart.copy')}</p>
      {cartItems.length === 0 ? (
        <EmptyState title={t('customer.cart.empty')} copy={t('customer.cart.syncNotice')} icon={ShoppingBag} />
      ) : (
        cartItems.map((item) => (
          <div className="summary-item editable" key={`${item.product.id}-${item.variantId}`}>
            <div className="cart-item-main">
              <img src={productCoverImage(item.product, t)} alt={productAlt(item.product, t)} />
              <div className="cart-item-copy">
                <strong>{productName(item.product, t)}</strong>
                <span className="cart-item-meta">
                  {variantLabel(t, item.variantId)} | {t('customer.cart.itemDates', { start: formatDate(item.start, locale), end: formatDate(item.end, locale) })}
                </span>
                <b className="cart-item-price">{formatRupiah((Number(item.product.price) || 0) * item.qty)}</b>
              </div>
            </div>
            <div className="cart-item-actions">
              <div className="quantity-control" aria-label={t('common.qty')}>
                <button type="button" onClick={() => onQty(item, -1)} aria-label={t('common.remove')}>
                  <Minus aria-hidden="true" />
                </button>
                <span>{item.qty}</span>
                <button type="button" onClick={() => onQty(item, 1)} aria-label={t('common.apply')}>
                  <Plus aria-hidden="true" />
                </button>
              </div>
              <button className="icon-button danger" type="button" onClick={() => onRemove(item)} aria-label={t('common.remove')}>
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </div>
        ))
      )}
      <div className="summary-total">
        <span>{t('customer.summary.totalLabel')}</span>
        <strong>{formatRupiah(cartTotal)}</strong>
      </div>
    </aside>
  );
}
