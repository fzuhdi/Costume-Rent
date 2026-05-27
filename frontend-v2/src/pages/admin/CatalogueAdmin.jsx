import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Link2,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState, Field, StatusPill } from '../../components/shared.jsx';
import { defaultDates } from '../../mockData.js';
import {
  formatDateRange,
  formatRupiah,
  getProductAvailability,
  productAlt,
  productCoverImage,
  productMeta,
  productName,
} from '../../lib/rental-utils.js';

const MAX_IMAGE_COUNT = 6;
const MAX_IMAGE_SIZE = 1024 * 1024;
const editorTabs = ['details', 'media', 'variants', 'maintenance'];

function cloneProduct(product) {
  if (!product) return null;
  return {
    ...product,
    variants: Array.isArray(product.variants) ? product.variants.map((variant) => ({ ...variant })) : [],
    maintenanceBlocks: Array.isArray(product.maintenanceBlocks) ? product.maintenanceBlocks.map((block) => ({ ...block })) : [],
    images: Array.isArray(product.images) ? product.images.map((image) => (typeof image === 'string' ? image : { ...image })) : undefined,
  };
}

export default function CatalogueAdmin({ t, locale, products, setProducts, dataAdapter }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(products[0]?.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState({ name: '', meta: '', category: 'formal', price: 0, variantLabel: 'M', total: 1 });
  const [productDraft, setProductDraft] = useState(cloneProduct(products[0]));
  const [activeTab, setActiveTab] = useState('details');
  const [newVariant, setNewVariant] = useState({ label: '', total: 1 });
  const [newVariantErrors, setNewVariantErrors] = useState({});
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceDraft, setMaintenanceDraft] = useState({ start: '', end: '', reason: '' });
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });
  const [switchTargetId, setSwitchTargetId] = useState('');
  const variantLabelRef = useRef(null);

  const selected = products.find((product) => product.id === selectedId) ?? products[0];
  const filtered = products.filter((product) => productName(product, t).toLowerCase().includes(query.trim().toLowerCase()));
  const mediaItems = useMemo(() => getDraftImages(productDraft, t), [productDraft, t]);
  const coverImage = mediaItems.find((image) => image.isCover) ?? mediaItems[0];
  const detailErrors = useMemo(() => validateDetails(productDraft, t), [productDraft, t]);
  const variantErrors = useMemo(() => validateVariants(productDraft?.variants ?? [], t), [productDraft?.variants, t]);
  const hasValidationErrors = hasErrors(detailErrors) || Object.values(variantErrors).some(hasErrors);
  const isDirty = Boolean(selected && productDraft && stableProductJson(selected) !== stableProductJson(productDraft));

  useEffect(() => {
    if (selected) return;
    setSelectedId(products[0]?.id);
  }, [products, selected]);

  useEffect(() => {
    setProductDraft(cloneProduct(selected));
    setNewVariant({ label: '', total: 1 });
    setNewVariantErrors({});
    setMaintenanceOpen(false);
    setMaintenanceDraft({ start: '', end: '', reason: '' });
    setActiveTab('details');
    setSaveState({ status: 'idle', message: '' });
  }, [selected?.id]);

  const updateDraft = (changes) => {
    setSaveState((current) => (current.status === 'saved' || current.status === 'error' ? { status: 'idle', message: '' } : current));
    setProductDraft((current) => (current ? { ...current, ...changes } : current));
  };

  const updateVariant = (variantId, changes) => {
    setSaveState((current) => (current.status === 'saved' || current.status === 'error' ? { status: 'idle', message: '' } : current));
    setProductDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        variants: current.variants.map((variant) => (variant.id === variantId ? { ...variant, ...changes } : variant)),
      };
    });
  };

  const updateMediaItems = (updater) => {
    setSaveState((current) => (current.status === 'saved' || current.status === 'error' ? { status: 'idle', message: '' } : current));
    setProductDraft((current) => {
      if (!current) return current;
      const currentImages = getDraftImages(current, t);
      const nextImages = ensureSingleCover(updater(currentImages).slice(0, MAX_IMAGE_COUNT));
      const nextCover = nextImages.find((image) => image.isCover) ?? nextImages[0];
      return {
        ...current,
        image: nextCover?.src ?? '',
        images: nextImages.map(toStoredImage),
      };
    });
  };

  const adjustVariantTotal = (variantId, delta) => {
    setProductDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        variants: current.variants.map((variant) => {
          if (variant.id !== variantId) return variant;
          const held = Number(variant.held) || 0;
          const currentTotal = Number(variant.total) || 0;
          return { ...variant, total: Math.max(Math.max(1, held), currentTotal + delta) };
        }),
      };
    });
  };

  const addVariant = () => {
    const label = newVariant.label.trim();
    const stock = Number(newVariant.total);
    const errors = validateNewVariant({ label, stock, variants: productDraft?.variants ?? [], t });
    setNewVariantErrors(errors);
    if (hasErrors(errors) || !productDraft) return;

    const id = makeVariantId(label, productDraft.variants);
    setProductDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        variants: [
          ...current.variants,
          {
            id,
            label,
            total: stock,
            held: 0,
          },
        ],
      };
    });
    setNewVariant({ label: '', total: 1 });
    setNewVariantErrors({});
    window.requestAnimationFrame(() => variantLabelRef.current?.focus());
  };

  const createProduct = () => {
    const name = createDraft.name.trim();
    const meta = createDraft.meta.trim();
    const variantLabel = createDraft.variantLabel.trim();
    if (!name || !variantLabel) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `catalogue-${Date.now()}`;
    const uniqueId = products.some((product) => product.id === slug) ? `${slug}-${products.length + 1}` : slug;
    const fallbackMeta = createDraft.category === 'accessory'
      ? (locale === 'id' ? 'Aksesori' : 'Accessory')
      : (locale === 'id' ? 'Adat formal' : 'Formal attire');
    const coverSrc = productCoverImage(selected ?? products[0] ?? {}, t);
    const nextProduct = {
      id: uniqueId,
      image: coverSrc,
      images: coverSrc ? [{ id: `${uniqueId}-cover`, src: coverSrc, alt: name, label: name, isCover: true }] : [],
      category: createDraft.category,
      region: createDraft.category === 'accessory' ? 'dance' : 'bali',
      active: false,
      nameKey: name,
      metaKey: meta || fallbackMeta,
      priceKey: 'customer.product.batik.price',
      unitKey: 'customer.product.batik.unitSet',
      copyKey: locale === 'id' ? 'Katalog baru, lengkapi detail produk.' : 'New catalogue item. Complete product details.',
      detailAriaKey: name,
      altKey: name,
      name,
      meta: meta || fallbackMeta,
      alt: name,
      price: Math.max(0, Number(createDraft.price) || 0),
      availability: 'available',
      measurementId: locale === 'id' ? 'Tambahkan ukuran produk' : 'Add product measurements',
      measurementEn: 'Add product measurements',
      bundleId: locale === 'id' ? 'Tambahkan isi paket' : 'Add package contents',
      bundleEn: 'Add package contents',
      variants: [{ id: variantLabel.toUpperCase(), label: variantLabel.toUpperCase(), total: Math.max(1, Number(createDraft.total) || 1), held: 0 }],
      maintenanceBlocks: [],
    };
    setProducts((current) => [nextProduct, ...current]);
    setSelectedId(nextProduct.id);
    setCreateOpen(false);
    setCreateDraft({ name: '', meta: '', category: 'formal', price: 0, variantLabel: 'M', total: 1 });
  };

  const removeVariant = (variantId) => {
    setProductDraft((current) => {
      if (!current) return current;
      if (current.variants.length <= 1) {
        setSaveState({ status: 'error', message: t('admin.catalogue.errorLastVariant') });
        return current;
      }
      return {
        ...current,
        variants: current.variants.filter((variant) => variant.id !== variantId),
      };
    });
  };

  const saveProduct = async () => {
    if (!selected || !productDraft) return false;
    if (hasValidationErrors) {
      setSaveState({ status: 'error', message: t('admin.catalogue.fixValidation') });
      return false;
    }

    const nextProduct = normalizeProductForSave(productDraft, t);
    setSaveState({ status: 'saving', message: t('admin.catalogue.saving') });
    try {
      if (dataAdapter) {
        await dataAdapter.admin.products.save(nextProduct);
      } else {
        setProducts((current) => current.map((product) => (product.id === selected.id ? nextProduct : product)));
      }
      setProductDraft(cloneProduct(nextProduct));
      setSaveState({ status: 'saved', message: t('admin.catalogue.saved') });
      window.setTimeout(() => setSaveState((current) => (current.status === 'saved' ? { status: 'idle', message: '' } : current)), 2400);
      return true;
    } catch {
      setSaveState({ status: 'error', message: t('admin.catalogue.saveError') });
      return false;
    }
  };

  const resetProduct = () => {
    setProductDraft(cloneProduct(selected));
    setNewVariant({ label: '', total: 1 });
    setNewVariantErrors({});
    setMaintenanceOpen(false);
    setMaintenanceDraft({ start: '', end: '', reason: '' });
    setSaveState({ status: 'idle', message: '' });
  };

  const requestProductSwitch = (productId) => {
    if (productId === selected?.id) return;
    if (isDirty) {
      setSwitchTargetId(productId);
      return;
    }
    setSelectedId(productId);
  };

  const saveAndSwitch = async () => {
    const saved = await saveProduct();
    if (!saved) return;
    setSelectedId(switchTargetId);
    setSwitchTargetId('');
  };

  const discardAndSwitch = () => {
    setSelectedId(switchTargetId);
    setSwitchTargetId('');
  };

  const saveMaintenanceBlock = () => {
    if (!maintenanceDraft.start || !maintenanceDraft.end || !productDraft) return;
    setProductDraft((current) => (current ? {
      ...current,
      maintenanceBlocks: [
        ...current.maintenanceBlocks,
        {
          id: `maintenance-${Date.now()}`,
          start: maintenanceDraft.start,
          end: maintenanceDraft.end,
          reason: maintenanceDraft.reason.trim(),
        },
      ],
    } : current));
    setMaintenanceDraft({ start: '', end: '', reason: '' });
    setMaintenanceOpen(false);
  };

  const removeMaintenanceBlock = (blockIndex) => {
    setProductDraft((current) => (current ? {
      ...current,
      maintenanceBlocks: current.maintenanceBlocks.filter((_, index) => index !== blockIndex),
    } : current));
  };

  return (
    <div className="admin-feature-grid catalogue-admin-grid">
      <section className="base-window management-window">
        <div className="view-bar">
          <label className="search-inline">
            <Search aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('common.search')} />
          </label>
          <button className="primary-button" type="button" onClick={() => setCreateOpen((open) => !open)}>
            <Plus aria-hidden="true" />
            {t('admin.catalogue.add')}
          </button>
        </div>
        {createOpen ? (
          <div className="content-panel compact-panel">
            <div className="form-grid">
              <Field label={t('common.name')}>
                <input value={createDraft.name} onChange={(event) => setCreateDraft((current) => ({ ...current, name: event.target.value }))} />
              </Field>
              <Field label={t('admin.catalogue.meta')}>
                <input value={createDraft.meta} onChange={(event) => setCreateDraft((current) => ({ ...current, meta: event.target.value }))} />
              </Field>
              <Field label={t('admin.catalogue.category')}>
                <select value={createDraft.category} onChange={(event) => setCreateDraft((current) => ({ ...current, category: event.target.value }))}>
                  <option value="formal">{locale === 'id' ? 'Formal' : 'Formal'}</option>
                  <option value="accessory">{locale === 'id' ? 'Aksesori' : 'Accessory'}</option>
                </select>
              </Field>
              <Field label={t('admin.catalogue.price')}>
                <input type="number" min="0" value={createDraft.price} onChange={(event) => setCreateDraft((current) => ({ ...current, price: event.target.value }))} />
              </Field>
              <Field label={t('admin.catalogue.newVariant')}>
                <input value={createDraft.variantLabel} onChange={(event) => setCreateDraft((current) => ({ ...current, variantLabel: event.target.value }))} />
              </Field>
              <Field label={t('admin.catalogue.totalQty')}>
                <input type="number" min="1" value={createDraft.total} onChange={(event) => setCreateDraft((current) => ({ ...current, total: event.target.value }))} />
              </Field>
            </div>
            <button className="secondary-button full" type="button" onClick={createProduct} disabled={!createDraft.name.trim() || !createDraft.variantLabel.trim()}>
              {t('common.save')}
            </button>
          </div>
        ) : null}
        <div className="management-list padded">
          {filtered.length === 0 ? (
            <EmptyState title={t('admin.catalogue.noProducts')} copy={t('admin.catalogue.noProductsCopy')} icon={Search} />
          ) : (
            filtered.map((product) => (
              <button
                className={`management-card catalogue-record ${selected?.id === product.id ? 'selected' : ''}`}
                type="button"
                key={product.id}
                onClick={() => requestProductSwitch(product.id)}
              >
                <img src={productCoverImage(product, t)} alt={productAlt(product, t)} />
                <div className="catalogue-record-copy">
                  <strong>{productName(product, t)}</strong>
                  <span>{productMeta(product, t)}</span>
                  {isDirty && selected?.id === product.id ? <em className="dirty-badge">{t('admin.catalogue.unsavedBadge')}</em> : null}
                </div>
                <StatusPill type="availability" value={getProductAvailability(product, defaultDates)} t={t} />
              </button>
            ))
          )}
        </div>
      </section>

      {selected && productDraft ? (
        <section className="record-panel feature-panel catalogue-editor-panel" aria-label={t('admin.catalogue.editorAria')}>
          <div className="catalogue-editor-head">
            <img className="catalogue-preview-thumb" src={coverImage?.src ?? productDraft.image} alt={coverImage?.alt ?? productAlt(productDraft, t)} />
            <div className="catalogue-editor-title">
              <span className="eyebrow">{t('admin.common.selected')}</span>
              <strong>{productName(productDraft, t)}</strong>
              <div className="catalogue-editor-meta">
                <span className={`status-badge ${productDraft.active ? 'success' : 'warning'}`}>
                  {productDraft.active ? t('admin.catalogue.active') : t('admin.catalogue.inactive')}
                </span>
                <span className={`save-state ${saveState.status}`}>{saveState.message || (isDirty ? t('admin.catalogue.unsaved') : t('admin.catalogue.noChanges'))}</span>
              </div>
            </div>
          </div>

          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="catalogue-tabs">
            <Tabs.List className="catalogue-tab-list" aria-label={t('admin.catalogue.editorTabs')}>
              {editorTabs.map((tab) => (
                <Tabs.Trigger className="catalogue-tab-trigger" value={tab} key={tab}>
                  {t(`admin.catalogue.tab.${tab}`)}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content className="catalogue-tab-panel" value="details">
              <DetailsTab
                t={t}
                locale={locale}
                productDraft={productDraft}
                detailErrors={detailErrors}
                updateDraft={updateDraft}
              />
            </Tabs.Content>

            <Tabs.Content className="catalogue-tab-panel" value="media">
              <MediaTab
                t={t}
                productDraft={productDraft}
                mediaItems={mediaItems}
                updateMediaItems={updateMediaItems}
              />
            </Tabs.Content>

            <Tabs.Content className="catalogue-tab-panel" value="variants">
              <VariantsTab
                t={t}
                variants={productDraft.variants}
                variantErrors={variantErrors}
                newVariant={newVariant}
                newVariantErrors={newVariantErrors}
                setNewVariant={setNewVariant}
                updateVariant={updateVariant}
                adjustVariantTotal={adjustVariantTotal}
                removeVariant={removeVariant}
                addVariant={addVariant}
                variantLabelRef={variantLabelRef}
              />
            </Tabs.Content>

            <Tabs.Content className="catalogue-tab-panel" value="maintenance">
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
            onSave={saveProduct}
            onDiscard={resetProduct}
          />
        </section>
      ) : null}

      <SwitchProductDialog
        t={t}
        open={Boolean(switchTargetId)}
        onStay={() => setSwitchTargetId('')}
        onDiscard={discardAndSwitch}
        onSave={saveAndSwitch}
        saving={saveState.status === 'saving'}
      />
    </div>
  );
}

function DetailsTab({ t, locale, productDraft, detailErrors, updateDraft }) {
  return (
    <div className="editor-section">
      <div className="editor-section-head">
        <div>
          <span className="section-kicker">{t('admin.catalogue.detailsTitle')}</span>
          <h3>{t('admin.catalogue.detailsCopy')}</h3>
        </div>
        <div className="info-block compact-info">
          <span>{t('admin.catalogue.publicPrice')}</span>
          <strong>{formatRupiah(productDraft.price)}</strong>
        </div>
      </div>
      <div className="catalogue-edit-grid">
        <Field label={t('common.name')} error={detailErrors.name} errorId="catalogue-name-error">
          <input
            value={productName(productDraft, t)}
            aria-invalid={Boolean(detailErrors.name)}
            aria-describedby={detailErrors.name ? 'catalogue-name-error' : undefined}
            onChange={(event) => updateDraft({
              nameKey: event.target.value,
              name: event.target.value,
              altKey: event.target.value,
              alt: event.target.value,
            })}
          />
        </Field>
        <Field label={t('admin.catalogue.meta')}>
          <input value={productMeta(productDraft, t)} onChange={(event) => updateDraft({ metaKey: event.target.value, meta: event.target.value })} />
        </Field>
        <Field label={t('admin.catalogue.category')}>
          <select value={productDraft.category} onChange={(event) => updateDraft({ category: event.target.value })}>
            <option value="formal">{locale === 'id' ? 'Formal' : 'Formal'}</option>
            <option value="accessory">{locale === 'id' ? 'Aksesori' : 'Accessory'}</option>
          </select>
        </Field>
        <Field label={t('admin.catalogue.price')}>
          <input
            type="number"
            min="0"
            value={productDraft.price}
            onChange={(event) => updateDraft({ price: Math.max(0, Number(event.target.value) || 0) })}
          />
        </Field>
      </div>
      <label className="switch-row catalogue-visibility">
        <span>
          <strong>{productDraft.active ? t('admin.catalogue.active') : t('admin.catalogue.inactive')}</strong>
          <small>{t('admin.catalogue.visibilityHelp')}</small>
        </span>
        <Switch.Root
          className="switch"
          checked={productDraft.active}
          aria-label={t('admin.catalogue.visibilitySwitch')}
          onCheckedChange={(checked) => updateDraft({ active: checked })}
        >
          <Switch.Thumb className="switch-thumb" />
        </Switch.Root>
      </label>
    </div>
  );
}

function MediaTab({ t, productDraft, mediaItems, updateMediaItems }) {
  const [urlDraft, setUrlDraft] = useState('');
  const [mediaError, setMediaError] = useState('');
  const fileInputRef = useRef(null);

  const addUrlImage = () => {
    const src = urlDraft.trim();
    if (!src) {
      setMediaError(t('admin.catalogue.errorImageUrl'));
      return;
    }
    if (mediaItems.length >= MAX_IMAGE_COUNT) {
      setMediaError(t('admin.catalogue.errorImageCount', { count: MAX_IMAGE_COUNT }));
      return;
    }
    setMediaError('');
    updateMediaItems((current) => [
      ...current,
      {
        id: makeMediaId(),
        src,
        alt: productAlt(productDraft, t),
        label: `${productName(productDraft, t)} ${current.length + 1}`,
        isCover: current.length === 0,
      },
    ]);
    setUrlDraft('');
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    const availableSlots = MAX_IMAGE_COUNT - mediaItems.length;
    if (availableSlots <= 0) {
      setMediaError(t('admin.catalogue.errorImageCount', { count: MAX_IMAGE_COUNT }));
      return;
    }

    const accepted = [];
    for (const file of files.slice(0, availableSlots)) {
      if (!file.type.startsWith('image/')) {
        setMediaError(t('admin.catalogue.errorImageType'));
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setMediaError(t('admin.catalogue.errorImageSize'));
        continue;
      }
      accepted.push(file);
    }
    if (files.length > availableSlots) setMediaError(t('admin.catalogue.errorImageCount', { count: MAX_IMAGE_COUNT }));
    if (accepted.length === 0) return;

    const dataUrls = await Promise.all(accepted.map(readFileAsDataUrl));
    updateMediaItems((current) => [
      ...current,
      ...dataUrls.map((src, index) => ({
        id: makeMediaId(),
        src,
        alt: productAlt(productDraft, t),
        label: accepted[index].name || `${productName(productDraft, t)} ${current.length + index + 1}`,
        isCover: current.length === 0 && index === 0,
      })),
    ]);
  };

  return (
    <div className="editor-section media-editor">
      <div className="editor-section-head">
        <div>
          <span className="section-kicker">{t('admin.catalogue.mediaTitle')}</span>
          <h3>{t('admin.catalogue.mediaCopy')}</h3>
          <p>{t('admin.catalogue.coverHelp')}</p>
        </div>
      </div>

      <div className="media-toolbar">
        <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={handleFiles} />
        <button className="outline-button" type="button" onClick={() => fileInputRef.current?.click()}>
          <Upload aria-hidden="true" />
          {t('admin.catalogue.imageUpload')}
        </button>
        <div className="field-control">
          <span>{t('admin.catalogue.imageUrl')}</span>
          <div className="url-add-row">
            <input
              value={urlDraft}
              aria-invalid={Boolean(mediaError)}
              aria-describedby={mediaError ? 'catalogue-media-error' : undefined}
              onChange={(event) => setUrlDraft(event.target.value)}
              placeholder="https://example.com/costume.jpg"
            />
            <button className="secondary-button" type="button" onClick={addUrlImage}>
              <Link2 aria-hidden="true" />
              {t('admin.catalogue.addImageUrl')}
            </button>
          </div>
          {mediaError ? <small className="validation-message" id="catalogue-media-error">{mediaError}</small> : null}
        </div>
      </div>

      {mediaItems.length === 0 ? (
        <div className="empty-state compact-empty">
          <ImagePlus aria-hidden="true" />
          <strong>{t('admin.catalogue.noMedia')}</strong>
          <p>{t('admin.catalogue.noMediaCopy')}</p>
        </div>
      ) : (
        <div className="media-grid" aria-label={t('admin.catalogue.mediaGridAria')}>
          {mediaItems.map((image, index) => (
            <article className={`media-tile ${image.isCover ? 'cover' : ''}`} key={image.id}>
              <div className="media-thumb">
                <img src={image.src} alt={image.alt} />
                {image.isCover ? <span>{t('admin.catalogue.cover')}</span> : null}
              </div>
              <Field label={t('admin.catalogue.altText')}>
                <input value={image.alt} onChange={(event) => updateMediaItems((current) => current.map((item) => (item.id === image.id ? { ...item, alt: event.target.value } : item)))} />
              </Field>
              <div className="media-actions">
                <button className="outline-button" type="button" onClick={() => updateMediaItems((current) => current.map((item) => ({ ...item, isCover: item.id === image.id })))} disabled={image.isCover}>
                  <CheckCircle2 aria-hidden="true" />
                  {t('admin.catalogue.setCover')}
                </button>
                <button className="icon-button" type="button" onClick={() => updateMediaItems((current) => moveItem(current, index, -1))} disabled={index === 0} aria-label={t('admin.catalogue.moveImageLeft')}>
                  <ArrowLeft aria-hidden="true" />
                </button>
                <button className="icon-button" type="button" onClick={() => updateMediaItems((current) => moveItem(current, index, 1))} disabled={index === mediaItems.length - 1} aria-label={t('admin.catalogue.moveImageRight')}>
                  <ArrowRight aria-hidden="true" />
                </button>
                <button className="icon-button danger" type="button" onClick={() => updateMediaItems((current) => current.filter((item) => item.id !== image.id))} aria-label={t('admin.catalogue.removeImage')}>
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantsTab({
  t,
  variants,
  variantErrors,
  newVariant,
  newVariantErrors,
  setNewVariant,
  updateVariant,
  adjustVariantTotal,
  removeVariant,
  addVariant,
  variantLabelRef,
}) {
  return (
    <div className="editor-section">
      <div className="editor-section-head">
        <div>
          <span className="section-kicker">{t('admin.catalogue.variantInventory')}</span>
          <h3>{t('admin.catalogue.variantHelp')}</h3>
          <p>{t('admin.catalogue.stockHelp')}</p>
        </div>
      </div>
      <div className="variant-management">
        {variants.map((variant) => {
          const errors = variantErrors[variant.id] ?? {};
          const held = Number(variant.held) || 0;
          const total = Number(variant.total) || 0;
          return (
            <div className="variant-row variant-admin-row" key={variant.id}>
              <Field label={t('admin.catalogue.variantLabel')} error={errors.label} errorId={`variant-${variant.id}-label-error`}>
                <input
                  value={variant.label}
                  aria-invalid={Boolean(errors.label)}
                  aria-describedby={errors.label ? `variant-${variant.id}-label-error` : undefined}
                  onChange={(event) => updateVariant(variant.id, { label: event.target.value })}
                />
              </Field>
              <Field label={t('admin.catalogue.totalQty')} error={errors.total} errorId={`variant-${variant.id}-total-error`}>
                <input
                  type="number"
                  min={Math.max(1, held)}
                  value={variant.total}
                  aria-invalid={Boolean(errors.total)}
                  aria-describedby={errors.total ? `variant-${variant.id}-total-error` : undefined}
                  onChange={(event) => updateVariant(variant.id, { total: event.target.value })}
                />
              </Field>
              <div className="variant-availability-readout">
                <span>{t('admin.catalogue.availableQty')}</span>
                <strong>{Math.max(0, total - held)}</strong>
                <small>{t('admin.catalogue.heldQty', { count: held })}</small>
              </div>
              <div className="quantity-control">
                <button type="button" onClick={() => adjustVariantTotal(variant.id, -1)} aria-label={t('admin.catalogue.decreaseVariant')}>
                  <Minus aria-hidden="true" />
                </button>
                <button type="button" onClick={() => adjustVariantTotal(variant.id, 1)} aria-label={t('admin.catalogue.increaseVariant')}>
                  <Plus aria-hidden="true" />
                </button>
                <button className="icon-button danger" type="button" onClick={() => removeVariant(variant.id)} aria-label={t('admin.catalogue.removeVariant')} disabled={variants.length <= 1}>
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}

        {variants.length <= 1 ? <p className="helper-text">{t('admin.catalogue.requiredFirstVariant')}</p> : null}

        <div className="variant-row variant-admin-row add-variant-row">
          <Field label={t('admin.catalogue.newVariant')} error={newVariantErrors.label} errorId="new-variant-label-error">
            <input
              ref={variantLabelRef}
              value={newVariant.label}
              aria-invalid={Boolean(newVariantErrors.label)}
              aria-describedby={newVariantErrors.label ? 'new-variant-label-error' : undefined}
              onChange={(event) => setNewVariant((current) => ({ ...current, label: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addVariant();
                }
              }}
              placeholder="XXL"
            />
          </Field>
          <Field label={t('admin.catalogue.totalQty')} error={newVariantErrors.total} errorId="new-variant-total-error">
            <input
              type="number"
              min="1"
              value={newVariant.total}
              aria-invalid={Boolean(newVariantErrors.total)}
              aria-describedby={newVariantErrors.total ? 'new-variant-total-error' : undefined}
              onChange={(event) => setNewVariant((current) => ({ ...current, total: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addVariant();
                }
              }}
            />
          </Field>
          <button className="outline-button add-variant-button" type="button" onClick={addVariant}>
            <Plus aria-hidden="true" />
            {t('admin.catalogue.addVariant')}
          </button>
        </div>
      </div>
    </div>
  );
}

function MaintenanceTab({
  t,
  locale,
  productDraft,
  maintenanceOpen,
  setMaintenanceOpen,
  maintenanceDraft,
  setMaintenanceDraft,
  saveMaintenanceBlock,
  removeMaintenanceBlock,
}) {
  return (
    <div className="editor-section maintenance-panel flat-panel">
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

      {productDraft.maintenanceBlocks.length > 0 ? (
        <div className="maintenance-list">
          {productDraft.maintenanceBlocks.map((block, index) => (
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
        <div className="empty-state compact-empty">
          <Wrench aria-hidden="true" />
          <strong>{t('admin.catalogue.noMaintenanceTitle')}</strong>
          <p>{t('admin.catalogue.noMaintenance')}</p>
        </div>
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
            <input value={maintenanceDraft.reason} onChange={(event) => setMaintenanceDraft((current) => ({ ...current, reason: event.target.value }))} placeholder={t('admin.catalogue.maintenancePlaceholder')} />
          </Field>
          <button className="secondary-button full" type="button" onClick={saveMaintenanceBlock} disabled={!maintenanceDraft.start || !maintenanceDraft.end}>
            {t('common.save')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function EditorSaveBar({ t, isDirty, hasValidationErrors, saveState, onSave, onDiscard }) {
  const saving = saveState.status === 'saving';
  return (
    <div className="catalogue-savebar" role="status" aria-live="polite">
      <div className="savebar-state">
        {saving ? <Loader2 aria-hidden="true" className="spin-icon" /> : saveState.status === 'error' ? <XCircle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
        <span>{hasValidationErrors ? t('admin.catalogue.fixValidation') : saveState.message || (isDirty ? t('admin.catalogue.unsaved') : t('admin.catalogue.noChanges'))}</span>
      </div>
      <div className="savebar-actions">
        <button className="outline-button" type="button" onClick={onDiscard} disabled={!isDirty || saving}>
          <RotateCcw aria-hidden="true" />
          {t('admin.catalogue.discardChanges')}
        </button>
        <button className="primary-button" type="button" onClick={onSave} disabled={!isDirty || saving || hasValidationErrors}>
          {saving ? <Loader2 aria-hidden="true" className="spin-icon" /> : <Save aria-hidden="true" />}
          {saving ? t('admin.catalogue.saving') : t('admin.catalogue.saveChanges')}
        </button>
      </div>
    </div>
  );
}

function SwitchProductDialog({ t, open, onStay, onDiscard, onSave, saving }) {
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onStay();
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{t('admin.catalogue.switchTitle')}</Dialog.Title>
          <Dialog.Description>{t('admin.catalogue.switchCopy')}</Dialog.Description>
          <div className="dialog-actions">
            <button className="outline-button" type="button" onClick={onStay}>{t('admin.catalogue.stay')}</button>
            <button className="ghost-button" type="button" onClick={onDiscard}>{t('admin.catalogue.discardSwitch')}</button>
            <button className="primary-button" type="button" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 aria-hidden="true" className="spin-icon" /> : <Save aria-hidden="true" />}
              {t('admin.catalogue.saveAndSwitch')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function getDraftImages(product, t) {
  if (!product) return [];
  const fallbackAlt = productAlt(product, t);
  const fallbackLabel = productName(product, t);
  const rawImages = Array.isArray(product.images) ? product.images : [];
  const normalized = rawImages
    .map((image, index) => {
      const src = typeof image === 'string' ? image : image?.src ?? image?.image ?? '';
      if (!src) return null;
      return {
        id: typeof image === 'string' ? `${product.id}-image-${index}` : image.id ?? `${product.id}-image-${index}`,
        src,
        alt: typeof image === 'string' ? fallbackAlt : image.alt ?? fallbackAlt,
        label: typeof image === 'string' ? fallbackLabel : image.label ?? fallbackLabel,
        isCover: typeof image === 'string' ? false : Boolean(image.isCover),
      };
    })
    .filter(Boolean);

  if (normalized.length === 0 && product.image) {
    return [{
      id: `${product.id}-legacy-cover`,
      src: product.image,
      alt: fallbackAlt,
      label: fallbackLabel,
      isCover: true,
    }];
  }

  return ensureSingleCover(normalized);
}

function normalizeProductForSave(product, t) {
  const images = ensureSingleCover(getDraftImages(product, t)).map(toStoredImage);
  const cover = images.find((image) => image.isCover) ?? images[0];
  return {
    ...product,
    image: cover?.src ?? product.image ?? '',
    images,
    variants: product.variants.map((variant) => ({
      ...variant,
      label: String(variant.label).trim(),
      total: Math.max(Number(variant.held) || 0, Math.max(1, Number(variant.total) || 1)),
      held: Number(variant.held) || 0,
    })),
    maintenanceBlocks: product.maintenanceBlocks.map((block) => ({ ...block })),
  };
}

function ensureSingleCover(images) {
  const clean = images.filter((image) => image?.src);
  if (clean.length === 0) return [];
  const coverIndex = clean.findIndex((image) => image.isCover);
  const resolvedCoverIndex = coverIndex >= 0 ? coverIndex : 0;
  return clean.map((image, index) => ({ ...image, isCover: index === resolvedCoverIndex }));
}

function toStoredImage(image, index = 0) {
  return {
    id: image.id ?? makeMediaId(),
    src: image.src,
    alt: image.alt ?? '',
    label: image.label ?? `Image ${index + 1}`,
    isCover: Boolean(image.isCover),
  };
}

function validateDetails(product, t) {
  if (!product) return {};
  return {
    name: productName(product, t).trim() ? '' : t('common.required'),
  };
}

function validateVariants(variants, t) {
  const errors = {};
  const labels = new Map();
  variants.forEach((variant) => {
    const label = String(variant.label ?? '').trim();
    const total = Number(variant.total);
    const held = Number(variant.held) || 0;
    errors[variant.id] = {};
    if (!label) errors[variant.id].label = t('common.required');
    if (!Number.isFinite(total) || total < 1) errors[variant.id].total = t('admin.catalogue.errorStockMin');
    if (Number.isFinite(total) && total < held) errors[variant.id].total = t('admin.catalogue.errorStockHeld', { count: held });
    const key = label.toLowerCase();
    if (key) labels.set(key, [...(labels.get(key) ?? []), variant.id]);
  });

  labels.forEach((ids) => {
    if (ids.length <= 1) return;
    ids.forEach((id) => {
      errors[id] = { ...errors[id], label: t('admin.catalogue.errorDuplicateVariant') };
    });
  });
  return errors;
}

function validateNewVariant({ label, stock, variants, t }) {
  const errors = {};
  if (!label) errors.label = t('common.required');
  if (!Number.isFinite(stock) || stock < 1) errors.total = t('admin.catalogue.errorStockMin');
  if (variants.some((variant) => String(variant.label).trim().toLowerCase() === label.toLowerCase())) {
    errors.label = t('admin.catalogue.errorDuplicateVariant');
  }
  return errors;
}

function hasErrors(errorMap) {
  return Object.values(errorMap).some(Boolean);
}

function stableProductJson(product) {
  if (!product) return '';
  return JSON.stringify({
    ...product,
    variants: Array.isArray(product.variants) ? product.variants.map((variant) => ({ ...variant })) : [],
    maintenanceBlocks: Array.isArray(product.maintenanceBlocks) ? product.maintenanceBlocks.map((block) => ({ ...block })) : [],
    images: Array.isArray(product.images) ? product.images.map((image) => (typeof image === 'string' ? image : { ...image })) : undefined,
  });
}

function makeVariantId(label, variants) {
  const base = label.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '').toUpperCase() || `VARIANT-${Date.now()}`;
  if (!variants.some((variant) => variant.id === base)) return base;
  return `${base}-${Date.now().toString(36).toUpperCase()}`;
}

function makeMediaId() {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function moveItem(items, index, delta) {
  const next = [...items];
  const targetIndex = index + delta;
  if (targetIndex < 0 || targetIndex >= next.length) return next;
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
