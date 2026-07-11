import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRent } from '../api/rentApi';
import { getCostumes } from '../api/costumeApi';
import ClientSelect from '../components/ClientSelect';
import { ShoppingCart, Search, Plus, Minus, Trash2 } from 'lucide-react';
import { 
  Input, Button, Card, Separator, Checkbox, 
  Select, ListBox, Label, Spinner, TextField, FieldError
} from '@heroui/react';

const GUARANTEE_TYPES = ['KTP', 'SIM', 'KK', 'Paspor', 'Lainnya'];

const POSPage = () => {
  const navigate = useNavigate();
  const [costumes, setCostumes] = useState([]);
  const [search, setSearch] = useState('');
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
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCostumes();
  }, []);

  const fetchCostumes = async () => {
    setLoadingCostumes(true);
    try {
      const response = await getCostumes({ limit: 100 });
      setCostumes(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch costumes:', error);
    } finally {
      setLoadingCostumes(false);
    }
  };

  const filteredCostumes = costumes.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

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
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.available_quantity) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalFee = cart.reduce((sum, item) => sum + (item.rental_fee * item.quantity), 0);
  const reqDp = totalFee / 2;

  const validate = () => {
    const newErrors = {};
    if (!formData.client) newErrors.client = 'Pilih atau buat klien';
    if (!formData.event_date) newErrors.event_date = 'Tanggal Acara wajib diisi';
    if (cart.length === 0) newErrors.cart = 'Keranjang kosong';
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
        has_security_item: formData.has_security_item,
        downpayment: formData.dp_paid ? reqDp : 0,
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
      alert('Penyewaan berhasil dibuat');
      navigate(`/rents/${res.data.id}`);
    } catch (error) {
      console.error('Failed to checkout:', error);
      alert('Gagal membuat penyewaan: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-100px)]">
      {/* Left: Costume Selection */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-[400px] lg:min-h-0">
        <div className="flex items-center gap-4 relative">
          <Search size={18} className="absolute left-3 text-default-400" />
          <Input 
            placeholder="Cari Kostum atau Aksesoris..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10"
            aria-label="Cari Kostum"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loadingCostumes ? (
            <div className="flex justify-center items-center h-full"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
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

      {/* Right: Checkout Pane */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4 overflow-y-auto bg-default-50 p-4 rounded-xl border border-default-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingCart size={20} />
          <h2 className="text-lg font-bold">POS Checkout</h2>
        </div>

        {/* Cart Items */}
        <div className="flex flex-col gap-3 min-h-[200px]">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-default-400 text-sm">
              Keranjang kosong. Pilih kostum di sebelah kiri.
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-default-100">
                <div className="w-12 h-12 bg-default-100 rounded overflow-hidden flex-shrink-0">
                  {item.cover_image && <img src={item.cover_image.startsWith('http') ? item.cover_image : `${import.meta.env.VITE_API_URL}${item.cover_image}`} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-sm truncate">{item.name}</h5>
                  <p className="text-xs text-default-500">Rp {item.rental_fee?.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button isIconOnly size="sm" variant="flat" onPress={() => updateCartQuantity(item.id, -1)}><Minus size={14}/></Button>
                  <span className="text-sm w-4 text-center">{item.quantity}</span>
                  <Button isIconOnly size="sm" variant="flat" onPress={() => updateCartQuantity(item.id, 1)} isDisabled={item.quantity >= item.available_quantity}><Plus size={14}/></Button>
                </div>
                <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => removeFromCart(item.id)}><Trash2 size={16}/></Button>
              </div>
            ))
          )}
          {errors.cart && <span className="text-danger text-xs">{errors.cart}</span>}
        </div>

        <Separator />

        {/* Client & Date */}
        <div className="flex flex-col gap-4">
          <div>
            <Label className="text-xs font-semibold mb-1 text-default-600 block">Klien</Label>
            <ClientSelect value={formData.client} onChange={(c) => {
              setFormData(p => ({ ...p, client: c, client_phone: c?.client?.phone || p.client_phone, client_address: c?.client?.address || p.client_address }));
              setErrors(p => ({...p, client: null}));
            }} error={errors.client} />
            {formData.client?.type === 'new' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input size="sm" placeholder="No HP" value={formData.client_phone} onChange={(e) => setFormData(p => ({...p, client_phone: e.target.value}))} />
                <Input size="sm" placeholder="Alamat" value={formData.client_address} onChange={(e) => setFormData(p => ({...p, client_address: e.target.value}))} />
              </div>
            )}
          </div>

          <div>
            <TextField isRequired>
              <Label className="text-xs font-semibold mb-1 text-default-600 block">Tanggal Acara</Label>
              <Input 
                type="date" 
                value={formData.event_date} 
                onChange={(e) => {
                  setFormData(p => ({...p, event_date: e.target.value}));
                  setErrors(p => ({...p, event_date: null}));
                }}
              />
              <FieldError className="text-danger text-xs mt-1">{errors.event_date}</FieldError>
            </TextField>
            {formData.event_date && (
              <div className="flex justify-between mt-2 text-xs text-default-500 bg-default-200/50 p-2 rounded">
                <span>Diambil: D-2</span>
                <span>Kembali: D+1</span>
              </div>
            )}
          </div>

          <div>
             <Select
                value={formData.guarantee_type}
                onChange={(v) => setFormData((prev) => ({ ...prev, guarantee_type: v }))}
              >
                <Label className="text-xs font-semibold mb-1 text-default-600 block">Jaminan</Label>
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
          </div>
        </div>

        <Separator />

        {/* Totals & Actions */}
        <div className="flex flex-col gap-3 pb-4">
          <div className="flex justify-between text-sm">
            <span className="text-default-500">Total Harga:</span>
            <span className="font-semibold text-lg">Rp {totalFee.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-default-500">Min. DP (50%):</span>
            <span className="font-semibold text-warning">Rp {reqDp.toLocaleString('id-ID')}</span>
          </div>
          
          <div className="flex flex-col gap-3 mt-2 bg-white p-4 rounded-lg border border-default-200 shadow-sm">
            <Checkbox isSelected={formData.dp_paid} onChange={(isSelected) => setFormData(p => ({...p, dp_paid: isSelected}))}>
              <span className="text-sm font-medium">DP Sudah Dibayar</span>
            </Checkbox>
            <Checkbox isSelected={formData.has_security_item} onChange={(isSelected) => setFormData(p => ({...p, has_security_item: isSelected}))}>
              <span className="text-sm font-medium">Kartu ID ({formData.guarantee_type}) Ditahan</span>
            </Checkbox>
          </div>

          <Button 
            color="primary" 
            size="lg" 
            className="w-full mt-2 font-bold h-14" 
            onPress={handleSubmit}
            isLoading={saving}
          >
            {saving ? 'Memproses...' : 'CHECKOUT (SIMPAN)'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default POSPage;
