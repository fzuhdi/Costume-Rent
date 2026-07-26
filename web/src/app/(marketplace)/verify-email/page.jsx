"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { marketplaceApi } from '@/marketplace/api';

export default function VerifyEmailPage() {
  const token = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('token');
  const [message, setMessage] = useState('Memverifikasi alamat email...');
  useEffect(() => { if (token) marketplaceApi.request('auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }).then(() => setMessage('Email berhasil diverifikasi. Kamu sekarang dapat masuk.')).catch(() => setMessage('Tautan verifikasi tidak valid atau sudah kedaluwarsa.')); }, [token]);
  return <div className="marketplace-container py-20 text-center"><h1 className="text-3xl font-bold">Verifikasi email</h1><p className="mt-4 text-[var(--mk-muted)]">{token ? message : 'Tautan verifikasi tidak lengkap.'}</p><Link href="/masuk" className="mt-6 inline-block font-bold text-[var(--mk-primary)]">Ke halaman masuk</Link></div>;
}
