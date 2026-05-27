import * as Switch from '@radix-ui/react-switch';
import { Minus, Plus, Search, Trash2, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Field, StatusPill } from '../../components/shared.jsx';
import { defaultDates } from '../../mockData.js';
import { formatDateRange, formatRupiah, getProductAvailability, updateVariantTotal } from '../../lib/rental-utils.js';

export default function CatalogueAdmin({ t, locale, products, setProducts }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(products[0]?.id);
  const [newVariant, setNewVariant] = useState({ label: '', total: 1 });
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceDraft, setMaintenanceDraft] = useState({ start: '', end: '', reason: '' });
  const selected = products.find((product) => product.id === selectedId) ?? products[0];
  const filtered = products.filter((product) => t(product.nameKey).toLowerCase().includes(query.toLowerCase()));

  const updateProduct = (productId, updater) => {
    setProducts((current) => current.map((product) => (product.id === productId ? (typeof updater === 'function' ? updater(product) : { ...product, ...updater }) : product)));
  };

  useEffect(() => {
    setNewVariant({ label: '', total: 1 });
    setMaintenanceOpen(false);
    setMaintenanceDraft({ start: '', end: '', reason: '' });
  }, [selected?.id]);

  const updateVariant = (variantId, changes) => {
    updateProduct(selected.id, (product) => ({
      ...product,
      variants: product.variants.map((variant) => (variant.id === variantId ? { ...variant, ...changes } : variant)),
    }));
  };

  const addVariant = () => {
    const label = newVariant.label.trim();
    if (!label || !selected) return;
    const id = label.replace(/\s+/g, '-').toUpperCase();
    updateProduct(selected.id, (product) => {
      if (product.variants.some((variant) => variant.id.toLowerCase() === id.toLowerCase())) return product;
      return {
        ...product,
        variants: [
          ...product.variants,
          {
            id,
            label,
            total: Math.max(1, Number(newVariant.total) || 1),
            held: 0,
          },
        ],
      };
    });
    setNewVariant({ label: '', total: 1 });
  };

  const removeVariant = (variantId) => {
    updateProduct(selected.id, (product) => ({
      ...product,
      variants: product.variants.length <= 1 ? product.variants : product.variants.filter((variant) => variant.id !== variantId),
    }));
  };

  const saveMaintenanceBlock = () => {
    if (!maintenanceDraft.start || !maintenanceDraft.end || !selected) return;
    updateProduct(selected.id, (product) => ({
      ...product,
      maintenanceBlocks: [
        ...product.maintenanceBlocks,
        {
          id: `maintenance-${Date.now()}`,
          start: maintenanceDraft.start,
          end: maintenanceDraft.end,
          reason: maintenanceDraft.reason.trim(),
        },
      ],
    }));
    setMaintenanceDraft({ start: '', end: '', reason: '' });
    setMaintenanceOpen(false);
  };

  const removeMaintenanceBlock = (blockIndex) => {
    updateProduct(selected.id, (product) => ({
      ...product,
      maintenanceBlocks: product.maintenanceBlocks.filter((_, index) => index !== blockIndex),
    }));
  };

  return (
    <div className="admin-feature-grid">
      <section className="base-window management-window">
        <div className="view-bar">
          <label className="search-inline">
            <Search aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('common.search')} />
          </label>
          <button className="primary-button" type="button">
            <Plus aria-hidden="true" />
            {t('admin.catalogue.add')}
          </button>
        </div>
        <div className="management-list padded">
          {filtered.map((product) => (
            <button className={`management-card catalogue-record ${selected?.id === product.id ? 'selected' : ''}`} type="button" key={product.id} onClick={() => setSelectedId(product.id)}>
              <img src={product.image} alt={t(product.altKey)} />
              <div>
                <strong>{t(product.nameKey)}</strong>
                <span>{t(product.metaKey)}</span>
              </div>
              <StatusPill type="availability" value={getProductAvailability(product, defaultDates)} t={t} />
            </button>
          ))}
        </div>
      </section>

      {selected ? (
        <section className="record-panel feature-panel">
          <div className="record-panel-head">
            <span className="eyebrow">{t('admin.catalogue.variantInventory')}</span>
            <strong>{t(selected.nameKey)}</strong>
          </div>
          <img className="catalogue-hero" src={selected.image} alt={t(selected.altKey)} />
          <div className="catalogue-edit-grid">
            <Field label={t('admin.catalogue.price')}>
              <input
                type="number"
                min="0"
                value={selected.price}
                onChange={(event) => updateProduct(selected.id, { price: Math.max(0, Number(event.target.value) || 0) })}
              />
            </Field>
            <div className="info-block">
              <span>{t('admin.catalogue.publicPrice')}</span>
              <strong>{formatRupiah(selected.price)}</strong>
            </div>
          </div>
          <label className="switch-row">
            <span>{selected.active ? t('admin.catalogue.active') : t('admin.catalogue.inactive')}</span>
            <Switch.Root className="switch" checked={selected.active} onCheckedChange={(checked) => updateProduct(selected.id, { active: checked })}>
              <Switch.Thumb className="switch-thumb" />
            </Switch.Root>
          </label>
          <div className="variant-management">
            {selected.variants.map((variant) => (
              <div className="variant-row variant-admin-row" key={variant.id}>
                <Field label={t('admin.catalogue.variantLabel')}>
                  <input value={variant.label} onChange={(event) => updateVariant(variant.id, { label: event.target.value })} />
                </Field>
                <Field label={t('admin.catalogue.totalQty')}>
                  <input
                    type="number"
                    min={variant.held}
                    value={variant.total}
                    onChange={(event) => updateVariant(variant.id, { total: Math.max(variant.held, Number(event.target.value) || variant.held) })}
                  />
                </Field>
                <div className="variant-availability-readout">
                  <span>{t('admin.catalogue.availableQty')}</span>
                  <strong>{Math.max(0, variant.total - variant.held)}</strong>
                </div>
                <div className="quantity-control">
                  <button type="button" onClick={() => updateProduct(selected.id, (product) => updateVariantTotal(product, variant.id, -1))} aria-label={t('admin.catalogue.decreaseVariant')}>
                    <Minus aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => updateProduct(selected.id, (product) => updateVariantTotal(product, variant.id, 1))} aria-label={t('admin.catalogue.increaseVariant')}>
                    <Plus aria-hidden="true" />
                  </button>
                  <button className="icon-button danger" type="button" onClick={() => removeVariant(variant.id)} aria-label={t('admin.catalogue.removeVariant')} disabled={selected.variants.length <= 1}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}

            <div className="variant-row variant-admin-row add-variant-row">
              <Field label={t('admin.catalogue.newVariant')}>
                <input value={newVariant.label} onChange={(event) => setNewVariant((current) => ({ ...current, label: event.target.value }))} placeholder="XXL" />
              </Field>
              <Field label={t('admin.catalogue.totalQty')}>
                <input type="number" min="1" value={newVariant.total} onChange={(event) => setNewVariant((current) => ({ ...current, total: event.target.value }))} />
              </Field>
              <button className="outline-button" type="button" onClick={addVariant} disabled={!newVariant.label.trim()}>
                <Plus aria-hidden="true" />
                {t('admin.catalogue.addVariant')}
              </button>
            </div>
          </div>

          <div className="maintenance-panel">
            <div className="maintenance-head">
              <div>
                <span className="section-kicker">{t('admin.catalogue.maintenance')}</span>
                <p>{t('admin.catalogue.maintenanceHelp')}</p>
              </div>
              <button className="outline-button" type="button" onClick={() => setMaintenanceOpen((open) => !open)}>
                <Wrench aria-hidden="true" />
                {maintenanceOpen ? t('common.cancel') : t('admin.catalogue.addMaintenance')}
              </button>
            </div>

            {selected.maintenanceBlocks.length > 0 ? (
              <div className="maintenance-list">
                {selected.maintenanceBlocks.map((block, index) => (
                  <div className="maintenance-item" key={block.id ?? `${block.start}-${block.end}-${index}`}>
                    <div>
                      <strong>{formatDateRange(block, locale)}</strong>
                      <span>{block.reason || t('admin.catalogue.maintenanceNoReason')}</span>
                    </div>
                    <button className="icon-button danger" type="button" onClick={() => removeMaintenanceBlock(index)} aria-label={t('admin.catalogue.removeMaintenance')}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="helper-text">{t('admin.catalogue.noMaintenance')}</p>
            )}

            {maintenanceOpen ? (
              <div className="maintenance-form">
                <div className="form-grid">
                  <Field label={t('common.dateStart')}>
                    <input type="date" value={maintenanceDraft.start} onChange={(event) => setMaintenanceDraft((current) => ({ ...current, start: event.target.value }))} />
                  </Field>
                  <Field label={t('admin.catalogue.maintenanceEnd')}>
                    <input type="date" value={maintenanceDraft.end} onChange={(event) => setMaintenanceDraft((current) => ({ ...current, end: event.target.value }))} />
                  </Field>
                </div>
                <Field label={t('common.notes')}>
                  <input value={maintenanceDraft.reason} onChange={(event) => setMaintenanceDraft((current) => ({ ...current, reason: event.target.value }))} placeholder={locale === 'id' ? 'Cuci, reparasi, atau tidak disewakan' : 'Cleaning, repair, or unavailable'} />
                </Field>
                <button className="secondary-button full" type="button" onClick={saveMaintenanceBlock} disabled={!maintenanceDraft.start || !maintenanceDraft.end}>
                  {t('common.save')}
                </button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
