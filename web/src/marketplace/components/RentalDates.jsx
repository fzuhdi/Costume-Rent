import { CalendarDays, PackageCheck, Undo2 } from 'lucide-react';
import { formatBusinessDate, shiftBusinessDate } from '@/marketplace/format';

export function RentalDates({ eventDate, compact = false }) {
  const dates = [
    { label: 'Ambil', value: shiftBusinessDate(eventDate, -2), icon: PackageCheck },
    { label: 'Acara', value: eventDate, icon: CalendarDays },
    { label: 'Kembali', value: shiftBusinessDate(eventDate, 1), icon: Undo2 },
  ];

  return (
    <div className={compact ? 'grid gap-3 sm:grid-cols-3' : 'grid gap-4 sm:grid-cols-3'}>
      {dates.map(({ label, value, icon: Icon }) => (
        <div key={label} className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--mk-primary-soft)] text-[var(--mk-primary)]">
            <Icon size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold text-[var(--mk-muted)]">{label}</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums">{formatBusinessDate(value)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
