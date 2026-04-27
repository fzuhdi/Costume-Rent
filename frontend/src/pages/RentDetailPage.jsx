import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRentById, markReturned, deleteRent } from '../api/rentApi';
import { ArrowLeft, Edit, Trash2, CheckCircle, User, Calendar, FileText, Shield } from 'lucide-react';
import {
  Button, Card, CardBody, Chip, Spinner,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
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
        <CardBody className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Peminjaman tidak ditemukan</h3>
          <Button as={Link} to="/rents" color="primary">Kembali ke Riwayat</Button>
        </CardBody>
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
        <CardBody className="gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold">Peminjaman #{rent.id}</h2>
              <Chip className="mt-2" color={statusColors[rent.status] ?? 'default'}>
                {statusLabels[rent.status] || rent.status}
              </Chip>
            </div>
            <div className="flex gap-2">
              {rent.status !== 'returned' && (
                <Button color="success" size="sm" onPress={() => setIsReturnOpen(true)} isLoading={processing} startContent={<CheckCircle size={16} />}>Kembalikan</Button>
              )}
              <Button as={Link} to={`/rents/${id}/edit`} variant="bordered" size="sm" startContent={<Edit size={16} />}>Edit</Button>
              <Button color="danger" size="sm" onPress={() => setIsDeleteOpen(true)} isLoading={processing} startContent={<Trash2 size={16} />}>Hapus</Button>
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
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Daftar Kostum</h3>
            <span className="text-sm text-[var(--muted)]">{rent.items?.length || 0} item</span>
          </div>
          <Table>
            <TableHeader>
              <TableColumn>Gambar</TableColumn>
              <TableColumn>Nama Kostum</TableColumn>
              <TableColumn>Jumlah</TableColumn>
            </TableHeader>
            <TableBody>
              {rent.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.cover_image ? (
                      <img src={item.cover_image} alt="" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <span className="text-[var(--muted)]">-</span>
                    )}
                  </TableCell>
                  <TableCell>{item.costume_name}</TableCell>
                  <TableCell>{item.quantity} unit</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
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
        </CardBody>
      </Card>

      <Modal isOpen={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <ModalContent>
          <ModalHeader>Konfirmasi</ModalHeader>
          <ModalBody>Tandai kostum sudah dikembalikan?</ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={() => setIsReturnOpen(false)}>Batal</Button>
            <Button color="success" onPress={handleMarkReturned} isLoading={processing}>Kembalikan</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ModalContent>
          <ModalHeader>Konfirmasi</ModalHeader>
          <ModalBody>Hapus peminjaman ini?</ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button color="danger" onPress={handleDelete} isLoading={processing}>Hapus</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default RentDetailPage;