import * as Dialog from '@radix-ui/react-dialog';
import { SheetHeader } from '../../shared.jsx';
import { CartSummary } from './CartSummary.jsx';
import { CheckoutForm } from './CheckoutForm.jsx';

export function CheckoutModal({
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
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="checkout-sheet" aria-describedby="checkout-modal-description">
          <SheetHeader
            kicker={t('customer.checkout.modalKicker')}
            title={t('customer.checkout.modalTitle')}
            description={t('customer.checkout.modalCopy')}
            descriptionId="checkout-modal-description"
            closeLabel={t('customer.checkout.close')}
          />

          <div className="checkout-modal-layout">
            <CheckoutForm t={t} cartCount={cartCount} createBooking={createBooking} submittedBooking={submittedBooking} />
            <CartSummary cartItems={cartItems} cartTotal={cartTotal} t={t} locale={locale} onQty={onQty} onRemove={onRemove} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
