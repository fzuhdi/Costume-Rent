import melayuImage from '../assets/baju_melayu.jpg';
import batikImage from '../assets/kebaya_bali.jpg';
import songketImage from '../assets/selendang_songket.jpg';
import topengImage from '../assets/topeng_bali.jpg';
import { contentSource, toSourceContent } from './lib/rental-utils';
import type { Client, HomeArticle, HomeContent, HomeTestimonial, LocalizedContent, Notification, Product, Rental, Settings } from './types/domain';

export const defaultDates = {
  start: '2026-06-12',
  end: '2026-06-15',
};

const sourceContent = (source: string, translations: Record<string, string> = {}): Exclude<LocalizedContent, string> => ({
  sourceLocale: 'id',
  source,
  translations,
});

export const defaultHomeContent: HomeContent = {
  heroImageUrl: '',
  heroImageAlt: sourceContent(''),
  heroKicker: sourceContent('Sewa kostum butik'),
  heroTitle: sourceContent('Costume Rental'),
  heroCopy: sourceContent('Katalog kostum adat, tari, dan aksesori dengan tanggal sewa yang jelas sebelum pelanggan membuat pesanan.'),
  catalogueKicker: sourceContent('Mulai dari tanggal'),
  catalogueTitle: sourceContent('Cek stok berdasarkan periode sewa.'),
  catalogueCopy: sourceContent('Pilih tanggal mulai dan tanggal kembali agar hasil katalog, detail produk, keranjang, dan checkout memakai periode sewa yang sama.'),
  articlesKicker: sourceContent('Panduan sewa'),
  articlesTitle: sourceContent('Catatan singkat sebelum memilih kostum'),
  testimonialsKicker: sourceContent('Pengalaman pelanggan'),
  testimonialsTitle: sourceContent('Pesanan tetap ditinjau staf sebelum sewa final'),
  locationTitle: sourceContent('Datangi Butik Kami'),
  locationAddress: sourceContent('Jl. Melati 12, Denpasar, Bali'),
  locationMapEmbed: 'https://www.google.com/maps?q=Jl.%20Melati%2012%2C%20Denpasar%2C%20Bali&output=embed',
  locationMapUrl: 'https://www.google.com/maps/search/?api=1&query=Jl.%20Melati%2012%2C%20Denpasar%2C%20Bali',
  articles: [
    {
      label: sourceContent('Ukuran'),
      title: sourceContent('Pilih ukuran dari varian yang benar-benar tersedia.'),
      copy: sourceContent('Staf tetap mengecek ukuran, tapi memilih varian sejak awal membantu stok tidak tertahan di item yang salah.'),
    },
    {
      label: sourceContent('Acara'),
      title: sourceContent('Sesuaikan paket dengan acara dan durasi.'),
      copy: sourceContent('Kostum formal, tari, dan aksesori punya isi paket berbeda. Gunakan catatan checkout untuk detail acara.'),
    },
    {
      label: sourceContent('Kondisi'),
      title: sourceContent('Blok perawatan terlihat sebelum pesanan dikirim.'),
      copy: sourceContent('Katalog menyaring item yang sedang dibersihkan atau diperbaiki pada tanggal pilihan.'),
    },
  ],
  testimonials: [
    {
      quote: sourceContent('Tanggal dan ukuran terlihat jelas, lalu staf cepat mengonfirmasi sebelum acara sekolah.'),
      name: sourceContent('Maya, acara sekolah'),
      photoUrl: '',
    },
    {
      quote: sourceContent('Saya bisa pilih pengantaran dan menulis catatan lokasi aula tanpa membuat akun.'),
      name: sourceContent('Dimas, pentas budaya'),
      photoUrl: '',
    },
    {
      quote: sourceContent('Aksesori tari mudah disaring, dan stok penuh tidak masuk ke pesanan saya.'),
      name: sourceContent('Rina, sanggar tari'),
      photoUrl: '',
    },
  ],
};

type HomeContentTextField =
  | 'heroKicker'
  | 'heroTitle'
  | 'heroCopy'
  | 'catalogueKicker'
  | 'catalogueTitle'
  | 'catalogueCopy'
  | 'articlesKicker'
  | 'articlesTitle'
  | 'testimonialsKicker'
  | 'testimonialsTitle'
  | 'locationTitle'
  | 'locationAddress';

const homeFields: HomeContentTextField[] = [
  'heroKicker',
  'heroTitle',
  'heroCopy',
  'catalogueKicker',
  'catalogueTitle',
  'catalogueCopy',
  'articlesKicker',
  'articlesTitle',
  'testimonialsKicker',
  'testimonialsTitle',
  'locationTitle',
  'locationAddress',
];

const articleFields: Array<keyof Pick<HomeArticle, 'label' | 'title' | 'copy'>> = ['label', 'title', 'copy'];
const testimonialFields: Array<keyof Pick<HomeTestimonial, 'quote' | 'name'>> = ['quote', 'name'];

export function normalizeHomeContent(content: Partial<HomeContent> | Record<string, unknown> = {}): HomeContent {
  const current = content && typeof content === 'object' ? content : {};
  const fallback = defaultHomeContent as unknown as Record<string, unknown>;
  const normalizedHomeFields = homeFields.reduce<Record<HomeContentTextField, LocalizedContent>>((result, field) => ({
    ...result,
    [field]: normalizeContentField(current, fallback, field),
  }), {} as Record<HomeContentTextField, LocalizedContent>);

  return {
    heroImageUrl: typeof current.heroImageUrl === 'string' ? current.heroImageUrl : defaultHomeContent.heroImageUrl,
    heroImageAlt: normalizeContentField(current, fallback, 'heroImageAlt'),
    ...normalizedHomeFields,
    locationMapEmbed: typeof current.locationMapEmbed === 'string' ? current.locationMapEmbed : defaultHomeContent.locationMapEmbed,
    locationMapUrl: typeof current.locationMapUrl === 'string' ? current.locationMapUrl : defaultHomeContent.locationMapUrl,
    articles: normalizeContentList<HomeArticle>(current.articles, defaultHomeContent.articles, articleFields),
    testimonials: normalizeContentList<HomeTestimonial>(current.testimonials, defaultHomeContent.testimonials, testimonialFields, ['photoUrl']),
  };
}

function normalizeContentList<T extends object>(
  listValue: unknown,
  fallbackList: T[],
  fields: Array<string | number | symbol>,
  stringFields: string[] = [],
): T[] {
  const list = Array.isArray(listValue) ? listValue : [];
  const count = Math.max(fallbackList.length, list.length);
  return Array.from({ length: count }).map((_, index) => {
    const current = (list[index] ?? {}) as Record<string, unknown>;
    const fallback = (fallbackList[index] ?? {}) as Record<string, unknown>;
    const contentFields = fields.reduce<Record<string, unknown>>((result, field) => ({
      ...result,
      [String(field)]: normalizeContentField(current, fallback, String(field)),
    }), {});
    return stringFields.reduce((result, field) => ({
      ...result,
      [field]: typeof current[field] === 'string' ? current[field] : fallback[field] ?? '',
    }), contentFields) as T;
  });
}

function normalizeContentField(current: Record<string, unknown>, fallback: Record<string, unknown>, field: string) {
  return toSourceContent(
    current?.[field],
    firstHomeText(current?.[`${field}Id`], current?.[`${field}En`], contentSource(fallback?.[field])),
  );
}

function firstHomeText(...values: unknown[]) {
  const value = values.find((entry) => String(entry ?? '').trim());
  return String(value ?? '').trim();
}

export const initialSettings: Settings = {
  brandName: 'Costume Rental',
  customerTaglineKey: 'brand.customerTagline',
  staffTaglineKey: 'brand.adminTagline',
  customerTaglineCustom: '',
  staffTaglineCustom: '',
  defaultLocale: 'id',
  policyKey: 'admin.settings.defaultPolicy',
  policy: '',
  publicCatalogue: true,
  requireVerifiedProof: true,
  homeContent: defaultHomeContent,
};

export const initialProducts: Product[] = [
  {
    id: 'batik',
    image: batikImage,
    category: 'formal',
    region: 'bali',
    gender: 'men',
    active: true,
    name: 'Batik Pria Premium',
    meta: 'Adat formal - Pria',
    unitKey: 'customer.product.unitSet',
    alt: 'Batik pria motif cokelat untuk sewa',
    price: 220000,
    availability: 'available',
    description: sourceContent('Atasan batik, celana gelap opsional, hanger pelindung.'),
    variants: [
      { id: 'S', label: 'S', total: 1, held: 1, notes: sourceContent('S: dada 90-94 cm, panjang 70 cm.') },
      { id: 'M', label: 'M', total: 4, held: 1, notes: sourceContent('M: dada 96-100 cm, panjang 72 cm.') },
      { id: 'L', label: 'L', total: 3, held: 0, notes: sourceContent('L: dada 102-106 cm, panjang 74 cm.') },
      { id: 'XL', label: 'XL', total: 1, held: 1, notes: sourceContent('XL: dada 108-112 cm, panjang 76 cm.') },
    ],
    maintenanceBlocks: [],
  },
  {
    id: 'melayu',
    image: melayuImage,
    category: 'formal',
    region: 'melayu',
    gender: 'men',
    active: true,
    name: 'Baju Melayu Pria',
    meta: 'Melayu - Pria',
    unitKey: 'customer.product.unitSet',
    alt: 'Baju Melayu pria lengkap dengan kain',
    price: 150000,
    availability: 'limited',
    description: sourceContent('Baju, celana, kain, dan kopiah sesuai stok.'),
    variants: [
      { id: 'M', label: 'M', total: 2, held: 1, notes: sourceContent('M: lingkar dada 98-102 cm, kain pinggang adjustable.') },
      { id: 'L', label: 'L', total: 3, held: 2, notes: sourceContent('L: lingkar dada 104-108 cm, kain pinggang adjustable.') },
      { id: 'XL', label: 'XL', total: 1, held: 1, notes: sourceContent('XL: lingkar dada 110-114 cm, stok terbatas.') },
    ],
    maintenanceBlocks: [],
  },
  {
    id: 'songket',
    image: songketImage,
    category: 'accessory',
    region: 'songket',
    gender: 'unisex',
    active: true,
    name: 'Selendang Songket',
    meta: 'Aksesori - Songket',
    unitKey: 'customer.product.unitPack',
    alt: 'Selendang songket biru dengan motif emas',
    price: 55000,
    availability: 'available',
    description: sourceContent('Selendang songket dan pin cadangan.'),
    variants: [{ id: 'package', label: 'package', total: 8, held: 1, notes: sourceContent('Paket aksesori standar untuk dewasa dan remaja.') }],
    maintenanceBlocks: [],
  },
  {
    id: 'topeng',
    image: topengImage,
    category: 'accessory',
    region: 'bali',
    gender: 'unisex',
    active: true,
    name: 'Topeng Bali',
    meta: 'Bali - Aksesori',
    unitKey: 'customer.product.unitPack',
    alt: 'Koleksi topeng Bali untuk aksesori panggung',
    price: 80000,
    availability: 'full',
    description: sourceContent('Topeng, sarung kain, dan kotak pelindung.'),
    variants: [{ id: 'package', label: 'package', total: 2, held: 2, notes: sourceContent('Paket topeng panggung ukuran campuran; staf mengecek kondisi cat sebelum ambil.') }],
    maintenanceBlocks: [{ start: '2026-06-12', end: '2026-06-16', reason: 'Perawatan cat' }],
  },
  {
    id: 'kebaya',
    image: batikImage,
    category: 'formal',
    region: 'bali',
    gender: 'women',
    active: true,
    name: 'Kebaya Bali',
    meta: 'Bali - Wanita',
    unitKey: 'customer.product.unitSet',
    alt: 'Kebaya Bali warna hangat untuk sewa',
    price: 260000,
    availability: 'available',
    description: sourceContent('Kebaya, kamen, selendang, dan bros sesuai stok.'),
    variants: [
      { id: 'S', label: 'S', total: 2, held: 0, notes: sourceContent('S: kebaya ramping, kamen pinggang adjustable.') },
      { id: 'M', label: 'M', total: 3, held: 1, notes: sourceContent('M: kebaya reguler, bros mengikuti stok.') },
      { id: 'L', label: 'L', total: 2, held: 0, notes: sourceContent('L: kebaya longgar, selendang bisa diganti warna.') },
    ],
    maintenanceBlocks: [],
  },
  {
    id: 'tari-bali',
    image: topengImage,
    category: 'formal',
    region: 'bali',
    gender: 'kids',
    active: true,
    name: 'Kostum Tari Bali Anak',
    meta: 'Bali - Anak',
    unitKey: 'customer.product.unitSet',
    alt: 'Kostum tari Bali anak dengan aksesori panggung',
    price: 180000,
    availability: 'available',
    description: sourceContent('Atasan tari, rok, sabuk, dan aksesori kepala.'),
    variants: [
      { id: '6-8', label: '6-8', total: 2, held: 0, notes: sourceContent('Untuk anak 6-8 tahun; sabuk dan rok adjustable.') },
      { id: '9-10', label: '9-10', total: 2, held: 1, notes: sourceContent('Untuk anak 9-10 tahun; aksesori kepala perlu dicek saat ambil.') },
    ],
    maintenanceBlocks: [],
  },
  {
    id: 'beskap',
    image: melayuImage,
    category: 'formal',
    region: 'jawa',
    gender: 'men',
    active: true,
    name: 'Beskap Jawa',
    meta: 'Jawa - Pria',
    unitKey: 'customer.product.unitSet',
    alt: 'Beskap Jawa pria untuk acara formal',
    price: 240000,
    availability: 'available',
    description: sourceContent('Beskap, jarik, blangkon, dan hanger pelindung.'),
    variants: [
      { id: 'M', label: 'M', total: 2, held: 0, notes: sourceContent('M: dada 98-102 cm, jarik adjustable.') },
      { id: 'L', label: 'L', total: 2, held: 0, notes: sourceContent('L: dada 104-108 cm, blangkon mengikuti stok.') },
    ],
    maintenanceBlocks: [],
  },
  {
    id: 'aksesoris-tari',
    image: songketImage,
    category: 'accessory',
    region: 'dance',
    gender: 'unisex',
    active: true,
    name: 'Paket Aksesori Tari',
    meta: 'Tari - Aksesori',
    unitKey: 'customer.product.unitPack',
    alt: 'Paket aksesori tari dengan selendang dan gelang',
    price: 95000,
    availability: 'available',
    description: sourceContent('Mahkota kecil, gelang, dan selendang cadangan.'),
    variants: [{ id: 'package', label: 'package', total: 5, held: 0, notes: sourceContent('Paket aksesori panggung dewasa/remaja; warna cadangan mengikuti stok.') }],
    maintenanceBlocks: [],
  },
];

export const initialRentals: Rental[] = [
  {
    reference: 'CR-0142',
    customerName: 'Maya Saputra',
    phone: '+62 812 0000 0142',
    email: 'maya@example.com',
    lifecycle: 'requested',
    paymentStatus: 'missing',
    paymentMethod: 'bank_transfer',
    fulfillment: 'pickup',
    start: '2026-06-12',
    end: '2026-06-15',
    pickupWindow: '10.00-12.00',
    returnWindow: '16.00-18.00',
    deliveryWindow: '',
    address: '',
    notes: 'Butuh ukuran nyaman untuk acara sekolah.',
    internalNotes: 'Konfirmasi ulang ukuran M sebelum diterima.',
    staleHours: 26,
    deliveryFee: 0,
    deliveryNotes: '',
    items: [
      { productId: 'batik', variantId: 'M', qty: 1 },
      { productId: 'melayu', variantId: 'L', qty: 1 },
    ],
    checklist: [
      { id: 'washed', labelId: 'Dicuci dan disetrika', labelEn: 'Washed and ironed', done: true },
      { id: 'packed', labelId: 'Dikemas', labelEn: 'Packed', done: false },
      { id: 'photo', labelId: 'Foto kondisi awal', labelEn: 'Initial condition photo', done: false },
    ],
    activity: [
      { id: 'a1', time: '27 Mei 2026 09.20', textId: 'Pesanan masuk dari katalog publik.', textEn: 'Order created from public catalogue.' },
      { id: 'a2', time: '27 Mei 2026 10.05', textId: 'Stok varian M ditahan sementara.', textEn: 'Size M inventory held temporarily.' },
    ],
  },
  {
    reference: 'CR-0143',
    customerName: 'Dimas Aditya',
    phone: '+62 812 0000 0143',
    email: '',
    lifecycle: 'preparing',
    paymentStatus: 'attached',
    paymentMethod: 'qris',
    fulfillment: 'delivery',
    start: '2026-06-14',
    end: '2026-06-16',
    pickupWindow: '',
    returnWindow: '15.00-17.00',
    deliveryWindow: '09.00-11.00',
    address: 'Jl. Melati 12, Denpasar',
    notes: 'Antar ke aula sekolah.',
    internalNotes: 'Fee antar belum final.',
    staleHours: 2,
    deliveryFee: 35000,
    deliveryNotes: 'Gosend instant, driver dikabari setelah siap.',
    items: [{ productId: 'songket', variantId: 'package', qty: 1 }],
    checklist: [
      { id: 'washed', labelId: 'Dicek benang lepas', labelEn: 'Loose threads checked', done: true },
      { id: 'packed', labelId: 'Dikemas', labelEn: 'Packed', done: true },
      { id: 'photo', labelId: 'Foto kondisi awal', labelEn: 'Initial condition photo', done: false },
    ],
    activity: [
      { id: 'a3', time: '27 Mei 2026 11.15', textId: 'Bukti bayar diunggah staf.', textEn: 'Payment proof uploaded by staff.' },
    ],
  },
  {
    reference: 'CR-0144',
    customerName: 'Rani Wibowo',
    phone: '+62 812 0000 0144',
    email: 'rani@example.com',
    lifecycle: 'returned',
    paymentStatus: 'rejected',
    paymentMethod: 'cash',
    fulfillment: 'delivery',
    start: '2026-06-17',
    end: '2026-06-18',
    pickupWindow: '',
    returnWindow: '13.00-15.00',
    deliveryWindow: '08.00-10.00',
    address: 'Jl. Kenanga 9, Denpasar Selatan',
    notes: 'Sudah kembali fisik, pembayaran belum beres.',
    internalNotes: 'Bukti tunai ditolak karena nominal kurang.',
    staleHours: 0,
    deliveryFee: 25000,
    deliveryNotes: 'Manual delivery by staff.',
    items: [{ productId: 'topeng', variantId: 'package', qty: 1 }],
    checklist: [
      { id: 'washed', labelId: 'Kondisi dicek', labelEn: 'Condition checked', done: true },
      { id: 'packed', labelId: 'Disimpan kembali', labelEn: 'Stored back', done: true },
    ],
    activity: [
      { id: 'a4', time: '26 Mei 2026 15.10', textId: 'Barang ditandai kembali.', textEn: 'Items marked returned.' },
      { id: 'a5', time: '26 Mei 2026 15.25', textId: 'Bukti bayar ditolak.', textEn: 'Payment proof rejected.' },
    ],
  },
  {
    reference: 'CR-0145',
    customerName: 'Nadia Putri',
    phone: '+62 812 0000 0145',
    email: '',
    lifecycle: 'completed',
    paymentStatus: 'verified',
    paymentMethod: 'bank_transfer',
    fulfillment: 'pickup',
    start: '2026-05-20',
    end: '2026-05-22',
    pickupWindow: '11.00-13.00',
    returnWindow: '14.00-16.00',
    deliveryWindow: '',
    address: '',
    notes: 'Sewa selesai.',
    internalNotes: 'Locked. Override admin wajib alasan.',
    staleHours: 0,
    deliveryFee: 0,
    deliveryNotes: '',
    items: [{ productId: 'batik', variantId: 'L', qty: 1 }],
    checklist: [{ id: 'closed', labelId: 'Selesai dan dikunci', labelEn: 'Completed and locked', done: true }],
    activity: [
      { id: 'a6', time: '22 Mei 2026 16.30', textId: 'Sewa selesai dan dikunci.', textEn: 'Rental completed and locked.' },
    ],
  },
];

export const initialClients: Client[] = [
  {
    id: 'client-maya',
    name: 'Maya Saputra',
    phone: '+62 812 0000 0142',
    email: 'maya@example.com',
    totalRentals: 3,
    lastContact: '27 Mei 2026',
    notes: 'Sering sewa untuk acara sekolah.',
  },
  {
    id: 'client-dimas',
    name: 'Dimas Aditya',
    phone: '+62 812 0000 0143',
    email: '',
    totalRentals: 1,
    lastContact: '27 Mei 2026',
    notes: 'Prefer delivery pagi.',
  },
  {
    id: 'client-rani',
    name: 'Rani Wibowo',
    phone: '+62 812 0000 0144',
    email: 'rani@example.com',
    totalRentals: 5,
    lastContact: '26 Mei 2026',
    notes: 'Perlu follow-up pembayaran.',
  },
];

export const initialNotifications: Notification[] = [
  {
    id: 'n1',
    tone: 'danger',
    titleId: 'Bukti bayar ditolak',
    titleEn: 'Payment proof rejected',
    copyId: 'CR-0144 belum bisa diselesaikan.',
    copyEn: 'CR-0144 cannot be completed yet.',
    targetRoute: '/admin/rentals?reference=CR-0144',
  },
  {
    id: 'n2',
    tone: 'warning',
    titleId: '2 pesanan tertahan',
    titleEn: '2 stale orders',
    copyId: 'Pesanan lebih dari 1 hari masih menahan stok.',
    copyEn: 'Orders older than 1 day still hold stock.',
    targetRoute: '/admin/requests?tab=stale',
  },
  {
    id: 'n3',
    tone: 'info',
    titleId: '3 jadwal antar',
    titleEn: '3 delivery schedules',
    copyId: 'Cek fee dan jadwal sebelum barang keluar.',
    copyEn: 'Check fees and schedule before release.',
    targetRoute: '/admin/rentals',
  },
];
