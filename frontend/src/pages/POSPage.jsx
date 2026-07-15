import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRent, uploadPaymentProof } from '../api/rentApi';
import { getCostumes } from '../api/costumeApi';
import ClientSelect from '../components/ClientSelect';
import FileUploadZone from '../components/FileUploadZone';
import HeroDatePicker from '../components/HeroDatePicker';
import CostumeCard from '../components/CostumeCard';
import PaymentFormFields from '../components/PaymentFormFields';
import { useSettings } from '../context/SettingsContext';
import { Search, Plus, Minus, Trash2, ShoppingCart, Calendar, User, Package, CheckCircle, ImageOff } from 'lucide-react';
import {
  Input, Button, Card, Separator, Checkbox,
  Select, ListBox, Label, Spinner, TextField, FieldError, InputGroup, Modal
} from '@heroui/react';

const GUARANTEE_TYPES = ['KTP', 'SIM', 'KK', 'Paspor', 'Lainnya'];

const POSPage = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [costumes, setCostumes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [loadingCostumes, setLoadingCostumes] = useState(false);

  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    client: null,
    client_phone: '',
    client_address: '',
    event_date: '',
    guarantee_type: 'KTP',
    has_security_item: false,
    dp_paid: false,
    payment_method: 'CASH',
    payment_proof: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDatePanelCollapsed, setIsDatePanelCollapsed] = useState(false);

  useEffect(() => {
    fetchCostumes(formData.event_date);
  }, [formData.event_date]);

  useEffect(() => {
    if (costumes.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const costumeIdParam = params.get('costumeId');
      const dateParam = params.get('date');

      if (dateParam && !formData.event_date) {
        setFormData(prev => ({ ...prev, event_date: dateParam }));
        setIsDatePanelCollapsed(true);
      }

      if (costumeIdParam) {
        const costume = costumes.find(c => String(c.id) === String(costumeIdParam));
        if (costume) {
          setCart(prev => {
            const existing = prev.find(item => item.id === costume.id);
            if (existing) return prev;
            return [...prev, { ...costume, quantity: 1 }];
          });
        }
      }
    }
  }, [costumes]);

  const fetchCostumes = async (eventDate = '') => {
    setLoadingCostumes(true);
    try {
      const params = { limit: 100 };
      if (eventDate) {
        params.event_date = eventDate;
      }
      const response = await getCostumes(params);
      setCostumes(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch costumes:', error);
    } finally {
      setLoadingCostumes(false);
    }
  };

  const categories = ['all', ...new Set(costumes.map(c => c.category).filter(Boolean))];
  const sizes = ['all', ...new Set(costumes.map(c => c.size).filter(Boolean))];

  const filteredCostumes = costumes.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesSize = selectedSize === 'all' || c.size === selectedSize;
    const matchesAvailability = !showOnlyAvailable || c.available_quantity > 0;
    return matchesSearch && matchesCategory && matchesSize && matchesAvailability;
  });

  const addToCart = (costume) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === costume.id);
      if (existing) {
        if (existing.quantity >= costume.available_quantity) return prev;
        return prev.map(item => item.id === costume.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...costume, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id, delta) => {
    setCart(prev => prev.flatMap(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return [];
        if (newQty > item.available_quantity) return [item];
        return [{ ...item, quantity: newQty }];
      }
      return [item];
    }));
  };

  const updateCartPrice = (id, newPrice) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, rental_fee: Number(newPrice) || 0 };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalFee = cart.reduce((sum, item) => sum + (item.rental_fee * item.quantity), 0);
  const reqDp = totalFee / 2;

  const handleUploadGeneric = async (e, setProofFn, setFileFn, setUploadingFn) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileFn(file.name);
    setUploadingFn(true);
    setErrors(p => ({ ...p, payment_proof: null }));
    try {
      const res = await uploadPaymentProof(file);
      setProofFn(res.data.payment_proof);
    } catch {
      setFileFn(null);
      setErrors(p => ({ ...p, payment_proof: 'Gagal mengunggah file' }));
    } finally {
      setUploadingFn(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.client) newErrors.client = 'Pilih atau buat klien';
    if (!formData.event_date) newErrors.event_date = 'Tanggal Acara wajib diisi';
    if (cart.length === 0) newErrors.cart = 'Keranjang kosong';
    if (formData.dp_paid && formData.payment_method !== 'CASH' && !formData.payment_proof) {
      newErrors.payment_proof = 'Bukti pembayaran downpayment wajib diunggah';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        guarantee_type: '',
        event_date: formData.event_date,
        has_security_item: false,
        status: formData.dp_paid ? 'booked' : 'draft',
        notes: formData.notes,
        items: cart.map(item => ({
          costume_id: item.id,
          quantity: item.quantity,
          custom_rental_fee: item.rental_fee,
        })),
      };

      if (formData.dp_paid) {
        payload.payment = {
          amount: reqDp,
          payment_method: formData.payment_method,
          payment_proof: formData.payment_proof,
          notes: 'Downpayment POS',
        };
      }

      if (formData.client?.type === 'existing') {
        payload.client_id = formData.client.client.id;
      } else if (formData.client?.type === 'new') {
        payload.client_name = formData.client.name;
        payload.client_phone = formData.client_phone;
        payload.client_address = formData.client_address;
      }

      const res = await createRent(payload);
      setIsCheckoutOpen(false);
      
      // Reset POS cart/state
      setCart([]);
      setFormData({
        client: null,
        client_phone: '',
        client_address: '',
        event_date: '',
        guarantee_type: 'KTP',
        has_security_item: false,
        dp_paid: false,
        payment_method: 'CASH',
        payment_proof: '',
        notes: '',
      });
      setProofFile(null);

      navigate(`/rents/${res.data.id}`);
    } catch (error) {
      console.error('Failed to checkout:', error);
      setErrors(p => ({ ...p, submit: error.response?.data?.error || error.message }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 relative pb-24">
      {/* Step 1: Event Date Selector */}
      {formData.event_date && isDatePanelCollapsed ? (
        <div className="bg-white border border-default-200 rounded-xl p-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success/15 text-success text-xs font-bold">✓</span>
            <div className="text-sm font-semibold">
              Tanggal Acara: <span className="text-primary">{formData.event_date}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-default-500 bg-default-100 px-2 py-0.5 rounded-full">
              <span>Ambil: H-{settings.pickup_days_before || 2}</span>
              <span>•</span>
              <span>Kembali: H+{settings.return_days_after || 1}</span>
            </div>
          </div>
          <Button variant="light" color="primary" size="sm" className="font-bold text-xs" onPress={() => setIsDatePanelCollapsed(false)}>
            Ubah Tanggal
          </Button>
        </div>
      ) : (
        <Card className="border border-default-200">
          <Card.Content className="p-4 flex flex-col gap-3">
            <h3 className="font-bold text-base text-default-800 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
              Tentukan Tanggal Acara
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <HeroDatePicker
                isRequired
                label="Tanggal Acara"
                value={formData.event_date}
                onChange={(e) => {
                  setFormData(p => ({ ...p, event_date: e.target.value }));
                  setErrors(p => ({ ...p, event_date: null }));
                }}
                isInvalid={!!errors.event_date}
                errorMessage={errors.event_date}
                className="flex-1 w-full min-w-[240px]"
              />
              {formData.event_date && (
                <div className="flex gap-4 p-3 bg-default-100 rounded-lg text-xs font-medium text-default-600 shrink-0 w-full md:w-auto justify-between md:justify-start">
                  <div>Persiapan Ambil: <span className="text-primary font-semibold">H-{settings.pickup_days_before || 2}</span></div>
                  <Separator orientation="vertical" className="hidden md:block h-4" />
                  <div>Batas Pengembalian: <span className="text-primary font-semibold">H+{settings.return_days_after || 1}</span></div>
                </div>
              )}
            </div>
            {formData.event_date && (
              <div className="flex justify-end mt-1">
                <Button size="sm" color="success" className="font-bold text-xs rounded-full px-4 text-white" onPress={() => setIsDatePanelCollapsed(true)}>
                  Simpan & Lanjutkan
                </Button>
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Step 2: Costume Catalog */}
      <div className="relative flex-1 flex flex-col gap-4">
        {/* Lock Overlay if no date selected */}
        {!formData.event_date && (
          <div className="absolute inset-0 z-20 bg-default-50/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-default-300 min-h-[350px]">
            <div className="bg-primary/10 text-primary p-4 rounded-full mb-3">
              <Calendar size={32} />
            </div>
            <h4 className="font-bold text-lg text-default-800">Tanggal Acara Belum Ditentukan</h4>
            <p className="text-sm text-default-500 max-w-sm mt-1 mb-4">
              Silakan tentukan tanggal acara terlebih dahulu di atas untuk memuat ketersediaan stok pakaian.
            </p>
          </div>
        )}

        <div className={`flex flex-col gap-4 ${!formData.event_date ? 'opacity-30 pointer-events-none' : ''}`}>
          <div className="flex flex-col gap-3 p-1">
            <h3 className="font-bold text-base text-default-800 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
              Pilih Kostum Tersedia
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <InputGroup className="flex-1 w-full !overflow-visible focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200">
                <InputGroup.Prefix>
                  <Search size={18} className="text-default-400" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  placeholder="Cari Kostum atau Aksesoris..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Cari Kostum"
                />
              </InputGroup>

              <div className="flex gap-2 w-full sm:w-auto">
                <Select
                  aria-label="Kategori"
                  className="flex-1 sm:w-[160px]"
                  selectedKey={selectedCategory}
                  onSelectionChange={(key) => setSelectedCategory(key)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Kategori" />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="all" textValue="Semua Kategori">
                        Semua Kategori
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      {categories.filter(c => c !== 'all').map(cat => (
                        <ListBox.Item key={cat} id={cat} textValue={cat}>
                          {cat}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Select
                  aria-label="Ukuran"
                  className="flex-1 sm:w-[120px]"
                  selectedKey={selectedSize}
                  onSelectionChange={(key) => setSelectedSize(key)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Ukuran" />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="all" textValue="Semua Ukuran">
                        Semua Ukuran
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      {sizes.filter(s => s !== 'all').map(sz => (
                        <ListBox.Item key={sz} id={sz} textValue={sz}>
                          {sz}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input type="checkbox" checked={showOnlyAvailable} onChange={(e) => setShowOnlyAvailable(e.target.checked)} className="w-4 h-4 rounded border-default-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer" />
                <span className="text-xs text-default-600 font-medium">Hanya Tampilkan Stok Tersedia</span>
              </label>

              <span className="text-xs text-default-500 font-medium">
                Menampilkan {filteredCostumes.length} dari {costumes.length} kostum
              </span>
            </div>
          </div>

          <div className="overflow-y-auto">
            {loadingCostumes ? (
              <div className="flex justify-center items-center h-48"><Spinner /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10 items-start">
                {filteredCostumes.map(costume => (
                  <CostumeCard
                    key={costume.id}
                    costume={costume}
                    showAvailabilityBadge
                    isDisabled={costume.available_quantity === 0}
                    onClick={() => costume.available_quantity > 0 && addToCart(costume)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Cart Pill */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] shadow-xl rounded-full px-5 py-3 flex items-center gap-6 animate-fade-in max-w-[90%] sm:max-w-md">
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingCart className="text-primary" size={20} />
              <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div className="text-xs font-semibold whitespace-nowrap ml-1">
              Rp {totalFee.toLocaleString('id-ID')}
            </div>
          </div>
          <Button color="primary" size="sm" className="rounded-full font-bold px-5 text-white" onPress={() => setIsCheckoutOpen(true)}>
            Lanjut ke Pembayaran
          </Button>
        </div>
      )}

      {/* Checkout Modal */}
      <Modal.Backdrop isOpen={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
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
                    <div key={item.id} className="grid grid-cols-[auto_1fr] sm:flex sm:items-center sm:justify-between gap-y-3 gap-x-3 w-full bg-default-50/50 hover:bg-default-50 p-3 rounded-xl border border-default-200 transition-colors">
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
                        <Input
                          type="number"
                          size="sm"
                          variant="bordered"
                          value={item.rental_fee}
                          onChange={(e) => updateCartPrice(item.id, e.target.value)}
                          startContent={<span className="text-default-400 text-xs font-semibold">Rp</span>}
                          className="w-28 sm:w-32"
                          classNames={{
                            input: "text-xs font-bold text-default-800",
                            inputWrapper: "h-7 min-h-7 px-2 border-default-200 hover:border-default-300 focus-within:!border-primary rounded-lg",
                          }}
                          aria-label={`Harga sewa untuk ${item.name}`}
                          min="0"
                        />
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
                            classNames={{
                              inputWrapper: "shadow-none border border-default-200 bg-white hover:border-default-300 focus-within:!border-primary rounded-lg"
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
                            classNames={{
                              inputWrapper: "shadow-none border border-default-200 bg-white hover:border-default-300 focus-within:!border-primary rounded-lg"
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
                  <Input
                    classNames={{
                      inputWrapper: "shadow-none border border-default-200 bg-white hover:border-default-300 focus-within:!border-primary rounded-lg"
                    }}
                    placeholder="Masukkan catatan tambahan transaksi..."
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    className="w-full"
                  />
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

              {(errors.submit || Object.keys(errors).filter(k => k !== 'submit').length > 0) && (
                <div className="text-danger text-xs bg-danger-50 p-2.5 rounded border border-danger-200 font-medium">
                  {errors.submit || "Terdapat isian yang belum lengkap atau tidak valid. Silakan periksa kembali form di atas."}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="px-6 py-4 border-t border-default-200 flex items-center justify-end gap-3 flex-shrink-0 bg-[var(--surface)] z-10">
              <Button variant="flat" className="text-default-700 font-semibold bg-default-100 hover:bg-default-200" onPress={() => setIsCheckoutOpen(false)} aria-label="Batal">Batal</Button>
              <Button color="primary" onPress={handleSubmit} isPending={saving} className="text-white font-bold px-6 shadow-md hover:shadow-lg transition-shadow" aria-label="Simpan Transaksi">Simpan Transaksi</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
};

export default POSPage;
