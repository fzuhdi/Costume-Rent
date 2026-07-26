"use client";

import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Save, Eye } from 'lucide-react';
import { TextField, Input, Button, Card, Chip, FieldError, Label } from '@heroui/react';
import FileUploadZone from '@/components/FileUploadZone';
import ImagePreviewModal from '@/components/ImagePreviewModal';

const SettingsPage = () => {
  const { settings, updateSettings, uploadLogo } = useSettings();
  const [formData, setFormData] = useState({
    app_name: settings.app_name || '',
    tagline: settings.app_tagline || '',
    pickup_days_before: settings.pickup_days_before || '2',
    return_days_after: settings.return_days_after || '1',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(settings.app_logo || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const onPreviewOpen = () => setIsPreviewOpen(true);
  const onPreviewClose = () => setIsPreviewOpen(false);


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
      await updateSettings({
        app_name: formData.app_name,
        app_tagline: formData.tagline,
        pickup_days_before: formData.pickup_days_before,
        return_days_after: formData.return_days_after,
      });
      setSuccessMsg('Pengaturan berhasil disimpan');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div 
                  className="w-20 h-20 bg-[var(--border)] rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer group relative overflow-hidden"
                  onClick={onPreviewOpen}
                  aria-label="Preview Logo"
                >
                  <img src={preview || '/kbr-logo.svg'} alt="Logo" className="w-full h-full object-contain p-2 group-hover:opacity-50 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="text-[var(--foreground)] opacity-75" size={24} />
                  </div>
                </div>
                <div className="flex-grow max-w-sm">
                  <FileUploadZone
                    uploading={uploading}
                    fileLabel={(preview && preview !== settings.app_logo) ? "Logo baru dipilih" : null}
                    onChange={handleLogoChange}
                    label="Logo Aplikasi"
                  />
                </div>
              </div>
            </div>

            <TextField isRequired>
              <Label>Nama Aplikasi</Label>
              <Input value={formData.app_name} onChange={(e) => setFormData((prev) => ({ ...prev, app_name: e.target.value }))} placeholder="Costume Rental" />
              <FieldError />
            </TextField>
            <TextField>
              <Label>Tagline</Label>
              <Input value={formData.tagline} onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))} placeholder="Inventory & Rental Management" />
            </TextField>
            <TextField isRequired>
              <Label>Hari Persiapan Ambil (Sebelum Hari-H)</Label>
              <Input type="number" min="0" value={formData.pickup_days_before} onChange={(e) => setFormData((prev) => ({ ...prev, pickup_days_before: e.target.value }))} placeholder="2" />
            </TextField>
            <TextField isRequired>
              <Label>Hari Batas Kembali (Setelah Hari-H)</Label>
              <Input type="number" min="0" value={formData.return_days_after} onChange={(e) => setFormData((prev) => ({ ...prev, return_days_after: e.target.value }))} placeholder="1" />
            </TextField>

            {successMsg && <Chip variant="secondary">{successMsg}</Chip>}
            {errorMsg && <Chip variant="soft" color="danger">{errorMsg}</Chip>}

            <Button type="submit" variant="primary" isPending={saving} aria-label="Simpan Perubahan">
              {({ isPending }) => (
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
          <div className="h-12 bg-[var(--surface)] rounded flex items-center gap-3 px-3 mb-4">
            <img
              src={preview || '/kbr-logo.svg'}
              alt="Logo"
              className="w-7 h-7 object-contain flex-shrink-0"
            />
            <div className="flex flex-col truncate">
              <span className="text-lg font-bold text-[var(--foreground)] truncate">
                {formData.app_name || 'Costume Rental'}
              </span>
              <span className="text-xs text-[var(--muted)] truncate">
                {formData.tagline || 'Inventory & Rental Management'}
              </span>
            </div>
          </div>
        </Card.Content>
      </Card>
      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
        images={[preview || '/kbr-logo.svg']}
      />
    </div>
  );
};

export default SettingsPage;
