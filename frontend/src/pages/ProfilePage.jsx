import { useState } from 'react';
import { Card, Input, Button, Alert, TextField, Label } from '@heroui/react';
import { User, Lock, Mail, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/authApi';

function ProfilePage() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok');
      return;
    }

    try {
      setLoading(true);
      await changePassword({
        old_password: formData.oldPassword,
        new_password: formData.newPassword
      });
      setSuccessMsg('Password berhasil diubah!');
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <User size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-default-900">Profil Pengguna</h1>
          <p className="text-default-500 text-sm">Lihat informasi akun dan ubah password Anda</p>
        </div>
      </div>

      {errorMsg && (
        <Alert color="danger" variant="flat">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{errorMsg}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {successMsg && (
        <Alert color="success" variant="flat">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{successMsg}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Card className="shadow-sm border border-default-200">
        <Card.Header className="px-6 py-4 border-b border-default-200 flex items-center gap-2">
          <User size={18} className="text-default-500" />
          <h2 className="text-lg font-semibold">Informasi Akun</h2>
        </Card.Header>
        <Card.Content className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField aria-label="Nama Lengkap" isReadOnly>
              <Label>Nama Lengkap</Label>
              <Input value={user?.name || ''} readOnly />
            </TextField>
            <TextField aria-label="Email" isReadOnly>
              <Label>Email</Label>
              <Input value={user?.email || ''} readOnly />
            </TextField>
            <TextField aria-label="Role" isReadOnly className="md:col-span-2">
              <Label>Role</Label>
              <Input value={user?.role || ''} readOnly />
            </TextField>
          </div>
        </Card.Content>
      </Card>

      <Card className="shadow-sm border border-default-200">
        <Card.Header className="px-6 py-4 border-b border-default-200 flex items-center gap-2">
          <Lock size={18} className="text-default-500" />
          <h2 className="text-lg font-semibold">Keamanan & Password</h2>
        </Card.Header>
        <Card.Content className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <TextField name="oldPassword" isRequired aria-label="Password Lama">
              <Label>Password Lama</Label>
              <Input
                type="password"
                placeholder="Masukkan password lama"
                value={formData.oldPassword}
                onChange={handleChange}
              />
            </TextField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField name="newPassword" isRequired aria-label="Password Baru">
                <Label>Password Baru</Label>
                <Input
                  type="password"
                  placeholder="Masukkan password baru"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </TextField>
              <TextField name="confirmPassword" isRequired aria-label="Konfirmasi Password Baru">
                <Label>Konfirmasi Password Baru</Label>
                <Input
                  type="password"
                  placeholder="Ulangi password baru"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </TextField>
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                color="primary"
                type="submit"
                isLoading={loading}
                isDisabled={!formData.oldPassword || !formData.newPassword || !formData.confirmPassword}
              >
                Ubah Password
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}

export default ProfilePage;
