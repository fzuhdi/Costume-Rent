import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCostumeById, createCostume, updateCostume, getRegions, getCategories, uploadCostumeImage } from '../api/costumeApi';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import './CatalogueFormPage.css';

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
  const [uploading, setUploading] = useState(false);

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
      alert('Gagal menyimpan kostum');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);
        const res = isEdit
          ? await uploadCostumeImage(id, formDataUpload)
          : null;
        if (res) {
          setImages((prev) => [...prev, res.data]);
        }
      }
      if (!isEdit) {
        alert('Simpan kostum terlebih dahulu untuk mengupload gambar');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="catalogue-form-page">
      <Link to="/catalogue" className="back-link">
        <ArrowLeft size={18} />
        Kembali ke Katalog
      </Link>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{isEdit ? 'Edit Kostum' : 'Tambah Kostum Baru'}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nama Kostum *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Wilayah</label>
              <select
                name="region_id"
                className="form-select"
                value={formData.region_id}
                onChange={handleChange}
              >
                <option value="">Pilih Wilayah</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select
                name="category_id"
                className="form-select"
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Kondisi</label>
              <select
                name="condition"
                className="form-select"
                value={formData.condition}
                onChange={handleChange}
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Jumlah Stok *</label>
              <input
                type="number"
                name="quantity"
                className="form-input"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tanggal Perolehan</label>
              <input
                type="date"
                name="acquired_at"
                className="form-input"
                value={formData.acquired_at}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="form-actions">
            <Link to="/catalogue" className="btn btn-outline">
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CatalogueFormPage;