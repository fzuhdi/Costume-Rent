import * as Tabs from '@radix-ui/react-tabs';
import { ArrowRight, BadgeCheck, CalendarDays, CheckCircle2, Clock3, Search, Star, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { defaultDates, normalizeHomeContent } from '../../mockData.js';
import {
  formatDateRange,
  formatRupiah,
  getProductAvailability,
  getVariantAvailability,
  localizeContent,
  productAlt,
  productCoverImage,
  productDescription,
  productMeta,
  productName,
  validateDates,
} from '../../lib/rental-utils.js';
import { StatusPill } from '../../components/shared.jsx';
import CustomerFrame from './CustomerFrame.jsx';

export default function CustomerHomePage({
  locale,
  setLocale,
  t,
  products,
  rentals = [],
  settings,
  cart,
  onOpenCart,
}) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState({ q: '', start: defaultDates.start, end: defaultDates.end });
  const [dateError, setDateError] = useState('');
  const heroProduct = products.find((product) => product.active) ?? products[0];
  const homeContent = normalizeHomeContent(settings.homeContent);
  const fallbackHeroImage = heroProduct ? productCoverImage(heroProduct, t) : '';
  const fallbackHeroAlt = heroProduct ? productAlt(heroProduct, t) : '';
  const heroImage = homeContent.heroImageUrl.trim() || fallbackHeroImage;
  const heroImageAlt = localizeContent(homeContent.heroImageAlt, locale, fallbackHeroAlt) || fallbackHeroAlt;
  const articles = homeContent.articles.slice(0, 3);
  const testimonials = homeContent.testimonials.slice(0, 3);
  const rentalPeriod = formatDateRange({ start: draft.start, end: draft.end }, locale);
  const activeProducts = products.filter((product) => product.active);
  const totalAvailableUnits = activeProducts.reduce((total, product) => total + availableUnits(product, draft, rentals), 0);
  const catalogueSearch = buildCatalogueSearch(draft);
  const collections = buildHomeCollections(activeProducts, t);
  const defaultCollection = collections.find((collection) => collection.products.length > 0)?.value ?? collections[0]?.value;
  const trustItems = [
    { icon: CalendarDays, title: t('customer.home.trustDateTitle'), copy: t('customer.home.trustDateCopy') },
    { icon: CheckCircle2, title: t('customer.home.trustStockTitle'), copy: t('customer.home.trustStockCopy') },
    { icon: Truck, title: t('customer.home.trustFulfillmentTitle'), copy: t('customer.home.trustFulfillmentCopy') },
  ];

  const submitSearch = (event) => {
    event.preventDefault();
    const error = validateDates({ start: draft.start, end: draft.end });
    setDateError(error ? t(error) : '');
    if (error) return;

    const params = new URLSearchParams({
      search: '1',
      start: draft.start,
      end: draft.end,
    });
    if (draft.q.trim()) params.set('q', draft.q.trim());
    navigate({ pathname: '/catalogue', search: `?${params.toString()}` });
  };

  return (
    <CustomerFrame
      title={t('document.customerTitle')}
      skipTo="customer-home"
      settings={settings}
      locale={locale}
      setLocale={setLocale}
      t={t}
      cartCount={cart.length}
      onOpenCart={onOpenCart}
    >
      <section
        className="customer-home-hero"
        id="customer-home"
        style={heroImage ? { backgroundImage: `linear-gradient(90deg, rgb(15 23 42 / 0.90) 0%, rgb(15 23 42 / 0.70) 45%, rgb(15 23 42 / 0.22) 100%), url(${heroImage})` } : undefined}
        aria-label={heroImageAlt || undefined}
      >
        <div className="shell home-hero-inner">
          <div className="home-hero-copy">
            <span className="section-kicker">{localizeContent(homeContent.heroKicker, locale)}</span>
            <h1>{localizeContent(homeContent.heroTitle, locale)}</h1>
            <p>{localizeContent(homeContent.heroCopy, locale)}</p>
            <div className="home-hero-actions" aria-label={t('customer.home.heroActionsAria')}>
              <Link className="secondary-button" to={{ pathname: '/catalogue', search: catalogueSearch }}>
                <CalendarDays aria-hidden="true" />
                {t('customer.home.catalogueAction')}
              </Link>
              <Link className="home-lookup-link" to="/lookup">
                <BadgeCheck aria-hidden="true" />
                {t('customer.home.lookupCta')}
              </Link>
            </div>
            <div className="home-hero-stats" aria-label={t('customer.home.statsAria')}>
              <span>
                <strong>{activeProducts.length}</strong>
                {t('customer.home.statActive')}
              </span>
              <span>
                <strong>{totalAvailableUnits}</strong>
                {t('customer.home.statUnits')}
              </span>
              <span>
                <strong>
                  <Clock3 aria-hidden="true" />
                </strong>
                {t('customer.home.statReview')}
              </span>
            </div>
          </div>
          <form className="home-search-panel" onSubmit={submitSearch} aria-label={t('customer.home.searchAria')}>
            <div className="home-search-heading">
              <span className="section-kicker">{t('customer.home.searchKicker')}</span>
              <strong>{t('customer.home.searchTitle')}</strong>
              <p>{t('customer.home.searchHint')}</p>
            </div>
            <label className="search-field search-query">
              <span>{t('customer.search.queryLabel')}</span>
              <input
                value={draft.q}
                onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
                placeholder={t('customer.search.queryValue')}
                type="search"
              />
            </label>
            <label className="search-field">
              <span>{t('customer.search.startLabel')}</span>
              <input value={draft.start} onChange={(event) => setDraft((current) => ({ ...current, start: event.target.value }))} type="date" />
            </label>
            <label className="search-field">
              <span>{t('customer.search.endLabel')}</span>
              <input value={draft.end} onChange={(event) => setDraft((current) => ({ ...current, end: event.target.value }))} type="date" />
            </label>
            <p className="home-search-period">{t('customer.home.periodSummary', { range: rentalPeriod })}</p>
            <button className="primary-button" type="submit">
              <Search aria-hidden="true" />
              {t('customer.home.searchCta')}
            </button>
            {dateError ? <p className="validation-message">{dateError}</p> : null}
          </form>
        </div>
      </section>

      <section className="home-trust-strip" aria-label={t('customer.home.trustAria')}>
        <div className="shell home-trust-grid">
          {trustItems.map((item) => (
            <article className="home-trust-item" key={item.title}>
              <item.icon aria-hidden="true" />
              <div>
                <h2>{item.title}</h2>
                <p>{item.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-featured-section">
        <div className="shell">
          <div className="home-featured-head">
            <div>
              <span className="section-kicker">{t('customer.home.featuredKicker')}</span>
              <h2>{t('customer.home.featuredTitle')}</h2>
              <p>{t('customer.home.featuredCopy')}</p>
            </div>
            <Link className="outline-button" to={{ pathname: '/catalogue', search: catalogueSearch }}>
              <Search aria-hidden="true" />
              {t('customer.home.searchCta')}
            </Link>
          </div>

          <Tabs.Root className="home-collection-tabs" defaultValue={defaultCollection}>
            <Tabs.List className="home-tab-list" aria-label={t('customer.home.tabsAria')}>
              {collections.map((collection) => (
                <Tabs.Trigger className="home-tab-trigger" value={collection.value} key={collection.value}>
                  {collection.label}
                  <span>{collection.products.length}</span>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {collections.map((collection) => (
              <Tabs.Content className="home-tab-panel" value={collection.value} key={collection.value}>
                {collection.products.length > 0 ? (
                  <div className="home-product-grid">
                    {collection.products.map((product) => (
                      <HomeProductCard
                        product={product}
                        dates={draft}
                        locale={locale}
                        t={t}
                        rentals={rentals}
                        catalogueSearch={catalogueSearch}
                        key={product.id}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="home-empty-note">{t('customer.home.featuredEmpty')}</p>
                )}
              </Tabs.Content>
            ))}
          </Tabs.Root>
        </div>
      </section>

      <section className="home-section home-catalogue-cta">
        <div className="shell home-cta-grid">
          <div>
            <span className="section-kicker">{localizeContent(homeContent.catalogueKicker, locale)}</span>
            <h2>{localizeContent(homeContent.catalogueTitle, locale)}</h2>
            <p>{localizeContent(homeContent.catalogueCopy, locale)}</p>
          </div>
          <Link className="secondary-button" to={{ pathname: '/catalogue', search: catalogueSearch }}>
            <CalendarDays aria-hidden="true" />
            {t('customer.home.catalogueAction')}
          </Link>
        </div>
      </section>

      <section className="home-section">
        <div className="shell">
          <div className="home-section-head">
            <span className="section-kicker">{localizeContent(homeContent.articlesKicker, locale)}</span>
            <h2>{localizeContent(homeContent.articlesTitle, locale)}</h2>
          </div>
          <div className="home-card-grid">
            {articles.map((article, index) => (
              <article className="home-article-card" key={`home-article-${index}`}>
                <span>{localizeContent(article.label, locale)}</span>
                <h3>{localizeContent(article.title, locale)}</h3>
                <p>{localizeContent(article.copy, locale)}</p>
                <Link className="text-button" to="/catalogue">
                  {t('customer.home.articleAction')}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-testimonials">
        <div className="shell">
          <div className="home-section-head">
            <span className="section-kicker">{localizeContent(homeContent.testimonialsKicker, locale)}</span>
            <h2>{localizeContent(homeContent.testimonialsTitle, locale)}</h2>
          </div>
          <div className="home-card-grid">
            {testimonials.map((testimonial, index) => (
              <figure className="testimonial-card" key={`home-testimonial-${index}`}>
                <div className="testimonial-stars" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} />
                  ))}
                </div>
                <blockquote>{localizeContent(testimonial.quote, locale)}</blockquote>
                <figcaption>{localizeContent(testimonial.name, locale)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </CustomerFrame>
  );
}

function HomeProductCard({ product, dates, locale, t, rentals, catalogueSearch }) {
  const availability = getProductAvailability(product, dates, rentals);
  const units = availableUnits(product, dates, rentals);
  const detailTo = { pathname: `/costumes/${product.id}`, search: catalogueSearch };

  return (
    <article className="home-product-card">
      <Link className="home-product-media" to={detailTo} aria-label={t('customer.product.detailAria', { product: productName(product, t) })}>
        <img src={productCoverImage(product, t)} alt={productAlt(product, t)} loading="lazy" />
        <StatusPill type="availability" value={availability} t={t} />
      </Link>
      <div className="home-product-body">
        <span className="product-meta">{productMeta(product, t)}</span>
        <h3>{productName(product, t)}</h3>
        <p>{productDescription(product, locale, t)}</p>
        <div className="home-product-footer">
          <span>{t('customer.home.fromPrice', { price: formatRupiah(product.price) })}</span>
          <Link className="text-button" to={detailTo}>
            {t('customer.home.viewProduct')}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <small className={units > 0 ? 'home-product-stock' : 'home-product-stock unavailable'}>
          {units > 0 ? t('customer.home.availableUnits', { count: units }) : t('customer.home.unavailableNow')}
        </small>
      </div>
    </article>
  );
}

function buildCatalogueSearch(draft) {
  const params = new URLSearchParams({
    search: '1',
    start: draft.start,
    end: draft.end,
  });
  if (draft.q.trim()) params.set('q', draft.q.trim());
  return `?${params.toString()}`;
}

function buildHomeCollections(products, t) {
  return [
    {
      value: 'formal',
      label: t('customer.home.tab.formal'),
      products: products.filter((product) => product.category === 'formal' && !product.id.includes('tari')).slice(0, 4),
    },
    {
      value: 'dance',
      label: t('customer.home.tab.dance'),
      products: products.filter((product) => product.id.includes('tari') || product.region === 'dance').slice(0, 4),
    },
    {
      value: 'accessory',
      label: t('customer.home.tab.accessory'),
      products: products.filter((product) => product.category === 'accessory').slice(0, 4),
    },
  ];
}

function availableUnits(product, dates, rentals) {
  return product.variants.reduce((sum, variant) => sum + getVariantAvailability(product, variant.id, dates, rentals), 0);
}
