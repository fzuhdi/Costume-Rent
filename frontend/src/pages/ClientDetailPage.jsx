import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClientById, updateClient } from '../api/clientApi';
import { ArrowLeft, Edit, Save, X, User, Phone, MapPin, ClipboardList, AlertTriangle } from 'lucide-react';
import {
  Input, Textarea, Button, Card, CardBody, Chip, Spinner,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell
} from '@heroui/react';

const statusColors = {
  active: 'primary',
  returned: 'success',
  overdue: 'danger',
};

const statusLabels = {
  active: 'Aktif',
  returned: 'Dikembalikan',
  overdue: 'Terlambat',
};

const ClientDetailPage = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const response = await getClientById(id);
      setClient(response.data);
    } catch (error) {
      console.error('Failed to fetch client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditData({
      name: client.name,
      phone: client.phone || '',
      address: client.address || '',
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleChange = (e) => {
    setEditData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateClient(id, editData);
      setEditing(false);
      fetchClient();
    } catch (error) {
      console.error('Failed to save:', error);
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

  if (!client) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Klien tidak ditemukan</h3>
          <Button as={Link} to="/clients" color="primary">Kembali ke Daftar</Button>
        </CardBody>
      </Card>
    );
  }

  const activeRents = client.rent_orders?.filter((r) => r.status === 'active') || [];
  const overdueRents = client.rent_orders?.filter((r) => r.status === 'overdue') || [];

  return (
    <div className="flex flex-col gap-4">
      <Link to="/clients" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft size={18} />
        Kembali ke Daftar Klien
      </Link>

      <Card>
        <CardBody className="gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Informasi Klien</h2>
            {!editing && (
              <Button variant="bordered" size="sm" onPress={handleEdit} startContent={<Edit size={16} />}>Edit</Button>
            )}
          </div>

          {editing ? (
            <div className="flex flex-col gap-4">
              <Input label="Nama" name="name" value={editData.name} onChange={handleChange} />
              <Input label="Telepon" name="phone" value={editData.phone} onChange={handleChange} />
              <Textarea label="Alamat" name="address" value={editData.address} onChange={handleChange} />
              <div className="flex gap-3 justify-end">
                <Button variant="bordered" onPress={handleCancel} startContent={<X size={16} />}>Batal</Button>
                <Button color="primary" onPress={handleSave} isLoading={saving} startContent={<Save size={16} />}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <User size={20} className="text-[var(--muted)]" />
                <div>
                  <span className="text-[var(--muted)]">Nama</span>
                  <p className="font-medium">{client.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={20} className="text-[var(--muted)]" />
                <div>
                  <span className="text-[var(--muted)]">Telepon</span>
                  <p className="font-medium">{client.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-[var(--muted)]" />
                <div>
                  <span className="text-[var(--muted)]">Alamat</span>
                  <p className="font-medium">{client.address || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-base font-semibold mb-4">Riwayat Peminjaman</h3>
          {client.rent_orders?.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted)]">
              <ClipboardList size={48} className="mx-auto mb-2 opacity-50" />
              <p>Belum ada riwayat peminjaman</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Tanggal</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Aksi</TableColumn>
              </TableHeader>
              <TableBody>
                {client.rent_orders?.map((rent) => (
                  <TableRow key={rent.id}>
                    <TableCell>#{rent.id}</TableCell>
                    <TableCell>{rent.rent_start} - {rent.rent_end}</TableCell>
                    <TableCell>
                      <Chip size="sm" color={statusColors[rent.status] ?? 'default'}>
                        {statusLabels[rent.status] || rent.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button as={Link} to={`/rents/${rent.id}`} variant="bordered" size="sm">Detail</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-sm font-medium mb-2">Statistik</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{client.rent_orders?.length || 0}</p>
              <p className="text-xs text-[var(--muted)]">Total Pinjaman</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{activeRents.length}</p>
              <p className="text-xs text-[var(--muted)]">Aktif</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-danger">{overdueRents.length}</p>
              <p className="text-xs text-[var(--muted)]">Terlambat</p>
            </div>
          </div>
          {overdueRents.length > 0 && (
            <Chip color="danger" className="mt-4" startContent={<AlertTriangle size={14} />}>
              {overdueRents.length} peminjaman terlambat
            </Chip>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ClientDetailPage;