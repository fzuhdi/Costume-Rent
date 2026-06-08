import {
  CheckCircle2,
  CreditCard,
  PackageCheck,
  Settings,
  Truck,
  Undo2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  activityText,
  appendActivity,
  applyItemHoldDelta,
  hasRentalChanged,
  productName,
  shouldReleaseHold,
} from '../../../lib/rental-utils';
import { resetMobileDetailScroll } from '../../../lib/mobile-detail';
import type { StateSetter } from '../../../types/app';
import type { Locale, Product, Rental, RentalLifecycle, Settings as AppSettings, TFunction } from '../../../types/domain';
import type {
  NextRentalAction,
  RentalActivity,
  RentalFilter,
  RentalTransitionAction,
  RentalUpdater,
  UpdateRental,
} from './rentalWorkflowTypes';

export const rentalFilters: RentalFilter[] = ['all', 'ready', 'on_rent', 'returned', 'completed'];

type UseRentalsAdminControllerParams = {
  t: TFunction;
  rentals: Rental[];
  setRentals: StateSetter<Rental[]>;
  products: Product[];
  setProducts: StateSetter<Product[]>;
  settings: AppSettings;
};

export function useRentalsAdminController({
  t,
  rentals,
  setRentals,
  products,
  setProducts,
  settings,
}: UseRentalsAdminControllerParams) {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const statusFilter: RentalFilter = isRentalFilter(statusParam) ? statusParam : 'all';
  const [selectedRef, setSelectedRef] = useState(searchParams.get('reference') ?? '');
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(Boolean(searchParams.get('reference')));
  const [query, setQuery] = useState('');
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const rentalsRef = useRef(rentals);
  const lifecycleMutationRef = useRef({ reference: '', at: 0 });

  const operationalRentals = useMemo(
    () => rentals.filter((rental) => rental.lifecycle !== 'requested' && rental.lifecycle !== 'rejected'),
    [rentals],
  );
  const filterCounts = useMemo(
    () => rentalFilters.reduce<Record<RentalFilter, number>>((counts, filter) => ({
      ...counts,
      [filter]: operationalRentals.filter((rental) => matchesStatusFilter(rental, filter)).length,
    }), { all: 0, ready: 0, on_rent: 0, returned: 0, completed: 0 }),
    [operationalRentals],
  );
  const filteredRentals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return operationalRentals
      .filter((rental) => matchesStatusFilter(rental, statusFilter))
      .filter((rental) => {
        if (!normalizedQuery) return true;
        const itemText = rental.items
          .map((item) => {
            const product = products.find((entry) => entry.id === item.productId);
            return product ? productName(product, t) : '';
          })
          .join(' ');
        return `${rental.reference} ${rental.customerName} ${rental.phone} ${itemText}`.toLowerCase().includes(normalizedQuery);
      });
  }, [operationalRentals, products, query, statusFilter, t]);

  const selected =
    filteredRentals.find((rental) => rental.reference === selectedRef) ??
    filteredRentals[0];
  const isCompleted = selected?.lifecycle === 'completed';
  const canComplete = selected?.paymentStatus === 'verified' || !settings.requireVerifiedProof;
  const nextAction = selected ? getNextAction({ selected, canComplete, t, updateRental }) : null;
  const manualTransitions = selected
    ? getManualTransitions({ selected, canComplete, t, updateRental }).filter((action) => action.lifecycle !== nextAction?.lifecycle && !action.disabled)
    : [];
  const NextActionIcon = nextAction?.icon ?? CheckCircle2;

  useEffect(() => {
    rentalsRef.current = rentals;
  }, [rentals]);

  useEffect(() => {
    const targetReference = searchParams.get('reference');
    if (targetReference && targetReference !== selectedRef) setSelectedRef(targetReference);
    setIsDetailViewOpen(Boolean(targetReference));
  }, [searchParams, selectedRef]);

  useEffect(() => {
    if (!selected && filteredRentals[0]) setSelectedRef(filteredRentals[0].reference);
  }, [filteredRentals, selected]);

  useEffect(() => {
    setCorrectionOpen(false);
  }, [selected?.reference]);

  useEffect(() => {
    if (isDetailViewOpen) resetMobileDetailScroll();
  }, [isDetailViewOpen, selected?.reference]);

  function updateRental(reference: string, updater: RentalUpdater, activity?: RentalActivity): void {
    const currentRentals = rentalsRef.current;
    const existing = currentRentals.find((rental) => rental.reference === reference);
    if (!existing) return;

    const preview: Rental = typeof updater === 'function' ? updater(existing) : { ...existing, ...updater };
    if (!hasRentalChanged(existing, preview)) return;

    if (existing.lifecycle !== preview.lifecycle) {
      const now = Date.now();
      const lastMutation = lifecycleMutationRef.current;
      if (lastMutation.reference === reference && now - lastMutation.at < 650) return;
      lifecycleMutationRef.current = { reference, at: now };
    }

    if (shouldReleaseHold(existing.lifecycle, preview.lifecycle)) {
      setProducts((productsCurrent) => applyItemHoldDelta(productsCurrent, existing.items, -1));
    }

    const nextRental = activity ? appendActivity(preview, activity) : preview;
    const nextRentals = currentRentals.map((rental) => (rental.reference === reference ? nextRental : rental));
    rentalsRef.current = nextRentals;
    setRentals(nextRentals);
  }

  const updateStatusFilter = (nextStatus: RentalFilter) => {
    const next = new URLSearchParams(searchParams);
    if (nextStatus === 'all') {
      next.delete('status');
    } else {
      next.set('status', nextStatus);
    }
    next.delete('reference');
    setIsDetailViewOpen(false);
    setSearchParams(next, { replace: true });
  };

  const selectRental = (reference: string) => {
    setSelectedRef(reference);
    setIsDetailViewOpen(true);
    const next = new URLSearchParams(searchParams);
    next.set('reference', reference);
    setSearchParams(next, { replace: true });
  };

  const closeDetailView = () => {
    setIsDetailViewOpen(false);
    const next = new URLSearchParams(searchParams);
    next.delete('reference');
    setSearchParams(next, { replace: true });
  };

  const overrideSelected = ({ reason, lifecycle }: { reason: string; lifecycle: RentalLifecycle }) => {
    if (!selected) return;
    updateRental(selected.reference, { lifecycle, internalNotes: reason }, activityText(`Override admin: ${reason}`, `Admin override: ${reason}`));
  };

  return {
    statusFilter,
    selected,
    isDetailViewOpen,
    query,
    setQuery,
    overrideOpen,
    setOverrideOpen,
    correctionOpen,
    setCorrectionOpen,
    filterCounts,
    filteredRentals,
    isCompleted,
    canComplete,
    nextAction,
    manualTransitions,
    NextActionIcon,
    updateRental,
    updateStatusFilter,
    selectRental,
    closeDetailView,
    planningEditable: Boolean(selected && !isCompleted && canEditPlanningDetails(selected)),
    showChecklist: Boolean(selected && canUseChecklist(selected)),
    overrideSelected,
  };
}

function isRentalFilter(value: string | null): value is RentalFilter {
  return rentalFilters.includes(value as RentalFilter);
}

function matchesStatusFilter(rental: Rental, statusFilter: RentalFilter): boolean {
  if (statusFilter === 'ready') return ['preparing', 'ready_pickup'].includes(rental.lifecycle);
  if (statusFilter === 'on_rent') return rental.lifecycle === 'on_rent' || rental.lifecycle === 'out_delivery';
  if (statusFilter === 'returned') return rental.lifecycle === 'returned';
  if (statusFilter === 'completed') return rental.lifecycle === 'completed';
  return true;
}

function canEditPlanningDetails(rental: Rental): boolean {
  return ['confirmed', 'preparing', 'ready_pickup'].includes(rental.lifecycle);
}

function canUseChecklist(rental: Rental): boolean {
  return ['confirmed', 'preparing', 'ready_pickup'].includes(rental.lifecycle);
}

function getManualTransitions({
  selected,
  canComplete,
  t,
  updateRental,
}: {
  selected: Rental;
  canComplete: boolean;
  t: TFunction;
  updateRental: UpdateRental;
}): RentalTransitionAction[] {
  const releaseLifecycle: RentalLifecycle = selected.fulfillment === 'delivery' ? 'out_delivery' : 'on_rent';
  const candidates: Array<Pick<RentalTransitionAction, 'label' | 'icon' | 'disabled'> & { lifecycle: RentalLifecycle }> = [];

  if (['confirmed', 'preparing'].includes(selected.lifecycle)) {
    candidates.push({ lifecycle: 'ready_pickup', label: t('admin.rentals.ready'), icon: PackageCheck });
  }

  if (selected.lifecycle === 'ready_pickup') {
    candidates.push({ lifecycle: releaseLifecycle, label: t('admin.rentals.release'), icon: Truck });
    candidates.push({ lifecycle: 'preparing', label: t(`enum.lifecycle.preparing`), icon: PackageCheck });
  }

  if (selected.lifecycle === 'out_delivery' || selected.lifecycle === 'on_rent') {
    candidates.push({ lifecycle: 'returned', label: t('admin.rentals.return'), icon: Undo2 });
    candidates.push({ lifecycle: 'ready_pickup', label: t(`enum.lifecycle.ready_pickup`), icon: PackageCheck });
  }

  if (selected.lifecycle === 'returned') {
    candidates.push({ lifecycle: 'completed', label: t('admin.rentals.complete'), icon: CheckCircle2, disabled: !canComplete });
  }

  return candidates
    .filter((candidate) => candidate.lifecycle !== selected.lifecycle)
    .map((candidate) => ({
      ...candidate,
      key: candidate.lifecycle,
      onClick: () => updateRental(
        selected.reference,
        { lifecycle: candidate.lifecycle },
        lifecycleActivity(candidate.lifecycle),
      ),
    }));
}

function lifecycleActivity(lifecycle: RentalLifecycle): RentalActivity {
  if (lifecycle === 'ready_pickup') return activityText('Barang siap diambil.', 'Items marked ready.');
  if (lifecycle === 'out_delivery' || lifecycle === 'on_rent') return activityText('Barang keluar ke pelanggan.', 'Items released to customer.');
  if (lifecycle === 'returned') return activityText('Barang kembali.', 'Items returned.');
  if (lifecycle === 'completed') return activityText('Sewa selesai.', 'Rental completed.');
  if (lifecycle === 'preparing') return activityText('Status dikoreksi ke persiapan.', 'Status corrected to preparing.');
  return activityText('Status pesanan dikoreksi.', 'Rental status corrected.');
}

function getNextAction({
  selected,
  canComplete,
  t,
  updateRental,
}: {
  selected: Rental;
  canComplete: boolean;
  t: TFunction;
  updateRental: UpdateRental;
}): NextRentalAction {
  if (selected.lifecycle === 'completed') {
    return {
      title: t('admin.rentals.nextLockedTitle'),
      copy: t('admin.rentals.nextLockedCopy'),
      label: t('admin.rentals.override'),
      icon: Settings,
      disabled: true,
      tone: 'warning',
      onClick: () => {},
    };
  }

  if (selected.lifecycle === 'returned' && !canComplete) {
    const canVerifyProof = selected.paymentStatus === 'attached';
    return {
      title: t('admin.rentals.nextPaymentTitle'),
      copy: t('admin.rentals.nextPaymentCopy'),
      label: canVerifyProof ? t('admin.payment.verify') : t('admin.payment.attach'),
      icon: CreditCard,
      disabled: !canVerifyProof,
      tone: 'warning',
      onClick: () => updateRental(selected.reference, { paymentStatus: 'verified' }, activityText('Bukti bayar diverifikasi.', 'Payment proof verified.')),
    };
  }

  if (selected.lifecycle === 'returned') {
    return {
      lifecycle: 'completed',
      title: t('admin.rentals.nextCompleteTitle'),
      copy: t('admin.rentals.nextCompleteCopy'),
      label: t('admin.rentals.complete'),
      icon: CheckCircle2,
      tone: 'success',
      onClick: () => updateRental(selected.reference, { lifecycle: 'completed' }, activityText('Sewa selesai.', 'Rental completed.')),
    };
  }

  if (selected.lifecycle === 'on_rent' || selected.lifecycle === 'out_delivery') {
    return {
      lifecycle: 'returned',
      title: t('admin.rentals.nextReturnTitle'),
      copy: t('admin.rentals.nextReturnCopy'),
      label: t('admin.rentals.return'),
      icon: Undo2,
      tone: 'info',
      onClick: () => updateRental(selected.reference, { lifecycle: 'returned' }, activityText('Barang kembali.', 'Items returned.')),
    };
  }

  if (selected.lifecycle === 'ready_pickup') {
    return {
      lifecycle: selected.fulfillment === 'delivery' ? 'out_delivery' : 'on_rent',
      title: t('admin.rentals.nextReleaseTitle'),
      copy: selected.fulfillment === 'delivery' ? t('admin.rentals.nextReleaseDeliveryCopy') : t('admin.rentals.nextReleasePickupCopy'),
      label: t('admin.rentals.release'),
      icon: Truck,
      tone: 'info',
      onClick: () => updateRental(selected.reference, { lifecycle: selected.fulfillment === 'delivery' ? 'out_delivery' : 'on_rent' }, activityText('Barang keluar ke pelanggan.', 'Items released to customer.')),
    };
  }

  return {
    lifecycle: 'ready_pickup',
    title: t('admin.rentals.nextReadyTitle'),
    copy: t('admin.rentals.nextReadyCopy'),
    label: t('admin.rentals.ready'),
    icon: PackageCheck,
    tone: 'info',
    onClick: () => updateRental(selected.reference, { lifecycle: 'ready_pickup' }, activityText('Barang siap diambil.', 'Items marked ready.')),
  };
}
