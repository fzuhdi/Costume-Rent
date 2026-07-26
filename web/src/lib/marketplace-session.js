import 'server-only';

import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes } from 'node:crypto';

const SESSION_COOKIE = 'kbr_marketplace_session';
const assertionAudience = 'costume-rent-marketplace-api';

function secretKey() {
  const secret = process.env.MARKETPLACE_SESSION_SECRET || process.env.MARKETPLACE_ASSERTION_SECRET;
  if (!secret) throw new Error('Marketplace session secret is not configured');
  return createHash('sha256').update(secret).digest();
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

export function encryptCustomerSession(customer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secretKey(), iv);
  const payload = Buffer.concat([cipher.update(JSON.stringify(customer), 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${payload.toString('base64url')}`;
}

export function decryptCustomerSession(value) {
  if (!value) return null;
  try {
    const [ivValue, tagValue, payloadValue] = value.split('.');
    const decipher = createDecipheriv('aes-256-gcm', secretKey(), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(payloadValue, 'base64url')), decipher.final()]).toString('utf8'));
  } catch {
    return null;
  }
}

export function createMarketplaceAssertion(customer) {
  const secret = process.env.MARKETPLACE_ASSERTION_SECRET;
  if (!secret) throw new Error('Marketplace assertion secret is not configured');
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    sub: String(customer.id),
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    email_verified: true,
    provider: customer.provider || 'credentials',
    aud: assertionAudience,
    iat: now,
    exp: now + 300,
  }));
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export const marketplaceSessionCookie = {
  name: SESSION_COOKIE,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  },
};
