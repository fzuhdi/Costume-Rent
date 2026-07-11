import { Modal, Input, Button } from '@heroui/react';

const RentReturnModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  idReturned, 
  setIdReturned, 
  isGoodCondition, 
  setIsGoodCondition, 
  damageFee, 
  setDamageFee, 
  actionLoading 
}) => {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onClose}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Konfirmasi Pengembalian</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-4">
              <p>Tandai kostum sudah dikembalikan?</p>
              <div className="flex flex-col gap-2 p-3 bg-default-50 rounded-lg border border-default-200">
                  <p className="text-sm font-semibold">Ceklist Pemeriksaan:</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={idReturned} onChange={(e) => setIdReturned(e.target.checked)} /> 
                    <span className="text-sm">Kartu ID Dikembalikan ke Klien</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isGoodCondition} onChange={(e) => setIsGoodCondition(e.target.checked)} /> 
                    <span className="text-sm">Kostum Dalam Kondisi Baik (Tidak Ada Denda)</span>
                  </label>
              </div>

              {!isGoodCondition && (
                <Input 
                  type="number"
                  label="Denda Kerusakan (Rp)"
                  placeholder="Masukkan nominal denda"
                  value={damageFee}
                  onChange={(e) => setDamageFee(e.target.value)}
                  min="0"
                />
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
              <Button variant="bordered" onPress={onClose} aria-label="Batal">Batal</Button>
              <Button variant="secondary" onPress={onConfirm} isDisabled={!idReturned} isPending={actionLoading} aria-label="Kembalikan peminjaman">Kembalikan</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default RentReturnModal;
