export const costumes = [
  {
    id: 'tari-piring',
    name: 'Set Tari Piring Minang',
    category: 'Tari tradisional',
    region: 'Sumatera Barat',
    size: 'M-L',
    price: 185000,
    maxQuantity: 2,
    availability: 'available',
    image: '/marketplace/tari-piring.webp',
    description: 'Set lengkap bernuansa merah marun dengan detail songket emas untuk pertunjukan Tari Piring.',
    includes: ['Baju beludru', 'Kain songket', 'Ikat pinggang', 'Tengkuluk', 'Aksesori kalung'],
  },
  {
    id: 'tari-pendet',
    name: 'Set Tari Pendet Bali',
    category: 'Tari tradisional',
    region: 'Bali',
    size: 'S-M',
    price: 210000,
    maxQuantity: 1,
    availability: 'limited',
    image: '/marketplace/tari-pendet.webp',
    description: 'Busana Tari Pendet dengan perpaduan songket hijau, magenta, dan prada emas yang tampil kuat di panggung.',
    includes: ['Kemben prada', 'Kain songket', 'Selendang', 'Badong', 'Hiasan kepala'],
  },
  {
    id: 'wayang-orang',
    name: 'Set Wayang Orang Ksatria',
    category: 'Drama tari',
    region: 'Jawa Tengah',
    size: 'L-XL',
    price: 225000,
    maxQuantity: 2,
    availability: 'available',
    image: '/marketplace/wayang-orang.webp',
    description: 'Kostum ksatria berwarna biru gelap dengan bordir emas dan kain batik untuk pentas Wayang Orang.',
    includes: ['Atasan bordir', 'Kain batik', 'Sabuk', 'Sumping', 'Gelang kostum'],
  },
  {
    id: 'tari-jaipong',
    name: 'Set Tari Jaipong Biru',
    category: 'Tari tradisional',
    region: 'Jawa Barat',
    size: 'M-L',
    price: 175000,
    maxQuantity: 2,
    availability: 'available',
    image: '/marketplace/tari-jaipong.webp',
    description: 'Kebaya biru kobalt dengan detail perak dan kain batik untuk pertunjukan Jaipong yang dinamis.',
    includes: ['Kebaya', 'Kain batik', 'Selendang', 'Sabuk', 'Hiasan rambut'],
  },
];

export const featuredCategories = [
  { name: 'Tari tradisional', description: 'Busana panggung dari berbagai daerah', href: '/catalogue?category=Tari%20tradisional' },
  { name: 'Drama tari', description: 'Karakter kuat untuk pertunjukan cerita', href: '/catalogue?category=Drama%20tari' },
  { name: 'Acara sekolah', description: 'Set praktis untuk pentas dan perayaan', href: '/catalogue?use=sekolah' },
];

export const sampleOrders = [
  {
    id: 'KBR-240725-018',
    createdAt: '25 Juli 2026',
    eventDate: '17 Agustus 2026',
    pickupDate: '15 Agustus 2026',
    returnDate: '18 Agustus 2026',
    rentalStatus: 'booked',
    paymentStatus: 'paid',
    deliveryStatus: 'not_requested',
    total: 360000,
    downpayment: 180000,
    items: [
      { ...costumes[0], quantity: 1 },
      { ...costumes[3], quantity: 1 },
    ],
  },
  {
    id: 'KBR-100626-006',
    createdAt: '10 Juni 2026',
    eventDate: '28 Juni 2026',
    pickupDate: '26 Juni 2026',
    returnDate: '29 Juni 2026',
    rentalStatus: 'completed',
    paymentStatus: 'paid',
    deliveryStatus: 'confirmed',
    total: 210000,
    downpayment: 105000,
    items: [{ ...costumes[1], quantity: 1 }],
  },
];

export function getCostume(id) {
  return costumes.find((costume) => costume.id === id);
}

export function getOrder(id) {
  return sampleOrders.find((order) => order.id === id) ?? sampleOrders[0];
}
