function unwrap(payload) {
  return payload?.success ? payload.data : payload;
}

async function request(path, options = {}) {
  const response = await fetch(`/api/marketplace/${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.data?.error_code || 'ERR_MARKETPLACE_REQUEST_FAILED');
    error.code = payload?.data?.error_code;
    throw error;
  }
  return unwrap(payload);
}

export function toMarketplaceCostume(costume) {
  return {
    ...costume,
    id: String(costume.id),
    price: costume.rental_fee,
    image: costume.cover_image || '/brand/kbr-marketplace-mark-mono.svg',
    availability: costume.available ? (costume.max_quantity === 1 ? 'limited' : 'available') : 'unavailable',
    maxQuantity: costume.max_quantity,
  };
}

export function toMarketplaceOrder(order) {
  const paymentStatus = order.payment_attempt?.status || 'pending';
  return {
    ...order,
    id: String(order.order_number || order.id),
    apiId: order.id,
    createdAt: order.created_at,
    eventDate: order.event_date,
    total: order.total_rental_fee,
    rentalStatus: order.status,
    paymentStatus,
    items: (order.items || []).map((item) => ({
      ...item,
      id: String(item.id || item.costume_id),
      image: item.cover_image || item.image || '/brand/kbr-marketplace-mark-mono.svg',
    })),
  };
}

export const marketplaceApi = {
  request,
  catalogue: async (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value && value !== 'all'));
    const response = await request(`costumes${query.size ? `?${query}` : ''}`);
    return { ...response, data: (response.data || []).map(toMarketplaceCostume) };
  },
  costume: async (id, eventDate) => toMarketplaceCostume(await request(`costumes/${id}${eventDate ? `?event_date=${encodeURIComponent(eventDate)}` : ''}`)),
  session: () => fetch('/api/marketplace/session').then(async (response) => {
    if (!response.ok) return null;
    return unwrap(await response.json());
  }),
  login: (data) => request('auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('auth/register', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data) => request('auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  checkout: (data) => request('checkouts', { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(data) }),
  orders: async () => {
    const response = await request('orders');
    return { ...response, data: (response.data || []).map(toMarketplaceOrder) };
  },
  order: async (id) => toMarketplaceOrder(await request(`orders/${id}`)),
  cancelOrder: (id) => request(`orders/${id}/cancel`, { method: 'POST' }),
};
