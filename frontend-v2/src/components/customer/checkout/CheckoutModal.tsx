import * as Dialog from '@radix-ui/react-dialog';
import { SheetHeader } from '../../shared';
import { CartSummary } from './CartSummary';
import { CheckoutForm } from './CheckoutForm';
import type { BookingValues, CartItem, CartLineItem, Locale, Rental, RequestCreateResult, TFunction } from '../../../types/domain';

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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: TFunction;
  locale: Locale;
  cartItems: CartLineItem[];
  cartTotal: number;
  cartCount: number;
  onQty: (target: CartItem, delta: number) => void;
  onRemove: (target: CartItem) => void;
  createBooking: (values: BookingValues) => Promise<RequestCreateResult>;
  submittedBooking: Rental | null;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="checkout-sheet checkout-shell">
          <SheetHeader
            kicker={t('customer.checkout.modalKicker')}
            title={t('customer.checkout.modalTitle')}
            description={t('customer.checkout.modalCopy')}
            closeLabel={t('customer.checkout.close')}
          />

          <div className="checkout-modal-layout checkout-panel">
            <CheckoutForm t={t} cartCount={cartCount} createBooking={createBooking} submittedBooking={submittedBooking} />
            <CartSummary cartItems={cartItems} cartTotal={cartTotal} t={t} locale={locale} onQty={onQty} onRemove={onRemove} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
