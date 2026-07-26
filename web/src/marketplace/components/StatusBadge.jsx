import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const successStyle = 'border-transparent bg-[var(--mk-success-soft)] text-[var(--mk-success)]';
const statusStyles = new Map([
  ['available', successStyle],
  ['limited', 'border-transparent bg-[var(--mk-warning-soft)] text-[var(--mk-warning)]'],
  ['booked', successStyle],
  ['completed', successStyle],
  ['paid', successStyle],
  ['pending', 'border-transparent bg-[var(--mk-warning-soft)] text-[var(--mk-warning)]'],
  ['failed', 'border-transparent bg-[var(--mk-danger-soft)] text-[var(--mk-danger)]'],
  ['confirmed', 'border-transparent bg-[var(--mk-info-soft)] text-[var(--mk-info)]'],
  ['not_requested', 'border-[var(--mk-line-strong)] bg-transparent text-[var(--mk-muted)]'],
]);

const statusLabels = new Map([
  ['available', 'Tersedia'],
  ['limited', 'Stok online terbatas'],
  ['booked', 'Sudah dipesan'],
  ['completed', 'Selesai'],
  ['paid', 'DP terbayar'],
  ['pending', 'Menunggu pembayaran'],
  ['failed', 'Pembayaran gagal'],
  ['confirmed', 'Pengantaran dikonfirmasi'],
  ['not_requested', 'Ambil di toko'],
]);

export function StatusBadge({ status, label, className }) {
  return (
    <Badge className={cn('rounded-lg px-2.5 py-1 font-semibold', statusStyles.get(status), className)}>
      {label ?? statusLabels.get(status) ?? status}
    </Badge>
  );
}
