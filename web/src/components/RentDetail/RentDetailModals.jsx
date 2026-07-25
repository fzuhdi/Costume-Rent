import MarkInspectedModal from '@/components/MarkInspectedModal';
import MarkRentedModal from '@/components/MarkRentedModal';
import ExtendRentModal from '@/components/ExtendRentModal';
import MarkBookedModal from '@/components/MarkBookedModal';
import ConfirmActionModal from '@/components/ConfirmActionModal';
import AddPaymentModal from '@/components/AddPaymentModal';
import ImagePreviewModal from '@/components/ImagePreviewModal';
import MarkReturnedModal from '@/components/MarkReturnedModal';

export default function RentDetailModals({
  id,
  rent,
  activeModal,
  onClose,
  handleCancel,
  handleDelete,
  handleRollback,
  handleComplete,
  isPreviewOpen, setIsPreviewOpen,
  previewImages, previewIndex,
  processing,
  fetchRent,
  sisaTagihan,
  totalBaseFee
}) {
  return (
    <>
      <MarkInspectedModal
        isOpen={activeModal === 'return'}
        onClose={onClose}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
        sisaTagihan={sisaTagihan}
        rent={rent}
      />

      <MarkRentedModal
        isOpen={activeModal === 'rent'}
        onClose={onClose}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
        sisaTagihan={sisaTagihan}
        guaranteeType={rent?.guarantee_type}
      />

      <ExtendRentModal
        isOpen={activeModal === 'extend'}
        onClose={onClose}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
        dailyFee={totalBaseFee}
      />

      <MarkBookedModal
        isOpen={activeModal === 'upgrade'}
        onClose={onClose}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
        minDp={Math.ceil(totalBaseFee / 2)}
      />

      <ConfirmActionModal
        isOpen={activeModal === 'cancel'}
        onClose={onClose}
        onConfirm={handleCancel}
        heading="Batalkan Order?"
        body="Order ini akan dibatalkan. Kostum yang sudah di-booking akan kembali tersedia. Apakah Anda yakin?"
        confirmLabel="Ya, Batalkan"
        confirmColor="danger"
        loading={processing}
      />

      <ConfirmActionModal
        isOpen={activeModal === 'delete'}
        onClose={onClose}
        onConfirm={handleDelete}
        heading="Hapus Order?"
        body="Tindakan ini tidak dapat dibatalkan. Semua data terkait order ini akan dihapus permanen."
        confirmLabel="Hapus Permanen"
        confirmColor="danger"
        loading={processing}
      />

      <ConfirmActionModal
        isOpen={activeModal === 'rollback'}
        onClose={onClose}
        onConfirm={handleRollback}
        heading="Rollback Status"
        body="Status order akan dikembalikan ke langkah sebelumnya. Apakah Anda yakin?"
        confirmLabel="Ya, Rollback"
        confirmColor="warning"
        loading={processing}
      />

      <MarkReturnedModal
        isOpen={activeModal === 'receive'}
        onClose={onClose}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
        guaranteeType={rent?.guarantee_type}
      />

      <AddPaymentModal
        isOpen={activeModal === 'payment'}
        onClose={onClose}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
      />

      <AddPaymentModal
        isOpen={activeModal === 'complete'}
        onClose={onClose}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
        defaultAmount={sisaTagihan > 0 ? sisaTagihan : undefined}
        onAfterSuccess={handleComplete}
      />

      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        images={previewImages}
        initialIndex={previewIndex}
      />
    </>
  );
}
