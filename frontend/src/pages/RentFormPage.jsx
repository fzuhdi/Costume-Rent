import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getRentById, createRent, updateRent } from '../api/rentApi';
import ClientSelect from '../components/ClientSelect';
import CostumeMultiSelect from '../components/CostumeMultiSelect';
import { ArrowLeft, Save } from 'lucide-react';
import './RentFormPage.css';

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
      alert(error.response?.data?.error || 'Gagal menyimpan peminjaman');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="rent-form-page">
      <Link to="/rents" className="back-link">
        <ArrowLeft size={18} />
        Kembali ke Riwayat Peminjaman
      </Link>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{isEdit ? 'Edit Peminjaman' : 'Form Peminjaman Baru'}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Data Klien</h3>
            <div className="form-group">
              <label className="form-label">Klien *</label>
              <ClientSelect
                value={formData.client}
                onChange={handleClientChange}
                error={errors.client}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Data Jaminan</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tipe Jaminan</label>
                <select
                  name="guarantee_type"
                  className="form-select"
                  value={formData.guarantee_type}
                  onChange={handleChange}
                >
                  {GUARANTEE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nomor Jaminan</label>
                <input
                  type="text"
                  name="guarantee_number"
                  className="form-input"
                  value={formData.guarantee_number}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Data Peminjaman</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tanggal Mulai *</label>
                <input
                  type="date"
                  name="rent_start"
                  className="form-input"
                  value={formData.rent_start}
                  onChange={handleChange}
                  required
                />
                {errors.rent_start && <span className="error-text">{errors.rent_start}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Selesai *</label>
                <input
                  type="date"
                  name="rent_end"
                  className="form-input"
                  value={formData.rent_end}
                  onChange={handleChange}
                  min={formData.rent_start}
                  required
                />
                {errors.rent_end && <span className="error-text">{errors.rent_end}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Daftar Kostum</h3>
            <CostumeMultiSelect
              value={items}
              onChange={setItems}
              error={errors.items}
            />
          </div>

          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Catatan</label>
              <textarea
                name="notes"
                className="form-textarea"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/rents" className="btn btn-outline">
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

export default RentFormPage;