import { Modal, Input, Button, Separator, Label, InputGroup } from '@heroui/react';
import { ShoppingCart, ImageOff, Minus, Plus, Trash2 } from 'lucide-react';
import ClientSelect from '../ClientSelect';
import PaymentFormFields from '../PaymentFormFields';

const POSCheckoutModal = ({
  isOpen,
  onOpenChange,
  cart,
  updateCartPrice,
  updateCartQuantity,
  removeFromCart,
  formData,
  setFormData,
  errors,
  setErrors,
  proofFile,
  setProofFile,
  uploadingProof,
  setUploadingProof,
  handleUploadGeneric,
  totalFee,
  reqDp,
  handleSubmit,
  saving
}) => {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="max-w-xl w-full max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-default-200 bg-[var(--surface)]">
          <Modal.Header className="px-6 py-4 border-b border-default-200 block text-left flex-shrink-0 bg-[var(--surface)] z-10">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              <Modal.Heading className="text-lg font-bold text-[var(--foreground)]">Checkout Transaksi</Modal.Heading>
            </div>
            <p className="text-[11px] text-default-500 mt-1">Konfirmasi pakaian pilihan dan lengkapi detail penyewaan</p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-5 p-6 overflow-y-auto flex-1 scrollbar-thin">
            {/* Cart Review */}
            <div>
              <h4 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-3">Review Pakaian Pilihan</h4>
              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1 w-full scrollbar-thin">
                {cart.map(item => (
                  <div key={item.id} className="grid grid-cols-[auto_1fr] sm:flex sm:items-center sm:justify-between gap-y-3 gap-x-3 w-full bg-default-50 hover:bg-default-100 p-3 rounded-xl border border-default-200 transition-colors">
                    <div className="w-12 h-12 bg-default-100 rounded-lg overflow-hidden flex-shrink-0 border border-default-200 relative row-span-2 sm:row-span-1">
                      {item.cover_image ? (
                        <img src={item.cover_image.startsWith('http') ? item.cover_image : `${import.meta.env.VITE_API_URL || ''}${item.cover_image}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-default-400 bg-default-50">
                          <ImageOff size={18} className="opacity-40" />
                        </div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1 col-start-2 row-start-1 self-center">
                      <h5 className="font-semibold text-sm truncate text-default-800">{item.name}</h5>
                    </div>

                    <div className="col-start-2 row-start-2 sm:row-start-1 flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto sm:ml-auto">
                      <InputGroup className="w-28 sm:w-32 h-7 min-h-7 border border-default-200 hover:border-default-300 focus-within:!border-primary rounded-lg overflow-hidden">
                        <InputGroup.Prefix className="bg-default-100 border-r border-default-200 px-2"><span className="text-default-400 text-[10px] font-semibold">Rp</span></InputGroup.Prefix>
                        <InputGroup.Input
                          type="number"
                          value={item.rental_fee}
                          onChange={(e) => updateCartPrice(item.id, e.target.value)}
                          className="text-xs font-bold text-default-800 h-full border-none shadow-none focus:ring-0 px-2"
                          aria-label={`Harga sewa untuk ${item.name}`}
                          min="0"
                        />
                      </InputGroup>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-default-200/80 p-0.5 rounded-lg border border-default-300">
                          <Button isIconOnly size="xs" variant="light" className="h-6 w-6 min-w-6 p-0 hover:bg-default-300/50" onPress={() => updateCartQuantity(item.id, -1)}><Minus size={10} /></Button>
                          <span className="text-xs w-6 text-center font-bold text-default-800">{item.quantity}</span>
                          <Button isIconOnly size="xs" variant="light" className="h-6 w-6 min-w-6 p-0 hover:bg-default-300/50" onPress={() => updateCartQuantity(item.id, 1)} isDisabled={item.quantity >= item.available_quantity}><Plus size={10} /></Button>
                        </div>
                        <Button isIconOnly size="xs" color="danger" variant="light" className="h-7 w-7 min-w-7 p-0 text-default-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg" onPress={() => removeFromCart(item.id)}><Trash2 size={14} /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-default-100" />

            {/* Client Selection & Downpayment */}
            <div className="flex flex-col gap-4">
              <div>
                <ClientSelect value={formData.client} onChange={(c) => {
                  setFormData(p => ({ ...p, client: c, client_phone: c?.client?.phone || p.client_phone, client_address: c?.client?.address || p.client_address }));
                  setErrors(p => ({ ...p, client: null }));
                }} error={errors.client} />
                {formData.client?.type === 'new' && (
                  <div className="flex flex-col gap-3 mt-1 ml-3 pl-4 border-l-2 border-default-200 relative pb-1">
                    <div className="absolute -left-[10px] top-6 w-4 h-[2px] bg-default-200"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] font-semibold text-default-700 block">No HP *</Label>
                        <Input 
                          size="sm" 
                          variant="bordered"
                          classNames={{
                            inputWrapper: "bg-white shadow-none border-default-200 hover:border-default-300 focus-within:!border-primary rounded-lg px-3 py-1.5"
                          }}
                          placeholder="Contoh: 08123456789" 
                          value={formData.client_phone} 
                          onChange={(e) => setFormData(p => ({ ...p, client_phone: e.target.value }))} 
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] font-semibold text-default-700 block">Alamat Klien *</Label>
                        <Input 
                          size="sm" 
                          variant="bordered"
                          classNames={{
                            inputWrapper: "bg-white shadow-none border-default-200 hover:border-default-300 focus-within:!border-primary rounded-lg px-3 py-1.5"
                          }}
                          placeholder="Alamat lengkap..." 
                          value={formData.client_address} 
                          onChange={(e) => setFormData(p => ({ ...p, client_address: e.target.value }))} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`flex flex-col justify-center gap-2 p-4 rounded-xl border transition-all duration-300 w-full border-default-200 bg-default-50`}>
                <label className="flex items-center gap-3.5 cursor-pointer py-0.5">
                  <input 
                    type="checkbox" 
                    checked={formData.dp_paid} 
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData(p => ({ ...p, dp_paid: checked, payment_proof: checked ? p.payment_proof : '' }));
                      if (!checked) {
                        setProofFile(null);
                      }
                      setErrors(p => ({ ...p, payment_proof: null }));
                    }} 
                    className="w-4.5 h-4.5 rounded border-default-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer" 
                  />
                  <div>
                    <span className="text-sm font-semibold text-default-800 block">DP Sudah Dibayar</span>
                    <span className="text-[11px] text-default-500 block">Lengkapi jika penyewa telah membayar uang muka (downpayment)</span>
                  </div>
                </label>

                {formData.dp_paid && (
                  <div className="mt-2.5 flex flex-col gap-1 border-t border-default-200 pt-3 w-full">
                    <PaymentFormFields
                      amount={reqDp}
                      setAmount={() => {}}
                      method={formData.payment_method}
                      setMethod={(val) => setFormData(p => ({ ...p, payment_method: val }))}
                      proof={formData.payment_proof}
                      setProof={(val) => setFormData(p => ({ ...p, payment_proof: val }))}
                      proofFile={proofFile}
                      setProofFile={setProofFile}
                      uploadingProof={uploadingProof}
                      setUploadingProof={setUploadingProof}
                      hideAmount={true}
                      errors={errors}
                      handleUploadGeneric={handleUploadGeneric}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <Label className="text-xs font-semibold text-default-700 block">Catatan Peminjaman</Label>
                <InputGroup className="flex-1 bg-white shadow-none border border-default-200 hover:border-default-300 focus-within:!border-primary rounded-lg px-3 py-2 text-sm">
                  <InputGroup.Input
                    placeholder="Catatan tambahan (opsional)..."
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  />
                </InputGroup>
              </div>
            </div>

            <Separator className="bg-default-100" />

            {/* Receipt Summary */}
            <div className="bg-default-50 border border-default-200 rounded-xl p-4 flex flex-col gap-2.5 font-sans shadow-sm">
              <div className="flex justify-between items-center text-xs text-default-500 font-medium">
                <span>Total Item ({cart.reduce((sum, item) => sum + item.quantity, 0)} pakaian)</span>
                <span>Rp {totalFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="border-t border-dashed border-default-300 my-1"></div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs text-default-500 font-semibold block mb-0.5">Total Tagihan</span>
                  <span className="text-lg font-bold text-primary">Rp {totalFee.toLocaleString('id-ID')}</span>
                </div>
                {formData.dp_paid && (
                  <div className="text-right">
                    <span className="text-xs text-default-500 font-semibold block mb-0.5">Minimal DP (50%)</span>
                    <span className="text-sm font-bold text-warning-600">Rp {reqDp.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>

            {(errors.submit || Object.entries(errors).some(([k, v]) => k !== 'submit' && !!v)) && (
              <div className="text-danger text-xs bg-danger-50 p-2.5 rounded border border-danger-200 font-medium">
                {errors.submit || "Terdapat isian yang belum lengkap atau tidak valid. Silakan periksa kembali form di atas."}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="px-6 py-4 border-t border-default-200 flex items-center justify-end gap-3 flex-shrink-0 bg-[var(--surface)] z-10">
            <Button variant="flat" className="text-default-700 font-semibold bg-default-100 hover:bg-default-200" onPress={() => onOpenChange(false)} aria-label="Batal">Batal</Button>
            <Button color="primary" onPress={handleSubmit} isPending={saving} className="text-white font-bold px-6 shadow-md hover:shadow-lg transition-shadow" aria-label="Simpan Transaksi">Simpan Transaksi</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default POSCheckoutModal;
