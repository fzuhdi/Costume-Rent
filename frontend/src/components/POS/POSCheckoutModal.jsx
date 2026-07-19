import { useState } from 'react';
import { Modal, Input, Button, InputGroup, TextArea, Tabs, RadioGroup, Radio } from '@heroui/react';
import { ShoppingCart, ImageOff, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
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
  const [step, setStep] = useState("1");

  const handleOpenChangeWrapper = (open) => {
    onOpenChange(open);
    if (!open) setStep("1");
  };

  const handleNext = () => {
    if (step === "1") {
      if (cart.length === 0) return;
      setStep("2");
    } else {
      if (!formData.client) {
        setErrors(p => ({ ...p, client: 'Pilih klien terlebih dahulu' }));
        return;
      }
      handleSubmit();
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChangeWrapper}>
      <Modal.Backdrop>
      <Modal.Container>
        <Modal.Dialog className="max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-default-200 bg-[var(--surface)]">
          <Modal.Header className="px-4 sm:px-6 py-4 border-b border-default-200 block text-left flex-shrink-0 bg-[var(--surface)] z-10">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              <Modal.Heading className="text-lg font-bold text-[var(--foreground)]">Checkout Transaksi</Modal.Heading>
            </div>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-0 p-0 overflow-hidden flex-1 bg-default-50/50">
            <Tabs
              variant="underlined"
              selectedKey={step}
              onSelectionChange={(key) => setStep(key.toString())}
              className="flex-1 flex flex-col overflow-hidden w-full"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none p-0",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-0 h-12",
                tabContent: "group-data-[selected=true]:text-primary font-semibold text-sm"
              }}
            >
              <Tabs.ListContainer className="px-4 sm:px-6 pt-2 bg-[var(--surface)] border-b border-default-200 shrink-0">
                <Tabs.List aria-label="Checkout Steps" className="flex gap-6 w-full">
                  <Tabs.Tab id="1">1. Review Pakaian<Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="2" isDisabled={cart.length === 0}>2. Klien & Pembayaran<Tabs.Indicator /></Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin relative">
                <Tabs.Panel id="1" className="flex flex-col gap-6 outline-none">
                  {/* Cart Review ONLY */}
                  <div>
                    <h4 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-4 hidden sm:block">Daftar Item Pilihan</h4>
                    <div className="flex flex-col gap-3">
                      {cart.length === 0 ? (
                        <div className="text-center py-8 text-default-400 bg-content1 border border-default-200 rounded-xl">Keranjang kosong</div>
                      ) : cart.map(item => (
                        <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-y-4 gap-x-4 w-full bg-content1 p-4 rounded-xl border border-default-200 transition-colors shadow-sm">
                          <div className="flex items-center gap-4 col-span-1 sm:col-span-2">
                            <div className="w-16 h-16 bg-default-100 rounded-xl overflow-hidden flex-shrink-0 border border-default-200 relative">
                              {item.cover_image ? (
                                <img src={item.cover_image.startsWith('http') ? item.cover_image : `${import.meta.env.VITE_API_URL || ''}${item.cover_image}`} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-default-400 bg-default-50">
                                  <ImageOff size={24} className="opacity-40" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-base text-default-800 line-clamp-2">{item.name}</h5>
                              <span className="text-xs text-default-500 font-medium">Stok: {item.available_quantity}</span>
                            </div>
                          </div>

                          <div className="col-span-1 sm:col-span-1 flex flex-col sm:flex-row items-end sm:items-center justify-between sm:justify-end gap-3 w-full border-t sm:border-t-0 border-default-100 pt-3 sm:pt-0">
                            <InputGroup className="w-full sm:w-44 h-10 min-h-10 border border-default-200 hover:border-default-300 focus-within:!border-primary rounded-xl overflow-hidden shadow-sm">
                              <InputGroup.Prefix className="bg-default-50 border-r border-default-200 px-3"><span className="text-default-500 text-xs font-semibold">Rp</span></InputGroup.Prefix>
                              <InputGroup.Input
                                type="number"
                                value={item.rental_fee}
                                onChange={(e) => updateCartPrice(item.id, e.target.value)}
                                className="text-sm font-bold text-default-800 h-full border-none shadow-none focus:ring-0 px-3"
                                aria-label={`Harga sewa untuk ${item.name}`}
                                min="0"
                              />
                            </InputGroup>

                            <div className="flex items-center gap-2 w-full justify-between sm:w-auto">
                              <div className="flex items-center gap-1.5 bg-default-100 p-1 rounded-xl border border-default-200 flex-1 sm:flex-none justify-center">
                                <Button isIconOnly size="sm" variant="light" className="h-8 w-8 min-w-8 p-0 hover:bg-default-200 rounded-lg shadow-sm" onPress={() => updateCartQuantity(item.id, -1)}><Minus size={14} /></Button>
                                <span className="text-sm w-8 text-center font-bold text-default-800">{item.quantity}</span>
                                <Button isIconOnly size="sm" variant="light" className="h-8 w-8 min-w-8 p-0 hover:bg-default-200 rounded-lg shadow-sm" onPress={() => updateCartQuantity(item.id, 1)} isDisabled={item.quantity >= item.available_quantity}><Plus size={14} /></Button>
                              </div>
                              <Button isIconOnly size="sm" color="danger" variant="light" className="h-10 w-10 min-w-10 p-0 text-default-400 hover:text-danger-500 hover:bg-danger-50 rounded-xl" onPress={() => removeFromCart(item.id)}><Trash2 size={18} /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Tabs.Panel>

                <Tabs.Panel id="2" className="flex flex-col gap-6 outline-none">
                  {/* Client Form */}
                  <div>
                    <h4 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-4">Identitas Penyewa</h4>
                    <div className="bg-content1 p-4 sm:p-5 rounded-xl border border-default-200 shadow-sm">
                      <ClientSelect value={formData.client} onChange={(c) => {
                        setFormData(p => ({ ...p, client: c, client_phone: c?.client?.phone || p.client_phone, client_address: c?.client?.address || p.client_address }));
                        setErrors(p => ({ ...p, client: null }));
                      }} error={errors.client} />
                      {formData.client?.type === 'new' && (
                        <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-default-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-semibold text-default-700 block">No HP *</label>
                              <Input
                                variant="bordered"
                                classNames={{
                                  inputWrapper: "bg-default-50 shadow-none border-default-200 hover:border-default-300 focus-within:!border-primary rounded-xl px-3"
                                }}
                                placeholder="Contoh: 08123456789"
                                value={formData.client_phone}
                                onChange={(e) => setFormData(p => ({ ...p, client_phone: e.target.value }))}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-semibold text-default-700 block">Alamat Klien *</label>
                              <Input
                                variant="bordered"
                                classNames={{
                                  inputWrapper: "bg-default-50 shadow-none border-default-200 hover:border-default-300 focus-within:!border-primary rounded-xl px-3"
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
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-4">Pembayaran & Catatan</h4>
                    <div className="flex flex-col gap-4 bg-content1 p-4 sm:p-5 rounded-xl border border-default-200 shadow-sm">
                      <RadioGroup
                        label="Status Pembayaran Awal"
                        aria-label="Status Pembayaran Awal"
                        orientation="horizontal"
                        value={formData.payment_status}
                        onChange={(val) => {
                          setFormData(p => ({ ...p, payment_status: val, payment_proof: val === 'none' ? '' : p.payment_proof }));
                          if (val === 'none') setProofFile(null);
                          setErrors(p => ({ ...p, payment_proof: null }));
                        }}
                        classNames={{
                          label: "text-xs font-bold text-default-400 uppercase tracking-wider mb-2",
                          wrapper: "gap-4"
                        }}
                        variant="secondary"
                      >
                        <Radio 
                          value="none" 
                          aria-label="Belum Bayar"
                          className="hover:bg-default-100 p-2 rounded-xl transition-colors cursor-pointer m-0"
                        >
                          <Radio.Content className="flex items-center gap-2">
                            <Radio.Control>
                              <Radio.Indicator />
                            </Radio.Control>
                            <span className="text-sm font-semibold text-default-800">Belum Bayar</span>
                          </Radio.Content>
                        </Radio>
                        <Radio 
                          value="dp" 
                          aria-label="DP (50%)"
                          className="hover:bg-default-100 p-2 rounded-xl transition-colors cursor-pointer m-0"
                        >
                          <Radio.Content className="flex items-center gap-2">
                            <Radio.Control>
                              <Radio.Indicator />
                            </Radio.Control>
                            <span className="text-sm font-semibold text-default-800">DP (50%)</span>
                          </Radio.Content>
                        </Radio>
                        <Radio 
                          value="full" 
                          aria-label="Lunas (100%)"
                          className="hover:bg-default-100 p-2 rounded-xl transition-colors cursor-pointer m-0"
                        >
                          <Radio.Content className="flex items-center gap-2">
                            <Radio.Control>
                              <Radio.Indicator />
                            </Radio.Control>
                            <span className="text-sm font-semibold text-default-800">Lunas (100%)</span>
                          </Radio.Content>
                        </Radio>
                      </RadioGroup>

                      {formData.payment_status !== 'none' && (
                        <div className="mt-2 flex flex-col gap-1 border-t border-default-100 pt-4 w-full">
                          <PaymentFormFields
                            amount={formData.payment_status === 'dp' ? reqDp : totalFee}
                            setAmount={() => { }}
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

                      <div className="w-full mt-2 pt-4 border-t border-default-100 flex flex-col">
                        <label className="text-xs font-semibold text-default-700 block mb-2">Catatan Peminjaman (Opsional)</label>
                        <TextArea
                          fullWidth
                          placeholder="Tuliskan catatan tambahan (Opsional)..."
                          value={formData.notes}
                          onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                          rows={3}
                          className="bg-default-50 shadow-none border border-default-200 hover:border-default-300 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl outline-none w-full resize-none p-3 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {(errors.submit || Object.entries(errors).some(([k, v]) => k !== 'submit' && !!v)) && (
                    <div className="text-danger text-sm bg-danger-50 p-4 rounded-xl border border-danger-200 font-medium">
                      {errors.submit || "Terdapat isian yang belum lengkap atau tidak valid. Silakan periksa kembali form di atas."}
                    </div>
                  )}
                </Tabs.Panel>
              </div>
            </Tabs>

            {/* Persistent Receipt Summary */}
            <div className="mt-auto px-4 sm:px-6 py-4 bg-[var(--surface)] border-t border-default-200 z-10 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6">
                <div className="flex-1 flex items-center justify-between bg-default-50/50 rounded-xl p-3 border border-default-200">
                  <div>
                    <span className="text-xs text-default-500 font-semibold block mb-0.5">Total Tagihan ({cart.reduce((sum, item) => sum + item.quantity, 0)} item)</span>
                    <span className="text-xl font-bold text-primary">Rp {totalFee.toLocaleString('id-ID')}</span>
                  </div>
                  {formData.payment_status === 'dp' && (
                    <div className="text-right border-l border-default-200 pl-4">
                      <span className="text-xs text-default-500 font-semibold block mb-0.5">Dibayar (DP 50%)</span>
                      <span className="text-base font-bold text-warning-600">Rp {reqDp.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {formData.payment_status === 'full' && (
                    <div className="text-right border-l border-default-200 pl-4">
                      <span className="text-xs text-default-500 font-semibold block mb-0.5">Dibayar (Lunas)</span>
                      <span className="text-base font-bold text-success-600">Rp {totalFee.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 flex items-center gap-3">
                  <Button variant="flat" className="text-default-700 font-semibold bg-default-100 hover:bg-default-200 h-12 px-6 flex-1 sm:flex-none" onPress={() => handleOpenChangeWrapper(false)} aria-label="Batal">Batal</Button>
                  {step === "1" ? (
                    <Button color="primary" onPress={handleNext} className="text-white font-bold h-12 px-8 shadow-md hover:shadow-lg transition-shadow flex-1 sm:flex-none">
                      Lanjut <ArrowRight size={16} />
                    </Button>
                  ) : (
                    <Button color="primary" onPress={handleNext} isPending={saving} className="text-white font-bold h-12 px-8 shadow-md hover:shadow-lg transition-shadow flex-1 sm:flex-none" aria-label="Simpan Transaksi">
                      Simpan Transaksi
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
    </Modal>
  );
};

export default POSCheckoutModal;
