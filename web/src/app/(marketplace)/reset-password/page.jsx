"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { marketplaceApi } from '@/marketplace/api';

export default function ResetPasswordPage() {
  const token = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('token');
  const [message, setMessage] = useState('');
  const submit = async (event) => { event.preventDefault(); const newPassword = new FormData(event.currentTarget).get('password'); try { await marketplaceApi.request('auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password: newPassword }) }); setMessage('Kata sandi diperbarui. Silakan masuk.'); } catch { setMessage('Tautan reset tidak valid atau kata sandi tidak memenuhi syarat.'); } };
  return <div className="marketplace-container py-20"><form onSubmit={submit} className="mx-auto grid max-w-md gap-4"><h1 className="text-3xl font-bold">Atur ulang kata sandi</h1><Label htmlFor="password">Kata sandi baru</Label><Input id="password" name="password" type="password" minLength={8} required /><Button type="submit">Simpan kata sandi</Button>{message && <p role="status">{message}</p>}<Link href="/masuk" className="font-bold text-[var(--mk-primary)]">Ke halaman masuk</Link></form></div>;
}
