import { useEffect, useReducer } from 'react';
import { Modal, Button, Checkbox, Input } from '@heroui/react';
import { markReturned, uploadRentPhoto } from '../api/rentApi';
import MultipleImageUpload from './MultipleImageUpload';

const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
const formatCurrency = (value) => currencyFormatter.format(value);

const initialState = {
  idReturned: false,
  isGoodCondition: true,
  damagedItems: {},
  damageFee: '',
  loading: false,
  error: '',
  returnPhotos: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return initialState;
    case 'TOGGLE_CONDITION': {
      const good = action.value;
      return {
        ...state,
        isGoodCondition: good,
        damageFee: good ? '' : state.damageFee,
      };
    }
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
  rent,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { idReturned, isGoodCondition, damagedItems, damageFee, loading, error, returnPhotos } = state;

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'RESET' });
    }
  }, [isOpen]);

  // Recalculate suggested damage fee when damaged items change
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
      dispatch({ type: 'SET_FIELD', field: 'damageFee', value: suggestedDenda > 0 ? String(suggestedDenda) : '' });
    } else if (isOpen && isGoodCondition) {
      dispatch({ type: 'SET_FIELD', field: 'damageFee', value: '' });
    }
  }, [damagedItems, isGoodCondition, rent, isOpen]);

  const handleConditionChange = (good) => {
    dispatch({ type: 'TOGGLE_CONDITION', value: good });
    if (good) {
      dispatch({ type: 'SET_FIELD', field: 'damagedItems', value: {} });
    }
  };

  const derivedDamageFee = isGoodCondition ? 0 : (parseInt(damageFee) || 0);

  const handleSubmit = async () => {
    dispatch({ type: 'SET_FIELD', field: 'loading', value: true });
    dispatch({ type: 'SET_FIELD', field: 'error', value: '' });
    try {
      const payloadDamagedItems = Object.entries(damagedItems)
        .map(([costumeId, qty]) => ({ costume_id: parseInt(costumeId), quantity: qty }))
        .filter(item => item.quantity > 0);

      // 1. Upload photos if any
      const uploadedPhotos = [];
      for (const photo of returnPhotos) {
        try {
          const res = await uploadRentPhoto(photo.file);
          uploadedPhotos.push(res.data.url);
        } catch (err) {
          console.error("Failed to upload photo", err);
        }
      }

      await markReturned(rentId, {
        damage_fee: derivedDamageFee,
        damaged_items: payloadDamagedItems,
        payment: null, // explicitly no payment
        return_photos: uploadedPhotos,
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
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <Modal.Backdrop>
      <Modal.Container>
        <Modal.Dialog className="bg-[var(--surface)] border border-default-200">
          <Modal.Header>
            <Modal.Heading>Inspeksi Kostum</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-4">
            {/* ID returned */}
            <Checkbox isSelected={idReturned} onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'idReturned', value: v })} aria-label="Kartu Identitas Dikembalikan" variant="secondary">
              <Checkbox.Content>
                <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                Kartu Identitas Dikembalikan (Wajib)
              </Checkbox.Content>
            </Checkbox>

            {/* Condition */}
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
                            <div className="flex flex-col">
                              <span className="text-sm">{item.costume_name || item.costume?.name} <span className="text-default-500 text-xs">x{item.quantity}</span></span>
                              <span className="text-default-400 text-xs mt-0.5">
                                Sewa: {item.custom_rental_fee || item.costume?.rental_fee ? formatCurrency(item.custom_rental_fee || item.costume?.rental_fee) : '-'} • Beli: {item.costume?.buy_price ? formatCurrency(item.costume.buy_price) : '-'}
                              </span>
                            </div>
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
                  
                  <div className="mt-3">
                    <Input 
                      type="number"
                      label="Total Denda *"
                      value={damageFee}
                      onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'damageFee', value: e.target.value })}
                      placeholder="Masukkan nominal denda"
                      description={derivedDamageFee > 0 ? `Akan ditambahkan ke tagihan: ${formatCurrency(derivedDamageFee)}` : ''}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <MultipleImageUpload 
                label="Dokumentasi Return (Opsional)" 
                files={returnPhotos} 
                onFilesChange={(newFiles) => dispatch({ type: 'SET_FIELD', field: 'returnPhotos', value: newFiles })}
              />
            </div>

            {error && <p className="text-danger text-sm font-medium">{error}</p>}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="bordered" onPress={onClose} aria-label="Batal">Batal</Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isPending={loading}
              isDisabled={!idReturned || (!isGoodCondition && derivedDamageFee <= 0)}
              aria-label="Simpan Inspeksi"
            >
              Simpan Inspeksi
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
    </Modal>
  );
};

export default MarkReturnedModal;
