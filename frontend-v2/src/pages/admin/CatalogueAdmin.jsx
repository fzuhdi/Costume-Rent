import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CatalogueEditor,
  SwitchProductDialog,
} from '../../components/admin/catalogue/CatalogueEditor.jsx';
import {
  AdminCreateAction,
  AdminCreateFab,
  AdminFeatureGrid,
  AdminListWindow,
  AdminViewBar,
} from '../../components/admin/common/AdminManagement.jsx';
import {
  CatalogueCreatePanel,
  CatalogueProductList,
  categoryOptions,
  genderOptions,
} from '../../components/admin/catalogue/CatalogueManagement.jsx';
import {
  CATALOGUE_MAX_IMAGE_COUNT,
  cloneProduct,
  ensureSingleCover,
  getDraftImages,
  hasErrors,
  makeMediaId,
  makeVariantId,
  normalizeProductForSave,
  readFileAsDataUrl,
  stableProductJson,
  toNonNegativeDraftNumber,
  toNonNegativeNumber,
  toStoredImage,
  updateSource,
  validateDetails,
  validateNewVariant,
  validateVariants,
} from '../../components/admin/catalogue/catalogueAdminUtils.js';
import { SearchInput } from '../../components/shared.jsx';
import {
  productCoverImage,
  productName,
  toSourceContent,
} from '../../lib/rental-utils.js';
import { resetMobileDetailScroll } from '../../lib/mobile-detail.js';

export default function CatalogueAdmin({ t, locale, products, setProducts, dataAdapter }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(products[0]?.id);
  const [editorOpen, setEditorOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState({ name: '', meta: '', category: 'formal', gender: 'unisex', price: '', variantLabel: 'M', total: 1 });
  const [productDraft, setProductDraft] = useState(cloneProduct(products[0]));
  const [activeTab, setActiveTab] = useState('details');
  const [newVariant, setNewVariant] = useState({ label: '', total: 1, notes: '' });
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
    setNewVariant({ label: '', total: 1, notes: '' });
    setNewVariantErrors({});
    setMaintenanceOpen(false);
    setMaintenanceDraft({ start: '', end: '', reason: '' });
    setActiveTab('details');
    setSaveState({ status: 'idle', message: '' });
  }, [selected?.id]);

  useEffect(() => {
    if (editorOpen) resetMobileDetailScroll();
  }, [editorOpen, selected?.id]);

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
      const nextImages = ensureSingleCover(updater(currentImages).slice(0, CATALOGUE_MAX_IMAGE_COUNT));
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
    if (hasErrors(errors) || !productDraft) {
      if (errors.label) window.requestAnimationFrame(() => variantLabelRef.current?.focus());
      return;
    }

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
            notes: toSourceContent(newVariant.notes.trim()),
          },
        ],
      };
    });
    setNewVariant({ label: '', total: 1, notes: '' });
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
    const fallbackMeta = createDraft.category === 'accessory' ? 'Aksesori' : 'Adat formal';
    const coverSrc = productCoverImage(selected ?? products[0] ?? {}, t);
    const nextProduct = {
      id: uniqueId,
      image: coverSrc,
      images: coverSrc ? [{ id: `${uniqueId}-cover`, src: coverSrc, alt: name, label: name, isCover: true }] : [],
      category: createDraft.category,
      region: createDraft.category === 'accessory' ? 'dance' : 'bali',
      gender: createDraft.gender,
      active: false,
      unitKey: createDraft.category === 'accessory' ? 'customer.product.unitPack' : 'customer.product.unitSet',
      name,
      meta: meta || fallbackMeta,
      alt: name,
      price: toNonNegativeNumber(createDraft.price),
      availability: 'available',
      description: toSourceContent('Tambahkan deskripsi produk'),
      variants: [{
        id: variantLabel.toUpperCase(),
        label: variantLabel.toUpperCase(),
        total: Math.max(1, Number(createDraft.total) || 1),
        held: 0,
        notes: toSourceContent('Tambahkan catatan varian'),
      }],
      maintenanceBlocks: [],
    };
    setProducts((current) => [nextProduct, ...current]);
    setSelectedId(nextProduct.id);
    setEditorOpen(true);
    setCreateOpen(false);
    setCreateDraft({ name: '', meta: '', category: 'formal', gender: 'unisex', price: '', variantLabel: 'M', total: 1 });
  };

  const removeVariant = (variantId) => {
    if (!window.confirm(t('common.remove'))) return;
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
    setNewVariant({ label: '', total: 1, notes: '' });
    setNewVariantErrors({});
    setMaintenanceOpen(false);
    setMaintenanceDraft({ start: '', end: '', reason: '' });
    setSaveState({ status: 'idle', message: '' });
  };

  const requestProductSwitch = (productId) => {
    if (productId === selected?.id) {
      setEditorOpen(true);
      return;
    }
    if (isDirty) {
      setSwitchTargetId(productId);
      return;
    }
    setSelectedId(productId);
    setEditorOpen(true);
  };

  const saveAndSwitch = async () => {
    const saved = await saveProduct();
    if (!saved) return;
    setSelectedId(switchTargetId);
    setEditorOpen(true);
    setSwitchTargetId('');
  };

  const discardAndSwitch = () => {
    setSelectedId(switchTargetId);
    setEditorOpen(true);
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
    if (!window.confirm(t('common.remove'))) return;
    setProductDraft((current) => (current ? {
      ...current,
      maintenanceBlocks: current.maintenanceBlocks.filter((_, index) => index !== blockIndex),
    } : current));
  };

  return (
    <AdminFeatureGrid className="catalogue-admin-grid" detailOpen={editorOpen}>
      <AdminListWindow>
        <AdminViewBar>
          <SearchInput value={query} onChange={setQuery} placeholder={t('common.search')} clearLabel={t('common.clear')} />
          <AdminCreateAction
            label={t('admin.catalogue.add')}
            open={createOpen}
            controls="catalogue-create-panel"
            onToggle={() => setCreateOpen((open) => !open)}
          />
        </AdminViewBar>
        <AdminCreateFab
          label={t('admin.catalogue.add')}
          open={createOpen}
          controls="catalogue-create-panel"
          onToggle={() => setCreateOpen((open) => !open)}
        />
        {createOpen ? (
          <CatalogueCreatePanel
            t={t}
            locale={locale}
            createDraft={createDraft}
            setCreateDraft={setCreateDraft}
            onCreate={createProduct}
            onClose={() => setCreateOpen(false)}
            toNonNegativeDraftNumber={toNonNegativeDraftNumber}
          />
        ) : null}
        <CatalogueProductList
          products={filtered}
          selectedId={selected?.id}
          isDirty={isDirty}
          t={t}
          onSelect={requestProductSwitch}
        />
      </AdminListWindow>

      {selected && productDraft && editorOpen ? (
        <CatalogueEditor
          t={t}
          locale={locale}
          productDraft={productDraft}
          mediaItems={mediaItems}
          coverImage={coverImage}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          detailErrors={detailErrors}
          variantErrors={variantErrors}
          newVariant={newVariant}
          newVariantErrors={newVariantErrors}
          setNewVariant={setNewVariant}
          setNewVariantErrors={setNewVariantErrors}
          updateDraft={updateDraft}
          updateVariant={updateVariant}
          updateMediaItems={updateMediaItems}
          adjustVariantTotal={adjustVariantTotal}
          removeVariant={removeVariant}
          addVariant={addVariant}
          variantLabelRef={variantLabelRef}
          maintenanceOpen={maintenanceOpen}
          setMaintenanceOpen={setMaintenanceOpen}
          maintenanceDraft={maintenanceDraft}
          setMaintenanceDraft={setMaintenanceDraft}
          saveMaintenanceBlock={saveMaintenanceBlock}
          removeMaintenanceBlock={removeMaintenanceBlock}
          isDirty={isDirty}
          hasValidationErrors={hasValidationErrors}
          saveState={saveState}
          onSave={saveProduct}
          onDiscard={resetProduct}
          onClose={() => setEditorOpen(false)}
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
        open={Boolean(switchTargetId)}
        onStay={() => setSwitchTargetId('')}
        onDiscard={discardAndSwitch}
        onSave={saveAndSwitch}
        saving={saveState.status === 'saving'}
      />
    </AdminFeatureGrid>
  );
}
