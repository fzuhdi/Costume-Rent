import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCostumeById, createCostume, updateCostume, getRegions, getCategories, uploadCostumeImage } from '../api/costumeApi';
import { ArrowLeft, Save } from 'lucide-react';
import { TextField, Input, TextArea, Label, Select, ListBox, Button, Card, Spinner, FieldError } from '@heroui/react';

const CatalogueFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region_id: '',
    category_id: '',
    condition: 'good',
    quantity: 1,
    acquired_at: '',
  });
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [regionsRes, categoriesRes] = await Promise.all([
        getRegions(),
        getCategories(),
      ]);
      setRegions(regionsRes.data);
      setCategories(categoriesRes.data);

      if (isEdit) {
        const costumeRes = await getCostumeById(id);
        const costume = costumeRes.data;
        setFormData({
          name: costume.name || '',
          description: costume.description || '',
          region_id: costume.region_id?.toString() || '',
          category_id: costume.category_id?.toString() || '',
          condition: costume.condition || 'good',
          quantity: costume.quantity || 1,
          acquired_at: costume.acquired_at || '',
        });
        setImages(costume.images || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        region_id: formData.region_id ? parseInt(formData.region_id) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        condition: formData.condition,
        quantity: parseInt(formData.quantity),
        acquired_at: formData.acquired_at || null,
      };

      if (isEdit) {
        await updateCostume(id, payload);
      } else {
        await createCostume(payload);
      }
      navigate('/catalogue');
    } catch (error) {
      console.error('Failed to save costume:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/catalogue" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft size={18} />
        Kembali ke Katalog
      </Link>

      <Card>
        <Card.Content>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{isEdit ? 'Edit Kostum' : 'Tambah Kostum Baru'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField value={formData.name} isRequired>
              <Label>Nama Kostum *</Label>
              <Input onChange={(e) => setFormData((prev) => ({...prev, name: e.target.value}))} />
              <FieldError />
            </TextField>
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={formData.region_id}
                onChange={(v) => setFormData((prev) => ({...prev, region_id: v ?? ''}))}
              >
                <Label>Wilayah</Label>
                <Select.Trigger>
                  <Select.Value placeholder="Pilih Wilayah" />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="" textValue="Pilih Wilayah">Pilih Wilayah</ListBox.Item>
                    {regions.map((r) => (
                      <ListBox.Item key={r.id} id={String(r.id)} textValue={r.name}>{r.name}</ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <Select
                value={formData.category_id}
                onChange={(v) => setFormData((prev) => ({...prev, category_id: v ?? ''}))}
              >
                <Label>Kategori</Label>
                <Select.Trigger>
                  <Select.Value placeholder="Pilih Kategori" />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="" textValue="Pilih Kategori">Pilih Kategori</ListBox.Item>
                    {categories.map((c) => (
                      <ListBox.Item key={c.id} id={String(c.id)} textValue={c.name}>{c.name}</ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <TextField value={String(formData.quantity)} isRequired>
                <Label>Jumlah Stok *</Label>
                <Input type="number" min="1" onChange={(e) => setFormData((prev) => ({...prev, quantity: e.target.value}))} />
                <FieldError />
              </TextField>
            </div>
            <div className="grid grid-cols-3 gap-4">
            </div>
            <TextArea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({...prev, description: e.target.value}))}
              placeholder="Deskripsi kostum..."
              minrows={4}
            />
            <div>
              <Label>Gambar Kostum</Label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  for (const file of files) {
                    try {
                      await uploadCostumeImage(file);
                    } catch (error) {
                      console.error('Failed to upload image:', error);
                    }
                  }
                  // Refresh images state
                  if (isEdit) {
                    const costumeRes = await getCostumeById(id);
                    setImages(costumeRes.data.images || []);
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {images.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {images.map((img) => (
                    <div key={img.id} className="relative w-20 h-20">
                      <img src={img.path} alt="Costume" className="w-full h-full object-cover rounded" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="bordered" onPress={() => window.location.href = '/catalogue'}>Batal</Button>
              <Button type="submit" variant="primary" isPending={saving}>
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

export default CatalogueFormPage;