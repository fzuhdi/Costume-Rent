import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCostumeById, createCostume, updateCostume, getRegions, getCategories, uploadCostumeImage } from '../api/costumeApi';
import { ArrowLeft, Save } from 'lucide-react';
import { TextField, Input, TextArea, Label, Select, ListBox, Button, Card, Spinner, FieldError } from '@heroui/react';
import FileUploadZone from '../components/FileUploadZone';

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
    size: '',
    rental_fee: '',
    total_quantity: 1,
    acquired_at: '',
  });
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [stagedFiles, setStagedFiles] = useState([]);
  const stagedFilesRef = useRef(stagedFiles);
  
  useEffect(() => {
    stagedFilesRef.current = stagedFiles;
  }, [stagedFiles]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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
            size: costumeData.size || '',
            rental_fee: costumeData.rental_fee?.toString() || '',
            total_quantity: costumeData.total_quantity || 1,
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
    fetchData();
    return () => {
      stagedFilesRef.current.forEach(s => URL.revokeObjectURL(s.previewUrl));
    };
  }, [id, isEdit]);

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
        size: formData.size,
        rental_fee: formData.rental_fee ? parseInt(formData.rental_fee) : 0,
        total_quantity: parseInt(formData.total_quantity),
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

        await Promise.all(stagedFiles.map(async (staged) => {
          const fd = new FormData();
          fd.append('image', staged.file);
          try {
            await uploadCostumeImage(costumeId, fd);
          } catch (error) {
            console.error('Failed to upload staged image:', error);
          }
        }));

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
                selectedKey={formData.region_id}
                onSelectionChange={(v) => setFormData((prev) => ({...prev, region_id: v ?? ''}))}
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
                selectedKey={formData.category_id}
                onSelectionChange={(v) => setFormData((prev) => ({...prev, category_id: v ?? ''}))}
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
              <TextField>
                <Label>Ukuran</Label>
                <Input value={formData.size} onChange={(e) => setFormData((prev) => ({...prev, size: e.target.value}))} />
              </TextField>
              <TextField isRequired>
                <Label>Harga Sewa per Set (Rp)</Label>
                <Input type="number" min="0" value={formData.rental_fee} onChange={(e) => setFormData((prev) => ({...prev, rental_fee: e.target.value}))} />
                <FieldError />
              </TextField>
              <TextField isRequired>
                 <Label>Total Stok *</Label>
                 <Input type="number" min="1" value={formData.total_quantity} onChange={(e) => setFormData((prev) => ({...prev, total_quantity: parseInt(e.target.value, 10) || 0}))} />
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
              <FileUploadZone
                uploading={false} // CatalogueFormPage handles uploading differently or doesn't have an uploading state for files yet
                fileLabel={stagedFiles.length > 0 ? `${stagedFiles.length} file dipilih` : null}
                onChange={handleFileSelect}
                label="Gambar Kostum"
                multiple={true}
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
