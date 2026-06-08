import * as Tabs from '@radix-ui/react-tabs';
import { X } from 'lucide-react';
import { CatalogueStockFraction } from './CatalogueStockFraction';
import { DetailsTab } from './DetailsTab';
import { EditorSaveBar } from './EditorSaveBar';
import { MaintenanceTab } from './MaintenanceTab';
import { MediaTab } from './MediaTab';
import { SwitchProductDialog } from './SwitchProductDialog';
import { VariantsTab } from './VariantsTab';
import { CATALOGUE_MAX_IMAGE_COUNT, editorTabs } from './catalogueEditorUtils';
import { DetailPanel } from '../../shared';
import { productAlt, productName } from '../../../lib/rental-utils';
import type { CatalogueEditorProps } from './catalogueEditorTypes';

export { CATALOGUE_MAX_IMAGE_COUNT } from './catalogueEditorUtils';
export { CatalogueStockFraction } from './CatalogueStockFraction';
export { SwitchProductDialog } from './SwitchProductDialog';

export function CatalogueEditor({
  t,
  locale,
  productDraft,
  mediaItems,
  coverImage,
  activeTab,
  setActiveTab,
  detailErrors,
  variantErrors,
  newVariant,
  newVariantErrors,
  setNewVariant,
  setNewVariantErrors,
  updateDraft,
  updateVariant,
  updateMediaItems,
  adjustVariantTotal,
  removeVariant,
  addVariant,
  variantLabelRef,
  maintenanceOpen,
  setMaintenanceOpen,
  maintenanceDraft,
  setMaintenanceDraft,
  saveMaintenanceBlock,
  removeMaintenanceBlock,
  isDirty,
  hasValidationErrors,
  saveState,
  onSave,
  onDiscard,
  onClose,
  categoryOptions,
  genderOptions,
  toNonNegativeDraftNumber,
  toNonNegativeNumber,
  updateSource,
  makeMediaId,
  readFileAsDataUrl,
}: CatalogueEditorProps) {
  return (
    <DetailPanel className="catalogue-editor-panel inventory-editor-panel" aria-label={t('admin.catalogue.editorAria')}>
      <div className="catalogue-editor-head">
        <div className="catalogue-preview-thumb">
          <img src={coverImage?.src ?? productDraft.image} alt={coverImage?.alt ?? productAlt(productDraft, t)} />
          <span>{t('admin.catalogue.imageCount', { count: mediaItems.length, total: CATALOGUE_MAX_IMAGE_COUNT })}</span>
        </div>
        <div className="catalogue-editor-title">
          <span className="eyebrow">{t('admin.common.selected')}</span>
          <strong>{productName(productDraft, t)}</strong>
          <div className="catalogue-editor-meta">
            <span className={`status-badge ${productDraft.active ? 'success' : 'warning'}`}>
              {productDraft.active ? t('admin.catalogue.active') : t('admin.catalogue.inactive')}
            </span>
            <span className={`save-state ${saveState.status}`}>
              {saveState.message || (isDirty ? t('admin.catalogue.unsaved') : t('admin.catalogue.noChanges'))}
            </span>
          </div>
        </div>
        <button className="icon-button catalogue-editor-close" type="button" aria-label={t('common.close')} onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      </div>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="catalogue-tabs">
        <Tabs.List className="catalogue-tab-list editor-tab-rail" aria-label={t('admin.catalogue.editorTabs')}>
          {editorTabs.map((tab) => (
            <Tabs.Trigger className="catalogue-tab-trigger" value={tab} key={tab}>
              {t(`admin.catalogue.tab.${tab}`)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content className="catalogue-tab-panel editor-section" value="details">
          <DetailsTab
            t={t}
            locale={locale}
            productDraft={productDraft}
            detailErrors={detailErrors}
            updateDraft={updateDraft}
            categoryOptions={categoryOptions}
            genderOptions={genderOptions}
            toNonNegativeDraftNumber={toNonNegativeDraftNumber}
            toNonNegativeNumber={toNonNegativeNumber}
            updateSource={updateSource}
          />
        </Tabs.Content>

        <Tabs.Content className="catalogue-tab-panel editor-section" value="media">
          <MediaTab
            t={t}
            productDraft={productDraft}
            mediaItems={mediaItems}
            updateMediaItems={updateMediaItems}
            makeMediaId={makeMediaId}
            readFileAsDataUrl={readFileAsDataUrl}
          />
        </Tabs.Content>

        <Tabs.Content className="catalogue-tab-panel editor-section" value="variants">
          <VariantsTab
            t={t}
            variants={productDraft.variants}
            variantErrors={variantErrors}
            newVariant={newVariant}
            newVariantErrors={newVariantErrors}
            setNewVariant={setNewVariant}
            setNewVariantErrors={setNewVariantErrors}
            updateVariant={updateVariant}
            adjustVariantTotal={adjustVariantTotal}
            removeVariant={removeVariant}
            addVariant={addVariant}
            variantLabelRef={variantLabelRef}
            updateSource={updateSource}
          />
        </Tabs.Content>

        <Tabs.Content className="catalogue-tab-panel editor-section" value="maintenance">
          <MaintenanceTab
            t={t}
            locale={locale}
            productDraft={productDraft}
            maintenanceOpen={maintenanceOpen}
            setMaintenanceOpen={setMaintenanceOpen}
            maintenanceDraft={maintenanceDraft}
            setMaintenanceDraft={setMaintenanceDraft}
            saveMaintenanceBlock={saveMaintenanceBlock}
            removeMaintenanceBlock={removeMaintenanceBlock}
          />
        </Tabs.Content>
      </Tabs.Root>

      <EditorSaveBar
        t={t}
        isDirty={isDirty}
        hasValidationErrors={hasValidationErrors}
        saveState={saveState}
        onSave={onSave}
        onDiscard={onDiscard}
      />
    </DetailPanel>
  );
}
