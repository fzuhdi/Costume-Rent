import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRent, uploadPaymentProof } from '../api/rentApi';
import { getCostumes } from '../api/costumeApi';
import ClientSelect from '../components/ClientSelect';
import { useSettings } from '../context/SettingsContext';
import { ShoppingCart, Search, Plus, Minus, Trash2, Calendar } from 'lucide-react';
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

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalFee = cart.reduce((sum, item) => sum + (item.rental_fee * item.quantity), 0);
  const reqDp = totalFee / 2;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingProof(true);
    setErrors(p => ({ ...p, payment_proof: null }));
    try {
      const res = await uploadPaymentProof(file);
      setFormData(p => ({ ...p, payment_proof: res.data.payment_proof }));
      setProofFile(file.name);
    } catch (err) {
      console.error('Upload failed:', err);
      setErrors(p => ({ ...p, payment_proof: 'Gagal mengunggah file bukti pembayaran' }));
    } finally {
      setUploadingProof(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.client) newErrors.client = 'Pilih atau buat klien';
    if (!formData.event_date) newErrors.event_date = 'Tanggal Acara wajib diisi';
    if (cart.length === 0) newErrors.cart = 'Keranjang kosong';
    if (formData.dp_paid && !formData.payment_proof) {
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
        guarantee_type: formData.guarantee_type,
        event_date: formData.event_date,
        has_security_item: false,
        downpayment: formData.dp_paid ? reqDp : 0,
        status: formData.dp_paid ? 'booked' : 'draft',
        payment_proof: formData.payment_proof,
        notes: formData.notes,
        items: cart.map(item => ({
          costume_id: item.id,
          quantity: item.quantity,
        })),
      };

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
              <TextField isRequired className="flex-1 w-full">
                <Label className="text-xs font-semibold mb-1 text-default-600 block">Tanggal Acara</Label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => {
                    setFormData(p => ({ ...p, event_date: e.target.value }));
                    setErrors(p => ({ ...p, event_date: null }));
                  }}
                  className="w-full"
                />
                {errors.event_date && <FieldError className="text-danger text-xs mt-1">{errors.event_date}</FieldError>}
              </TextField>
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
                <input
                  type="checkbox"
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">Hanya Tampilkan Stok Tersedia</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10">
                {filteredCostumes.map(costume => (
                  <Card
                    key={costume.id}
                    onClick={() => costume.available_quantity > 0 && addToCart(costume)}
                    className={`border cursor-pointer ${costume.available_quantity === 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-primary'}`}
                  >
                    <Card.Content className="p-0 relative h-full flex flex-col">
                      <div className="aspect-square bg-default-100 relative">
                        {costume.cover_image ? (
                          <img src={costume.cover_image.startsWith('http') ? costume.cover_image : `${import.meta.env.VITE_API_URL}${costume.cover_image}`} alt={costume.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-default-400 text-xs">No Image</div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                          Sisa: {costume.available_quantity}
                        </div>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-sm line-clamp-1">{costume.name}</h4>
                          <p className="text-xs text-default-500 mb-2">{costume.size} • {costume.category}</p>
                        </div>
                        <p className="text-sm font-bold text-primary">Rp {costume.rental_fee?.toLocaleString('id-ID')}</p>
                      </div>
                    </Card.Content>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Cart Pill */}
      {cart.length > 0 && formData.event_date && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-md border border-default-200 shadow-xl rounded-full px-5 py-3 flex items-center gap-6 animate-fade-in max-w-[90%] sm:max-w-md">
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
          <Modal.Dialog className="max-w-xl w-full max-h-[90vh] md:max-h-none overflow-y-auto rounded-2xl shadow-2xl border border-default-200 bg-white">
            <Modal.Header className="px-6 py-4 border-b border-default-200">
              <Modal.Heading className="text-lg font-bold text-default-800">Checkout Transaksi</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4 p-6">
              {/* Cart Review */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Review Pakaian Pilihan</h4>
                <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1 w-full">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden flex-shrink-0 border border-slate-200">
                          {item.cover_image ? (
                            <img src={item.cover_image.startsWith('http') ? item.cover_image : `${import.meta.env.VITE_API_URL}${item.cover_image}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 font-semibold uppercase bg-slate-100">No img</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-semibold text-xs truncate text-slate-800">{item.name}</h5>
                          <p className="text-[11px] text-slate-500 font-medium">Rp {item.rental_fee?.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
                          <Button isIconOnly size="xs" variant="light" className="h-6 w-6 min-w-6 p-0" onPress={() => updateCartQuantity(item.id, -1)}><Minus size={10} /></Button>
                          <span className="text-xs w-5 text-center font-bold text-slate-700">{item.quantity}</span>
                          <Button isIconOnly size="xs" variant="light" className="h-6 w-6 min-w-6 p-0" onPress={() => updateCartQuantity(item.id, 1)} isDisabled={item.quantity >= item.available_quantity}><Plus size={10} /></Button>
                        </div>
                        <Button isIconOnly size="xs" color="danger" variant="light" className="h-6 w-6 min-w-6 p-0 text-slate-400 hover:text-red-500" onPress={() => removeFromCart(item.id)}><Trash2 size={13} /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-slate-200" />

              {/* Client Selection */}
              <div className="flex flex-col gap-4">
                <div>
                  <ClientSelect value={formData.client} onChange={(c) => {
                    setFormData(p => ({ ...p, client: c, client_phone: c?.client?.phone || p.client_phone, client_address: c?.client?.address || p.client_address }));
                    setErrors(p => ({ ...p, client: null }));
                  }} error={errors.client} />
                  {formData.client?.type === 'new' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <Input size="sm" placeholder="No HP" value={formData.client_phone} onChange={(e) => setFormData(p => ({ ...p, client_phone: e.target.value }))} />
                      <Input size="sm" placeholder="Alamat" value={formData.client_address} onChange={(e) => setFormData(p => ({ ...p, client_address: e.target.value }))} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    value={formData.guarantee_type}
                    onChange={(v) => setFormData((prev) => ({ ...prev, guarantee_type: v }))}
                  >
                    <Label className="text-xs font-semibold mb-1 text-slate-600 block">Jaminan *</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {GUARANTEE_TYPES.map((type) => (
                          <ListBox.Item key={type} id={type} textValue={type}>{type}</ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <div className="flex flex-col justify-center gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer py-0.5">
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
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700">DP Sudah Dibayar</span>
                    </label>

                    {formData.dp_paid && (
                      <div className="mt-2 flex flex-col gap-1 border-t border-slate-200 pt-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bukti Pembayaran DP *</label>
                        <div className="relative border border-dashed border-slate-300 rounded-lg p-2.5 bg-white text-center hover:bg-slate-50 transition duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[64px]">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {uploadingProof ? (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                              <Spinner size="xs" /> Mengunggah...
                            </div>
                          ) : proofFile ? (
                            <div className="flex items-center justify-between w-full text-xs text-success font-semibold px-1">
                              <span className="truncate max-w-[140px]">✓ {proofFile}</span>
                              <Button
                                size="xs"
                                variant="light"
                                isIconOnly
                                className="h-5 w-5 min-w-5 p-0 text-slate-400 hover:text-red-500"
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setFormData(p => ({ ...p, payment_proof: '' }));
                                  setProofFile(null);
                                }}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Klik untuk pilih bukti transfer</span>
                          )}
                        </div>
                        {errors.payment_proof && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.payment_proof}</p>}
                      </div>
                    )}
                  </div>
                </div>

                <TextField>
                  <Label className="text-xs font-semibold mb-1 text-slate-600 block">Catatan Peminjaman</Label>
                  <Input
                    placeholder="Masukkan catatan tambahan..."
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  />
                </TextField>
              </div>

              <Separator className="bg-slate-200" />

              {/* Totals Summary */}
              <div className="flex justify-between items-center text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Total Biaya Sewa:</span>
                  <div className="font-bold text-lg text-primary">Rp {totalFee.toLocaleString('id-ID')}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium">Minimal Downpayment (50%):</span>
                  <div className="font-semibold text-warning">Rp {reqDp.toLocaleString('id-ID')}</div>
                </div>
              </div>

              {errors.submit && <div className="text-danger text-xs bg-danger-50 p-2.5 rounded border border-danger-200">{errors.submit}</div>}
            </Modal.Body>
            <Modal.Footer className="px-6 py-4 border-t border-slate-200">
              <Button variant="light" className="text-slate-600 font-semibold" onPress={() => setIsCheckoutOpen(false)} aria-label="Batal">Batal</Button>
              <Button color="primary" onPress={handleSubmit} isPending={saving} className="text-white font-bold px-6" aria-label="Simpan Transaksi">Simpan Transaksi</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
};

export default POSPage;
