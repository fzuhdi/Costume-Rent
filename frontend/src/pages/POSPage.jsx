import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRent, uploadPaymentProof } from '../api/rentApi';
import { getCostumes } from '../api/costumeApi';
import { useSettings } from '../context/SettingsContext';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@heroui/react';
import POSCheckoutModal from '../components/POS/POSCheckoutModal';
import POSCostumeCatalog from '../components/POS/POSCostumeCatalog';
import POSEventDateSelector from '../components/POS/POSEventDateSelector';

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
  const searchParams = new URLSearchParams(window.location.search);
  const initialDate = searchParams.get('date') || '';

  const [formData, setFormData] = useState({
    client: null,
    client_phone: '',
    client_address: '',
    event_date: initialDate,
    guarantee_type: 'KTP',
    has_security_item: false,
    payment_status: 'none', // 'none', 'dp', 'full'
    payment_method: 'CASH',
    payment_proof: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDatePanelCollapsed, setIsDatePanelCollapsed] = useState(!!initialDate);

  useEffect(() => {
    fetchCostumes(formData.event_date);
  }, [formData.event_date]);

  useEffect(() => {
    if (costumes.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const costumeIdParam = params.get('costumeId');
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

  const categories = ['all', ...new Set(costumes.flatMap(c => c.category ? [c.category] : []))];
  const sizes = ['all', ...new Set(costumes.flatMap(c => c.size ? [c.size] : []))];

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
    if (formData.payment_status !== 'none' && formData.payment_method !== 'CASH' && !formData.payment_proof) {
      newErrors.payment_proof = 'Bukti pembayaran wajib diunggah';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let status = 'pending';
      let paymentAmount = 0;
      let paymentNotes = '';

      if (formData.payment_status === 'dp') {
        status = 'booked';
        paymentAmount = reqDp;
        paymentNotes = 'Downpayment POS';
      } else if (formData.payment_status === 'full') {
        status = 'booked';
        paymentAmount = totalFee;
        paymentNotes = 'Full Payment POS';
      }

      const payload = {
        guarantee_type: '',
        event_date: formData.event_date,
        has_security_item: false,
        status: status,
        notes: formData.notes,
        items: cart.map(item => ({
          costume_id: item.id,
          quantity: item.quantity,
          custom_rental_fee: item.rental_fee,
        })),
      };

      if (formData.payment_status !== 'none') {
        payload.payment = {
          amount: paymentAmount,
          payment_method: formData.payment_method,
          payment_proof: formData.payment_proof,
          notes: paymentNotes,
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
        payment_status: 'none',
        payment_method: 'CASH',
        payment_proof: '',
        notes: '',
      });
      setProofFile(null);

      navigate(`/rents/${res.data.id}`);
    } catch (error) {
      console.error('Failed to checkout:', error);
      setErrors(p => ({ ...p, submit: error.message }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 relative pb-24">
      {/* Step 1: Event Date Selector */}
      <POSEventDateSelector
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        setErrors={setErrors}
        isDatePanelCollapsed={isDatePanelCollapsed}
        setIsDatePanelCollapsed={setIsDatePanelCollapsed}
        settings={settings}
      />

      {/* Step 2: Costume Catalog */}
      <POSCostumeCatalog
        formData={formData}
        search={search} setSearch={setSearch}
        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
        selectedSize={selectedSize} setSelectedSize={setSelectedSize}
        showOnlyAvailable={showOnlyAvailable} setShowOnlyAvailable={setShowOnlyAvailable}
        categories={categories} sizes={sizes}
        loadingCostumes={loadingCostumes}
        filteredCostumes={filteredCostumes}
        costumes={costumes}
        addToCart={addToCart}
      />

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

      <POSCheckoutModal
        isOpen={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        cart={cart}
        updateCartPrice={updateCartPrice}
        updateCartQuantity={updateCartQuantity}
        removeFromCart={removeFromCart}
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        setErrors={setErrors}
        proofFile={proofFile}
        setProofFile={setProofFile}
        uploadingProof={uploadingProof}
        setUploadingProof={setUploadingProof}
        handleUploadGeneric={handleUploadGeneric}
        totalFee={totalFee}
        reqDp={reqDp}
        handleSubmit={handleSubmit}
        saving={saving}
      />
    </div>
  );
};

export default POSPage;
