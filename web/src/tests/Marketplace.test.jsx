import { describe, expect, it } from 'vitest';
import { costumes, getCostume, getOrder } from '../marketplace/data';
import { formatBusinessDate, formatRupiah, shiftBusinessDate } from '../marketplace/format';

describe('marketplace rental calculations', () => {
  it('formats integer Rental Fees as Indonesian Rupiah', () => {
    expect(formatRupiah(185000)).toBe('Rp 185.000');
  });

  it('derives pickup and return from one Event Date', () => {
    expect(shiftBusinessDate('2026-08-17', -2)).toBe('2026-08-15');
    expect(shiftBusinessDate('2026-08-17', 1)).toBe('2026-08-18');
    expect(formatBusinessDate('2026-08-17')).toBe('17 Agustus 2026');
  });
});

describe('marketplace-safe sample data', () => {
  it('exposes only the online quantity cap on catalogue items', () => {
    expect(costumes.every((costume) => costume.maxQuantity <= 2)).toBe(true);
    expect(costumes.some((costume) => 'totalQuantity' in costume)).toBe(false);
    expect(costumes.some((costume) => 'acquiredAt' in costume)).toBe(false);
    expect(costumes.some((costume) => 'buyPrice' in costume)).toBe(false);
  });

  it('resolves costume and customer order detail routes', () => {
    expect(getCostume('tari-piring')?.name).toBe('Set Tari Piring Minang');
    expect(getOrder('KBR-240725-018').paymentStatus).toBe('paid');
  });
});
