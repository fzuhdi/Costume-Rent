import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Save, Upload, Image } from 'lucide-react';
import { Input, Button, Card, CardBody, Chip } from '@heroui/react';

const SettingsPage = () => {
  const { settings, updateSettings, uploadLogo } = useSettings();
  const [formData, setFormData] = useState({
    app_name: settings.app_name || '',
    tagline: settings.app_tagline || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(settings.app_logo || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setUploading(true);
      uploadLogo(file)
        .then(() => setUploading(false))
        .catch(() => {
          setUploading(false);
          setPreview(settings.app_logo || '');
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await updateSettings(formData);
      setSuccessMsg('Pengaturan berhasil disimpan');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg('Gagal menyimpan pengaturan');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Pengaturan Aplikasi</h1>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">Branding</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Logo Aplikasi</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-[var(--border)] rounded-lg flex items-center justify-center">
                  {preview ? (
                    <img src={preview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Image size={32} className="opacity-50" />
                  )}
                </div>
                <div>
                  <Button variant="bordered" size="sm" isLoading={uploading} as="label" className="cursor-pointer">
                    <Upload size={16} />
                    {uploading ? 'Mengupload...' : 'Pilih Logo'}
                    <input type="file" accept="image/*" onChange={handleLogoChange} disabled={uploading} className="hidden" />
                  </Button>
                  <p className="text-xs text-[var(--muted)] mt-1">Format: PNG, JPG. Maksimal 2MB</p>
                </div>
              </div>
            </div>

            <Input label="Nama Aplikasi" name="app_name" value={formData.app_name} onChange={handleChange} placeholder="Costume Rental" />
            <Input label="Tagline" name="tagline" value={formData.tagline} onChange={handleChange} placeholder="Inventory & Rental Management" />

            {successMsg && <Chip color="success">{successMsg}</Chip>}
            {errorMsg && <Chip color="danger">{errorMsg}</Chip>}

            <Button type="submit" color="primary" isLoading={saving} startContent={<Save size={18} />}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">Preview</h2>
          <div className="bg-[var(--border)] rounded-lg p-4">
            <div className="h-12 bg-[var(--surface)] rounded flex items-center px-3 mb-4">
              {preview ? (
                <img src={preview} alt="Logo" className="h-8" />
              ) : (
                <span className="font-bold">{formData.app_name || 'Costume Rental'}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold">{formData.app_name || 'Costume Rental'}</h3>
              <p className="text-sm text-[var(--muted)]">{formData.tagline || 'Inventory & Rental Management'}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default SettingsPage;