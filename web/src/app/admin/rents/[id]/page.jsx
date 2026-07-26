"use client";

import { useParams, Link, useNavigate } from '@/lib/router-shim';
import { useRentDetail } from '@/hooks/useRentDetail';
import { ArrowLeft } from 'lucide-react';
import { Button, Card, Spinner } from '@heroui/react';
import RentDetailInfo from '@/components/RentDetail/RentDetailInfo';
import RentDetailItems from '@/components/RentDetail/RentDetailItems';
import RentDetailModals from '@/components/RentDetail/RentDetailModals';
import RentPaymentSection from '@/components/RentDetail/RentPaymentSection';
import RentDetailActivityLog from '@/components/RentDetail/RentDetailActivityLog';
import { XCircle, CheckCircle, Edit, Trash2, RotateCcw } from 'lucide-react';
import { Chip } from '@heroui/react';

const statusColors = {
  pending: { variant: 'soft', color: 'default' },
  booked: { variant: 'soft', color: 'accent' },
  rented: { variant: 'soft', color: 'accent' },
  returned: { variant: 'soft', color: 'success' },
  inspected: { variant: 'soft', color: 'success' },
  completed: { variant: 'flat', color: 'success' },
  overdue: { variant: 'soft', color: 'warning' },
  cancelled: { variant: 'soft', color: 'danger' },
};

const statusLabels = {
  pending: 'Pending',
  booked: 'Dipesan',
  rented: 'Disewa',
  returned: 'Diterima',
  inspected: 'Diinspeksi',
  completed: 'Selesai',
  overdue: 'Terlambat',
  cancelled: 'Dibatalkan',
};

const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDate = (isoString) => {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

const formatCurrency = (value) => {
  return idrFormatter.format(value);
};

const RentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    rent, loading, processing,
    activeModal, setActiveModal,
    isEditing,
    editData, setEditData,
    editItems, setEditItems,
    previewImages, previewIndex,
    isPreviewOpen, setIsPreviewOpen,
    openPreview, fetchRent, toggleEditMode,
    openRentModal, openReturnModal, openUpgradeModal,
    handleEditSave, handleCancel, handleRollback, handleReceive, handleComplete, handleDelete,
    handleVoidTransaction,
    groupedLogs, renderLogContent
  } = useRentDetail(id, navigate, formatDate);

  const totalBaseFee = rent?.items?.reduce((sum, item) => sum + ((item.rental_fee || 0) * item.quantity), 0) || 0;

	// Ledger-based calculations provided by backend PaymentSummary
	const totalDebits = rent?.payment_summary?.total_debits || 0;
	const totalCredits = rent?.payment_summary?.total_credits || 0;
	const totalTagihan = totalDebits;
	const totalPaid = totalCredits;
	const isCancelled = rent?.status === 'cancelled';
	const sisaTagihan = isCancelled ? 0 : (rent?.payment_summary?.balance || 0);

  if (loading) {
    return <div className="flex justify-center items-center h-48"><Spinner /></div>;
  }

  if (!rent) {
    return (
      <Card>
        <Card.Content className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Peminjaman tidak ditemukan</h3>
          <Button onPress={() => navigate('/admin/rents')} variant="primary">Kembali ke Riwayat</Button>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1440px] mx-auto w-full pb-10">
      <Link to="/admin/rents" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft size={18} aria-hidden="true" />
        Kembali ke Riwayat
      </Link>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] p-4 sm:p-6 rounded-xl border border-[var(--border)] shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold m-0">Order #{rent.id}</h1>
            <Chip {...(statusColors[rent.status] ?? { variant: 'secondary' })}>
              {statusLabels[rent.status] || rent.status}
            </Chip>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Buttons based on RentDetailActions & RentDetailInfo */}
          {isEditing ? (
            <>
              <Button variant="light" size="sm" onPress={toggleEditMode}><XCircle size={16} className="mr-1" /> Batal</Button>
              <Button color="primary" size="sm" onPress={handleEditSave} isPending={processing}><CheckCircle size={16} className="mr-1" /> Simpan Perubahan</Button>
            </>
          ) : (
            <>
              {rent.status === 'pending' && (
                <>
                  <Button color="primary" onPress={openUpgradeModal}>Book</Button>
                  <Button color="danger" variant="flat" onPress={() => setActiveModal('cancel')}>Cancel</Button>
                </>
              )}
              {rent.status === 'booked' && (
                <>
                  <Button color="success" className="text-white font-bold" onPress={openRentModal}>Pickup</Button>
                  <Button color="danger" variant="flat" onPress={() => setActiveModal('cancel')}>Cancel</Button>
                </>
              )}
              {(rent.status === 'rented' || rent.status === 'overdue') && (
                <>
                  <Button color="primary" size="sm" onPress={() => setActiveModal('receive')}>Receive</Button>
                  <Button color="secondary" variant="flat" onPress={() => setActiveModal('extend')}>Extend</Button>
                  {rent.status === 'rented' && (
                    <Button color="default" variant="flat" isIconOnly onPress={() => setActiveModal('rollback')} aria-label="Rollback"><RotateCcw size={18} /></Button>
                  )}
                </>
              )}
              {rent.status === 'returned' && (
                <>
                  <Button color="primary" size="sm" onPress={openReturnModal}>Inspect</Button>
                  <Button color="default" variant="flat" isIconOnly onPress={() => setActiveModal('rollback')} aria-label="Rollback"><RotateCcw size={18} /></Button>
                </>
              )}
              {rent.status === 'inspected' && (
                <>
                  <Button color="success" size="sm" className="text-white font-bold" onPress={() => setActiveModal('complete')}>Complete</Button>
                  <Button color="default" variant="flat" isIconOnly onPress={() => setActiveModal('rollback')} aria-label="Rollback"><RotateCcw size={18} /></Button>
                </>
              )}
              {rent.status === 'completed' && (
                <>
                  <Button color="default" variant="flat" isIconOnly onPress={() => setActiveModal('rollback')} aria-label="Rollback"><RotateCcw size={18} /></Button>
                </>
              )}
              <div className="w-px h-6 bg-[var(--border)] mx-1 hidden sm:block"></div>
              <Button variant="light" size="sm" isIconOnly aria-label="Edit" onPress={toggleEditMode}><Edit size={18} /></Button>
              <Button variant="light" color="danger" size="sm" isIconOnly aria-label="Hapus" onPress={() => setActiveModal('delete')}><Trash2 size={18} className="text-danger" /></Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Info & Items */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <RentDetailInfo
            rent={rent}
            isEditing={isEditing}
            editData={editData}
            setEditData={setEditData}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            openPreview={openPreview}
          />
          <RentDetailItems
            rent={rent}
            isEditing={isEditing}
            editItems={editItems}
            setEditItems={setEditItems}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Right Column: Payment & Activity */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <RentPaymentSection
            rent={rent}
            isEditing={isEditing}
            totalTagihan={totalTagihan}
            totalPaid={totalPaid}
            sisaTagihan={sisaTagihan}
            setIsPaymentModalOpen={() => setActiveModal('payment')}
            handleVoidTransaction={handleVoidTransaction}
            openPreview={openPreview}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
          <RentDetailActivityLog
            rent={rent}
            groupedLogs={groupedLogs}
            renderLogContent={renderLogContent}
            formatDateTime={formatDateTime}
          />
        </div>
      </div>

      {/* All Modals */}
      <RentDetailModals
        id={id}
        rent={rent}
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        handleCancel={handleCancel}
        handleDelete={handleDelete}
        handleRollback={handleRollback}
        handleComplete={handleComplete}
        isPreviewOpen={isPreviewOpen} setIsPreviewOpen={setIsPreviewOpen}
        previewImages={previewImages} previewIndex={previewIndex}
        processing={processing}
        fetchRent={fetchRent}
        sisaTagihan={sisaTagihan}
        totalBaseFee={totalBaseFee}
      />
    </div>
  );
};

export default RentDetailPage;
