import { NextResponse } from 'next/server';
import { encryptCustomerSession, marketplaceSessionCookie } from '@/lib/marketplace-session';

const backendURL = process.env.API_TARGET_URL || 'http://localhost:8080';
const supported = new Set(['register', 'login', 'forgot-password', 'reset-password', 'verify-email', 'resend-verification']);

export async function POST(request, { params }) {
  const { action } = await params;
  if (!supported.has(action)) return NextResponse.json({ success: false, data: { error_code: 'ERR_NOT_FOUND' } }, { status: 404 });
  const body = await request.text();
  const response = await fetch(`${backendURL}/api/marketplace/auth/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': request.headers.get('content-type') || 'application/json' },
    body,
    cache: 'no-store',
  });
  const responseBody = await response.text();
  const nextResponse = new NextResponse(responseBody, {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
  });
  if (action === 'login' && response.ok) {
    try {
      const parsed = JSON.parse(responseBody);
      const customer = parsed.data ?? parsed;
      nextResponse.cookies.set(marketplaceSessionCookie.name, encryptCustomerSession(customer), marketplaceSessionCookie.options);
    } catch {
      return NextResponse.json({ success: false, data: { error_code: 'ERR_CUSTOMER_LOGIN_RESPONSE_INVALID' } }, { status: 502 });
    }
  }
  return nextResponse;
}
