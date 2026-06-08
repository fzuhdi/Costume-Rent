import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpDown, Check, ChevronDown, DollarSign, Heart, MapPin, RotateCcw, SlidersHorizontal, Tags, Users, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { NavigateOptions } from 'react-router-dom';
import { Field } from '../../shared';
import type { TFunction } from '../../../types/domain';

const GENDER_OPTIONS = ['women', 'men', 'unisex', 'kids'] as const;
const SORT_OPTIONS = ['relevance', 'price_asc', 'price_desc', 'availability'] as const;

type CatalogueFilters = {
  region: string;
  type: string;
  gender: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

type ActiveFilterSummary = {
  key: string;
  label: string;
  value: string | number;
};

type ParamUpdates = Partial<Record<string, string | undefined | null>>;

type UpdateCatalogueParams = (updates: ParamUpdates, options?: NavigateOptions) => void;

type PriceDraft = Pick<CatalogueFilters, 'minPrice' | 'maxPrice'>;

export function CatalogueFilterBoard({
  t,
  periodLabel,
  filters,
  favoritesOnly,
  favoritesCount,
  activeFilter,
  setActiveFilter,
  activeFilterCount,
  secondaryFilterCount,
  activeFilterSummaries,
  regionOptions,
  typeOptions,
  updateCatalogueParams,
  clearFilters,
  optionLabel,
}: {
  t: TFunction;
  periodLabel: string;
  filters: CatalogueFilters;
  favoritesOnly: boolean;
  favoritesCount: number;
  activeFilter: string;
  setActiveFilter: Dispatch<SetStateAction<string>>;
  activeFilterCount: number;
  secondaryFilterCount: number;
  activeFilterSummaries: ActiveFilterSummary[];
  regionOptions: string[];
  typeOptions: string[];
  updateCatalogueParams: UpdateCatalogueParams;
  clearFilters: () => void;
  optionLabel: (value: string, t: TFunction, prefix: string) => string;
}) {
  return (
    <div className="catalogue-filter-board">
      <div className="filter-board-head">
        <div>
          <span className="eyebrow">
            {t('customer.toolbar.kicker')}: {periodLabel}
          </span>
          <h2>{t('customer.toolbar.title')}</h2>
        </div>
        <button
          className="filter-reset-inline"
          type="button"
          onClick={clearFilters}
          disabled={activeFilterCount === 0}
        >
          <RotateCcw aria-hidden="true" />
          {t('customer.filters.clearAll')}
        </button>
      </div>

      <div className="filter-summary-row" aria-live="polite">
        <span className="filter-count-label">
          <SlidersHorizontal aria-hidden="true" />
          {activeFilterCount} {t('customer.filters.kicker')}
        </span>
        <div className="filter-summary-chips">
          {activeFilterSummaries.length > 0 ? (
            activeFilterSummaries.map((item) => (
              <span className="filter-summary-chip" key={item.key}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </span>
            ))
          ) : (
            <span className="filter-summary-chip quiet">
              <Check aria-hidden="true" />
              {t('customer.filters.all')}
            </span>
          )}
        </div>
      </div>

      <div className="filter-control-grid" aria-label={t('customer.filters.aria')}>
        <FilterButton filterKey="region" activeFilter={activeFilter} setActiveFilter={setActiveFilter} label={t('customer.filters.region')} valueLabel={optionLabel(filters.region, t, 'customer.filters.regionOption')} icon={MapPin} isApplied={filters.region !== 'all'} />
        <FilterButton filterKey="type" activeFilter={activeFilter} setActiveFilter={setActiveFilter} label={t('customer.filters.type')} valueLabel={optionLabel(filters.type, t, 'customer.filters.typeOption')} icon={Tags} isApplied={filters.type !== 'all'} />
        <FilterButton filterKey="more" activeFilter={activeFilter} setActiveFilter={setActiveFilter} label={t('customer.filters.kicker')} valueLabel={secondaryFilterCount > 0 ? `${secondaryFilterCount}` : t('customer.filters.all')} icon={SlidersHorizontal} isApplied={secondaryFilterCount > 0} />
      </div>

      <FilterPanel
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        filters={filters}
        t={t}
        favoritesOnly={favoritesOnly}
        favoritesCount={favoritesCount}
        regionOptions={regionOptions}
        typeOptions={typeOptions}
        updateCatalogueParams={updateCatalogueParams}
        clearFilters={clearFilters}
        optionLabel={optionLabel}
      />
    </div>
  );
}

function FilterButton({
  filterKey,
  activeFilter,
  setActiveFilter,
  label,
  valueLabel,
  icon: Icon,
  isApplied,
}: {
  filterKey: string;
  activeFilter: string;
  setActiveFilter: Dispatch<SetStateAction<string>>;
  label: string;
  valueLabel: string;
  icon: LucideIcon;
  isApplied: boolean;
}) {
  const isOpen = activeFilter === filterKey;
  return (
    <button
      className={`filter-control-card ${isOpen ? 'open' : ''} ${isApplied ? 'selected' : ''}`}
      data-filter-key={filterKey}
      type="button"
      aria-expanded={isOpen}
      onClick={() => setActiveFilter(isOpen ? '' : filterKey)}
    >
      <span className="filter-card-icon">
        <Icon aria-hidden="true" />
      </span>
      <span className="filter-card-copy">
        <span>{label}</span>
        <strong>{valueLabel}</strong>
      </span>
      <ChevronDown className="filter-card-chevron" aria-hidden="true" />
    </button>
  );
}

function FilterPanel({
  activeFilter,
  setActiveFilter,
  filters,
  t,
  favoritesOnly,
  favoritesCount,
  regionOptions,
  typeOptions,
  updateCatalogueParams,
  clearFilters,
  optionLabel,
}: {
  activeFilter: string;
  setActiveFilter: Dispatch<SetStateAction<string>>;
  filters: CatalogueFilters;
  t: TFunction;
  favoritesOnly: boolean;
  favoritesCount: number;
  regionOptions: string[];
  typeOptions: string[];
  updateCatalogueParams: UpdateCatalogueParams;
  clearFilters: () => void;
  optionLabel: (value: string, t: TFunction, prefix: string) => string;
}) {
  const [priceDraft, setPriceDraft] = useState({ minPrice: filters.minPrice, maxPrice: filters.maxPrice });

  useEffect(() => {
    setPriceDraft({ minPrice: filters.minPrice, maxPrice: filters.maxPrice });
  }, [filters.minPrice, filters.maxPrice, activeFilter]);

  if (!activeFilter) return null;

  const applyValue = (key: string, value: string) => {
    updateCatalogueParams({ [key]: value }, { replace: false });
    setActiveFilter('');
  };
  const applyPrice = () => {
    updateCatalogueParams({
      minPrice: priceDraft.minPrice,
      maxPrice: priceDraft.maxPrice,
    }, { replace: false });
    setActiveFilter('');
  };
  const panelTitle = activeFilter === 'more' ? t('customer.filters.kicker') : t(`customer.filters.panel.${activeFilter}`);

  return (
    <Dialog.Root open={Boolean(activeFilter)} onOpenChange={(open: boolean) => {
      if (!open) setActiveFilter('');
    }}>
      <Dialog.Overlay className="filter-panel-scrim" />
      <Dialog.Content className="catalogue-filter-panel" aria-label={panelTitle}>
        <div className="filter-panel-head">
          <div>
            <span className="section-kicker">{t('customer.filters.kicker')}</span>
            <Dialog.Title asChild>
              <strong>{panelTitle}</strong>
            </Dialog.Title>
          </div>
          <button className="icon-button" type="button" aria-label={t('common.close')} onClick={() => setActiveFilter('')}>
            <X aria-hidden="true" />
          </button>
        </div>

        {activeFilter === 'region' ? (
          <FilterOptionList
            options={['all', ...regionOptions]}
            selected={filters.region}
            labelFor={(value) => optionLabel(value, t, 'customer.filters.regionOption')}
            onSelect={(value) => applyValue('region', value)}
          />
        ) : null}

        {activeFilter === 'type' ? (
          <FilterOptionList
            options={['all', ...typeOptions]}
            selected={filters.type}
            labelFor={(value) => optionLabel(value, t, 'customer.filters.typeOption')}
            onSelect={(value) => applyValue('type', value)}
          />
        ) : null}

        {activeFilter === 'gender' ? (
          <FilterOptionList
            options={['all', ...GENDER_OPTIONS]}
            selected={filters.gender}
            labelFor={(value) => optionLabel(value, t, 'enum.gender')}
            onSelect={(value) => applyValue('gender', value)}
          />
        ) : null}

        {activeFilter === 'sort' ? (
          <FilterOptionList
            options={SORT_OPTIONS}
            selected={filters.sort}
            labelFor={(value) => t(`customer.sort.${value}`)}
            onSelect={(value) => applyValue('sort', value)}
          />
        ) : null}

        {activeFilter === 'price' ? (
          <PriceFilterFields t={t} priceDraft={priceDraft} setPriceDraft={setPriceDraft} applyPrice={applyPrice} />
        ) : null}

        {activeFilter === 'more' ? (
          <div className="more-filter-stack">
            <button
              className={`more-filter-toggle ${favoritesOnly ? 'selected' : ''}`}
              type="button"
              aria-pressed={favoritesOnly}
              onClick={() => updateCatalogueParams({ favorites: favoritesOnly ? undefined : '1', search: '1' }, { replace: false })}
            >
              <span className="filter-card-icon">
                <Heart aria-hidden="true" fill={favoritesOnly ? 'currentColor' : 'none'} />
              </span>
              <span>
                <strong>{t('customer.filters.favorites')}</strong>
                <small>{favoritesCount}</small>
              </span>
              <span className="filter-card-state" aria-hidden="true" />
            </button>

            <section className="more-filter-section">
              <div className="more-filter-heading">
                <DollarSign aria-hidden="true" />
                <strong>{t('customer.filters.price')}</strong>
              </div>
              <PriceFilterFields t={t} priceDraft={priceDraft} setPriceDraft={setPriceDraft} applyPrice={applyPrice} />
            </section>

            <section className="more-filter-section">
              <div className="more-filter-heading">
                <Users aria-hidden="true" />
                <strong>{t('customer.filters.gender')}</strong>
              </div>
              <FilterOptionList
                options={['all', ...GENDER_OPTIONS]}
                selected={filters.gender}
                labelFor={(value) => optionLabel(value, t, 'enum.gender')}
                onSelect={(value) => applyValue('gender', value)}
              />
            </section>

            <section className="more-filter-section">
              <div className="more-filter-heading">
                <ArrowUpDown aria-hidden="true" />
                <strong>{t('customer.filters.sort')}</strong>
              </div>
              <FilterOptionList
                options={SORT_OPTIONS}
                selected={filters.sort}
                labelFor={(value) => t(`customer.sort.${value}`)}
                onSelect={(value) => applyValue('sort', value)}
              />
            </section>
          </div>
        ) : null}

        <div className="filter-panel-actions">
          <button className="text-button filter-reset-button" type="button" onClick={clearFilters}>
            <RotateCcw aria-hidden="true" />
            {t('customer.filters.clearAll')}
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}

function PriceFilterFields({
  t,
  priceDraft,
  setPriceDraft,
  applyPrice,
}: {
  t: TFunction;
  priceDraft: PriceDraft;
  setPriceDraft: Dispatch<SetStateAction<PriceDraft>>;
  applyPrice: () => void;
}) {
  return (
    <div className="price-filter-fields">
      <Field label={t('customer.filters.minPrice')}>
        <input
          type="number"
          min="0"
          value={priceDraft.minPrice}
          onChange={(event) => setPriceDraft((current) => ({ ...current, minPrice: event.target.value }))}
        />
      </Field>
      <Field label={t('customer.filters.maxPrice')}>
        <input
          type="number"
          min="0"
          value={priceDraft.maxPrice}
          onChange={(event) => setPriceDraft((current) => ({ ...current, maxPrice: event.target.value }))}
        />
      </Field>
      <button className="secondary-button full" type="button" onClick={applyPrice}>
        {t('common.apply')}
      </button>
    </div>
  );
}

function FilterOptionList({
  options,
  selected,
  labelFor,
  onSelect,
}: {
  options: readonly string[];
  selected: string;
  labelFor: (value: string) => string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="filter-option-list">
      {options.map((value) => {
        const isSelected = selected === value || (!selected && value === 'all');
        return (
          <button className={isSelected ? 'selected' : ''} type="button" key={value} aria-pressed={isSelected} onClick={() => onSelect(value)}>
            <span>{labelFor(value)}</span>
            {isSelected ? <Check aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}
