import { Card, Button } from '@heroui/react';
import { Plus, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import ConfirmActionModal from '../ConfirmActionModal';

export default function RentPaymentSection({
  rent,
  isEditing,
  totalTagihan,
  totalPaid,
  sisaTagihan,
  setIsPaymentModalOpen,
  handleVoidTransaction,
  openPreview,
  formatCurrency,
  formatDate
}) {
  const { user } = useAuth();
  const [voidTrxId, setVoidTrxId] = useState(null);
  return (
    <Card>
      <Card.Content>
        <h2 className="text-xl font-semibold mb-4">Rincian Keuangan</h2>

        {/* Transaction ledger */}
        <div className="flex flex-col gap-3 text-sm">
          {rent.transactions && rent.transactions.length > 0 ? (
            rent.transactions.toSorted((a, b) => a.id - b.id).map((trx) => {
              const isDebit = trx.type === 'DEBIT';
              const isCredit = trx.type === 'CREDIT' || !trx.type; // empty means legacy payment
              const amount = trx.amount || 0;

              let sign = '';
              let colorClass = 'text-default-700';
              let borderClass = 'border-default-200';

              if (isDebit) {
                if (amount < 0) {
                  sign = '-'; // Reversal of debit (e.g. voided damage fee)
                  colorClass = 'text-success'; 
                  borderClass = 'border-success/40';
                } else {
                  sign = '+';
                  colorClass = 'text-danger';
                  borderClass = 'border-danger/40';
                }
              } else if (isCredit) {
                if (amount < 0) {
                  sign = '+'; // Negative payment is a refund (increases what they owe)
                  colorClass = 'text-warning-600';
                  borderClass = 'border-warning/40';
                } else {
                  sign = '-'; // Normal payment
                  colorClass = 'text-success';
                  borderClass = 'border-success/40';
                }
              }

              return (
                <div
                  key={trx.id || trx.created_at || 'trx-' + String(trx.amount)}
                  className={`flex justify-between items-start pl-3 border-l-2 ${borderClass}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-default-700">
                      {trx.notes || (isDebit ? 'Biaya Tambahan' : 'Pembayaran')}
                    </span>
                    <span className="text-xs text-default-400 flex items-center flex-wrap gap-1">
                      {formatDate(trx.created_at)} {trx.payment_method ? `· ${trx.payment_method}` : ''}
                      {trx.payment_proof && (
                        <>
                          <span>·</span>
                          <Button
                            variant="light"
                            size="sm"
                            onPress={() => openPreview([trx.payment_proof], 0)}
                            className="text-primary hover:underline bg-transparent border-none p-0 h-auto min-w-0 cursor-pointer text-xs flex items-center gap-1"
                          >
                            Lihat Bukti
                          </Button>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={`${colorClass} font-semibold whitespace-nowrap ml-4`}>
                      {sign} {formatCurrency(Math.abs(amount))}
                    </span>
                    {['admin', 'staff'].includes(user?.role) && !isEditing && !['CORRECTION', 'BASE_FEE'].includes(trx.category) && !(trx.notes && trx.notes.toLowerCase().includes('biaya sewa')) && !trx.is_voided && amount > 0 && rent.status !== 'cancelled' && (
                      <Button
                        variant="flat"
                        color="danger"
                        size="sm"
                        className="h-7 px-2 ml-2 text-xs flex-shrink-0 font-medium"
                        onPress={() => setVoidTrxId(trx.id)}
                        aria-label="Void Transaksi"
                      >
                        <XCircle size={14} className="mr-1" /> Void
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-default-400 text-sm italic">Belum ada pembayaran.</p>
          )}

          <hr className="border-default-200 mt-1" />

          {/* Totals */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-default-600">
              <span>Total Tagihan</span>
              <span className="font-medium">{formatCurrency(totalTagihan)}</span>
            </div>
            {totalPaid > 0 && (
              <div className="flex justify-between text-success">
                <span>Total Dibayar</span>
                <span className="font-medium">{formatCurrency(totalPaid)}</span>
              </div>
            )}
          </div>

          <hr className="border-default-200" />

          <div className={`flex justify-between text-base font-bold ${sisaTagihan < 0 ? 'text-warning-600' : 'text-primary'}`}>
            <span>{sisaTagihan < 0 ? 'Kembalian' : 'Sisa Tagihan'}</span>
            <span>{formatCurrency(Math.abs(sisaTagihan))}</span>
          </div>

          {!isEditing && rent.status !== 'cancelled' && (
            <div className="mt-3 pt-3 border-t border-default-200">
              <Button
                size="sm"
                variant="flat"
                color="primary"
                className="w-full font-semibold"
                onPress={() => setIsPaymentModalOpen(true)}
              >
                <Plus size={16} className="mr-1" /> Tambah Pembayaran
              </Button>
            </div>
          )}
        </div>
      </Card.Content>

      <ConfirmActionModal
        isOpen={!!voidTrxId}
        onClose={() => setVoidTrxId(null)}
        onConfirm={async () => {
          await handleVoidTransaction(voidTrxId);
          setVoidTrxId(null);
        }}
        heading="Batalkan Transaksi"
        body="Apakah Anda yakin ingin membatalkan transaksi ini? Transaksi koreksi (pembatalan) akan otomatis dibuat dan tidak dapat dihapus."
        confirmLabel="Ya, Batalkan"
        confirmColor="danger"
      />
    </Card>
  );
}
