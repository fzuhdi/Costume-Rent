import { type ComponentPropsWithoutRef, type ElementType, type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { type ColumnDef, type SortingState, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { AlertTriangle, ArrowLeft, Bell, Check, CheckCircle, ChevronDown, Languages, Search, Truck, WalletCards, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { availabilityIcon, lifecycleIcon, lifecycleTone, paymentTone } from '../constants/ui';
import { availabilityTone } from '../lib/rental-utils';
import type { Locale, PaymentStatus, ProductAvailabilityState, RentalLifecycle, TFunction, Tone } from '../types/domain';

type DataTableProps<TData extends object> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  selectedId?: string;
  getRowId: (row: TData) => string;
  onRowClick: (row: TData) => void;
  emptyLabel: string;
};

export function DataTable<TData extends object>({ data, columns, selectedId, getRowId, onRowClick, emptyLabel }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
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

type StatusPillProps =
  | { type: 'lifecycle'; value: RentalLifecycle; t: TFunction; tone?: Tone; icon?: LucideIcon }
  | { type: 'payment'; value: PaymentStatus; t: TFunction; tone?: Tone; icon?: LucideIcon }
  | { type: 'availability'; value: ProductAvailabilityState; t: TFunction; tone?: Tone; icon?: LucideIcon }
  | { type: 'fulfillment'; value: string; t: TFunction; tone?: Tone; icon?: LucideIcon }
  | { type?: undefined; value: string; t: TFunction; tone?: Tone; icon?: LucideIcon };

export function StatusPill({ type, value, t, tone, icon: ExplicitIcon }: StatusPillProps) {
  const Icon =
    ExplicitIcon ??
    (type === 'lifecycle'
      ? lifecycleIcon[value as RentalLifecycle]
      : type === 'payment'
        ? WalletCards
        : type === 'fulfillment'
          ? Truck
          : type === 'availability'
            ? availabilityIcon[value as ProductAvailabilityState] ?? CheckCircle
            : CheckCircle);
  const resolvedTone =
    tone ??
    (type === 'lifecycle'
      ? lifecycleTone[value as RentalLifecycle]
      : type === 'payment'
        ? paymentTone[value as PaymentStatus]
        : type === 'availability'
          ? availabilityTone(value as ProductAvailabilityState)
          : 'info');
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

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearLabel: string;
  className?: string;
  as?: ElementType<{ className?: string; children?: ReactNode }>;
};

export function SearchInput({ value, onChange, placeholder, clearLabel, className = '', as: Element = 'label' }: SearchInputProps) {
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

type SheetHeaderProps = {
  kicker?: string;
  title: string;
  description?: string;
  descriptionId?: string;
  closeLabel?: string;
  className?: string;
};

export function SheetHeader({ kicker, title, description, descriptionId, closeLabel, className = '' }: SheetHeaderProps) {
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

type StepProgressItem = {
  key?: string;
  label: string;
  marker?: ReactNode;
  className?: string;
  state?: string;
  icon?: LucideIcon;
};

type StepProgressProps = {
  steps: StepProgressItem[];
  ariaLabel: string;
  className?: string;
};

export function StepProgress({ steps, ariaLabel, className = '' }: StepProgressProps) {
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

type MobileDetailShellProps = {
  className?: string;
  backLabel: string;
  title: string;
  onBack: () => void;
  actionLabel?: string;
  actionClassName?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export function MobileDetailShell({ className = '', backLabel, title, onBack, actionLabel, actionClassName = '', actions, children }: MobileDetailShellProps) {
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

type NotificationSeverityBadgeProps = {
  tone?: Tone;
  label: string;
  icon?: LucideIcon;
};

export function NotificationSeverityBadge({ tone = 'info', label, icon: ExplicitIcon }: NotificationSeverityBadgeProps) {
  const Icon = ExplicitIcon ?? (tone === 'danger' ? AlertTriangle : Bell);
  return (
    <span className={`notification-severity ${tone}`}>
      <Icon aria-hidden="true" />
      {label}
    </span>
  );
}

type NotificationRowProps = {
  as?: ElementType;
  tone?: Tone;
  resolved?: boolean;
  severityLabel: string;
  severityIcon?: LucideIcon;
  title: string;
  copy: string;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>;

export function NotificationRow({ as: Element = 'article', tone = 'info', resolved = false, severityLabel, severityIcon, title, copy, className = '', children, ...props }: NotificationRowProps) {
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

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  errorId?: string;
  hintId?: string;
  children: ReactNode;
};

export function Field({ label, error, hint, errorId, hintId, children }: FieldProps) {
  return (
    <label className="field-control">
      <span>{label}</span>
      {children}
      {error ? <small className="validation-message" id={errorId}>{error}</small> : null}
      {!error && hint ? <small className="field-hint" id={hintId}>{hint}</small> : null}
    </label>
  );
}

type PhoneFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  errorId?: string;
  hintId?: string;
  inputProps?: ComponentPropsWithoutRef<'input'>;
} & ComponentPropsWithoutRef<'input'>;

export function PhoneField({ label, error, hint, errorId, hintId, inputProps = {}, ...props }: PhoneFieldProps) {
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

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<string | SelectOption>;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
};

export function SelectField({ label, value, onValueChange, options, disabled = false, placeholder, ariaLabel }: SelectFieldProps) {
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

type InfoBlockProps = {
  title: string;
  copy: ReactNode;
};

export function InfoBlock({ title, copy }: InfoBlockProps) {
  return (
    <div className="info-block">
      <span>{title}</span>
      <strong>{copy}</strong>
    </div>
  );
}

type MetricProps = {
  value: ReactNode;
  title: string;
  copy: string;
  to?: string;
  tone?: Tone;
};

export function Metric({ value, title, copy, to = '#admin-content', tone = 'neutral' }: MetricProps) {
  return (
    <Link className={`metric-card ${tone}`} to={to}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{copy}</p>
    </Link>
  );
}

type EmptyStateProps = {
  title: string;
  copy?: string;
  icon: LucideIcon;
};

export function EmptyState({ title, copy, icon: Icon }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon aria-hidden="true" />
      <strong>{title}</strong>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}

type LocaleButtonProps = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
};

export function LocaleButton({ locale, setLocale, t }: LocaleButtonProps) {
  const nextLocale = locale === 'id' ? 'en' : 'id';
  return (
    <button className="locale-button" type="button" aria-label={t(`language.switchTo.${nextLocale}`)} onClick={() => setLocale(nextLocale)}>
      <Languages aria-hidden="true" />
      <span>{t(`language.current.${locale}`)} -&gt; {t(`language.current.${nextLocale}`)}</span>
    </button>
  );
}
