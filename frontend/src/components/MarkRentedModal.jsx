import { useState, useEffect } from 'react';
import { Modal, Button, Checkbox } from '@heroui/react';
import PaymentFormFields from './PaymentFormFields';
import { markRented, uploadPaymentProof } from '../api/rentApi';

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

/**
 * MarkRentedModal
 *
 * Props:
 *   isOpen        – boolean
 *   onClose       – () => void
 *   onSuccess     – () => void   called after successful API response
 *   rentId        – number       the order ID to transition
 *   sisaTagihan   – number       remaining balance (totalFee - totalPaid)
 *   earlyFee      – number       optional early takeaway fee already applied (default 0)
 */
const MarkRentedModal = ({ isOpen, onClose, onSuccess, rentId, sisaTagihan = 0 }) => {
  const [confirmSecurityItem, setConfirmSecurityItem] = useState(true);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [proof, setProof] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync amount to sisaTagihan every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmSecurityItem(true);
      setAmount(String(Math.max(0, sisaTagihan)));
      setMethod('CASH');
      setProof('');
      setProofFile(null);
      setError('');
    }
  }, [isOpen, sisaTagihan]);

  const hasBalance = sisaTagihan > 0;
  const needsProof = hasBalance && method !== 'CASH' && !proof;

  const handleUploadGeneric = async (e, setProofFn, setFileFn, setUploadingFn) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileFn(file.name);
    setUploadingFn(true);
    try {
      const res = await uploadPaymentProof(file);
      setProofFn(res.data.payment_proof);
    } catch {
      setFileFn(null);
    } finally {
      setUploadingFn(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const paymentPayload = hasBalance && parseInt(amount) > 0
        ? { amount: parseInt(amount), payment_method: method, payment_proof: proof, notes: 'Pelunasan Sewa' }
        : null;

      await markRented(rentId, { payment: paymentPayload });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Pickup (Serahkan Kostum)</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-4">
            {/* Balance summary */}
            <div className="p-3 bg-default-50 rounded border">
              <div className="flex justify-between text-sm font-bold">
                <span>Sisa Tagihan</span>
                <span className="text-primary">{formatCurrency(Math.max(0, sisaTagihan))}</span>
              </div>
            </div>

            {/* Security item confirmation */}
            <Checkbox isSelected={confirmSecurityItem} onChange={setConfirmSecurityItem}>
              <Checkbox.Content>
                <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                Jaminan Ditahan (Wajib)
              </Checkbox.Content>
            </Checkbox>

            {/* Payment form — only shown when there's a remaining balance */}
            {hasBalance && (
              <PaymentFormFields
                amount={amount}
                setAmount={setAmount}
                method={method}
                setMethod={setMethod}
                proof={proof}
                setProof={setProof}
                proofFile={proofFile}
                setProofFile={setProofFile}
                uploadingProof={uploading}
                setUploadingProof={setUploading}
                errors={{}}
                handleUploadGeneric={handleUploadGeneric}
              />
            )}

            {error && <p className="text-danger text-sm font-medium">{error}</p>}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="bordered" onPress={handleClose} aria-label="Batal">Batal</Button>
            <Button
              color="success"
              className="text-white font-bold"
              onPress={handleSubmit}
              isPending={loading}
              isDisabled={!confirmSecurityItem || needsProof}
              aria-label="Konfirmasi penyewaan"
            >
              Disewakan
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default MarkRentedModal;
