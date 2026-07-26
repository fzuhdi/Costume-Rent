import { NextResponse } from 'next/server';
import { encryptCustomerSession, marketplaceSessionCookie } from '@/lib/marketplace-session';

const stateCookie = 'kbr_marketplace_google_state';

export async function GET(request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const publicUrl = process.env.MARKETPLACE_PUBLIC_URL || request.nextUrl.origin;
  if (!clientId) {
    return NextResponse.json({ success: false, data: { error_code: 'ERR_GOOGLE_AUTH_NOT_CONFIGURED' } }, { status: 503 });
  }
  const state = crypto.randomUUID();
  const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorization.searchParams.set('client_id', clientId);
  authorization.searchParams.set('redirect_uri', `${publicUrl}/api/marketplace/auth/google/callback`);
  authorization.searchParams.set('response_type', 'code');
  authorization.searchParams.set('scope', 'openid email profile');
  authorization.searchParams.set('state', state);
  const response = NextResponse.redirect(authorization);
  response.cookies.set(stateCookie, encryptCustomerSession({ state }), { ...marketplaceSessionCookie.options, maxAge: 600 });
  return response;
}
