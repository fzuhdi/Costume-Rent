export function monthKey(date) {
  return `${date.slice(0, 7)}-01`;
}

export function shiftMonth(date, delta) {
  const cursor = new Date(`${date}T00:00:00`);
  cursor.setMonth(cursor.getMonth() + delta);
  return `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-01`;
}

export function formatMonth(date, locale) {
  return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

export function buildMonthGrid(date) {
  const cursor = new Date(`${date}T00:00:00`);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: firstDay.getDay() }).map(() => null),
    ...Array.from({ length: daysInMonth }).map((_, index) => `${year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`),
  ];
}

export function getMonthRange(date) {
  const cursor = new Date(`${date}T00:00:00`);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0);
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  return { start, end };
}

export function aggregateDayAvailability(product, date, rows) {
  const variants = product.variants.map((variant) => {
    const row = rows.find((entry) => entry.variantId === variant.id);
    return row
      ? {
          variantId: variant.id,
          label: variant.label,
          total: row.total,
          booked: row.booked,
          available: row.available,
          state: row.state,
        }
      : {
          variantId: variant.id,
          label: variant.label,
          total: variant.total,
          booked: variant.held,
          available: Math.max(0, variant.total - variant.held),
          state: variant.held > 0 ? 'partially_booked' : 'available',
        };
  });
  const total = variants.reduce((sum, row) => sum + row.total, 0);
  const booked = variants.reduce((sum, row) => sum + row.booked, 0);
  const available = variants.reduce((sum, row) => sum + row.available, 0);
  const state = variants.every((variant) => variant.state === 'unavailable')
    ? 'unavailable'
    : available <= 0
      ? 'fully_booked'
      : booked > 0
        ? 'partially_booked'
        : 'available';
  return { date, productId: product.id, total, booked, available, state, variants };
}
