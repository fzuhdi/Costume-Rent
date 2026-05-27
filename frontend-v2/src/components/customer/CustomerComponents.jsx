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
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { EmptyState, Field, InfoBlock, LocaleButton, StatusPill } from '../shared.jsx';
import {
  firstAvailableVariant,
  formatDate,
  formatDateRange,
  formatRupiah,
  findNextAvailableWindow,
  getProductAvailability,
  getProductDayAvailability,
  getVariantAvailability,
  makeBookingSchema,
  makeLookupSchema,
  normalizePhone,
  variantLabel,
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
    pathname: '/',
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

export function ProductCard({ product, dates, detailTo, locale, t, rentals }) {
  const availability = getProductAvailability(product, dates, rentals);
  const isBlocked = availability === 'fully_booked' || availability === 'unavailable';
  const nextWindow = isBlocked ? findNextAvailableWindow(product, null, dates, rentals) : null;

  return (
    <article className={`product-card ${isBlocked ? 'muted' : ''}`}>
      <Link className="product-media product-card-link" to={detailTo} aria-label={t(product.detailAriaKey)}>
        <img src={product.image} alt={t(product.altKey)} loading="lazy" />
        <StatusPill type="availability" value={availability} t={t} />
      </Link>
      <div className="product-copy">
        <span className="product-meta">{t(product.metaKey)}</span>
        <div className="product-title-line">
          <h3>{t(product.nameKey)}</h3>
          <strong>
            {formatRupiah(product.price)}
            <small>{t(product.unitKey)}</small>
          </strong>
        </div>
        <p>{t(product.copyKey)}</p>
        <div className="product-footer">
          <span>
            {nextWindow
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
            {t(product.nameKey)}
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

export function ProductDetail({ product, selectedVariantId, setSelectedVariantId, dates, locale, t, onAdd, selectedAvailability, cart, rentals }) {
  const availability = getProductAvailability(product, dates, rentals);
  const isInCart = cart.some((item) => item.productId === product.id && item.variantId === selectedVariantId);
  const canAdd = selectedVariantId && selectedAvailability > 0;
  const nextWindow = selectedVariantId && selectedAvailability <= 0 ? findNextAvailableWindow(product, selectedVariantId, dates, rentals) : null;

  return (
    <section className="product-detail" id="product-detail">
      <div className="shell product-detail-layout">
        <div className="detail-gallery" aria-label={t('customer.detail.galleryAria')}>
          <div className="thumb-rail" aria-label={t('customer.detail.thumbsAria')}>
            {[product].map((thumb) => (
              <button className="thumb-button" type="button" key={thumb.id} aria-label={t(thumb.detailAriaKey)}>
                <img src={thumb.image} alt={t(thumb.altKey)} />
              </button>
            ))}
          </div>
          <div className="detail-photo">
            <img src={product.image} alt={t(product.altKey)} />
          </div>
        </div>

        <aside className="detail-purchase" aria-label={t('customer.detail.panelAria')}>
          <div className="detail-heading">
            <StatusPill type="availability" value={availability} t={t} />
            <p className="product-meta">{t(product.metaKey)}</p>
            <h2>{t(product.nameKey)}</h2>
            <strong className="detail-price">
              {formatRupiah(product.price)}
              <span>{t(product.unitKey)}</span>
            </strong>
            <p>{t(product.copyKey)}</p>
          </div>

          <div className="info-grid compact">
            <InfoBlock title={t('customer.detail.measurement')} copy={locale === 'id' ? product.measurementId : product.measurementEn} />
            <InfoBlock title={t('customer.detail.bundle')} copy={locale === 'id' ? product.bundleId : product.bundleEn} />
          </div>

          <div className="option-group">
            <span className="option-label">{t('customer.detail.dateLabel')}</span>
            <div className="date-summary">
              <span>{formatDate(dates.start, locale)}</span>
              <b>{t('customer.detail.until')}</b>
              <span>{formatDate(dates.end, locale)}</span>
            </div>
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
            <p className={canAdd ? 'helper-text' : 'validation-message'}>{canAdd ? t('customer.detail.variantHelp') : t('customer.detail.unavailable')}</p>
            {selectedVariantId && selectedAvailability <= 0 ? (
              <p className="helper-text availability-suggestion">
                {nextWindow
                  ? t('customer.calendar.nextWindow', { range: formatDateRange(nextWindow, locale) })
                  : t('customer.calendar.noNextWindow')}
              </p>
            ) : null}
          </div>

          <ProductAvailabilityCalendar
            product={product}
            selectedVariantId={selectedVariantId}
            setSelectedVariantId={setSelectedVariantId}
            dates={dates}
            locale={locale}
            t={t}
            rentals={rentals}
          />

          <button className="secondary-button full" type="button" disabled={!canAdd} onClick={onAdd}>
            <ShoppingCart aria-hidden="true" />
            {isInCart ? t('customer.status.added') : t('customer.detail.add')}
          </button>
          <button className="outline-button full" type="button">
            <Heart aria-hidden="true" />
            {t('customer.detail.favorite')}
          </button>
        </aside>
      </div>
    </section>
  );
}

function ProductAvailabilityCalendar({ product, selectedVariantId, setSelectedVariantId, dates, locale, t, rentals }) {
  const [monthCursor, setMonthCursor] = useState(monthKey(dates.start));
  const [inspectedDate, setInspectedDate] = useState(dates.start);
  const inspected = getProductDayAvailability(product, inspectedDate, rentals);
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];
  const monthDays = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
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

          const dayInfo = getProductDayAvailability(product, day, rentals);
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

      <div className="calendar-inspector">
        <div>
          <span className="eyebrow">{formatDate(inspectedDate, locale)}</span>
          <strong>{t(`enum.availability.${inspected.state}`)}</strong>
        </div>
        <div className="calendar-stock-list">
          {inspected.variants.map((variant) => (
            <button
              className={selectedVariantId === variant.variantId ? 'selected' : ''}
              type="button"
              key={variant.variantId}
              onClick={() => setSelectedVariantId(variant.variantId)}
            >
              <span>{variantLabel(t, variant.label)}</span>
              <b>{variant.available}/{variant.total}</b>
            </button>
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
            <img src={item.product.image} alt={t(item.product.altKey)} />
            <div>
              <strong>{t(item.product.nameKey)}</strong>
              <span>{t('customer.cart.itemDates', { start: formatDate(item.start, locale), end: formatDate(item.end, locale) })}</span>
              <span>{variantLabel(t, item.variantId)}</span>
            </div>
            <b>{formatRupiah(item.product.price * item.qty)}</b>
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
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const schema = useMemo(() => makeBookingSchema(t), [t]);
  const showFailureToggle = import.meta.env.DEV && import.meta.env.VITE_SHOW_DEMO_FAILURE === 'true';
  const {
    control,
    register,
    handleSubmit,
    watch,
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
    const result = createBooking(values);
    if (result?.error) {
      setSubmitError(result.error);
      return;
    }
    reset();
  };

  return (
    <form className="checkout-card" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <span className="section-kicker">{t('customer.checkout.title')}</span>
        <h2>{t('customer.summary.continue')}</h2>
        <p>{t('customer.checkout.copy')}</p>
      </div>

      <div className="form-grid">
        <Field label={t('common.name')} error={errors.name?.message}>
          <input {...register('name')} autoComplete="name" />
        </Field>
        <Field label={t('common.phone')} error={errors.phone?.message}>
          <input {...register('phone')} autoComplete="tel" inputMode="tel" />
        </Field>
        <Field label={`${t('common.email')} (${t('common.optional')})`} error={errors.email?.message}>
          <input {...register('email')} autoComplete="email" type="email" />
        </Field>
      </div>

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

      <Field label={`${t('common.notes')} (${t('common.optional')})`} error={errors.notes?.message}>
        <textarea {...register('notes')} rows="3" />
      </Field>

      {showFailureToggle ? (
        <label className="checkbox-row">
          <input type="checkbox" checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)} />
          <span>{t('customer.checkout.simulateFailure')}</span>
        </label>
      ) : null}

      {submitError ? <p className="validation-message">{submitError}</p> : null}
      <button className="primary-button full" type="submit" disabled={cartCount === 0 || isSubmitting}>
        {isSubmitting ? t('common.loading') : t('customer.checkout.submit')}
      </button>

      {submittedBooking ? (
        <div className="confirmation-panel" id="confirmation">
          <span className="status-badge success">
            <BadgeCheck aria-hidden="true" />
            {t('customer.checkout.successTitle')}
          </span>
          <h3>{t('customer.confirmation.title')}: {submittedBooking.reference}</h3>
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

export function RequestSummarySheet({ open, onOpenChange, t, locale, cartItems, cartTotal, cartCount, onQty, onRemove }) {
  const checkoutLink = useCheckoutLink();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="request-sheet-content" aria-describedby="request-summary-description">
          <div className="sheet-header">
            <div>
              <span className="section-kicker">{t('customer.requestSheet.kicker')}</span>
              <Dialog.Title className="sheet-title">{t('customer.requestSheet.title')}</Dialog.Title>
              <Dialog.Description id="request-summary-description">{t('customer.requestSheet.copy')}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="icon-button" type="button" aria-label={t('customer.requestSheet.close')}>
                <X aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <CartSummary cartItems={cartItems} cartTotal={cartTotal} t={t} locale={locale} onQty={onQty} onRemove={onRemove} />

          <div className="sheet-actions">
            {cartCount > 0 ? (
              <Link className="primary-button full" to={checkoutLink.to} state={checkoutLink.state} onClick={() => onOpenChange(false)}>
                {t('customer.requestSheet.checkout')}
              </Link>
            ) : (
              <button className="primary-button full" type="button" disabled>
                {t('customer.requestSheet.checkout')}
              </button>
            )}
            <Link className="outline-button full" to={{ pathname: '/', search: checkoutLink.to.search }} onClick={() => onOpenChange(false)}>
              {t('customer.requestSheet.continue')}
            </Link>
          </div>
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
          <div className="checkout-sheet-header">
            <div>
              <span className="section-kicker">{t('customer.checkout.modalKicker')}</span>
              <Dialog.Title className="sheet-title">{t('customer.checkout.modalTitle')}</Dialog.Title>
              <Dialog.Description id="checkout-modal-description">{t('customer.checkout.modalCopy')}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="icon-button" type="button" aria-label={t('customer.checkout.close')}>
                <X aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <div className="checkout-steps" aria-label={t('customer.checkout.stepsAria')}>
            <span className="step-chip done">
              <Check aria-hidden="true" />
              {t('customer.checkout.stepReview')}
            </span>
            <span className="step-chip current">{t('customer.checkout.stepContact')}</span>
            <span className="step-chip">{t('customer.checkout.stepFulfillment')}</span>
          </div>

          <div className="checkout-modal-layout">
            <CartSummary cartItems={cartItems} cartTotal={cartTotal} t={t} locale={locale} onQty={onQty} onRemove={onRemove} />
            <CheckoutForm t={t} cartCount={cartCount} createBooking={createBooking} submittedBooking={submittedBooking} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function LookupSection({ t, locale, rentals, products, setNotifications }) {
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [changeSent, setChangeSent] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState({ phone: '', name: '', hint: '' });
  const schema = useMemo(() => makeLookupSchema(t), [t]);
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { reference: 'CR-0142', phone: '+62 812 0000 0142', changeType: 'reschedule', changeNotes: '' },
  });

  const onLookup = ({ reference, phone }) => {
    const match = rentals.find((rental) => rental.reference.toLowerCase() === reference.toLowerCase() && normalizePhone(rental.phone) === normalizePhone(phone));
    setResult(match ?? null);
    setNotFound(!match);
    setChangeSent(false);
  };

  const submitRecovery = (event) => {
    event.preventDefault();
    const phone = recoveryDraft.phone.trim();
    if (!phone) return;
    const name = recoveryDraft.name.trim() || t('customer.lookup.recoveryUnknownName');
    const hint = recoveryDraft.hint.trim();
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
    setRecoverySent(true);
    setRecoveryDraft({ phone: '', name: '', hint: '' });
  };

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
            <Field label={t('customer.lookup.phoneLabel')} error={errors.phone?.message}>
              <input {...register('phone')} inputMode="tel" />
            </Field>
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
                <Field label={t('customer.lookup.recoveryPhone')}>
                  <input
                    value={recoveryDraft.phone}
                    onChange={(event) => setRecoveryDraft((current) => ({ ...current, phone: event.target.value }))}
                    inputMode="tel"
                    autoComplete="tel"
                    required
                  />
                </Field>
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
                <button className="outline-button" type="submit">
                  {t('customer.lookup.recoverySubmit')}
                </button>
              </form>
            ) : null}
            {recoverySent ? <p className="success-message">{t('customer.lookup.recoverySent')}</p> : null}
          </div>
        </div>

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
                    <img src={product.image} alt={t(product.altKey)} />
                    <div>
                      <strong>{t(product.nameKey)}</strong>
                      <span>{variantLabel(t, item.variantId)} x {item.qty}</span>
                    </div>
                    <b>{formatRupiah(product.price * item.qty)}</b>
                  </div>
                ) : null;
              })}
            </div>
            <form className="change-request-form" onSubmit={(event) => {
              event.preventDefault();
              setChangeSent(true);
            }}>
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
              <button className="outline-button" type="submit">
                {t('customer.lookup.changeSubmit')}
              </button>
              {changeSent ? <p className="success-message">{t('customer.lookup.changeSent')}</p> : null}
            </form>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export { firstAvailableVariant };
