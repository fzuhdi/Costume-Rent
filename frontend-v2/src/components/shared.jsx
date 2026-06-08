import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { AlertTriangle, ArrowLeft, Bell, Check, CheckCircle, ChevronDown, Languages, Search, Truck, WalletCards, X } from 'lucide-react';
import { availabilityIcon, lifecycleIcon, lifecycleTone, paymentTone } from '../constants/ui.js';
import { availabilityTone } from '../lib/rental-utils.js';

export function DataTable({ data, columns, selectedId, getRowId, onRowClick, emptyLabel }) {
  const [sorting, setSorting] = useState([]);
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (data.length === 0) return <EmptyState title={emptyLabel} copy="" icon={Search} />;

  return (
    <div className="record-table data-table-wrap">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  <button type="button" onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </button>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr className={selectedId === row.id ? 'selected' : ''} key={row.id} onClick={() => onRowClick(row.original)}>
              {row.getVisibleCells().map((cell) => (
                <td data-label={String(cell.column.columnDef.header ?? '')} key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusPill({ type, value, t, tone, icon: ExplicitIcon }) {
  const Icon =
    ExplicitIcon ??
    (type === 'lifecycle'
      ? lifecycleIcon[value]
      : type === 'payment'
        ? WalletCards
        : type === 'fulfillment'
          ? Truck
          : type === 'availability'
            ? availabilityIcon[value] ?? CheckCircle
            : CheckCircle);
  const resolvedTone = tone ?? (type === 'lifecycle' ? lifecycleTone[value] : type === 'payment' ? paymentTone[value] : type === 'availability' ? availabilityTone(value) : 'info');
  const label =
    type === 'lifecycle'
      ? t(`enum.lifecycle.${value}`)
      : type === 'payment'
        ? t(`enum.payment.${value}`)
        : type === 'fulfillment'
          ? t(`enum.fulfillment.${value}`)
          : type === 'availability'
            ? t(`enum.availability.${value}`)
            : value;

  return (
    <span className={`status-badge ${resolvedTone}`}>
      <Icon aria-hidden="true" />
      <span className="status-badge-label">{label}</span>
    </span>
  );
}

export function SearchInput({ value, onChange, placeholder, clearLabel, className = '', as: Element = 'label' }) {
  const hasValue = String(value ?? '').length > 0;
  return (
    <Element className={`search-inline compact-search ${className}`.trim()}>
      <Search aria-hidden="true" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {hasValue ? (
        <button className="search-clear-button" type="button" aria-label={clearLabel} onClick={() => onChange('')}>
          <X aria-hidden="true" />
        </button>
      ) : null}
    </Element>
  );
}

export function SheetHeader({ kicker, title, description, descriptionId, closeLabel, className = '' }) {
  return (
    <div className={`sheet-header ${className}`.trim()}>
      <div>
        {kicker ? <span className="section-kicker">{kicker}</span> : null}
        <Dialog.Title className="sheet-title">{title}</Dialog.Title>
        {description ? <Dialog.Description id={descriptionId}>{description}</Dialog.Description> : null}
      </div>
      {closeLabel ? (
        <Dialog.Close asChild>
          <button className="icon-button" type="button" aria-label={closeLabel}>
            <X aria-hidden="true" />
          </button>
        </Dialog.Close>
      ) : null}
    </div>
  );
}

export function StepProgress({ steps, ariaLabel, className = '' }) {
  return (
    <ol className={`checkout-steps ${className}`.trim()} aria-label={ariaLabel}>
      {steps.map((step, index) => {
        const MarkerIcon = step.icon;
        const marker = step.marker ?? index + 1;
        return (
          <li className={`checkout-step ${step.className ?? ''} ${step.state ?? ''}`.trim()} key={step.key ?? step.label}>
            <span>{MarkerIcon ? <MarkerIcon aria-hidden="true" /> : marker}</span>
            <strong>{step.label}</strong>
          </li>
        );
      })}
    </ol>
  );
}

export function MobileDetailShell({ className = '', backLabel, title, onBack, actionLabel, actionClassName = '', actions, children }) {
  return (
    <div className={`mobile-detail-shell ${className}`.trim()}>
      <div className="mobile-detail-nav">
        <button className="back-list-button" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          <span>{backLabel}</span>
        </button>
        <strong>{title}</strong>
      </div>
      {children}
      {actions ? (
        <div className={`mobile-detail-actionbar ${actionClassName}`.trim()} role="group" aria-label={actionLabel}>
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function NotificationSeverityBadge({ tone = 'info', label, icon: ExplicitIcon }) {
  const Icon = ExplicitIcon ?? (tone === 'danger' ? AlertTriangle : Bell);
  return (
    <span className={`notification-severity ${tone}`}>
      <Icon aria-hidden="true" />
      {label}
    </span>
  );
}

export function NotificationRow({ as: Element = 'article', tone = 'info', resolved = false, severityLabel, severityIcon, title, copy, className = '', children, ...props }) {
  return (
    <Element className={`notification-row ${className} ${tone} ${resolved ? 'resolved' : ''}`.trim()} {...props}>
      <NotificationSeverityBadge tone={tone} label={severityLabel} icon={severityIcon} />
      <div className="notification-copy">
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
      {children}
    </Element>
  );
}

export function Field({ label, error, hint, errorId, hintId, children }) {
  return (
    <label className="field-control">
      <span>{label}</span>
      {children}
      {error ? <small className="validation-message" id={errorId}>{error}</small> : null}
      {!error && hint ? <small className="field-hint" id={hintId}>{hint}</small> : null}
    </label>
  );
}

export function PhoneField({ label, error, hint, errorId, hintId, inputProps = {}, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} errorId={errorId} hintId={hintId}>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        enterKeyHint="next"
        pattern="[0-9+()\\s-]*"
        {...props}
        {...inputProps}
      />
    </Field>
  );
}

export function SelectField({ label, value, onValueChange, options, disabled = false, placeholder, ariaLabel }) {
  const normalizedOptions = options.map((option) =>
    typeof option === 'string'
      ? { value: option, label: option }
      : option,
  );

  return (
    <div className="field-control">
      <span>{label}</span>
      <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <Select.Trigger className="select-trigger" aria-label={ariaLabel ?? label}>
          <Select.Value placeholder={placeholder} />
          <Select.Icon asChild>
            <ChevronDown className="select-trigger-icon" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="select-content" position="popper" sideOffset={4}>
            <Select.Viewport className="select-viewport">
              {normalizedOptions.map((option) => (
                <Select.Item className="select-item" value={option.value} disabled={option.disabled} key={option.value}>
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="select-item-indicator">
                    <Check aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

export function InfoBlock({ title, copy }) {
  return (
    <div className="info-block">
      <span>{title}</span>
      <strong>{copy}</strong>
    </div>
  );
}

export function Metric({ value, title, copy, to = '#admin-content', tone = 'neutral' }) {
  return (
    <Link className={`metric-card ${tone}`} to={to}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{copy}</p>
    </Link>
  );
}

export function EmptyState({ title, copy, icon: Icon }) {
  return (
    <div className="empty-state">
      <Icon aria-hidden="true" />
      <strong>{title}</strong>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}

export function LocaleButton({ locale, setLocale, t }) {
  const nextLocale = locale === 'id' ? 'en' : 'id';
  return (
    <button className="locale-button" type="button" aria-label={t(`language.switchTo.${nextLocale}`)} onClick={() => setLocale(nextLocale)}>
      <Languages aria-hidden="true" />
      <span>{t(`language.current.${locale}`)} -&gt; {t(`language.current.${nextLocale}`)}</span>
    </button>
  );
}
