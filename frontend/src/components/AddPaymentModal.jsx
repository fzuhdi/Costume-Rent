import { useState } from 'react';
import { Modal, Button, TextField, Label, Input } from '@heroui/react';
import PaymentFormFields from './PaymentFormFields';
import { addPayment, uploadPaymentProof } from '../api/rentApi';

/**
 * AddPaymentModal
 *
 * Props:
 *   isOpen    – boolean
 *   onClose   – () => void
 *   onSuccess – () => void   called after successful API response
 *   rentId    – number       the order ID to add a payment against
 */
const AddPaymentModal = ({ isOpen, onClose, onSuccess, rentId }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [proof, setProof] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({ amount: '', proof: '', submit: '' });
  const [loading, setLoading] = useState(false);

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

  const validate = () => {
    const newErrors = { amount: '', proof: '', submit: '' };
    let valid = true;

    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Nominal harus berupa angka positif.';
      valid = false;
    }

    if (method !== 'CASH' && !proof) {
      newErrors.proof = 'Bukti pembayaran wajib diunggah untuk metode ini.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors((prev) => ({ ...prev, submit: '' }));
    try {
      await addPayment(rentId, {
        amount: Number(amount),
        payment_method: method,
        payment_proof: proof,
        notes,
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        submit: err.response?.data?.error || err.message,
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setMethod('CASH');
    setProof('');
    setProofFile(null);
    setUploading(false);
    setNotes('');
    setErrors({ amount: '', proof: '', submit: '' });
    onClose();
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Tambah Pembayaran</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-4">
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
              errors={{ amount: errors.amount, proof: errors.proof }}
              handleUploadGeneric={handleUploadGeneric}
            />

            {/* Notes field */}
            <div className="flex flex-col gap-1 w-full">
              <Label className="text-xs font-semibold mb-1 text-default-600 block">
                Catatan (Opsional)
              </Label>
              <Input
                className="w-full bg-white border border-default-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Contoh: Pelunasan Denda Keterlambatan"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {errors.submit && (
              <p className="text-danger text-sm text-center mt-2 font-medium bg-danger/10 p-2 rounded-lg">
                {errors.submit}
              </p>
            )}
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
              aria-label="Simpan pembayaran"
            >
              Simpan Pembayaran
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default AddPaymentModal;
