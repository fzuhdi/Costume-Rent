import { AdminWorkQueueLayout } from '../../components/admin/common/AdminManagement';
import { OverrideDialog } from '../../components/admin/rentals/RentalDialogs';
import { RentalListView, RentalWorkflowDetail } from '../../components/admin/rentals/RentalWorkflow';
import { rentalFilters, useRentalsAdminController } from '../../components/admin/rentals/useRentalsAdminController';
import type { StateSetter } from '../../types/app';
import type { Locale, Product, Rental, Settings as AppSettings, TFunction } from '../../types/domain';

type RentalsAdminProps = {
  t: TFunction;
  locale: Locale;
  rentals: Rental[];
  setRentals: StateSetter<Rental[]>;
  products: Product[];
  setProducts: StateSetter<Product[]>;
  settings: AppSettings;
};

export default function RentalsAdmin({ t, locale, rentals, setRentals, products, setProducts, settings }: RentalsAdminProps) {
  const controller = useRentalsAdminController({ t, rentals, setRentals, products, setProducts, settings });

  return (
    <AdminWorkQueueLayout featureGrid className="rentals-admin-grid" detailOpen={controller.isDetailViewOpen}>
      <RentalListView
        t={t}
        locale={locale}
        query={controller.query}
        setQuery={controller.setQuery}
        statusFilter={controller.statusFilter}
        filterCounts={controller.filterCounts}
        rentalFilters={rentalFilters}
        filteredRentals={controller.filteredRentals}
        selected={controller.selected}
        onStatusFilterChange={controller.updateStatusFilter}
        onSelectRental={controller.selectRental}
      />

      {controller.selected ? (
        <RentalWorkflowDetail
          selected={controller.selected}
          t={t}
          locale={locale}
          products={products}
          updateRental={controller.updateRental}
          onBack={controller.closeDetailView}
          nextAction={controller.nextAction}
          manualTransitions={controller.manualTransitions}
          NextActionIcon={controller.NextActionIcon}
          isCompleted={controller.isCompleted}
          canComplete={controller.canComplete}
          correctionOpen={controller.correctionOpen}
          setCorrectionOpen={controller.setCorrectionOpen}
          setOverrideOpen={controller.setOverrideOpen}
          planningEditable={controller.planningEditable}
          showChecklist={controller.showChecklist}
        />
      ) : null}

      <OverrideDialog
        open={controller.overrideOpen}
        setOpen={controller.setOverrideOpen}
        t={t}
        rental={controller.selected}
        locale={locale}
        onOverride={controller.overrideSelected}
      />
    </AdminWorkQueueLayout>
  );
}
