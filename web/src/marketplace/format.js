const jakartaDate = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function formatRupiah(value) {
  return rupiah.format(value);
}

export function formatBusinessDate(dateValue) {
  if (!dateValue) return 'Pilih tanggal';
  const date = new Date(`${dateValue}T12:00:00+07:00`);
  return jakartaDate.format(date);
}

export function shiftBusinessDate(dateValue, dayOffset) {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T12:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

export function defaultEventDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}
