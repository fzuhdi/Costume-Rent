import { useEffect, useReducer } from 'react';
import { Modal, Button, Checkbox, Input } from '@heroui/react';
import { markReturned, uploadPaymentProof } from '../api/rentApi';
import PaymentFormFields from './PaymentFormFields';

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


const initialState = {
  idReturned: false,
  isGoodCondition: true,
  damagedItems: {},
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
    case 'UPDATE_DAMAGED_ITEM':
      return {
        ...state,
        damagedItems: {
          ...state.damagedItems,
          [action.costumeId]: action.quantity,
        },
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
  rent,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { idReturned, isGoodCondition, damagedItems, amount, method, proof, proofFile, uploading, loading, error } = state;

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'RESET', payload: { sisaTagihan } });
    }
  }, [isOpen, sisaTagihan]);

  // Recalculate total amount when damaged items change
  useEffect(() => {
    if (isOpen && !isGoodCondition && rent?.items) {
      let suggestedDenda = 0;
      rent.items.forEach(item => {
        const qty = damagedItems[item.costume_id] || 0;
        if (qty > 0) {
          const bp = item.costume?.buy_price || item.buy_price || 0;
          suggestedDenda += bp * qty;
        }
      });
      dispatch({ type: 'SET_FIELD', field: 'amount', value: String(sisaTagihan + suggestedDenda) });
    } else if (isOpen && isGoodCondition) {
      dispatch({ type: 'SET_FIELD', field: 'amount', value: sisaTagihan > 0 ? String(sisaTagihan) : '' });
    }
  }, [damagedItems, isGoodCondition, rent, sisaTagihan, isOpen]);

  const handleConditionChange = (good) => {
    dispatch({ type: 'TOGGLE_CONDITION', value: good, payload: { sisaTagihan } });
    // Also reset damaged items if condition is good
    if (good) {
      dispatch({ type: 'SET_FIELD', field: 'damagedItems', value: {} });
    }
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

      const payloadDamagedItems = Object.entries(damagedItems)
        .map(([costumeId, qty]) => ({ costume_id: parseInt(costumeId), quantity: qty }))
        .filter(item => item.quantity > 0);

      await markReturned(rentId, {
        damage_fee: derivedDamageFee,
        damaged_items: payloadDamagedItems,
        payment: paymentPayload
      });
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
        <Modal.Dialog className="bg-[var(--surface)] border border-default-200">
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
            <Checkbox isSelected={idReturned} onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'idReturned', value: v })} aria-label="Kartu Identitas Dikembalikan" variant="secondary">
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
                variant="secondary"
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
                variant="secondary"
              >
                <Checkbox.Content>
                  <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                  Ada Kerusakan / Denda
                </Checkbox.Content>
              </Checkbox>
              {!isGoodCondition && rent?.items && (
                <div className="flex flex-col gap-2 pl-7 mt-2 border-l-2 border-default-200">
                  <span className="text-xs font-semibold text-default-600 mb-1">Pilih Item yang Rusak</span>
                  {rent.items.map((item) => {
                    const isDamaged = (damagedItems[item.costume_id] || 0) > 0;
                    return (
                      <div key={item.id} className="flex flex-col gap-2 p-2 bg-default-50 rounded">
                        <Checkbox
                          isSelected={isDamaged}
                          onChange={(checked) => {
                            dispatch({
                              type: 'UPDATE_DAMAGED_ITEM',
                              costumeId: item.costume_id,
                              quantity: checked ? 1 : 0
                            });
                          }}
                          aria-label={item.costume_name || item.costume?.name}
                          variant="secondary"
                        >
                          <Checkbox.Content>
                            <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                            {item.costume_name || item.costume?.name} x{item.quantity}
                          </Checkbox.Content>
                        </Checkbox>
                        {isDamaged && (
                          <div className="pl-7">
                            <Input
                              type="number"
                              size="sm"
                              label="Jumlah Rusak"
                              min={1}
                              max={item.quantity}
                              value={String(damagedItems[item.costume_id] || 1)}
                              onChange={(e) => {
                                let val = parseInt(e.target.value) || 1;
                                if (val > item.quantity) val = item.quantity;
                                if (val < 1) val = 1;
                                dispatch({
                                  type: 'UPDATE_DAMAGED_ITEM',
                                  costumeId: item.costume_id,
                                  quantity: val
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment fields — appear when balance exists OR damage is flagged */}
            {showPaymentFields && (
              <div className="flex flex-col gap-3">
                <PaymentFormFields
                  amount={amount}
                  setAmount={(val) => dispatch({ type: 'SET_FIELD', field: 'amount', value: val })}
                  method={method}
                  setMethod={(val) => dispatch({ type: 'SET_METHOD', value: String(val) })}
                  proofFile={proofFile}
                  setProofFile={(val) => dispatch({ type: 'SET_FIELD', field: 'proofFile', value: val })}
                  uploadingProof={uploading}
                  handleUploadGeneric={handleUpload}
                  amountLabel="Total Denda *"
                />
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
