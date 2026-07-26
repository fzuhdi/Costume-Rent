import { useEffect, useReducer } from 'react';
import { Modal, Button, Checkbox } from '@heroui/react';
import { receiveOrder, uploadRentPhoto } from '@/api/rentApi';
import MultipleImageUpload from '@/components/MultipleImageUpload';

const initialState = {
  guaranteeReturned: false,
  returnPhotos: [],
  loading: false,
  error: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const MarkReturnedModal = ({ isOpen, onClose, onSuccess, rentId, guaranteeType }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { guaranteeReturned, returnPhotos, loading, error } = state;

  useEffect(() => {
    if (isOpen) dispatch({ type: 'RESET' });
  }, [isOpen]);

  const handleSubmit = async () => {
    dispatch({ type: 'SET_FIELD', field: 'loading', value: true });
    dispatch({ type: 'SET_FIELD', field: 'error', value: '' });
    try {
      const uploadedPhotos = [];
      for (const photo of returnPhotos) {
        try {
          const res = await uploadRentPhoto(photo.file);
          uploadedPhotos.push(res.data.url);
        } catch (err) {
          console.error('Failed to upload return photo', err);
        }
      }

      await receiveOrder(rentId, {
        guarantee_returned: guaranteeReturned,
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
      <Button className="hidden">Hidden Trigger</Button>
      <Modal.Backdrop>
      <Modal.Container>
        <Modal.Dialog className="bg-[var(--surface)] border border-default-200">
          <Modal.Header>
            <Modal.Heading>Terima Kostum</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-5">
            <p className="text-sm text-default-600">
              Konfirmasi bahwa kostum telah diterima kembali dan waktu denda akan dihentikan.
            </p>

            {/* Guarantee confirmation */}
            <div className="bg-default-50 border border-default-200 rounded-xl p-4">
              <Checkbox
                isSelected={guaranteeReturned}
                onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'guaranteeReturned', value: v })}
                aria-label="Jaminan dikembalikan ke penyewa"
                variant="secondary"
              >
                <Checkbox.Content>
                  <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Jaminan Dikembalikan ke Penyewa</span>
                    {guaranteeType && (
                      <span className="text-xs text-default-500 mt-0.5">
                        Jenis jaminan: <span className="font-medium">{guaranteeType}</span>
                      </span>
                    )}
                  </div>
                </Checkbox.Content>
              </Checkbox>
            </div>

            {/* Return photos */}
            <MultipleImageUpload
              label="Foto Penerimaan (Opsional)"
              files={returnPhotos}
              onFilesChange={(newFiles) => dispatch({ type: 'SET_FIELD', field: 'returnPhotos', value: newFiles })}
            />

            {error && <p className="text-danger text-sm font-medium">{error}</p>}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline" onPress={onClose} aria-label="Batal">Batal</Button>
            <Button
              onPress={handleSubmit}
              isPending={loading}
              isDisabled={!guaranteeReturned}
              aria-label="Ya, Terima Kostum"
            >
              Ya, Terima Kostum
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default MarkReturnedModal;
