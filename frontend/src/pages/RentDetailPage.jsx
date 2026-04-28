import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRentById, markReturned, deleteRent } from '../api/rentApi';
import { ArrowLeft, Edit, Trash2, CheckCircle, User, Calendar, FileText, Shield } from 'lucide-react';
import {
  Button, Card, Chip, Spinner, Table
} from '@heroui/react';

const statusColors = {
  active: 'secondary',
  returned: 'secondary',
  overdue: 'danger-soft',
};

const statusLabels = {
  active: 'Aktif',
  returned: 'Dikembalikan',
  overdue: 'Terlambat',
};

const RentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rent, setRent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    fetchRent();
  }, [id]);

  const fetchRent = async () => {
    setLoading(true);
    try {
      const response = await getRentById(id);
      setRent(response.data);
    } catch (error) {
      console.error('Failed to fetch rent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReturned = async () => {
    setProcessing(true);
    try {
      await markReturned(id);
      setIsReturnOpen(false);
      fetchRent();
    } catch (error) {
      console.error('Failed to mark returned:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    setProcessing(true);
    try {
      await deleteRent(id);
      setIsDeleteOpen(false);
      navigate('/rents');
    } catch (error) {
      console.error('Failed to delete rent:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner />
      </div>
    );
  }

  if (!rent) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Peminjaman tidak ditemukan</h3>
          <Button as={Link} to="/rents" variant="primary">Kembali ke Riwayat</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/rents" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft size={18} />
        Kembali ke Riwayat
      </Link>

      <Card>
        <Card.Content>
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold">Peminjaman #{rent.id}</h2>
              <Chip className="mt-2" variant={statusColors[rent.status] ?? 'secondary'}>
                {statusLabels[rent.status] || rent.status}
              </Chip>
            </div>
            <div className="flex gap-2">
              {rent.status !== 'returned' && (
                <Button variant="secondary" size="sm" onPress={() => setIsReturnOpen(true)} isPending={processing} startContent={<CheckCircle size={16} />}>Kembalikan</Button>
              )}
              <Button as={Link} to={`/rents/${id}/edit`} variant="bordered" size="sm" startContent={<Edit size={16} />}>Edit</Button>
              <Button variant="danger" size="sm" onPress={() => setIsDeleteOpen(true)} isPending={processing} startContent={<Trash2 size={16} />}>Hapus</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <User size={20} className="text-[var(--muted)]" />
              <div>
                <span className="text-[var(--muted)]">Klien</span>
                <p className="font-medium">{rent.client_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-[var(--muted)]" />
              <div>
                <span className="text-[var(--muted)]">Tanggal Pinjam</span>
                <p className="font-medium">{rent.rent_start} - {rent.rent_end}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[var(--muted)]" />
              <div>
                <span className="text-[var(--muted)]">Jaminan</span>
                <p className="font-medium">{rent.guarantee_type} {rent.guarantee_number && `- ${rent.guarantee_number}`}</p>
              </div>
            </div>
            {rent.notes && (
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-[var(--muted)]" />
                <div>
                  <span className="text-[var(--muted)]">Catatan</span>
                  <p className="font-medium">{rent.notes}</p>
                </div>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Daftar Kostum</h2>
            <span className="text-sm text-[var(--muted)]">{rent.items?.length || 0} item</span>
          </div>
          <Table aria-label="Rent items">
            <Table.ScrollContainer>
              <Table.Content>
                <Table.Header>
                  <Table.Column>Gambar</Table.Column>
                  <Table.Column>Nama Kostum</Table.Column>
                  <Table.Column>Jumlah</Table.Column>
                </Table.Header>
                <Table.Body>
                  {rent.items?.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell>
                        {item.cover_image ? (
                          <img src={item.cover_image} alt="" className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <span className="text-[var(--muted)]">-</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>{item.costume_name}</Table.Cell>
                      <Table.Cell>{item.quantity} unit</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <h3 className="text-sm font-medium mb-2">Informasi</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Dibuat</span>
              <span>{rent.created_at}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Diperbarui</span>
              <span>{rent.updated_at}</span>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Modal>
        <Modal.Backdrop isOpen={isReturnOpen} onOpenChange={setIsReturnOpen}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Konfirmasi</Modal.Heading>
              </Modal.Header>
              <Modal.Body>Tandai kostum sudah dikembalikan?</Modal.Body>
              <Modal.Footer>
                <Button variant="bordered" onPress={() => setIsReturnOpen(false)}>Batal</Button>
                <Button variant="secondary" onPress={handleMarkReturned} isPending={processing}>Kembalikan</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Konfirmasi</Modal.Heading>
              </Modal.Header>
              <Modal.Body>Hapus peminjaman ini?</Modal.Body>
              <Modal.Footer>
                <Button variant="bordered" onPress={() => setIsDeleteOpen(false)}>Batal</Button>
                <Button variant="danger" onPress={handleDelete} isPending={processing}>Hapus</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
};

export default RentDetailPage;