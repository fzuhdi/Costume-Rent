import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Save, Upload, Image } from 'lucide-react';
import './SettingsPage.css';

const SettingsPage = () => {
  const { settings, updateSettings, uploadLogo } = useSettings();
  const [formData, setFormData] = useState({
    app_name: settings.app_name || '',
    tagline: settings.app_tagline || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(settings.app_logo || '');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setUploading(true);
      uploadLogo(file)
        .then(() => {
          setUploading(false);
        })
        .catch(() => {
          setUploading(false);
          setPreview(settings.app_logo || '');
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      alert('Pengaturan berhasil disimpan');
    } catch (error) {
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Pengaturan Aplikasi</h1>
      </div>

      <div className="settings-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Branding</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Logo Aplikasi</label>
              <div className="logo-upload">
                <div className="logo-preview">
                  {preview ? (
                    <img src={preview} alt="Logo" />
                  ) : (
                    <div className="no-logo">
                      <Image size={32} />
                      <span>Belum ada logo</span>
                    </div>
                  )}
                </div>
                <div className="logo-actions">
                  <label className="btn btn-outline">
                    <Upload size={16} />
                    {uploading ? 'Mengupload...' : 'Pilih Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <p className="help-text">Format: PNG, JPG. Maksimal 2MB</p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nama Aplikasi</label>
              <input
                type="text"
                name="app_name"
                className="form-input"
                value={formData.app_name}
                onChange={handleChange}
                placeholder="Costume Rental"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tagline</label>
              <input
                type="text"
                name="tagline"
                className="form-input"
                value={formData.tagline}
                onChange={handleChange}
                placeholder="Inventory & Rental Management"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Preview</h2>
          </div>

          <div className="preview-box">
            <div className="preview-navbar">
              {preview ? (
                <img src={preview} alt="Logo" className="preview-logo" />
              ) : (
                <span className="preview-title">{formData.app_name || 'Costume Rental'}</span>
              )}
            </div>
            <div className="preview-content">
              <h3>{formData.app_name || 'Costume Rental'}</h3>
              <p>{formData.tagline || 'Inventory & Rental Management'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;