import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SheetHeader } from '../../shared.jsx';
import { CartSummary } from './CartSummary.jsx';
import { CheckoutForm } from './CheckoutForm.jsx';
import { useCheckoutLink } from './useCheckoutLink.js';

export function RequestSummarySheet({
  open,
  onOpenChange,
  t,
  locale,
  cartItems,
  cartTotal,
  cartCount,
  onQty,
  onRemove,
  createBooking,
  submittedBooking,
}) {
  const checkoutLink = useCheckoutLink();
  const [checkoutActive, setCheckoutActive] = useState(false);

  useEffect(() => {
    if (!open) setCheckoutActive(false);
  }, [open]);

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) setCheckoutActive(false);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className={`request-sheet-content ${checkoutActive ? 'checkout-active' : ''}`} aria-describedby="request-summary-description">
          <SheetHeader
            kicker={t('customer.requestSheet.kicker')}
            title={checkoutActive ? t('customer.checkout.modalTitle') : t('customer.requestSheet.title')}
            description={checkoutActive ? t('customer.checkout.modalCopy') : t('customer.requestSheet.copy')}
            descriptionId="request-summary-description"
            closeLabel={t('customer.requestSheet.close')}
          />

          <div className="request-sheet-body">
            {checkoutActive ? (
              <div className="checkout-modal-layout">
                <CheckoutForm t={t} cartCount={cartCount} createBooking={createBooking} submittedBooking={submittedBooking} />
                <CartSummary cartItems={cartItems} cartTotal={cartTotal} t={t} locale={locale} onQty={onQty} onRemove={onRemove} />
              </div>
            ) : (
              <CartSummary cartItems={cartItems} cartTotal={cartTotal} t={t} locale={locale} onQty={onQty} onRemove={onRemove} />
            )}
          </div>

          {!checkoutActive ? (
            <div className="sheet-actions">
              <button className="primary-button full" type="button" disabled={cartCount === 0} onClick={() => setCheckoutActive(true)}>
                {t('customer.requestSheet.checkout')}
              </button>
              <Link className="outline-button full" to={{ pathname: '/catalogue', search: checkoutLink.to.search }} onClick={() => handleOpenChange(false)}>
                {t('customer.requestSheet.continue')}
              </Link>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
