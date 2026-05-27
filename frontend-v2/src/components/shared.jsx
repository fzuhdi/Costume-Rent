import { useState } from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { CheckCircle, Languages, Search, Truck, WalletCards } from 'lucide-react';
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
      {label}
    </span>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="field-control">
      <span>{label}</span>
      {children}
      {error ? <small className="validation-message">{error}</small> : null}
    </label>
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

export function Metric({ value, title, copy }) {
  return (
    <a href="#admin-content">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{copy}</p>
    </a>
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
      <span>{t(`language.current.${locale}`)}</span>
    </button>
  );
}
