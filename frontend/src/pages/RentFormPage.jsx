import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRentById, createRent, updateRent } from '../api/rentApi';
import ClientSelect from '../components/ClientSelect';
import CostumeMultiSelect from '../components/CostumeMultiSelect';
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
    rent_start: '',
    rent_end: '',
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
        rent_start: rent.rent_start?.split('T')[0] || '',
        rent_end: rent.rent_end?.split('T')[0] || '',
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
    if (!formData.rent_start) newErrors.rent_start = 'Tanggal mulai wajib diisi';
    if (!formData.rent_end) newErrors.rent_end = 'Tanggal selesai wajib diisi';
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
        rent_start: formData.rent_start,
        rent_end: formData.rent_end,
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
      } else {
        await createRent(payload);
      }
      navigate('/rents');
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
        <ArrowLeft size={18} />
        Kembali ke Riwayat Peminjaman
      </Link>

      <Card>
        <Card.Content>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{isEdit ? 'Edit Peminjaman' : 'Form Peminjaman Baru'}</h2>
          </div>
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
              <h3 className="text-base font-medium mb-3">Data Peminjaman</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField isRequired>
                  <Label>Tanggal Mulai</Label>
                  <Input type="date" value={formData.rent_start} onChange={(e) => setFormData((prev) => ({...prev, rent_start: e.target.value}))} />
                  <FieldError>{errors.rent_start}</FieldError>
                </TextField>
                <TextField isRequired>
                  <Label>Tanggal Selesai</Label>
                  <Input type="date" value={formData.rent_end} onChange={(e) => setFormData((prev) => ({...prev, rent_end: e.target.value}))} />
                  <FieldError>{errors.rent_end}</FieldError>
                </TextField>
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
                    {!isPending && <Save size={18} />}
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
