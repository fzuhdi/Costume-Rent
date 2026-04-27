import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getRentById, createRent, updateRent } from '../api/rentApi';
import ClientSelect from '../components/ClientSelect';
import CostumeMultiSelect from '../components/CostumeMultiSelect';
import { ArrowLeft, Save } from 'lucide-react';
import { Input, Textarea, Select, SelectItem, Button, Card, CardBody, Divider } from '@heroui/react';

const GUARANTEE_TYPES = ['KTP', 'SIM', 'KK', 'Paspor', 'Lainnya'];

const RentFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    client: null,
    guarantee_type: 'KTP',
    guarantee_number: '',
    rent_start: '',
    rent_end: '',
    notes: '',
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

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
        guarantee_number: formData.guarantee_number,
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

  if (isEdit && loading) {
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
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">{isEdit ? 'Edit Peminjaman' : 'Form Peminjaman Baru'}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <h3 className="text-base font-medium mb-3">Data Klien</h3>
              <ClientSelect value={formData.client} onChange={handleClientChange} error={errors.client} />
            </div>

            <Divider />

            <div>
              <h3 className="text-base font-medium mb-3">Data Jaminan</h3>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Tipe Jaminan"
                  selectedKeys={[formData.guarantee_type]}
                  onChange={(e) => setFormData((prev) => ({ ...prev, guarantee_type: e.anchorKey }))}
                >
                  {GUARANTEE_TYPES.map((type) => (
                    <SelectItem key={type}>{type}</SelectItem>
                  ))}
                </Select>
                <Input
                  label="Nomor Jaminan"
                  name="guarantee_number"
                  value={formData.guarantee_number}
                  onChange={handleChange}
                />
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="text-base font-medium mb-3">Data Peminjaman</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Tanggal Mulai *"
                  type="date"
                  name="rent_start"
                  value={formData.rent_start}
                  onChange={handleChange}
                  isInvalid={!!errors.rent_start}
                  errorMessage={errors.rent_start}
                />
                <Input
                  label="Tanggal Selesai *"
                  type="date"
                  name="rent_end"
                  value={formData.rent_end}
                  onChange={handleChange}
                  isInvalid={!!errors.rent_end}
                  errorMessage={errors.rent_end}
                />
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="text-base font-medium mb-3">Daftar Kostum</h3>
              <CostumeMultiSelect value={items} onChange={setItems} error={errors.items} />
            </div>

            <Textarea
              label="Catatan"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              minRows={3}
            />

            <div className="flex gap-3 justify-end">
              <Button variant="bordered" as={Link} to="/rents">Batal</Button>
              <Button type="submit" color="primary" isLoading={saving} startContent={<Save size={18} />}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default RentFormPage;