import * as Dialog from '@radix-ui/react-dialog';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Select from '@radix-ui/react-select';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { EmptyState, Field, InfoBlock, LocaleButton, PhoneField, SheetHeader, StatusPill, StepProgress } from '../shared.jsx';
import {
  firstAvailableVariant,
  formatDate,
  formatDateRange,
  formatRupiah,
  findNextAvailableWindow,
  productAlt,
  productCoverImage,
  productGallery,
  getMaintenanceReason,
  productMeta,
  productName,
  getProductAvailability,
  getProductDayAvailability,
  getVariantAvailability,
  makeBookingSchema,
  makeLookupSchema,
  normalizePhone,
  productDescription,
  variantLabel,
  selectedVariantNotes,
  variantSummary,
} from '../../lib/rental-utils.js';

function useCheckoutLink() {
  const location = useLocation();
  return {
    to: { pathname: '/checkout', search: location.search },
    state: location.pathname === '/checkout' ? undefined : { backgroundLocation: location },
  };
}

export function CustomerNav({ brandName, tagline, locale, setLocale, t, cartCount, onOpenCart }) {
  const location = useLocation();
  const catalogueTo = {
    pathname: '/catalogue',
    search: location.pathname.startsWith('/costumes/') || location.pathname === '/checkout' ? location.search : '',
  };

  return (
    <header className="customer-nav">
      <div className="shell nav-inner">
        <Link className="brand" to="/" aria-label={t('brand.customerAria')}>
          <span className="brand-mark">CR</span>
          <span>
            <strong>{brandName}</strong>
            <small>{tagline}</small>
          </span>
        </Link>
        <nav className="nav-links" aria-label={t('nav.customerAria')}>
          <NavLink to="/" end>
            {t('nav.home')}
          </NavLink>
          <NavLink to={catalogueTo} end>
            {t('nav.catalogue')}
          </NavLink>
          <NavLink to="/lookup">{t('nav.lookup')}</NavLink>
        </nav>
        <div className="nav-actions">
          <LocaleButton locale={locale} setLocale={setLocale} t={t} />
          <button className="cart-button icon-only" type="button" onClick={onOpenCart} aria-label={t('cart.itemsAria', { count: cartCount })}>
            <ShoppingCart aria-hidden="true" />
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function ProductCard({ product, dates, detailTo, locale, t, rentals, availabilityOverride }) {
  const availability = availabilityOverride ?? getProductAvailability(product, dates, rentals);
  const isBlocked = availability === 'fully_booked' || availability === 'unavailable';
  const maintenanceReason = availability === 'unavailable' ? getMaintenanceReason(product, dates) : '';
  const nextWindow = isBlocked ? findNextAvailableWindow(product, null, dates, rentals) : null;
  const configuredDetailAria = product.detailAriaKey ? t(product.detailAriaKey) : '';
  const detailAria =
    product.detailAria ||
    (configuredDetailAria && configuredDetailAria !== product.detailAriaKey
      ? configuredDetailAria
      : t('customer.product.detailAria', { product: productName(product, t) }));

  return (
    <article className={`product-card ${isBlocked ? 'muted' : ''}`}>
      <Link className="product-media product-card-link" to={detailTo} aria-label={detailAria}>
        <img src={productCoverImage(product, t)} alt={productAlt(product, t)} loading="lazy" />
        <StatusPill type="availability" value={availability} t={t} />
      </Link>
      <div className="product-copy">
        <span className="product-meta">{productMeta(product, t)}</span>
        <div className="product-title-line">
          <h3>{productName(product, t)}</h3>
          <strong>
            {formatRupiah(product.price)}
            <small>{t(product.unitKey)}</small>
          </strong>
        </div>
        <p>{productDescription(product, locale, t)}</p>
        <div className="product-footer">
          <span>
            {maintenanceReason
              ? t('customer.product.unavailableReason', { reason: maintenanceReason })
              : nextWindow
              ? t('customer.product.nextAvailable', { range: formatDateRange(nextWindow, locale) })
              : variantSummary(product, dates, locale, t, rentals)}
          </span>
          <Link to={detailTo}>
            {t('customer.product.detailAction')}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function AvailabilityPanel({ products, dates, t, onOpenCart, rentals }) {
  const totals = products.map((product) => ({
    product,
    available: product.variants.reduce((sum, variant) => sum + getVariantAvailability(product, variant.id, dates, rentals), 0),
  }));

  return (
    <aside className="availability-panel" aria-label={t('customer.availability.aria')}>
      <span className="eyebrow">{t('customer.availability.kicker')}</span>
      <h2>{t('customer.availability.title')}</h2>
      <p>{t('customer.availability.copy')}</p>
      <div className="availability-list">
        {totals.map(({ product, available }) => (
          <span key={product.id}>
            {productName(product, t)}
            <b>{available}</b>
          </span>
        ))}
      </div>
      <button type="button" onClick={onOpenCart}>
        {t('customer.availability.action')}
        <ChevronRight aria-hidden="true" />
      </button>
    </aside>
  );
}

export function ProductDetail({
  product,
  selectedVariantId,
  setSelectedVariantId,
  dates,
  locale,
  t,
  onAdd,
  selectedAvailability,
  cart,
  rentals,
  dataAdapter,
  isFavorite,
  onFavoriteToggle,
}) {
  const availability = getProductAvailability(product, dates, rentals);
  const maintenanceReason = availability === 'unavailable' ? getMaintenanceReason(product, dates) : '';
  const isInCart = cart.some((item) => item.productId === product.id && item.variantId === selectedVariantId);
  const canAdd = selectedVariantId && selectedAvailability > 0;
  const nextWindow = selectedVariantId && selectedAvailability <= 0 ? findNextAvailableWindow(product, selectedVariantId, dates, rentals) : null;
  const images = useMemo(() => productGallery(product, t), [product, t]);
  const [selectedImageId, setSelectedImageId] = useState(images[0]?.id ?? '');
  const [favoriteNotice, setFavoriteNotice] = useState(false);
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? images[0];
  const description = productDescription(product, locale, t);
  const variantNotes = selectedVariantNotes(product, selectedVariantId, locale, t);

  useEffect(() => {
    setSelectedImageId(images[0]?.id ?? '');
  }, [product.id, images]);

  useEffect(() => {
    if (!favoriteNotice) return undefined;
    const timeoutId = window.setTimeout(() => setFavoriteNotice(false), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [favoriteNotice]);

  const handleFavoriteToggle = () => {
    onFavoriteToggle();
    setFavoriteNotice(true);
  };

  return (
    <section className="product-detail" id="product-detail">
      <div className="shell product-detail-layout">
        <div className={`detail-gallery ${images.length > 1 ? '' : 'single-image'}`} aria-label={t('customer.detail.galleryAria')}>
          <div className="detail-photo">
            <img src={selectedImage?.src ?? product.image} alt={selectedImage?.alt ?? productAlt(product, t)} />
          </div>
          {images.length > 1 ? (
            <div className="thumb-rail" aria-label={t('customer.detail.thumbsAria')}>
              {images.map((thumb) => (
                <button
                  className={`thumb-button ${selectedImage?.id === thumb.id ? 'selected' : ''}`}
                  type="button"
                  key={thumb.id}
                  aria-label={t('customer.detail.thumbSelect', { item: thumb.label })}
                  aria-pressed={selectedImage?.id === thumb.id}
                  onClick={() => setSelectedImageId(thumb.id)}
                >
                  <img src={thumb.src} alt={thumb.alt} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="detail-purchase" aria-label={t('customer.detail.panelAria')}>
          <div className="detail-heading">
            <StatusPill type="availability" value={availability} t={t} />
            <p className="product-meta">{productMeta(product, t)}</p>
            <h2>{productName(product, t)}</h2>
            <strong className="detail-price">
              {formatRupiah(product.price)}
              <span>{t(product.unitKey)}</span>
            </strong>
          </div>

          <div className="detail-description-block">
            <span className="option-label">{t('customer.detail.description')}</span>
            <p className="detail-copy">{description}</p>
          </div>

          <div className="option-group">
            <span className="option-label">{t('customer.detail.variantLabel')}</span>
            <div className="variant-grid" aria-label={t('customer.detail.variantAria')}>
              {product.variants.map((variant) => {
                const available = getVariantAvailability(product, variant.id, dates, rentals);
                return (
                  <button
                    className={`${selectedVariantId === variant.id ? 'selected' : ''} ${available <= 0 ? 'disabled' : ''}`}
                    type="button"
                    key={variant.id}
                    disabled={available <= 0}
                    onClick={() => setSelectedVariantId(variant.id)}
                  >
                    {variantLabel(t, variant.label)}
                    <small>{available}</small>
                  </button>
                );
              })}
            </div>
            <p className={canAdd ? 'helper-text' : 'validation-message'}>
              {canAdd
                ? t('customer.detail.variantHelp')
                : maintenanceReason
                  ? t('customer.detail.unavailableReason', { reason: maintenanceReason })
                  : t('customer.detail.unavailable')}
            </p>
            {selectedVariantId && selectedAvailability <= 0 ? (
              <p className="helper-text availability-suggestion">
                {nextWindow
                  ? t('customer.calendar.nextWindow', { range: formatDateRange(nextWindow, locale) })
                  : t('customer.calendar.noNextWindow')}
              </p>
            ) : null}
          </div>

          <div className="detail-description-block variant-note-block" aria-live="polite">
            <span className="option-label">{t('customer.detail.variantNotes')}</span>
            <p className="detail-copy">{variantNotes}</p>
          </div>

          <div className="option-group">
            <span className="option-label">{t('customer.detail.dateLabel')}</span>
            <div className="date-summary">
              <span>{formatDate(dates.start, locale)}</span>
              <b>{t('customer.detail.until')}</b>
              <span>{formatDate(dates.end, locale)}</span>
            </div>
          </div>

          <div className="detail-quick-actions">
            <button className={`outline-button full favorite-button ${isFavorite ? 'selected' : ''}`} type="button" aria-pressed={isFavorite} onClick={handleFavoriteToggle}>
              <Heart aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
              {isFavorite ? t('customer.detail.favoriteSaved') : t('customer.detail.favorite')}
            </button>
            {favoriteNotice ? <p className="success-message favorite-feedback">{t('customer.detail.favoriteUndo')}</p> : null}
            <div className="detail-cta-bar">
              <button className="secondary-button full" type="button" disabled={!canAdd} onClick={onAdd}>
                <ShoppingCart aria-hidden="true" />
                {isInCart ? t('customer.status.added') : t('customer.detail.add')}
              </button>
            </div>
          </div>

          <ProductAvailabilityCalendar
            product={product}
            selectedVariantId={selectedVariantId}
            dates={dates}
            locale={locale}
            t={t}
            rentals={rentals}
            dataAdapter={dataAdapter}
          />
        </aside>
      </div>
    </section>
  );
}

function ProductAvailabilityCalendar({ product, selectedVariantId, dates, locale, t, rentals, dataAdapter }) {
  const [monthCursor, setMonthCursor] = useState(monthKey(dates.start));
  const [inspectedDate, setInspectedDate] = useState(dates.start);
  const [availabilityRows, setAvailabilityRows] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];
  const monthDays = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
  const monthRange = useMemo(() => getMonthRange(monthCursor), [monthCursor]);
  const rowsByDate = useMemo(() => {
    const byDate = new Map();
    availabilityRows.forEach((row) => {
      const rows = byDate.get(row.date) ?? [];
      rows.push(row);
      byDate.set(row.date, rows);
    });
    return byDate;
  }, [availabilityRows]);
  const getDayAvailability = (day) => {
    const rows = rowsByDate.get(day);
    return rows?.length ? aggregateDayAvailability(product, day, rows) : getProductDayAvailability(product, day, rentals);
  };
  const inspected = getDayAvailability(inspectedDate);
  const weekdayLabels = useMemo(() => {
    const base = new Date('2026-06-07T00:00:00');
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(base);
      date.setDate(base.getDate() + index);
      return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' }).format(date);
    });
  }, [locale]);

  useEffect(() => {
    setMonthCursor(monthKey(dates.start));
    setInspectedDate(dates.start);
  }, [dates.start]);

  useEffect(() => {
    if (!dataAdapter) return undefined;
    const controller = new AbortController();
    setAvailabilityLoading(true);
    setAvailabilityError('');
    dataAdapter.availability
      .batch({
        productIds: [product.id],
        start: monthRange.start,
        end: monthRange.end,
        signal: controller.signal,
      })
      .then((rows) => setAvailabilityRows(rows))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setAvailabilityError(t('customer.calendar.loadError'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      });
    return () => controller.abort();
  }, [product.id, monthRange.start, monthRange.end, rentals, t]);

  return (
    <section className="availability-calendar" aria-label={t('customer.calendar.aria')}>
      <div className="calendar-heading">
        <div>
          <span className="option-label">{t('customer.calendar.title')}</span>
          <strong>{variantLabel(t, selectedVariant?.label ?? selectedVariantId)}</strong>
        </div>
        <div className="calendar-controls">
          <button type="button" onClick={() => setMonthCursor((current) => shiftMonth(current, -1))} aria-label={t('customer.calendar.previous')}>
            <ChevronLeft aria-hidden="true" />
          </button>
          <span>{formatMonth(monthCursor, locale)}</span>
          <button type="button" onClick={() => setMonthCursor((current) => shiftMonth(current, 1))} aria-label={t('customer.calendar.next')}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="calendar-grid" role="grid" aria-label={formatMonth(monthCursor, locale)}>
        {weekdayLabels.map((label) => (
          <span className="calendar-weekday" key={label}>
            {label}
          </span>
        ))}
        {monthDays.map((day, index) => {
          if (!day) return <span className="calendar-day empty" aria-hidden="true" key={`empty-${index}`} />;

          const dayInfo = getDayAvailability(day);
          const inSelectedRange = day >= dates.start && day <= dates.end;
          return (
            <button
              className={`calendar-day ${dayInfo.state} ${inspectedDate === day ? 'selected' : ''} ${inSelectedRange ? 'in-range' : ''}`}
              type="button"
              key={day}
              onClick={() => setInspectedDate(day)}
              aria-label={t('customer.calendar.dayAria', {
                date: formatDate(day, locale),
                state: t(`enum.availability.${dayInfo.state}`),
                available: dayInfo.available,
              })}
            >
              <span>{Number(day.slice(-2))}</span>
              <small>{dayInfo.available}</small>
            </button>
          );
        })}
      </div>

      <div className="calendar-legend" aria-label={t('customer.calendar.legend')}>
        {['unavailable', 'fully_booked', 'partially_booked', 'available'].map((state) => (
          <span className={`legend-item ${state}`} key={state}>
            <i aria-hidden="true" />
            {t(`enum.availability.${state}`)}
          </span>
        ))}
      </div>

      <p className="calendar-hint">{t('customer.calendar.clickHint')}</p>
      {availabilityLoading ? <p className="calendar-hint">{t('customer.calendar.loading')}</p> : null}
      {availabilityError ? <p className="validation-message">{availabilityError}</p> : null}

      <div className="calendar-inspector">
        <div>
          <span className="eyebrow">{formatDate(inspectedDate, locale)}</span>
          <strong>{t(`enum.availability.${inspected.state}`)}</strong>
        </div>
        <div className="calendar-stock-list">
          {inspected.variants.map((variant) => (
            <span
              className={`calendar-stock-chip ${selectedVariantId === variant.variantId ? 'selected' : ''}`}
              key={variant.variantId}
            >
              <span>{variantLabel(t, variant.label)}</span>
              <b>{variant.available}/{variant.total}</b>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function monthKey(date) {
  return `${date.slice(0, 7)}-01`;
}

function shiftMonth(date, delta) {
  const cursor = new Date(`${date}T00:00:00`);
  cursor.setMonth(cursor.getMonth() + delta);
  return `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-01`;
}

function formatMonth(date, locale) {
  return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

function buildMonthGrid(date) {
  const cursor = new Date(`${date}T00:00:00`);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: firstDay.getDay() }).map(() => null),
    ...Array.from({ length: daysInMonth }).map((_, index) => `${year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`),
  ];
}

function getMonthRange(date) {
  const cursor = new Date(`${date}T00:00:00`);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0);
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  return { start, end };
}

function aggregateDayAvailability(product, date, rows) {
  const variants = product.variants.map((variant) => {
    const row = rows.find((entry) => entry.variantId === variant.id);
    return row
      ? {
          variantId: variant.id,
          label: variant.label,
          total: row.total,
          booked: row.booked,
          available: row.available,
          state: row.state,
        }
      : {
          variantId: variant.id,
          label: variant.label,
          total: variant.total,
          booked: variant.held,
          available: Math.max(0, variant.total - variant.held),
          state: variant.held > 0 ? 'partially_booked' : 'available',
        };
  });
  const total = variants.reduce((sum, row) => sum + row.total, 0);
  const booked = variants.reduce((sum, row) => sum + row.booked, 0);
  const available = variants.reduce((sum, row) => sum + row.available, 0);
  const state = variants.every((variant) => variant.state === 'unavailable')
    ? 'unavailable'
    : available <= 0
      ? 'fully_booked'
      : booked > 0
        ? 'partially_booked'
        : 'available';
  return { date, productId: product.id, total, booked, available, state, variants };
}

export function CartSummary({ cartItems, cartTotal, t, locale, onQty, onRemove }) {
  return (
    <aside className="summary-card cart-card" aria-label={t('customer.summary.aria')}>
      <div className="summary-header">
        <span className="eyebrow">{t('customer.cart.title')}</span>
        <strong>{formatRupiah(cartTotal)}</strong>
      </div>
      <p>{t('customer.cart.copy')}</p>
      {cartItems.length === 0 ? (
        <EmptyState title={t('customer.cart.empty')} copy={t('customer.cart.syncNotice')} icon={ShoppingBag} />
      ) : (
        cartItems.map((item) => (
          <div className="summary-item editable" key={`${item.product.id}-${item.variantId}`}>
            <div className="cart-item-main">
              <img src={productCoverImage(item.product, t)} alt={productAlt(item.product, t)} />
              <div className="cart-item-copy">
                <strong>{productName(item.product, t)}</strong>
                <span className="cart-item-meta">
                  {variantLabel(t, item.variantId)} | {t('customer.cart.itemDates', { start: formatDate(item.start, locale), end: formatDate(item.end, locale) })}
                </span>
                <b className="cart-item-price">{formatRupiah(item.product.price * item.qty)}</b>
              </div>
            </div>
            <div className="cart-item-actions">
              <div className="quantity-control" aria-label={t('common.qty')}>
                <button type="button" onClick={() => onQty(item, -1)} aria-label={t('common.remove')}>
                  <Minus aria-hidden="true" />
                </button>
                <span>{item.qty}</span>
                <button type="button" onClick={() => onQty(item, 1)} aria-label={t('common.apply')}>
                  <Plus aria-hidden="true" />
                </button>
              </div>
              <button className="icon-button danger" type="button" onClick={() => onRemove(item)} aria-label={t('common.remove')}>
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </div>
        ))
      )}
      <div className="summary-total">
        <span>{t('customer.summary.totalLabel')}</span>
        <strong>{formatRupiah(cartTotal)}</strong>
      </div>
    </aside>
  );
}

export function CheckoutForm({ t, cartCount, createBooking, submittedBooking }) {
  const checkoutStepOrder = ['contact', 'fulfillment', 'review'];
  const [activeStep, setActiveStep] = useState('contact');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const schema = useMemo(() => makeBookingSchema(t), [t]);
  const showFailureToggle = import.meta.env.DEV && import.meta.env.VITE_SHOW_DEMO_FAILURE === 'true';
  const {
    control,
    register,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      fulfillment: 'pickup',
      pickupWindow: '10.00-12.00',
      returnWindow: '16.00-18.00',
      deliveryWindow: '09.00-11.00',
      address: '',
      notes: '',
    },
  });
  const fulfillment = watch('fulfillment');
  const values = watch();
  const activeStepIndex = checkoutStepOrder.indexOf(activeStep);
  const activeStepFields = {
    contact: ['name', 'phone', 'email'],
    fulfillment: fulfillment === 'delivery'
      ? ['fulfillment', 'address', 'deliveryWindow', 'returnWindow']
      : ['fulfillment', 'pickupWindow', 'returnWindow'],
    review: ['notes'],
  };
  const checkoutSteps = checkoutStepOrder.map((step, index) => ({
    key: step,
    label: t(`customer.checkout.step.${step}`),
    state: index < activeStepIndex ? 'done' : index === activeStepIndex ? 'current' : '',
    icon: index < activeStepIndex ? Check : undefined,
    marker: index + 1,
  }));

  const goNext = async () => {
    const valid = await trigger(activeStepFields[activeStep], { shouldFocus: true });
    if (!valid) return;
    setSubmitError('');
    setActiveStep(checkoutStepOrder[Math.min(activeStepIndex + 1, checkoutStepOrder.length - 1)]);
  };

  const goBack = () => {
    setSubmitError('');
    setActiveStep(checkoutStepOrder[Math.max(activeStepIndex - 1, 0)]);
  };

  const onSubmit = async (values) => {
    setSubmitError('');
    if (cartCount === 0) {
      setSubmitError(t('customer.checkout.emptyCart'));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (simulateFailure) {
      setSubmitError(t('customer.checkout.failureCopy'));
      return;
    }
    const result = await createBooking(values);
    if (result?.error) {
      setSubmitError(result.error);
      return;
    }
    reset();
    setActiveStep('contact');
  };

  return (
    <form className="checkout-card" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <span className="section-kicker">{t('customer.checkout.title')}</span>
        <h2>{t('customer.summary.continue')}</h2>
        <p>{t('customer.checkout.copy')}</p>
      </div>
      {!submittedBooking ? <StepProgress steps={checkoutSteps} ariaLabel={t('customer.checkout.stepsAria')} className="checkout-form-steps" /> : null}
      {!submittedBooking ? (
        <div className="checkout-mobile-submitbar">
          <CheckoutStepActions
            t={t}
            isFirst={activeStepIndex === 0}
            isLast={activeStepIndex === checkoutStepOrder.length - 1}
            isSubmitting={isSubmitting}
            cartCount={cartCount}
            onBack={goBack}
            onNext={goNext}
          />
        </div>
      ) : null}

      {!submittedBooking && activeStep === 'contact' ? (
        <section className="checkout-step-panel" aria-label={t('customer.checkout.step.contact')}>
          <div className="form-grid">
            <Field label={t('common.name')} error={errors.name?.message}>
              <input {...register('name')} autoComplete="name" />
            </Field>
            <PhoneField label={t('common.phone')} error={errors.phone?.message} inputProps={register('phone')} />
            <Field label={`${t('common.email')} (${t('common.optional')})`} error={errors.email?.message}>
              <input {...register('email')} autoComplete="email" type="email" />
            </Field>
          </div>
        </section>
      ) : null}

      {!submittedBooking && activeStep === 'fulfillment' ? (
        <section className="checkout-step-panel" aria-label={t('customer.checkout.step.fulfillment')}>
          <Controller
            control={control}
            name="fulfillment"
            render={({ field }) => (
              <RadioGroup.Root className="radio-grid" value={field.value} onValueChange={field.onChange}>
                <RadioGroup.Item className="radio-card" value="pickup">
                  <MapPin aria-hidden="true" />
                  <span>{t('enum.fulfillment.pickup')}</span>
                  <RadioGroup.Indicator className="radio-indicator" />
                </RadioGroup.Item>
                <RadioGroup.Item className="radio-card" value="delivery">
                  <Truck aria-hidden="true" />
                  <span>{t('enum.fulfillment.delivery')}</span>
                  <RadioGroup.Indicator className="radio-indicator" />
                </RadioGroup.Item>
              </RadioGroup.Root>
            )}
          />

          <div className="form-grid">
            {fulfillment === 'pickup' ? (
              <Field label={t('customer.checkout.pickupWindow')} error={errors.pickupWindow?.message}>
                <input {...register('pickupWindow')} />
              </Field>
            ) : (
              <>
                <Field label={t('common.address')} error={errors.address?.message}>
                  <input {...register('address')} autoComplete="street-address" />
                </Field>
                <Field label={t('customer.checkout.deliveryWindow')} error={errors.deliveryWindow?.message}>
                  <input {...register('deliveryWindow')} />
                </Field>
              </>
            )}
            <Field label={t('customer.checkout.returnWindow')} error={errors.returnWindow?.message}>
              <input {...register('returnWindow')} />
            </Field>
          </div>
        </section>
      ) : null}

      {!submittedBooking && activeStep === 'review' ? (
        <section className="checkout-step-panel" aria-label={t('customer.checkout.step.review')}>
          <div className="checkout-review-grid">
            <InfoBlock title={t('common.name')} copy={values.name || '-'} />
            <InfoBlock title={t('common.phone')} copy={values.phone || '-'} />
            <InfoBlock title={t('admin.table.fulfillment')} copy={t(`enum.fulfillment.${values.fulfillment}`)} />
            <InfoBlock
              title={t('common.window')}
              copy={values.fulfillment === 'delivery' ? values.deliveryWindow || '-' : values.pickupWindow || '-'}
            />
          </div>
          <Field label={`${t('common.notes')} (${t('common.optional')})`} error={errors.notes?.message}>
            <textarea {...register('notes')} rows="3" />
          </Field>

          {showFailureToggle ? (
            <label className="checkbox-row">
              <input type="checkbox" checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)} />
              <span>{t('customer.checkout.simulateFailure')}</span>
            </label>
          ) : null}
        </section>
      ) : null}

      {submitError ? <p className="validation-message">{submitError}</p> : null}
      {!submittedBooking ? (
        <CheckoutStepActions
          className="checkout-submit-inline"
          t={t}
          isFirst={activeStepIndex === 0}
          isLast={activeStepIndex === checkoutStepOrder.length - 1}
          isSubmitting={isSubmitting}
          cartCount={cartCount}
          onBack={goBack}
          onNext={goNext}
        />
      ) : null}

      {submittedBooking ? (
        <div className="confirmation-panel" id="confirmation">
          <span className="status-badge success">
            <BadgeCheck aria-hidden="true" />
            <span className="status-badge-label">{t('customer.checkout.successTitle')}</span>
          </span>
          <h3>{t('customer.confirmation.title')}: {submittedBooking.groupedReferences?.join(', ') ?? submittedBooking.reference}</h3>
          {submittedBooking.groupedReferences?.length > 1 ? <p>{t('customer.checkout.splitByDate')}</p> : null}
          <p>{t('customer.checkout.successCopy')}</p>
          <div className="info-grid compact">
            <InfoBlock title={t('common.status')} copy={t(`enum.lifecycle.${submittedBooking.lifecycle}`)} />
            <InfoBlock title={t('customer.confirmation.next')} copy={t('customer.confirmation.nextCopy')} />
          </div>
        </div>
      ) : null}
    </form>
  );
}

function CheckoutStepActions({ className = '', t, isFirst, isLast, isSubmitting, cartCount, onBack, onNext }) {
  return (
    <div className={`checkout-step-actions ${className}`.trim()}>
      {!isFirst ? (
        <button className="outline-button" type="button" onClick={(event) => {
          event.preventDefault();
          onBack();
        }} disabled={isSubmitting}>
          {t('customer.checkout.back')}
        </button>
      ) : null}
      {isLast ? (
        <button className="primary-button" type="submit" disabled={cartCount === 0 || isSubmitting}>
          {isSubmitting ? t('common.loading') : t('customer.checkout.submit')}
        </button>
      ) : (
        <button className="primary-button" type="button" onClick={(event) => {
          event.preventDefault();
          onNext();
        }}>
          {t('customer.checkout.next')}
        </button>
      )}
    </div>
  );
}

export function RequestSummarySheet({
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
}) {
  const checkoutLink = useCheckoutLink();
  const [checkoutActive, setCheckoutActive] = useState(false);

  useEffect(() => {
    if (!open) setCheckoutActive(false);
  }, [open]);

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) setCheckoutActive(false);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className={`request-sheet-content ${checkoutActive ? 'checkout-active' : ''}`} aria-describedby="request-summary-description">
          <SheetHeader
            kicker={t('customer.requestSheet.kicker')}
            title={checkoutActive ? t('customer.checkout.modalTitle') : t('customer.requestSheet.title')}
            description={checkoutActive ? t('customer.checkout.modalCopy') : t('customer.requestSheet.copy')}
            descriptionId="request-summary-description"
            closeLabel={t('customer.requestSheet.close')}
          />

          <div className="request-sheet-body">
            {checkoutActive ? (
              <div className="checkout-modal-layout">
                <CheckoutForm t={t} cartCount={cartCount} createBooking={createBooking} submittedBooking={submittedBooking} />
                <CartSummary cartItems={cartItems} cartTotal={cartTotal} t={t} locale={locale} onQty={onQty} onRemove={onRemove} />
              </div>
            ) : (
              <CartSummary cartItems={cartItems} cartTotal={cartTotal} t={t} locale={locale} onQty={onQty} onRemove={onRemove} />
            )}
          </div>

          {!checkoutActive ? (
            <div className="sheet-actions">
              <button className="primary-button full" type="button" disabled={cartCount === 0} onClick={() => setCheckoutActive(true)}>
                {t('customer.requestSheet.checkout')}
              </button>
              <Link className="outline-button full" to={{ pathname: '/catalogue', search: checkoutLink.to.search }} onClick={() => handleOpenChange(false)}>
                {t('customer.requestSheet.continue')}
              </Link>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

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
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="checkout-sheet" aria-describedby="checkout-modal-description">
          <SheetHeader
            kicker={t('customer.checkout.modalKicker')}
            title={t('customer.checkout.modalTitle')}
            description={t('customer.checkout.modalCopy')}
            descriptionId="checkout-modal-description"
            closeLabel={t('customer.checkout.close')}
          />

          <div className="checkout-modal-layout">
            <CheckoutForm t={t} cartCount={cartCount} createBooking={createBooking} submittedBooking={submittedBooking} />
            <CartSummary cartItems={cartItems} cartTotal={cartTotal} t={t} locale={locale} onQty={onQty} onRemove={onRemove} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function LookupSection({ t, locale, rentals, products, setNotifications, dataAdapter }) {
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [changeSent, setChangeSent] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryDraft, setRecoveryDraft] = useState({ phone: '', name: '', hint: '' });
  const lookupResultRef = useRef(null);
  const schema = useMemo(() => makeLookupSchema(t), [t]);
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { reference: 'CR-0142', phone: '+62 812 0000 0142', changeType: 'reschedule', changeNotes: '' },
  });

  useEffect(() => {
    if (!result && !notFound) return;
    const node = lookupResultRef.current;
    if (!node) return;
    window.requestAnimationFrame(() => {
      node.scrollIntoView({ block: 'start', behavior: 'smooth' });
      node.focus({ preventScroll: true });
    });
  }, [result, notFound]);

  const onLookup = ({ reference, phone }) => {
    const match = rentals.find((rental) => rental.reference.toLowerCase() === reference.toLowerCase() && normalizePhone(rental.phone) === normalizePhone(phone));
    setResult(match ?? null);
    setNotFound(!match);
    setChangeSent(false);
  };

  const submitRecovery = async (event) => {
    event.preventDefault();
    const phone = recoveryDraft.phone.trim();
    if (!phone) return;
    setRecoveryLoading(true);
    setRecoveryError('');
    const name = recoveryDraft.name.trim() || t('customer.lookup.recoveryUnknownName');
    const hint = recoveryDraft.hint.trim();
    try {
      if (dataAdapter) {
        await dataAdapter.lookup.recover({ phone, name, hint });
      } else {
        setNotifications?.((current) => [
          {
            id: `lookup-recovery-${Date.now()}`,
            tone: 'info',
            titleId: 'Pelanggan lupa kode',
            titleEn: 'Customer forgot reference',
            copyId: `${name} meminta bantuan kode untuk ${phone}${hint ? ` (${hint})` : ''}.`,
            copyEn: `${name} asked for reference help for ${phone}${hint ? ` (${hint})` : ''}.`,
            targetRoute: `/admin/clients?phone=${encodeURIComponent(normalizePhone(phone))}`,
          },
          ...current,
        ]);
      }
      setRecoverySent(true);
      setRecoveryDraft({ phone: '', name: '', hint: '' });
    } catch {
      setRecoveryError(t('customer.lookup.recoveryError'));
    } finally {
      setRecoveryLoading(false);
    }
  };

  const submitChange = handleSubmit(async (values) => {
    if (!result) return;
    setChangeError('');
    setChangeSent(false);
    try {
      if (dataAdapter) {
        await dataAdapter.requests.change({
          reference: result.reference,
          customerName: result.customerName,
          phone: result.phone,
          changeType: values.changeType,
          changeNotes: values.changeNotes,
        });
      } else {
        setNotifications?.((current) => [
          {
            id: `lookup-change-${Date.now()}`,
            tone: values.changeType === 'cancel' ? 'warning' : 'info',
            titleId: 'Pelanggan meminta perubahan pesanan',
            titleEn: 'Customer order change',
            copyId: `${result.reference} - ${result.customerName}: ${values.changeNotes || values.changeType}.`,
            copyEn: `${result.reference} - ${result.customerName}: ${values.changeNotes || values.changeType}.`,
            targetRoute: `/admin/requests?reference=${encodeURIComponent(result.reference)}`,
          },
          ...current,
        ]);
      }
      setChangeSent(true);
    } catch {
      setChangeError(t('customer.lookup.changeError'));
    }
  });

  return (
    <section className="lookup-section" id="lookup-page">
      <div className="shell lookup-feature">
        <div className="lookup-card">
          <div>
            <span className="section-kicker">{t('customer.lookup.kicker')}</span>
            <h2>{t('customer.lookup.title')}</h2>
            <p>{t('customer.lookup.copy')}</p>
          </div>
          <form className="lookup-fields" aria-label={t('customer.lookup.aria')} onSubmit={handleSubmit(onLookup)}>
            <Field label={t('customer.lookup.refLabel')} error={errors.reference?.message}>
              <input {...register('reference')} />
            </Field>
            <PhoneField label={t('customer.lookup.phoneLabel')} error={errors.phone?.message} inputProps={register('phone')} />
            <button className="secondary-button" type="submit">
              {t('customer.lookup.submit')}
            </button>
          </form>
          <div className="lookup-recovery">
            <button className="text-button" type="button" onClick={() => setRecoveryOpen((open) => !open)}>
              {recoveryOpen ? t('common.close') : t('customer.lookup.forgotCode')}
            </button>
            {recoveryOpen ? (
              <form className="recovery-fields" onSubmit={submitRecovery}>
                <PhoneField
                  label={t('customer.lookup.recoveryPhone')}
                  value={recoveryDraft.phone}
                  onChange={(event) => setRecoveryDraft((current) => ({ ...current, phone: event.target.value }))}
                  required
                />
                <Field label={t('customer.lookup.recoveryName')}>
                  <input
                    value={recoveryDraft.name}
                    onChange={(event) => setRecoveryDraft((current) => ({ ...current, name: event.target.value }))}
                    autoComplete="name"
                  />
                </Field>
                <Field label={t('customer.lookup.recoveryHint')}>
                  <input
                    value={recoveryDraft.hint}
                    onChange={(event) => setRecoveryDraft((current) => ({ ...current, hint: event.target.value }))}
                  />
                </Field>
                <button className="outline-button" type="submit" disabled={recoveryLoading}>
                  {recoveryLoading ? t('common.loading') : t('customer.lookup.recoverySubmit')}
                </button>
              </form>
            ) : null}
            {recoverySent ? <p className="success-message">{t('customer.lookup.recoverySent')}</p> : null}
            {recoveryError ? <p className="validation-message">{recoveryError}</p> : null}
          </div>
        </div>

        {notFound || result ? (
          <div className="lookup-feedback-region" ref={lookupResultRef} tabIndex="-1">
            {notFound ? <EmptyState title={t('customer.lookup.notFound')} copy={t('common.retry')} icon={AlertTriangle} /> : null}
            {result ? (
              <div className="lookup-result">
                <div>
                  <span className="section-kicker">{t('customer.lookup.resultTitle')}</span>
                  <h2>{result.reference}</h2>
                  <div className="inline-status">
                    <StatusPill type="lifecycle" value={result.lifecycle} t={t} />
                    <StatusPill type="payment" value={result.paymentStatus} t={t} />
                  </div>
                </div>
                <div className="info-grid">
                  <InfoBlock title={t('common.name')} copy={result.customerName} />
                  <InfoBlock title={t('admin.table.dates')} copy={formatDateRange(result, locale)} />
                  <InfoBlock title={t('admin.table.fulfillment')} copy={t(`enum.fulfillment.${result.fulfillment}`)} />
                  <InfoBlock title={t('common.address')} copy={result.address || '-'} />
                </div>
                <div className="summary-card compact-card">
                  {result.items.map((item) => {
                    const product = products.find((entry) => entry.id === item.productId);
                    return product ? (
                      <div className="summary-item" key={`${item.productId}-${item.variantId}`}>
                        <img src={product.image} alt={productAlt(product, t)} />
                        <div>
                          <strong>{productName(product, t)}</strong>
                          <span>{variantLabel(t, item.variantId)} x {item.qty}</span>
                        </div>
                        <b>{formatRupiah(product.price * item.qty)}</b>
                      </div>
                    ) : null;
                  })}
                </div>
                <form className="change-request-form" onSubmit={submitChange}>
                  <div>
                    <span className="section-kicker">{t('customer.lookup.changeTitle')}</span>
                    <p>{t('customer.lookup.changeCopy')}</p>
                  </div>
                  <Controller
                    control={control}
                    name="changeType"
                    render={({ field }) => (
                      <Select.Root value={field.value} onValueChange={field.onChange}>
                        <Select.Trigger className="select-trigger" aria-label={t('customer.lookup.changeTitle')}>
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="select-content">
                            {['cancel', 'reschedule', 'items', 'contact'].map((type) => (
                              <Select.Item className="select-item" value={type} key={type}>
                                <Select.ItemText>{t(`enum.change.${type}`)}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    )}
                  />
                  <Field label={t('common.notes')} error={errors.changeNotes?.message}>
                    <textarea {...register('changeNotes')} rows="3" />
                  </Field>
                  <button className="outline-button" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('common.loading') : t('customer.lookup.changeSubmit')}
                  </button>
                  {changeSent ? <p className="success-message">{t('customer.lookup.changeSent')}</p> : null}
                  {changeError ? <p className="validation-message">{changeError}</p> : null}
                </form>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export { firstAvailableVariant };
