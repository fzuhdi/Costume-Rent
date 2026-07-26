import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuantityStepper({ value, max, onChange, label = 'Jumlah kostum' }) {
  return (
    <div className="inline-flex h-11 items-center rounded-xl border border-[var(--mk-line-strong)] bg-[var(--mk-surface)]" aria-label={label}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 rounded-xl"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Kurangi jumlah"
      >
        <Minus aria-hidden="true" />
      </Button>
      <span className="w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 rounded-xl"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Tambah jumlah"
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
