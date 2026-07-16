import { Card, Button } from '@heroui/react';

export default function RentPaymentSection({
  rent,
  isEditing,
  totalTagihan,
  totalPaid,
  sisaTagihan,
  setIsPaymentModalOpen,
  openPreview,
  formatCurrency,
  formatDate
}) {
  return (
    <Card>
      <Card.Content>
        <h2 className="text-xl font-semibold mb-4">Rincian Keuangan</h2>

        {/* Transaction ledger */}
        <div className="flex flex-col gap-3 text-sm">
          {rent.transactions && rent.transactions.length > 0 ? (
            rent.transactions.toSorted((a, b) => a.id - b.id).map((trx, idx) => {
              const isDebit = trx.type === 'DEBIT';
              const isCredit = trx.type === 'CREDIT' || !trx.type; // empty means legacy payment
              const amount = trx.amount || 0;
              
              let sign = '';
              let colorClass = 'text-default-700';
              let borderClass = 'border-default-200';
              
              if (isDebit) {
                sign = '+';
                colorClass = 'text-danger';
                borderClass = 'border-danger/40';
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
                  key={trx.id || idx}
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
                  <span className={`${colorClass} font-semibold whitespace-nowrap ml-4`}>
                    {sign} {formatCurrency(Math.abs(amount))}
                  </span>
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

          <div className="flex justify-between text-base font-bold text-primary">
            <span>Sisa Tagihan</span>
            <span>{formatCurrency(sisaTagihan)}</span>
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
                + Tambah Pembayaran
              </Button>
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
