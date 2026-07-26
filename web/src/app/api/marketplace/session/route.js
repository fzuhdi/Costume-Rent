import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decryptCustomerSession, marketplaceSessionCookie } from '@/lib/marketplace-session';

export async function GET() {
  const store = await cookies();
  const customer = decryptCustomerSession(store.get(marketplaceSessionCookie.name)?.value);
  if (!customer) return NextResponse.json({ success: false, data: { error_code: 'ERR_CUSTOMER_AUTH_REQUIRED' } }, { status: 401 });
  return NextResponse.json({ success: true, data: customer });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(marketplaceSessionCookie.name, '', { ...marketplaceSessionCookie.options, maxAge: 0 });
  return response;
}
