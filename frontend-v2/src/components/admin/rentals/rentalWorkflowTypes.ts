import type { LucideIcon } from 'lucide-react';
import type {
  ActivityItem,
  FulfillmentMethod,
  PaymentMethod,
  Rental,
  RentalLifecycle,
  Tone,
} from '../../../types/domain';

export type RentalFilter = 'all' | 'ready' | 'on_rent' | 'returned' | 'completed';

export type RentalActivity = Omit<ActivityItem, 'id' | 'time'>;

export type RentalPatch = Partial<Rental>;

export type RentalUpdater = RentalPatch | ((rental: Rental) => Rental);

export type UpdateRental = (reference: string, updater: RentalUpdater, activity?: RentalActivity) => void;

export type RentalTransitionAction = {
  key: string;
  lifecycle?: RentalLifecycle;
  title?: string;
  copy?: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  tone?: Tone;
  onClick: () => void;
};

export type NextRentalAction = Omit<RentalTransitionAction, 'key'> & {
  title: string;
  copy: string;
};

export type PaymentDeliveryDraft = {
  paymentMethod: PaymentMethod;
  deliveryFee: number;
  fulfillment: FulfillmentMethod;
  address: string;
  pickupWindow: string;
  deliveryWindow: string;
  returnWindow: string;
  deliveryNotes: string;
};
