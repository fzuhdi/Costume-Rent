import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getClientById, updateClient } from '../api/clientApi';
import { ArrowLeft, Edit, Save, X, User, Phone, MapPin, ClipboardList, AlertTriangle } from 'lucide-react';
import {
  TextField, TextArea, Label, Input, Button, Card, Chip, Spinner, Table, FieldError
} from '@heroui/react';

const statusColors = {
  draft: { variant: 'soft', color: 'warning' },
  booked: { variant: 'soft', color: 'primary' },
  rented: { variant: 'secondary' },
  returned: { variant: 'soft', color: 'success' },
  overdue: { variant: 'soft', color: 'danger' },
  cancelled: { variant: 'soft', color: 'default' },
};

const statusLabels = {
  draft: 'Draft',
  booked: 'Dipesan',
  rented: 'Disewa',
  returned: 'Dikembalikan',
  overdue: 'Terlambat',
  cancelled: 'Dibatalkan',
};

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getClientById(id);
      setClient(response.data);
    } catch (error) {
      console.error('Failed to fetch client:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

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
        <Card.Content className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Klien tidak ditemukan</h3>
           <Button onPress={() => navigate('/clients')} variant="primary">Kembali ke Daftar</Button>
        </Card.Content>
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
        <Card.Content>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Informasi Klien</h2>
            {!editing && (
              <Button variant="bordered" size="sm" onPress={handleEdit}><Edit size={16} />Edit</Button>
            )}
          </div>
          {editing ? (
            <div className="flex flex-col gap-4">
              <TextField>
                <Label>Nama</Label>
                <Input value={editData.name} onChange={(e) => setEditData((prev) => ({...prev, name: e.target.value}))} />
                <FieldError />
              </TextField>
              <TextField>
                <Label>Telepon</Label>
                <Input value={editData.phone} onChange={(e) => setEditData((prev) => ({...prev, phone: e.target.value}))} />
              </TextField>
              <TextField>
                <Label>Alamat</Label>
                <TextArea value={editData.address} onChange={(e) => setEditData((prev) => ({...prev, address: e.target.value}))} />
              </TextField>
              <div className="flex gap-3 justify-end">
                <Button variant="bordered" onPress={handleCancel}><X size={16} />Batal</Button>
                <Button variant="primary" onPress={handleSave} isPending={saving}>
                  {({isPending}) => (
                    <>
                      {!isPending && <Save size={16} />}
                      {isPending ? 'Menyimpan...' : 'Simpan'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <h2 className="text-xl font-semibold mb-4">Riwayat Peminjaman</h2>
          {client.rent_orders?.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted)]">
              <ClipboardList size={48} className="mx-auto mb-2 opacity-50" />
              <p>Belum ada riwayat peminjaman</p>
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Client rent history">
                  <Table.Header>
                    <Table.Column isRowHeader>ID</Table.Column>
                    <Table.Column>Tanggal</Table.Column>
                    <Table.Column>Status</Table.Column>
                    <Table.Column>Aksi</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {client.rent_orders?.map((rent) => (
                      <Table.Row key={rent.id}>
                        <Table.Cell>#{rent.id}</Table.Cell>
                        <Table.Cell>{rent.pickup_date} - {rent.expected_return_date}</Table.Cell>
                        <Table.Cell>
                          <Chip size="sm" {...statusColors[rent.status]}>
                            {statusLabels[rent.status] || rent.status}
                          </Chip>
                        </Table.Cell>
                        <Table.Cell>
                           <Button onPress={() => navigate(`/rents/${rent.id}`)} variant="bordered" size="sm">Detail</Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <h3 className="text-sm font-medium mb-2">Statistik</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{client.rent_orders?.length || 0}</p>
              <p className="text-xs text-[var(--muted)]">Total Pinjaman</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--primary)]">{activeRents.length}</p>
              <p className="text-xs text-[var(--muted)]">Aktif</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--danger)]">{overdueRents.length}</p>
              <p className="text-xs text-[var(--muted)]">Terlambat</p>
            </div>
          </div>
          {overdueRents.length > 0 && (
             <Chip variant="soft" color="danger" className="mt-4"><AlertTriangle size={14} />{overdueRents.length} peminjaman terlambat</Chip>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default ClientDetailPage;
