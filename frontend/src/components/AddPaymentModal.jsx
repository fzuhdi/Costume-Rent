import { useReducer } from 'react';
import { Modal, Button, Label, Input } from '@heroui/react';
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

const initialState = {
  amount: '',
  method: 'CASH',
  proof: '',
  proofFile: null,
  uploading: false,
  notes: '',
  errors: { amount: '', proof: '', submit: '' },
  loading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ERRORS':
      return { ...state, errors: { ...state.errors, ...action.payload } };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const AddPaymentModal = ({ isOpen, onClose, onSuccess, rentId }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { amount, method, proof, proofFile, uploading, notes, errors, loading } = state;

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

    dispatch({ type: 'SET_ERRORS', payload: newErrors });
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    dispatch({ type: 'SET_FIELD', field: 'loading', value: true });
    dispatch({ type: 'SET_ERRORS', payload: { submit: '' } });
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
      dispatch({
        type: 'SET_ERRORS',
        payload: { submit: err.response?.data?.error || err.message },
      });
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'loading', value: false });
    }
  };

  const handleClose = () => {
    dispatch({ type: 'RESET' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose}>
      <Modal.Backdrop>
      <Modal.Container>
        <Modal.Dialog className="bg-[var(--surface)] border border-default-200">
          <Modal.Header>
            <Modal.Heading>Tambah Pembayaran</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-4">
            <PaymentFormFields
              amount={amount}
              setAmount={(v) => dispatch({ type: 'SET_FIELD', field: 'amount', value: v })}
              method={method}
              setMethod={(v) => dispatch({ type: 'SET_FIELD', field: 'method', value: v })}
              proof={proof}
              setProof={(v) => dispatch({ type: 'SET_FIELD', field: 'proof', value: v })}
              proofFile={proofFile}
              setProofFile={(v) => dispatch({ type: 'SET_FIELD', field: 'proofFile', value: v })}
              uploadingProof={uploading}
              setUploadingProof={(v) => dispatch({ type: 'SET_FIELD', field: 'uploading', value: v })}
              errors={{ amount: errors.amount, proof: errors.proof }}
              handleUploadGeneric={handleUploadGeneric}
            />

            {/* Notes field */}
            <div className="flex flex-col gap-1 w-full">
              <Label className="text-xs font-semibold mb-1 text-default-600 block">
                Catatan (Opsional)
              </Label>
              <Input
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Contoh: Pelunasan Denda Keterlambatan"
                value={notes}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'notes', value: e.target.value })}
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
    </Modal>
  );
};

export default AddPaymentModal;
