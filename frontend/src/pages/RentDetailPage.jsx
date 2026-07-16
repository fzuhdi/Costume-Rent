import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRentById, cancelRent, deleteRent, updateRent, rollbackOrder } from '../api/rentApi';
import { updateClient } from '../api/clientApi';
import { useRentDetail } from '../hooks/useRentDetail';
import { ArrowLeft, Edit, Trash2, CheckCircle, Package, XCircle, User, Calendar, FileText, Shield, Upload, FileImage, ImageOff, Clock, Search } from 'lucide-react';
import { Button, Card, Chip, Spinner, Table, Modal, Select, ListBox, Label, Input, TextField, Switch } from '@heroui/react';
import RentDetailInfo from '../components/RentDetail/RentDetailInfo';
import RentDetailItems from '../components/RentDetail/RentDetailItems';
import RentDetailModals from '../components/RentDetail/RentDetailModals';
import RentPaymentSection from '../components/RentDetail/RentPaymentSection';
import RentDetailActivityLog from '../components/RentDetail/RentDetailActivityLog';
import RentDetailActions from '../components/RentDetail/RentDetailActions';

const statusColors = {
  draft: { variant: 'soft', color: 'warning' },
  booked: { variant: 'soft', color: 'primary' },
  rented: { variant: 'secondary' },
  returned: { variant: 'soft', color: 'success' },
  overdue: { variant: 'soft', color: 'danger' },
  cancelled: { variant: 'soft', color: 'default' },
};

const statusLabels = {
  draft: 'Draft',
  booked: 'Dipesan',
  rented: 'Disewa',
  returned: 'Dikembalikan',
  overdue: 'Terlambat',
  cancelled: 'Dibatalkan',
};

const itemStatusColors = {
  booked: { variant: 'flat', color: 'primary' },
  rented: { variant: 'flat', color: 'secondary' },
  returned: { variant: 'flat', color: 'success' },
  lost: { variant: 'flat', color: 'danger' },
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
    isEditing, setIsEditing,
    isHistoryOpen, setIsHistoryOpen,
    editData, setEditData,
    editItems, setEditItems,
    previewImages, previewIndex,
    isPreviewOpen, setIsPreviewOpen,
    openPreview, fetchRent, toggleEditMode,
    openRentModal, openReturnModal, openUpgradeModal,
    handleEditSave, handleCancel, handleRollback, handleDelete,
    groupedLogs, renderLogContent
  } = useRentDetail(id, navigate, formatDate);

  const totalBaseFee = rent?.items?.reduce((sum, item) => sum + ((item.rental_fee || 0) * item.quantity), 0) || 0;
  
  // Ledger-based calculations
  // If a transaction has no type (unmigrated), default to CREDIT (payment)
  const totalDebits = rent?.transactions?.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const totalCredits = rent?.transactions?.filter(t => t.type === 'CREDIT' || !t.type).reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  const totalTagihan = totalDebits;
  
  const totalPaid = totalCredits;
  const isCancelled = rent?.status === 'cancelled';
  const sisaTagihan = isCancelled ? 0 : Math.max(0, totalTagihan - totalPaid);


  if (loading) {
    return <div className="flex justify-center items-center h-48"><Spinner /></div>;
  }

  if (!rent) {
    return (
      <Card>
        <Card.Content className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Peminjaman tidak ditemukan</h3>
          <Button onPress={() => navigate('/rents')} variant="primary">Kembali ke Riwayat</Button>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full pb-10">
      <Link to="/rents" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft size={18} aria-hidden="true" />
        Kembali ke Riwayat
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <RentDetailInfo
            rent={rent}
            isEditing={isEditing}
            processing={processing}
            editData={editData}
            setEditData={setEditData}
            toggleEditMode={toggleEditMode}
            handleEditSave={handleEditSave}
            setIsDeleteOpen={() => setActiveModal('delete')}
            statusColors={statusColors}
            statusLabels={statusLabels}
            formatDate={formatDate}
          />

          <RentDetailItems
            rent={rent}
            isEditing={isEditing}
            editItems={editItems}
            setEditItems={setEditItems}
            formatCurrency={formatCurrency}
          />

          <RentDetailActions 
            rent={rent} 
            totalDebits={totalDebits}
            sisaTagihan={sisaTagihan}
            openReturnModal={openReturnModal}
            openRentModal={openRentModal}
            openUpgradeModal={openUpgradeModal}
            setIsCancelOpen={() => setActiveModal('cancel')}
            setIsExtendOpen={() => setActiveModal('extend')}
            setIsDeleteOpen={() => setActiveModal('delete')}
            setIsRollbackOpen={() => setActiveModal('rollback')}
            toggleEditMode={toggleEditMode}
            isEditing={isEditing}
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          <RentPaymentSection
            rent={rent}
            isEditing={isEditing}
            totalBaseFee={totalBaseFee}
            totalCredits={totalCredits}
            totalDebits={totalDebits}
            sisaTagihan={sisaTagihan}
            openPaymentModal={() => setActiveModal('payment')}
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
