import { useEffect, useReducer } from 'react';
import { Modal, Button, Checkbox } from '@heroui/react';
import PaymentFormFields from './PaymentFormFields';
import { markRented, uploadPaymentProof } from '../api/rentApi';

const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
const formatCurrency = (value) => currencyFormatter.format(value);

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
  confirmSecurityItem: true,
  amount: '',
  method: 'CASH',
  proof: '',
  proofFile: null,
  uploading: false,
  loading: false,
  error: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return {
        ...initialState,
        amount: String(Math.max(0, action.payload?.sisaTagihan || 0)),
      };
    default:
      return state;
  }
}

const MarkRentedModal = ({ isOpen, onClose, onSuccess, rentId, sisaTagihan = 0 }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { confirmSecurityItem, amount, method, proof, proofFile, uploading, loading, error } = state;

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'RESET', payload: { sisaTagihan } });
    }
  }, [isOpen, sisaTagihan]);

  const hasBalance = sisaTagihan > 0;
  const needsProof = hasBalance && method !== 'CASH' && !proof;

  const handleSubmit = async () => {
    dispatch({ type: 'SET_FIELD', field: 'loading', value: true });
    dispatch({ type: 'SET_FIELD', field: 'error', value: '' });
    try {
      const paymentPayload = hasBalance && parseInt(amount) > 0
        ? { amount: parseInt(amount), payment_method: method, payment_proof: proof, notes: 'Pelunasan Sewa' }
        : null;

      await markRented(rentId, { payment: paymentPayload });
      handleClose();
      onSuccess();
    } catch (err) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: err.response?.data?.error || err.message });
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'loading', value: false });
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
            <Checkbox isSelected={confirmSecurityItem} onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'confirmSecurityItem', value: v })}>
              <Checkbox.Content>
                <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                Jaminan Ditahan (Wajib)
              </Checkbox.Content>
            </Checkbox>

            {/* Payment form — only shown when there's a remaining balance */}
            {hasBalance && (
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
