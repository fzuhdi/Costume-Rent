import { ChevronRight, Search } from 'lucide-react';
import { AdminCreatePanel } from '../common/AdminManagement';
import { CatalogueStockFraction } from './CatalogueStockFraction';
import { EmptyState, Field, SelectField, type SelectOption } from '../../shared';
import {
  productAlt,
  productCoverImage,
  productMeta,
  productName,
} from '../../../lib/rental-utils';
import type { Locale, Product, TFunction } from '../../../types/domain';
import type { StateSetter } from '../../../types/app';
import type { CatalogueCreateDraft } from './catalogueEditorTypes';
import type { DraftNumber } from './catalogueAdminUtils';

export const categoryOptions = (locale: Locale): SelectOption[] => [
  { value: 'formal', label: locale === 'id' ? 'Formal' : 'Formal' },
  { value: 'accessory', label: locale === 'id' ? 'Aksesori' : 'Accessory' },
];

export const genderOptions = (t: TFunction): SelectOption[] => ['women', 'men', 'unisex', 'kids'].map((value) => ({
  value,
  label: t(`enum.gender.${value}`),
}));

export function CatalogueCreatePanel({
  t,
  locale,
  createDraft,
  setCreateDraft,
  onCreate,
  onClose,
  toNonNegativeDraftNumber,
}: {
  t: TFunction;
  locale: Locale;
  createDraft: CatalogueCreateDraft;
  setCreateDraft: StateSetter<CatalogueCreateDraft>;
  onCreate: () => void;
  onClose: () => void;
  toNonNegativeDraftNumber: (value: string | number) => DraftNumber;
}) {
  return (
    <AdminCreatePanel
      id="catalogue-create-panel"
      kicker={t('admin.catalogue.add')}
      title={t('admin.catalogue.addHelp')}
      closeLabel={t('common.close')}
      onClose={onClose}
    >
      <div className="form-grid">
        <Field label={t('common.name')}>
          <input value={createDraft.name} onChange={(event) => setCreateDraft((current) => ({ ...current, name: event.target.value }))} />
        </Field>
        <Field label={t('admin.catalogue.meta')}>
          <input value={createDraft.meta} onChange={(event) => setCreateDraft((current) => ({ ...current, meta: event.target.value }))} />
        </Field>
        <SelectField
          label={t('admin.catalogue.category')}
          value={createDraft.category}
          onValueChange={(category) => setCreateDraft((current) => ({ ...current, category }))}
          options={categoryOptions(locale)}
        />
        <SelectField
          label={t('admin.catalogue.gender')}
          value={createDraft.gender}
          onValueChange={(gender) => setCreateDraft((current) => ({ ...current, gender }))}
          options={genderOptions(t)}
        />
        <Field label={t('admin.catalogue.price')}>
          <input type="number" min="0" value={createDraft.price} onChange={(event) => setCreateDraft((current) => ({ ...current, price: toNonNegativeDraftNumber(event.target.value) }))} />
        </Field>
        <Field label={t('admin.catalogue.newVariant')}>
          <input value={createDraft.variantLabel} onChange={(event) => setCreateDraft((current) => ({ ...current, variantLabel: event.target.value }))} />
        </Field>
        <Field label={t('admin.catalogue.totalQty')}>
          <input type="number" min="1" value={createDraft.total} onChange={(event) => setCreateDraft((current) => ({ ...current, total: event.target.value === '' ? '' : Number(event.target.value) }))} />
        </Field>
      </div>
      <button className="secondary-button full" type="button" onClick={onCreate} disabled={!createDraft.name.trim() || !createDraft.variantLabel.trim()}>
        {t('common.save')}
      </button>
    </AdminCreatePanel>
  );
}

export function CatalogueProductList({
  products,
  selectedId,
  isDirty,
  t,
  onSelect,
}: {
  products: Product[];
  selectedId?: string;
  isDirty: boolean;
  t: TFunction;
  onSelect: (productId: string) => void;
}) {
  return (
    <div className="management-list padded">
      {products.length === 0 ? (
        <EmptyState title={t('admin.catalogue.noProducts')} copy={t('admin.catalogue.noProductsCopy')} icon={Search} />
      ) : (
        products.map((product) => (
          <button
            className={`management-card catalogue-record ${selectedId === product.id ? 'selected' : ''}`}
            type="button"
            key={product.id}
            aria-current={selectedId === product.id ? 'true' : undefined}
            onClick={() => onSelect(product.id)}
          >
            <img src={productCoverImage(product, t)} alt={productAlt(product, t)} />
            <div className="catalogue-record-main">
              <div className="catalogue-record-copy">
                <strong>{productName(product, t)}</strong>
                <span>{productMeta(product, t)}</span>
              </div>
              <div className="catalogue-record-status">
                <span className={`status-badge ${product.active ? 'success' : 'warning'} catalogue-active-badge`}>
                  <span aria-hidden="true" />
                  <span className="status-badge-label">{product.active ? t('admin.catalogue.activeShort') : t('admin.catalogue.inactiveShort')}</span>
                </span>
                <CatalogueStockFraction product={product} t={t} showHealthy />
                {isDirty && selectedId === product.id ? <em className="dirty-badge">{t('admin.catalogue.unsavedBadge')}</em> : null}
              </div>
            </div>
            <ChevronRight className="catalogue-card-chevron" aria-hidden="true" />
          </button>
        ))
      )}
    </div>
  );
}
