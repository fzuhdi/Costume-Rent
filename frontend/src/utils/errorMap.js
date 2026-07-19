export const errorMessages = {
  ERR_USER_NOT_FOUND: 'Pengguna tidak ditemukan',
  ERR_INVALID_OLD_PASSWORD: 'Password lama tidak sesuai',
  ERR_DUPLICATE_REGION: 'Gagal: Regional sudah ada',
  ERR_DUPLICATE_CATEGORY: 'Gagal: Kategori sudah ada',
  ERR_EXCEL_EMPTY: 'Gagal: File kosong atau format header tidak valid',
  ERR_INVALID_DATE: 'Format tanggal tidak valid',
  ERR_PAYMENT_REQUIRED: 'Pembayaran diperlukan untuk status booked',
  ERR_PAYMENT_PROOF_REQUIRED: 'Bukti pembayaran wajib diunggah untuk pemesanan (booked)',
  ERR_MIN_DOWNPAYMENT: 'Uang muka minimal 50% dari total harga sewa dasar',
  ERR_INVALID_STATUS_RECEIVE: 'Hanya pesanan berstatus disewakan atau terlambat yang bisa diterima',
  ERR_INVALID_STATUS_COMPLETE: 'Hanya pesanan berstatus kembali, disewakan, atau terlambat yang bisa diselesaikan',
  ERR_INVALID_STATUS_RENT: 'Hanya pesanan berstatus booked yang bisa diubah menjadi disewakan',
  ERR_FULL_PAYMENT_PROOF_REQUIRED: 'Bukti pelunasan pembayaran wajib diunggah untuk mengambil kostum',
  ERR_FULL_PAYMENT_REQUIRED: 'Pelunasan pembayaran diperlukan untuk mengambil kostum',
  ERR_INVALID_STATUS_ROLLBACK: 'Hanya pesanan berstatus disewakan, kembali, diinspeksi, atau selesai yang dapat dibatalkan statusnya',
  ERR_INVALID_STATUS_UPGRADE: 'Hanya pesanan berstatus pending yang dapat diubah ke booked',
  ERR_PAYMENT_REQUIRED_UPGRADE: 'Pembayaran diperlukan untuk mengubah status menjadi booked',
  ERR_DP_PROOF_REQUIRED: 'Bukti pembayaran DP wajib diunggah',
  ERR_INVALID_STATUS_CANCEL: 'Hanya pesanan booked yang dapat dibatalkan',
  ERR_INVALID_STATUS_EXTEND: 'Hanya pesanan berstatus disewakan yang dapat diperpanjang',
  ERR_RENT_NOT_FOUND: 'Pesanan sewa tidak ditemukan',
  ERR_BAD_REQUEST: 'Permintaan tidak valid',
  ERR_INVALID_ID: 'ID tidak valid',
  ERR_INVALID_CREDENTIALS: 'Username atau password tidak sesuai',
  ERR_USER_EXISTS: 'Username atau email sudah digunakan',
  ERR_CLIENT_NOT_FOUND: 'Klien tidak ditemukan',
  ERR_INTERNAL: 'Terjadi kesalahan sistem'
};

export const getErrorMessage = (errorResponse) => {
  const payload = errorResponse.response?.data;
  if (!payload) {
    return errorResponse?.message || 'Terjadi kesalahan jaringan atau server tidak merespons';
  }

  const errorData = payload.data || payload;
  const code = errorData.error_code;
  const meta = errorData.meta;

  // Handle dynamic error mapping for codes that require metadata
  if (code === 'ERR_COSTUME_NOT_FOUND') {
    return 'Kostum tidak ditemukan' + (meta?.costume_id ? ` (ID: ${meta.costume_id})` : '');
  }
  if (code === 'ERR_INSUFFICIENT_STOCK') {
    let msg = 'Stok kostum tidak mencukupi' + (meta?.costume_id ? ` (ID: ${meta.costume_id})` : '');
    if (meta?.requested !== undefined && meta?.available !== undefined) {
      msg += `. Diminta: ${meta.requested}, Tersedia: ${meta.available}`;
    }
    return msg;
  }
  if (code === 'ERR_UNAVAILABLE_DATE') {
    return 'Kostum tidak tersedia pada tanggal tersebut' + (meta?.costume_id ? ` (ID: ${meta.costume_id})` : '');
  }
  if (code === 'ERR_UNAVAILABLE_EXTENSION') {
    return 'Kostum tidak dapat diperpanjang' + (meta?.costume_id ? ` (ID: ${meta.costume_id})` : '');
  }

  // Fallback to mapped static message
  if (code && errorMessages[code]) {
    return errorMessages[code];
  }

  // Fallback to any string message provided by the backend (like for generic errors)
  return errorResponse.response.data?.error || 'Terjadi kesalahan sistem';
};
