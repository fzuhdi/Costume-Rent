import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createClient } from '../api/clientApi';
import { ArrowLeft, Save } from 'lucide-react';
import { TextField, Input, TextArea, Label, Button, Card, FieldError } from '@heroui/react';

const ClientFormPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nama wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await createClient(formData);
      navigate('/clients');
    } catch (error) {
      console.error('Failed to save client:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
       <Link to="/clients" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]" aria-label="Kembali ke Klien">
        <ArrowLeft size={18} />
        Kembali ke Klien
      </Link>

      <Card>
        <Card.Content>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Tambah Klien Baru</h2>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField isRequired>
              <Label>Nama Klien *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange(e)}
                placeholder="Masukkan nama klien"
                name="name"
              />
              <FieldError>{errors.name}</FieldError>
            </TextField>

            <TextField>
              <Label>Nomor Telepon</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange(e)}
                placeholder="Masukkan nomor telepon"
                name="phone"
              />
            </TextField>

            <TextField>
              <Label>Alamat</Label>
              <TextArea
                value={formData.address}
                onChange={(e) => handleChange(e)}
                placeholder="Masukkan alamat"
                name="address"
                minRows={3}
              />
            </TextField>

            <div className="flex gap-3 justify-end">
               <Button variant="bordered" onPress={() => navigate('/clients')} aria-label="Batal">Batal</Button>
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

export default ClientFormPage;
