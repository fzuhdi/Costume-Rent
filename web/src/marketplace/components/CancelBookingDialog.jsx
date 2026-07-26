"use client";

import { useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatRupiah } from '@/marketplace/format';

export function CancelBookingDialog({ downpayment }) {
  const [accepted, setAccepted] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  if (cancelled) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-[var(--mk-success-soft)] px-4 py-3 text-sm font-semibold text-[var(--mk-success)]" role="status">
        <Check size={18} aria-hidden="true" /> Pembatalan demo berhasil dicatat.
      </div>
    );
  }

  return (
    <Dialog onOpenChange={(open) => !open && setAccepted(false)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11 rounded-xl border-[var(--mk-danger)]/40 text-[var(--mk-danger)] hover:bg-[var(--mk-danger-soft)] hover:text-[var(--mk-danger)]">
          Batalkan pesanan
        </Button>
      </DialogTrigger>
      <DialogContent className="marketplace-theme rounded-[20px] sm:max-w-md">
        <DialogHeader>
          <span className="mb-2 grid size-11 place-items-center rounded-xl bg-[var(--mk-danger-soft)] text-[var(--mk-danger)]">
            <AlertTriangle aria-hidden="true" />
          </span>
          <DialogTitle>Batalkan pesanan ini?</DialogTitle>
          <DialogDescription className="leading-6">
            Stok akan dilepas segera. Downpayment {formatRupiah(downpayment)} tidak dikembalikan untuk pembatalan oleh pelanggan.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-3 rounded-xl bg-[var(--mk-danger-soft)] p-4">
          <Checkbox id="cancel-acknowledgement" checked={accepted} onCheckedChange={(checked) => setAccepted(checked === true)} className="mt-0.5 size-5" />
          <Label htmlFor="cancel-acknowledgement" className="cursor-pointer text-sm leading-6 text-[var(--mk-danger)]">
            Saya memahami downpayment akan hangus dan pesanan tidak dapat dipulihkan.
          </Label>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" className="h-11 rounded-xl">Kembali</Button></DialogClose>
          <Button type="button" variant="destructive" disabled={!accepted} className="h-11 rounded-xl bg-[var(--mk-danger)] text-[var(--mk-on-danger)] hover:bg-[var(--mk-danger-hover)]" onClick={() => setCancelled(true)}>
            Ya, batalkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
