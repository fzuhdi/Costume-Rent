import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRentById, createRent, updateRent } from '../api/rentApi';
import ClientSelect from '../components/ClientSelect';
import CostumeMultiSelect from '../components/CostumeMultiSelect';
import HeroDatePicker from '../components/HeroDatePicker';
import { ArrowLeft, Save } from 'lucide-react';
import { TextField, TextArea, Label, Select, ListBox, Button, Card, Separator, FieldError, Input } from '@heroui/react';

const GUARANTEE_TYPES = ['KTP', 'SIM', 'KK', 'Paspor', 'Lainnya'];

const RentFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    client: null,
    guarantee_type: 'KTP',
    event_date: '',
    downpayment: 0,
    has_security_item: false,
    notes: '',
    client_phone: '',
    client_address: '',
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      fetchRent();
    }
  }, [id]);

  const fetchRent = async () => {
    setLoading(true);
    try {
      const response = await getRentById(id);
      const rent = response.data;
      setFormData({
        client: { type: 'existing', client: { id: rent.client_id, name: rent.client_name } },
        guarantee_type: rent.guarantee_type || 'KTP',
        event_date: rent.event_date?.split('T')[0] || '',
        downpayment: rent.downpayment || 0,
        has_security_item: rent.has_security_item || false,
        notes: rent.notes || '',
        client_phone: '',
        client_address: '',
      });
      setItems(rent.items?.map(item => ({
        costume_id: item.costume_id,
        costume: item.costume,
        quantity: item.quantity,
      })) || []);
    } catch (error) {
      console.error('Failed to fetch rent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (client) => {
    setFormData((prev) => ({ ...prev, client }));
    if (client?.client) {
      setFormData((prev) => ({
        ...prev,
        client,
        client_phone: client.client.phone,
        client_address: client.client.address,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.client) newErrors.client = 'Pilih atau buat klien';
    if (!formData.event_date) newErrors.event_date = 'Tanggal acara wajib diisi';
    if (items.length === 0) newErrors.items = 'Pilih minimal 1 kostum';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        guarantee_type: formData.guarantee_type,
        event_date: formData.event_date,
        downpayment: parseInt(formData.downpayment) || 0,
        has_security_item: Boolean(formData.has_security_item),
        notes: formData.notes,
        items: items.map((item) => ({
          costume_id: item.costume_id,
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

      if (isEdit) {
        await updateRent(id, payload);
        navigate(`/rents/${id}`);
      } else {
        await createRent(payload);
        navigate('/rents');
      }
    } catch (error) {
      console.error('Failed to save rent:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-[var(--muted)]">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/rents" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft size={18} aria-hidden="true" />
        Kembali ke Data Sewa
      </Link>

      <Card>
        <Card.Content>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{isEdit ? 'Edit Pesanan' : 'Form Pesanan Baru'}</h2>
          </div>
          {Object.values(errors).some(Boolean) && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
            >
              Lengkapi data pesanan sebelum menyimpan.
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <h3 className="text-base font-medium mb-3">Data Klien</h3>
              <ClientSelect value={formData.client} onChange={handleClientChange} error={errors.client} />
              {formData.client?.type === 'new' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <TextField>
                    <Label>Nomor Telepon</Label>
                    <Input value={formData.client_phone} onChange={(e) => setFormData((prev) => ({...prev, client_phone: e.target.value}))} />
                  </TextField>
                  <TextField>
                    <Label>Alamat</Label>
                    <Input value={formData.client_address} onChange={(e) => setFormData((prev) => ({...prev, client_address: e.target.value}))} />
                  </TextField>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-base font-medium mb-3">Data Jaminan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  value={formData.guarantee_type}
                  onChange={(v) => setFormData((prev) => ({ ...prev, guarantee_type: v }))}
                >
                  <Label>Tipe Jaminan</Label>
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

            <div>
              <h3 className="text-base font-medium mb-3">Data Pesanan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <HeroDatePicker
                  isRequired
                  label="Tanggal Acara"
                  value={formData.event_date}
                  onChange={(e) => setFormData((prev) => ({...prev, event_date: e.target.value}))}
                  isInvalid={!!errors.event_date}
                  errorMessage={errors.event_date}
                />
                <TextField>
                  <Label>Uang Muka (DP)</Label>
                  <Input type="number" min="0" value={formData.downpayment} onChange={(e) => setFormData((prev) => ({...prev, downpayment: e.target.value}))} />
                </TextField>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" id="has_security_item" checked={formData.has_security_item} onChange={(e) => setFormData((prev) => ({...prev, has_security_item: e.target.checked}))} />
                  <label htmlFor="has_security_item" className="text-sm font-medium">Tahan Kartu Jaminan</label>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-base font-medium mb-3">Daftar Kostum</h3>
              <CostumeMultiSelect value={items} onChange={setItems} error={errors.items} />
            </div>

            <TextField>
              <Label>Catatan</Label>
              <TextArea rows={3} value={formData.notes} onChange={(e) => setFormData((prev) => ({...prev, notes: e.target.value}))} />
            </TextField>

            <div className="flex gap-3 justify-end">
              <Button variant="bordered" onPress={() => navigate('/rents')} aria-label="Batal">Batal</Button>
              <Button type="submit" variant="primary" isPending={saving} aria-label="Simpan">
                {({isPending}) => (
                  <>
                    {!isPending && <Save size={18} aria-hidden="true" />}
                    {isPending ? 'Menyimpan...' : 'Simpan'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
};

export default RentFormPage;
