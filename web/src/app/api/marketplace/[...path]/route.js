import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createMarketplaceAssertion, decryptCustomerSession, marketplaceSessionCookie } from '@/lib/marketplace-session';

const backendURL = process.env.API_TARGET_URL || 'http://localhost:8080';

async function proxy(request, context) {
  const { path } = await context.params;
  const pathname = path.join('/');
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const idempotencyKey = request.headers.get('idempotency-key');
  if (contentType) headers.set('content-type', contentType);
  if (idempotencyKey) headers.set('idempotency-key', idempotencyKey);

  const protectedPath = pathname.startsWith('checkouts') || pathname.startsWith('orders');
  if (protectedPath) {
    const store = await cookies();
    const customer = decryptCustomerSession(store.get(marketplaceSessionCookie.name)?.value);
    if (!customer) return NextResponse.json({ success: false, data: { error_code: 'ERR_CUSTOMER_AUTH_REQUIRED' } }, { status: 401 });
    headers.set('authorization', `Bearer ${createMarketplaceAssertion(customer)}`);
  }

  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
  const response = await fetch(`${backendURL}/api/marketplace/${pathname}${request.nextUrl.search}`, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
  });
  return new NextResponse(await response.arrayBuffer(), {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
  });
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
