import { Search } from 'lucide-react';

export function RentalSearchPanel({
  as: Element = 'div',
  className = 'search-panel',
  ariaLabel,
  t,
  query,
  onQueryChange,
  dates,
  onDatesChange,
  onSubmit,
  submitLabel,
  buttonType,
  children,
  periodSummary,
  error,
}) {
  const resolvedButtonType = buttonType ?? (Element === 'form' ? 'submit' : 'button');
  const submitProps = Element === 'form' ? { onSubmit } : {};
  const buttonProps = resolvedButtonType === 'submit' ? {} : { onClick: onSubmit };

  return (
    <Element className={className} aria-label={ariaLabel} {...submitProps}>
      {children}
      <label className="search-field search-query">
        <span>{t('customer.search.queryLabel')}</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('customer.search.queryValue')}
          type="search"
        />
      </label>
      <label className="search-field">
        <span>{t('customer.search.startLabel')}</span>
        <input value={dates.start} onChange={(event) => onDatesChange({ ...dates, start: event.target.value })} type="date" />
      </label>
      <label className="search-field">
        <span>{t('customer.search.endLabel')}</span>
        <input value={dates.end} onChange={(event) => onDatesChange({ ...dates, end: event.target.value })} type="date" />
      </label>
      {periodSummary ? <p className="home-search-period">{periodSummary}</p> : null}
      <button className="primary-button" type={resolvedButtonType} {...buttonProps}>
        <Search aria-hidden="true" />
        {submitLabel}
      </button>
      {error ? <p className="validation-message">{error}</p> : null}
    </Element>
  );
}
