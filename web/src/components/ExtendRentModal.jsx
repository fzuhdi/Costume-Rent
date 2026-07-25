import { useState } from 'react';
import { Modal, Button, TextField, Label, Input } from '@heroui/react';
import { extendRent } from '@/api/rentApi';

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
const formatCurrency = (value) => idrFormatter.format(value);

/**
 * ExtendRentModal
 *
 * Props:
 *   isOpen    – boolean
 *   onClose   – () => void
 *   onSuccess – () => void   called after successful API response
 *   rentId    – number       the order ID to extend
 *   dailyFee  – number       total base fee per day (used for cost preview)
 */
const ExtendRentModal = ({ isOpen, onClose, onSuccess, rentId, dailyFee = 0 }) => {
  const [extraDays, setExtraDays] = useState('1');
  const [customExtensionFee, setCustomExtensionFee] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    const defaultFee = dailyFee * parseInt(extraDays);
    const customFee = parseInt(customExtensionFee);
    try {
      const payload = { extra_days: parseInt(extraDays) };
      if (!isNaN(customFee) && customFee !== defaultFee) {
        payload.custom_extension_fee = customFee;
      }
      await extendRent(rentId, payload);
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setExtraDays('1');
    setCustomExtensionFee('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose}>
      <Button className="hidden">Hidden Trigger</Button>
      <Modal.Backdrop>
      <Modal.Container>
        <Modal.Dialog className="bg-[var(--surface)] border border-default-200">
          <Modal.Header>
            <Modal.Heading>Perpanjang Sewa</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-4">
            <TextField>
              <Label className="text-xs font-semibold mb-1 text-default-600 block">
                Tambah Hari
              </Label>
              <Input
                aria-label="Tambah Hari"
                type="number"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                placeholder="1"
                min="1"
                value={extraDays}
                onChange={(e) => setExtraDays(e.target.value)}
              />
            </TextField>

            <TextField>
              <Label className="text-xs font-semibold mb-1 text-default-600 block">
                Biaya Tambahan (Modifikasi)
              </Label>
              <Input
                aria-label="Biaya Tambahan"
                type="number"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                placeholder={dailyFee * parseInt(extraDays || 0)}
                value={customExtensionFee}
                onChange={(e) => setCustomExtensionFee(e.target.value)}
              />
            </TextField>

            {parseInt(extraDays) > 0 && (
              <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg flex justify-between items-center font-semibold">
                <span className="text-sm text-primary">Biaya Asli (Full Order):</span>
                <span className="text-primary">{formatCurrency(dailyFee * parseInt(extraDays))}</span>
              </div>
            )}

            <p className="text-xs text-default-500 mt-2">
              Biaya perpanjangan akan ditambahkan ke tagihan akhir dan dapat dilunasi saat pengembalian.
            </p>

            {error && <p className="text-danger text-sm font-medium">{error}</p>}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="bordered" onPress={handleClose} aria-label="Batal">
              Batal
            </Button>
            <Button
              color="secondary"
              className="font-bold"
              onPress={handleSubmit}
              isPending={loading}
              isDisabled={!parseInt(extraDays) || parseInt(extraDays) < 1}
              aria-label="Perpanjang sewa"
            >
              Perpanjang
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
    </Modal>
  );
};

export default ExtendRentModal;
