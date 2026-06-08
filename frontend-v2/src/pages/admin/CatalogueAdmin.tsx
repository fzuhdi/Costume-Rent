import {
  CatalogueEditor,
  SwitchProductDialog,
} from '../../components/admin/catalogue/CatalogueEditor';
import {
  AdminCreateAction,
  AdminCreateFab,
  AdminFeatureGrid,
  AdminListWindow,
  AdminViewBar,
} from '../../components/admin/common/AdminManagement';
import {
  CatalogueCreatePanel,
  CatalogueProductList,
  categoryOptions,
  genderOptions,
} from '../../components/admin/catalogue/CatalogueManagement';
import {
  makeMediaId,
  readFileAsDataUrl,
  toNonNegativeDraftNumber,
  toNonNegativeNumber,
  updateSource,
} from '../../components/admin/catalogue/catalogueAdminUtils';
import { useCatalogueAdminController } from '../../components/admin/catalogue/useCatalogueAdminController';
import type { CatalogueEditorTab } from '../../components/admin/catalogue/catalogueEditorUtils';
import { SearchInput } from '../../components/shared';
import type { DataAdapter, Locale, Product, TFunction } from '../../types/domain';
import type { StateSetter } from '../../types/app';

export default function CatalogueAdmin({
  t,
  locale,
  products,
  setProducts,
  dataAdapter,
}: {
  t: TFunction;
  locale: Locale;
  products: Product[];
  setProducts: StateSetter<Product[]>;
  dataAdapter?: DataAdapter;
}) {
  const controller = useCatalogueAdminController({ t, products, setProducts, dataAdapter });

  return (
    <AdminFeatureGrid className="catalogue-admin-grid" detailOpen={controller.editorOpen}>
      <AdminListWindow>
        <AdminViewBar>
          <SearchInput value={controller.query} onChange={controller.setQuery} placeholder={t('common.search')} clearLabel={t('common.clear')} />
          <AdminCreateAction
            label={t('admin.catalogue.add')}
            open={controller.createOpen}
            controls="catalogue-create-panel"
            onToggle={() => controller.setCreateOpen((open) => !open)}
          />
        </AdminViewBar>
        <AdminCreateFab
          label={t('admin.catalogue.add')}
          open={controller.createOpen}
          controls="catalogue-create-panel"
          onToggle={() => controller.setCreateOpen((open) => !open)}
        />
        {controller.createOpen ? (
          <CatalogueCreatePanel
            t={t}
            locale={locale}
            createDraft={controller.createDraft}
            setCreateDraft={controller.setCreateDraft}
            onCreate={controller.createProduct}
            onClose={() => controller.setCreateOpen(false)}
            toNonNegativeDraftNumber={toNonNegativeDraftNumber}
          />
        ) : null}
        <CatalogueProductList
          products={controller.filtered}
          selectedId={controller.selected?.id}
          isDirty={controller.isDirty}
          t={t}
          onSelect={controller.requestProductSwitch}
        />
      </AdminListWindow>

      {controller.selected && controller.productDraft && controller.editorOpen ? (
        <CatalogueEditor
          t={t}
          locale={locale}
          productDraft={controller.productDraft}
          mediaItems={controller.mediaItems}
          coverImage={controller.coverImage}
          activeTab={controller.activeTab}
          setActiveTab={(tab) => controller.setActiveTab(tab as CatalogueEditorTab)}
          detailErrors={controller.detailErrors}
          variantErrors={controller.variantErrors}
          newVariant={controller.newVariant}
          newVariantErrors={controller.newVariantErrors}
          setNewVariant={controller.setNewVariant}
          setNewVariantErrors={controller.setNewVariantErrors}
          updateDraft={controller.updateDraft}
          updateVariant={controller.updateVariant}
          updateMediaItems={controller.updateMediaItems}
          adjustVariantTotal={controller.adjustVariantTotal}
          removeVariant={controller.removeVariant}
          addVariant={controller.addVariant}
          variantLabelRef={controller.variantLabelRef}
          maintenanceOpen={controller.maintenanceOpen}
          setMaintenanceOpen={controller.setMaintenanceOpen}
          maintenanceDraft={controller.maintenanceDraft}
          setMaintenanceDraft={controller.setMaintenanceDraft}
          saveMaintenanceBlock={controller.saveMaintenanceBlock}
          removeMaintenanceBlock={controller.removeMaintenanceBlock}
          isDirty={controller.isDirty}
          hasValidationErrors={controller.hasValidationErrors}
          saveState={controller.saveState}
          onSave={controller.saveProduct}
          onDiscard={controller.resetProduct}
          onClose={() => controller.setEditorOpen(false)}
          categoryOptions={categoryOptions(locale)}
          genderOptions={genderOptions(t)}
          toNonNegativeDraftNumber={toNonNegativeDraftNumber}
          toNonNegativeNumber={toNonNegativeNumber}
          updateSource={updateSource}
          makeMediaId={makeMediaId}
          readFileAsDataUrl={readFileAsDataUrl}
        />
      ) : null}

      <SwitchProductDialog
        t={t}
        open={Boolean(controller.switchTargetId)}
        onStay={controller.clearSwitchTarget}
        onDiscard={controller.discardAndSwitch}
        onSave={controller.saveAndSwitch}
        saving={controller.saveState.status === 'saving'}
      />
    </AdminFeatureGrid>
  );
}
