import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Save, Upload, Image } from 'lucide-react';
import { TextField, Input, Button, Card, Chip, FieldError, Label } from '@heroui/react';

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
        <Card.Content>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Branding</h2>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Logo Aplikasi</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-20 h-20 bg-[var(--border)] rounded-lg flex items-center justify-center flex-shrink-0">
                  {preview ? (
                    <img src={preview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Image size={32} className="opacity-50" />
                  )}
                </div>
                <div>
                   <Button variant="bordered" size="sm" isPending={uploading} as="label" className="cursor-pointer" aria-label="Pilih Logo">
                    <Upload size={16} />
                    {uploading ? 'Mengupload...' : 'Pilih Logo'}
                    <input type="file" accept="image/*" onChange={handleLogoChange} disabled={uploading} className="hidden" />
                  </Button>
                  <p className="text-xs text-[var(--muted)] mt-1">Format: PNG, JPG. Maksimal 2MB</p>
                </div>
              </div>
            </div>

            <TextField isRequired>
              <Label>Nama Aplikasi</Label>
              <Input value={formData.app_name} onChange={(e) => setFormData((prev) => ({...prev, app_name: e.target.value}))} placeholder="Costume Rental" />
              <FieldError />
            </TextField>
            <TextField>
              <Label>Tagline</Label>
              <Input value={formData.tagline} onChange={(e) => setFormData((prev) => ({...prev, tagline: e.target.value}))} placeholder="Inventory & Rental Management" />
            </TextField>

            {successMsg && <Chip variant="secondary">{successMsg}</Chip>}
             {errorMsg && <Chip variant="soft" color="danger">{errorMsg}</Chip>}

             <Button type="submit" variant="primary" isPending={saving} aria-label="Simpan Perubahan">
              {({isPending}) => (
                <>
                  {!isPending && <Save size={18} />}
                  {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </>
              )}
            </Button>
          </form>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Preview</h2>
          </div>
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
        </Card.Content>
      </Card>
    </div>
  );
};

export default SettingsPage;
