import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCostumeById, createCostume, updateCostume, getRegions, getCategories, uploadCostumeImage } from '../api/costumeApi';
import { ArrowLeft, Save } from 'lucide-react';
import { Input, Textarea, Select, SelectItem, Button, Card, CardBody, Spinner } from '@heroui/react';

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
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">{isEdit ? 'Edit Kostum' : 'Tambah Kostum Baru'}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nama Kostum *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Wilayah"
                name="region_id"
                selectedKeys={formData.region_id ? [formData.region_id] : []}
                onChange={handleChange}
              >
                <SelectItem key="">Pilih Wilayah</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={String(r.id)}>{r.name}</SelectItem>
                ))}
              </Select>
              <Select
                label="Kategori"
                name="category_id"
                selectedKeys={formData.category_id ? [formData.category_id] : []}
                onChange={handleChange}
              >
                <SelectItem key="">Pilih Kategori</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={String(c.id)}>{c.name}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Kondisi"
                name="condition"
                selectedKeys={[formData.condition]}
                onChange={(e) => setFormData((prev) => ({ ...prev, condition: e.anchorKey }))}
              >
                <SelectItem key="excellent">Excellent</SelectItem>
                <SelectItem key="good">Good</SelectItem>
                <SelectItem key="fair">Fair</SelectItem>
              </Select>
              <Input
                label="Jumlah Stok *"
                type="number"
                name="quantity"
                value={String(formData.quantity)}
                onChange={handleChange}
                min="1"
                required
              />
              <Input
                label="Tanggal Perolehan"
                type="date"
                name="acquired_at"
                value={formData.acquired_at}
                onChange={handleChange}
              />
            </div>
            <Textarea
              label="Deskripsi"
              name="description"
              value={formData.description}
              onChange={handleChange}
              minRows={4}
            />
            <div className="flex gap-3 justify-end">
              <Button variant="bordered" as={Link} to="/catalogue">Batal</Button>
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

export default CatalogueFormPage;