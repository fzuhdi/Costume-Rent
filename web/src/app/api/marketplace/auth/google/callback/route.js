import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decryptCustomerSession, encryptCustomerSession, marketplaceSessionCookie } from '@/lib/marketplace-session';

const stateCookie = 'kbr_marketplace_google_state';

export async function GET(request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const publicUrl = process.env.MARKETPLACE_PUBLIC_URL || request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const stored = decryptCustomerSession((await cookies()).get(stateCookie)?.value);
  if (!clientId || !clientSecret || !code || !stored || stored.state !== state) {
    return NextResponse.redirect(new URL('/masuk?error=google', publicUrl));
  }
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: `${publicUrl}/api/marketplace/auth/google/callback`, grant_type: 'authorization_code' }),
    cache: 'no-store',
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) return NextResponse.redirect(new URL('/masuk?error=google', publicUrl));
  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${token.access_token}` }, cache: 'no-store' });
  const profile = await profileResponse.json();
  if (!profileResponse.ok || !profile.sub || !profile.email || !profile.email_verified) return NextResponse.redirect(new URL('/masuk?error=google', publicUrl));
  const response = NextResponse.redirect(new URL('/checkout', publicUrl));
  response.cookies.set(marketplaceSessionCookie.name, encryptCustomerSession({ id: profile.sub, email: profile.email, name: profile.name || profile.email, phone: '', provider: 'google' }), marketplaceSessionCookie.options);
  response.cookies.set(stateCookie, '', { ...marketplaceSessionCookie.options, maxAge: 0 });
  return response;
}
