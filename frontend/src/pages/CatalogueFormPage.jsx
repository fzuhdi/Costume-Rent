import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCostumeById, createCostume, updateCostume, getRegions, getCategories, uploadCostumeImage } from '../api/costumeApi';
import { ArrowLeft, Save } from 'lucide-react';
import { TextField, Input, TextArea, Label, Select, ListBox, Button, Card, Spinner, FieldError } from '@heroui/react';

const CatalogueFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [costume, setCostume] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region_id: '',
    category_id: '',
    price: '',
    quantity: 1,
    acquired_at: '',
  });
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
    return () => {
      stagedFiles.forEach(s => URL.revokeObjectURL(s.previewUrl));
    };
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
        const costumeData = costumeRes.data;
        setCostume(costumeData);
        setFormData({
          name: costumeData.name || '',
          description: costumeData.description || '',
          region_id: costumeData.region_id?.toString() || '',
          category_id: costumeData.category_id?.toString() || '',
          price: costumeData.price?.toString() || '',
          quantity: costumeData.quantity || 1,
          acquired_at: costumeData.acquired_at || '',
        });
        setImages(costumeData.images || []);
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
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Nama kostum harus diisi');
      setSaving(false);
      return;
    }
    if (!formData.region_id) {
      alert('Wilayah harus dipilih');
      setSaving(false);
      return;
    }
    if (!formData.category_id) {
      alert('Kategori harus dipilih');
      setSaving(false);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        region_id: formData.region_id ? parseInt(formData.region_id) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        price: formData.price ? parseInt(formData.price) : 0,
        quantity: parseInt(formData.quantity),
        acquired_at: formData.acquired_at || null,
      };

        let costumeId;
        if (isEdit) {
          await updateCostume(id, payload);
          costumeId = id;
        } else {
          const result = await createCostume(payload);
          costumeId = result.data.id;
        }

        for (const staged of stagedFiles) {
          const fd = new FormData();
          fd.append('image', staged.file);
          try {
            await uploadCostumeImage(costumeId, fd);
          } catch (error) {
            console.error('Failed to upload staged image:', error);
          }
        }

        // Navigate to detail page after save
        navigate(`/catalogue/${costumeId}`);
    } catch (error) {
      console.error('Failed to save costume:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newStaged = files.map(f => ({
      id: Math.random().toString(36).slice(2, 9),
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setStagedFiles(prev => [...prev, ...newStaged]);
    e.target.value = '';
  };

  const removeStaged = (id) => {
    setStagedFiles(prev => {
      const toRemove = prev.find(s => s.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter(s => s.id !== id);
    });
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
       <Link to="/catalogue" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]" aria-label="Kembali ke Katalog">
         <ArrowLeft size={18} />
         Kembali ke Katalog
       </Link>

      <Card>
        <Card.Content>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{isEdit ? 'Edit Kostum' : 'Tambah Kostum Baru'}</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField isRequired>
              <Label>Nama Kostum</Label>
              <Input value={formData.name} onChange={(e) => setFormData((prev) => ({...prev, name: e.target.value}))} />
              <FieldError />
            </TextField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <TextField isRequired>
                <Label>Harga Sewa per Set (Rp)</Label>
                <Input type="number" min="0" value={formData.price} onChange={(e) => setFormData((prev) => ({...prev, price: e.target.value}))} />
                <FieldError />
              </TextField>
              <TextField isRequired>
                 <Label>Jumlah Stok *</Label>
                 <Input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData((prev) => ({...prev, quantity: parseInt(e.target.value, 10) || 0}))} />
                 {isEdit && costume && costume.available_quantity !== undefined && (
                   <span className="text-xs text-[var(--muted)]">Tersedia: {costume.available_quantity}</span>
                 )}
                 <FieldError />
               </TextField>
            </div>
            <TextArea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({...prev, description: e.target.value}))}
              placeholder="Deskripsi kostum..."
              minrows={4}
              aria-label="Deskripsi kostum"
            />
            <div>
              <Label>Gambar Kostum</Label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                aria-label="Upload costume images"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {(images.length > 0 || stagedFiles.length > 0) && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {images.map((img) => (
                    <div key={`existing-${img.id}`} className="relative w-20 h-20">
                      <img src={img.path} alt="Costume" className="w-full h-full object-cover rounded" />
                    </div>
                  ))}
                  {stagedFiles.map((staged) => (
                    <div key={`staged-${staged.id}`} className="relative w-20 h-20 group">
                      <img src={staged.previewUrl} alt="Staged" className="w-full h-full object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeStaged(staged.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-80 hover:opacity-100"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="bordered" onPress={() => navigate('/catalogue')} aria-label="Batal">Batal</Button>
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

export default CatalogueFormPage;
