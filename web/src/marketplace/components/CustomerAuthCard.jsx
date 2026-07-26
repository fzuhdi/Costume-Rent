"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MARKETPLACE_BRAND } from '@/marketplace/brand';
import { marketplaceApi } from '@/marketplace/api';
import { useCustomerAuth } from '@/marketplace/CustomerAuthContext';

const content = new Map([
  ['login', {
    title: 'Masuk ke akunmu',
    description: 'Lanjutkan checkout dan lihat pesanan yang pernah dibuat.',
    submit: 'Masuk dengan email',
    footer: <>Belum punya akun? <Link href="/daftar" className="inline-flex min-h-11 items-center font-bold text-[var(--mk-primary)]">Daftar</Link></>,
  }],
  ['register', {
    title: `Buat akun ${MARKETPLACE_BRAND.name}`,
    description: 'Simpan data penyewa dan kelola pesanan dari satu tempat.',
    submit: 'Buat akun',
    footer: <>Sudah punya akun? <Link href="/masuk" className="inline-flex min-h-11 items-center font-bold text-[var(--mk-primary)]">Masuk</Link></>,
  }],
  ['forgot', {
    title: 'Atur ulang kata sandi',
    description: 'Kami akan mengirim tautan sekali pakai ke alamat emailmu.',
    submit: 'Kirim tautan reset',
    footer: <Link href="/masuk" className="inline-flex min-h-11 items-center font-bold text-[var(--mk-primary)]">Kembali ke halaman masuk</Link>,
  }],
]);

export function CustomerAuthCard({ mode }) {
  const router = useRouter();
  const { login } = useCustomerAuth();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const copy = content.get(mode) ?? content.get('login');
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '');
    setError('');
    setSubmitting(true);
    try {
      if (isForgot) {
        await marketplaceApi.forgotPassword({ email });
        setSubmitted(true);
      } else if (isRegister) {
        await marketplaceApi.register({
          name: String(form.get('name') || ''),
          phone: String(form.get('phone') || ''),
          email,
          password: String(form.get('password') || ''),
        });
        setSubmitted(true);
      } else {
        await login({ email, password: String(form.get('password') || '') });
        router.push('/checkout');
      }
    } catch (caught) {
      setError(caught.code === 'ERR_EMAIL_NOT_VERIFIED' ? 'Verifikasi alamat emailmu sebelum masuk.' : 'Permintaan tidak dapat diproses. Periksa data lalu coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md rounded-[20px] border-[var(--mk-line)] bg-[var(--mk-surface)] shadow-[var(--mk-shadow-float)]">
      <CardContent className="p-6 sm:p-8">
        <span className="grid size-11 place-items-center rounded-xl bg-[var(--mk-primary-soft)] text-[var(--mk-primary)]">
          <ShieldCheck aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-[-0.04em]">{copy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--mk-muted)]">{copy.description}</p>

        {submitted ? (
          <div className="mt-7">
            <Alert announcement="status" className="border-[var(--mk-success)]/25 bg-[var(--mk-success-soft)] text-[var(--mk-success)]">
              <Mail aria-hidden="true" />
              <AlertTitle>{isForgot ? 'Email reset sudah dikirim' : 'Periksa email untuk verifikasi akun'}</AlertTitle>
              <AlertDescription className="text-[var(--mk-success)]/90">
                {isForgot ? 'Periksa kotak masuk dan folder spam untuk melanjutkan.' : 'Buka tautan verifikasi sebelum masuk dan melanjutkan ke checkout.'}
              </AlertDescription>
            </Alert>
            {!isForgot && (
              <Button asChild className="mt-5 h-12 w-full rounded-xl bg-[var(--mk-primary)] text-[var(--mk-on-primary)]">
                <Link href="/masuk">Masuk setelah verifikasi <ArrowRight aria-hidden="true" /></Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {!isForgot && (
              <>
                <Button type="button" variant="outline" onClick={() => { window.location.assign('/api/marketplace/auth/google'); }} className="mt-7 h-12 w-full rounded-xl border-[var(--mk-line-strong)] bg-[var(--mk-surface)]">
                  <span className="text-lg font-bold text-[#4285f4]" aria-hidden="true">G</span>
                  Lanjut dengan Google
                </Button>
                <div className="my-6 flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs font-semibold text-[var(--mk-muted)]">atau dengan email</span>
                  <Separator className="flex-1" />
                </div>
              </>
            )}

            <form onSubmit={submit} className={isForgot ? 'mt-7 grid gap-5' : 'grid gap-5'}>
              {isRegister && (
                <div className="grid gap-2">
                  <Label htmlFor="auth-name">Nama lengkap</Label>
                  <Input id="auth-name" name="name" autoComplete="name" placeholder="Nama sesuai identitas" className="h-11 rounded-xl border-[var(--mk-line-strong)]" required />
                </div>
              )}
              {isRegister && (
                <div className="grid gap-2">
                  <Label htmlFor="auth-phone">Nomor WhatsApp</Label>
                  <Input id="auth-phone" name="phone" type="tel" autoComplete="tel" placeholder="0812 3456 7890" className="h-11 rounded-xl border-[var(--mk-line-strong)]" required />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="auth-email">Email</Label>
                <Input id="auth-email" name="email" type="email" autoComplete="email" placeholder="nama@email.com" className="h-11 rounded-xl border-[var(--mk-line-strong)]" required />
              </div>
              {!isForgot && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="auth-password">Kata sandi</Label>
                    {mode === 'login' && <Link href="/lupa-kata-sandi" className="inline-flex min-h-11 items-center text-xs font-bold text-[var(--mk-primary)]">Lupa kata sandi?</Link>}
                  </div>
                  <Input id="auth-password" name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} className="h-11 rounded-xl border-[var(--mk-line-strong)]" required />
                  {isRegister && <p className="text-xs text-[var(--mk-muted)]">Minimal 8 karakter.</p>}
                </div>
              )}
              {error && <p className="text-sm font-semibold text-[var(--mk-danger)]" role="alert">{error}</p>}
              <Button type="submit" disabled={submitting} className="h-12 rounded-xl bg-[var(--mk-primary)] text-[var(--mk-on-primary)] hover:bg-[var(--mk-primary-hover)]">
                {submitting ? 'Memproses...' : copy.submit}
              </Button>
            </form>
          </>
        )}
        <p className="mt-6 text-center text-sm text-[var(--mk-muted)]">{copy.footer}</p>
      </CardContent>
    </Card>
  );
}
