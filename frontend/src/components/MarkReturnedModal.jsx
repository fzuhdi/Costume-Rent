import { useEffect, useReducer } from 'react';
import { Modal, Button, Checkbox, Select, ListBox, Label, Input, TextField } from '@heroui/react';
import { markReturned, uploadPaymentProof } from '../api/rentApi';
import FileUploadZone from './FileUploadZone';

const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
const formatCurrency = (value) => currencyFormatter.format(value);

/**
 * MarkReturnedModal
 *
 * Props:
 *   isOpen               – boolean
 *   onClose              – () => void
 *   onSuccess            – () => void   called after successful API response
 *   rentId               – number       the order ID to transition
 *   sisaTagihan          – number       remaining balance before damage
 *   calculatedDamageFee  – number       pre-filled damage fee suggestion (from prior inspection)
 */

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'CASH' },
  { id: 'TRANSFER BCA', label: 'Transfer BCA' },
  { id: 'TRANSFER BRI', label: 'Transfer BRI' },
  { id: 'TRANSFER MANDIRI', label: 'Transfer Mandiri' },
  { id: 'QRIS', label: 'QRIS' },
];

const initialState = {
  idReturned: false,
  isGoodCondition: true,
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
        amount: action.payload?.sisaTagihan > 0 ? String(action.payload.sisaTagihan) : '',
      };
    case 'TOGGLE_CONDITION': {
      const good = action.value;
      return {
        ...state,
        isGoodCondition: good,
        amount: action.payload?.sisaTagihan > 0 ? String(action.payload.sisaTagihan) : '',
      };
    }
    case 'SET_METHOD':
      return {
        ...state,
        method: action.value,
        proof: '',
        proofFile: null,
      };
    default:
      return state;
  }
}

const MarkReturnedModal = ({
  isOpen,
  onClose,
  onSuccess,
  rentId,
  sisaTagihan = 0,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { idReturned, isGoodCondition, amount, method, proof, proofFile, uploading, loading, error } = state;

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'RESET', payload: { sisaTagihan } });
    }
  }, [isOpen, sisaTagihan]);

  const handleConditionChange = (good) => {
    dispatch({ type: 'TOGGLE_CONDITION', value: good, payload: { sisaTagihan } });
  };

  const totalAmount = parseInt(amount) || 0;
  // Damage fee = whatever is collected above the base sisaTagihan
  const derivedDamageFee = isGoodCondition ? 0 : Math.max(0, totalAmount - sisaTagihan);
  const showPaymentFields = sisaTagihan > 0 || !isGoodCondition;
  const needsProof = showPaymentFields && totalAmount > 0 && method !== 'CASH' && !proof;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    dispatch({ type: 'SET_FIELD', field: 'proofFile', value: file.name });
    dispatch({ type: 'SET_FIELD', field: 'uploading', value: true });
    try {
      const res = await uploadPaymentProof(file);
      dispatch({ type: 'SET_FIELD', field: 'proof', value: res.data.payment_proof });
    } catch {
      dispatch({ type: 'SET_FIELD', field: 'proofFile', value: null });
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'uploading', value: false });
    }
  };

  const handleSubmit = async () => {
    dispatch({ type: 'SET_FIELD', field: 'loading', value: true });
    dispatch({ type: 'SET_FIELD', field: 'error', value: '' });
    try {
      const paymentPayload =
        totalAmount > 0
          ? {
            amount: totalAmount,
            payment_method: method,
            payment_proof: proof,
            notes: isGoodCondition ? 'Sisa Tagihan' : 'Sisa Tagihan / Denda',
          }
          : null;

      await markReturned(rentId, { damage_fee: derivedDamageFee, payment: paymentPayload });
      onClose();
      onSuccess();
    } catch (err) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: err.response?.data?.error || err.message });
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'loading', value: false });
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onClose}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Konfirmasi Pengembalian</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-4">
            {/* Summary box */}
            <div className="p-3 bg-default-50 rounded border flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-default-600">Sisa Tagihan Awal</span>
                <span className="font-semibold">{formatCurrency(sisaTagihan)}</span>
              </div>
              {!isGoodCondition && totalAmount > sisaTagihan && (
                <div className="flex justify-between">
                  <span className="text-default-600">Denda Kerusakan</span>
                  <span className="font-semibold text-danger">{formatCurrency(derivedDamageFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-default-200 pt-1 mt-1">
                <span>Total Harus Dibayar</span>
                <span className="text-primary">{formatCurrency(Math.max(sisaTagihan, totalAmount))}</span>
              </div>
            </div>

            {/* ID returned */}
            <Checkbox isSelected={idReturned} onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'idReturned', value: v })} aria-label="Kartu Identitas Dikembalikan">
              <Checkbox.Content>
                <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                Kartu Identitas Dikembalikan (Wajib)
              </Checkbox.Content>
            </Checkbox>

            {/* Condition — radio-style pair */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-default-600">Kondisi Kostum</span>
              <Checkbox
                isSelected={isGoodCondition}
                onChange={() => handleConditionChange(true)}
                aria-label="Kondisi Baik"
              >
                <Checkbox.Content>
                  <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                  Kondisi Baik
                </Checkbox.Content>
              </Checkbox>
              <Checkbox
                isSelected={!isGoodCondition}
                onChange={() => handleConditionChange(false)}
                aria-label="Ada Kerusakan"
              >
                <Checkbox.Content>
                  <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                  Ada Kerusakan / Denda
                </Checkbox.Content>
              </Checkbox>
            </div>

            {/* Payment fields — appear when balance exists OR damage is flagged */}
            {showPaymentFields && (
              <div className="flex flex-col gap-3">
                <TextField>
                  <Label className="text-xs font-semibold mb-1 text-default-600 block">
                    Total Denda *
                  </Label>
                  <Input
                    type="number"
                    className="w-full bg-content1 border border-default-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder='Masukkan total denda yang harus dibayar'
                    value={amount}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'amount', value: e.target.value })}
                  />
                </TextField>

                <div className="flex flex-col gap-1 w-full">
                  <Label className="text-xs font-semibold mb-1 text-default-600 block">Metode Pembayaran *</Label>
                  <Select
                    aria-label="Metode Pembayaran"
                    value={method}
                    onChange={(key) => {
                      dispatch({ type: 'SET_METHOD', value: String(key) });
                    }}
                    className="w-full"
                  >
                    <Select.Trigger className="w-full bg-content1 border border-default-200 rounded-lg px-3 py-2 text-sm">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox aria-label="Metode Pembayaran">
                        {PAYMENT_METHODS.map((m) => (
                          <ListBox.Item key={m.id} id={m.id} textValue={m.label}>
                            {m.label}<ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                {method !== 'CASH' && (
                  <FileUploadZone
                    uploading={uploading}
                    fileLabel={proofFile}
                    onChange={handleUpload}
                    label="Bukti Pembayaran *"
                  />
                )}
              </div>
            )}

            {error && <p className="text-danger text-sm font-medium">{error}</p>}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="bordered" onPress={onClose} aria-label="Batal">Batal</Button>
            <Button
              color="success"
              className="text-white font-bold"
              onPress={handleSubmit}
              isPending={loading}
              isDisabled={!idReturned || needsProof}
              aria-label="Selesaikan pengembalian"
            >
              Selesaikan Pengembalian
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default MarkReturnedModal;
