import { useState, useEffect } from 'react';
import { Modal, Button } from '@heroui/react';
import PaymentFormFields from './PaymentFormFields';
import { markBooked, uploadPaymentProof } from '../api/rentApi';

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

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

/**
 * MarkBookedModal

 *
 * Props:
 *   isOpen    – boolean
 *   onClose   – () => void
 *   onSuccess – () => void   called after successful API response
 *   rentId    – number       the order ID to transition
 *   minDp     – number       minimum DP amount (50% of totalBaseFee, pre-fill into amount field)
 */
const MarkBookedModal = ({ isOpen, onClose, onSuccess, rentId, minDp = 0 }) => {
  const [amount, setAmount] = useState(String(Math.max(0, minDp)));
  const [method, setMethod] = useState('CASH');
  const [proof, setProof] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync pre-filled amount when minDp prop changes (e.g. modal re-opened for a different rent)
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setAmount(String(Math.max(0, minDp))), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen, minDp]);

  const needsProof = method !== 'CASH' && !proof;



  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await markBooked(rentId, {
        payment: {
          amount: parseInt(amount) || 0,
          payment_method: method,
          payment_proof: proof,
          notes: 'Downpayment Booked',
        },
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount(String(Math.max(0, minDp)));
    setMethod('CASH');
    setProof('');
    setProofFile(null);
    setUploading(false);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose}>
      <Modal.Backdrop>
      <Modal.Container>
        <Modal.Dialog className="bg-[var(--surface)] border border-default-200">
          <Modal.Header>
            <Modal.Heading>Ubah Status ke Booked</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-4">
            {/* DP info */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
              <p className="text-default-700">
                Minimal DP yang harus dibayar adalah{' '}
                <span className="font-bold text-primary">
                  {idrFormatter.format(minDp)}
                </span>{' '}
                (50% dari total biaya sewa).
              </p>
            </div>

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

            {error && <p className="text-danger text-sm font-medium">{error}</p>}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="bordered" onPress={handleClose} aria-label="Batal">
              Batal
            </Button>
            <Button
              color="primary"
              className="font-bold"
              onPress={handleSubmit}
              isPending={loading}
              isDisabled={needsProof}
              aria-label="Konfirmasi booked"
            >
              Konfirmasi Booked
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
    </Modal>
  );
};

export default MarkBookedModal;
