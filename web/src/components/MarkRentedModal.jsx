import { useEffect, useReducer } from 'react';
import { Modal, Button, Checkbox, Select, ListBox, Label } from '@heroui/react';
import PaymentFormFields from '@/components/PaymentFormFields';
import { markRented, uploadPaymentProof, uploadRentPhoto } from '@/api/rentApi';
import MultipleImageUpload from '@/components/MultipleImageUpload';

const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
const formatCurrency = (value) => currencyFormatter.format(value);

const GUARANTEE_OPTIONS = [
  { id: 'KTP', label: 'KTP' },
  { id: 'SIM', label: 'SIM' },
  { id: 'KK', label: 'Kartu Keluarga (KK)' },
  { id: 'Paspor', label: 'Paspor' },
  { id: 'Lainnya', label: 'Lainnya' }
];

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
  guaranteeType: 'KTP',
  uploading: false,
  loading: false,
  error: '',
  pickupPhotos: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return {
        ...initialState,
        amount: String(Math.max(0, action.payload?.sisaTagihan || 0)),
        guaranteeType: action.payload?.guaranteeType || 'KTP',
      };
    default:
      return state;
  }
}

const MarkRentedModal = ({ isOpen, onClose, onSuccess, rentId, sisaTagihan = 0, guaranteeType }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { confirmSecurityItem, amount, method, proof, proofFile, guaranteeType: formGuaranteeType, uploading, loading, error, pickupPhotos } = state;

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'RESET', payload: { sisaTagihan, guaranteeType } });
    }
  }, [isOpen, sisaTagihan, guaranteeType]);

  const hasBalance = sisaTagihan > 0;
  const needsProof = hasBalance && method !== 'CASH' && !proof;

  const handleSubmit = async () => {
    dispatch({ type: 'SET_FIELD', field: 'loading', value: true });
    dispatch({ type: 'SET_FIELD', field: 'error', value: '' });
    try {
      // 1. Upload photos if any
      const uploadedPhotos = [];
      for (const photo of pickupPhotos) {
        try {
          const res = await uploadRentPhoto(photo.file);
          uploadedPhotos.push(res.data.url);
        } catch (err) {
          console.error("Failed to upload photo", err);
        }
      }

      const paymentPayload = hasBalance && parseInt(amount) > 0
        ? { amount: parseInt(amount), payment_method: method, payment_proof: proof, notes: 'Pelunasan Sewa' }
        : null;

      const payload = {
        guarantee_type: formGuaranteeType,
        payment: paymentPayload,
        pickup_photos: uploadedPhotos,
      };

      await markRented(rentId, payload);
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
    <Modal isOpen={isOpen} onOpenChange={handleClose}>
      <Button className="hidden">Hidden Trigger</Button>
      <Modal.Backdrop>
      <Modal.Container>
        <Modal.Dialog className="bg-[var(--surface)] border border-default-200">
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
            <div className="flex flex-col gap-2">
              <Select
                selectedKey={formGuaranteeType}
                onSelectionChange={(val) => dispatch({ type: 'SET_FIELD', field: 'guaranteeType', value: val })}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'guaranteeType', value: e?.target?.value ?? e })}
              >
                <Label className="text-xs font-semibold mb-1 text-default-600 block">Jaminan yang Ditahan <span className="text-danger">*</span></Label>
                <Select.Trigger className="w-full flex items-center justify-between bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-default-300 data-[focused]:border-primary rounded-lg px-3 py-2 text-sm text-left shadow-sm">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox className="bg-content1 border border-default-200 rounded-lg shadow-lg max-h-60 overflow-y-auto p-1">
                    {GUARANTEE_OPTIONS.map((m) => (
                      <ListBox.Item key={m.id} id={m.id} textValue={m.label} className="px-3 py-2 hover:bg-default-100 cursor-pointer rounded-md text-sm outline-none data-[focused]:bg-default-100">
                        {m.label}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <Checkbox className="mt-1" isSelected={confirmSecurityItem} onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'confirmSecurityItem', value: v })} variant="secondary">
                <Checkbox.Content>
                  <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                  <span className="text-sm font-medium">Saya telah menerima jaminan ini (Wajib)</span>
                </Checkbox.Content>
              </Checkbox>
            </div>

            <div className="flex flex-col gap-2">
              <MultipleImageUpload 
                label="Dokumentasi Pickup (Opsional)" 
                files={pickupPhotos} 
                onFilesChange={(newFiles) => dispatch({ type: 'SET_FIELD', field: 'pickupPhotos', value: newFiles })}
              />
            </div>

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
    </Modal>
  );
};

export default MarkRentedModal;
