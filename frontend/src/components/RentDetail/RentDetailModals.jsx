import MarkReturnedModal from '../MarkReturnedModal';
import MarkRentedModal from '../MarkRentedModal';
import ExtendRentModal from '../ExtendRentModal';
import MarkBookedModal from '../MarkBookedModal';
import ConfirmActionModal from '../ConfirmActionModal';
import AddPaymentModal from '../AddPaymentModal';
import ImagePreviewModal from '../ImagePreviewModal';

export default function RentDetailModals({
  id,
  rent,
  activeModal,
  onClose,
  handleCancel,
  handleDelete,
  handleRollback,
  isPreviewOpen, setIsPreviewOpen,
  previewImages, previewIndex,
  processing,
  fetchRent,
  sisaTagihan,
  totalBaseFee
}) {
  return (
    <>
      <MarkReturnedModal
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

      <AddPaymentModal
        isOpen={activeModal === 'payment'}
        onClose={onClose}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
        sisaTagihan={sisaTagihan}
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
