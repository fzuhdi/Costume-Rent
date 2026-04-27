import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRents, markReturned, deleteRent } from '../api/rentApi';
import { Plus, Search, CheckCircle } from 'lucide-react';
import {
  Input, Button, Select, SelectItem,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Spinner, Pagination, Card, CardBody,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
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

const RentHistoryPage = () => {
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRentId, setSelectedRentId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRents();
  }, [search, statusFilter, page]);

  const fetchRents = async () => {
    setLoading(true);
    try {
      const response = await getRents({
        search,
        status: statusFilter,
        page,
        limit: 10,
      });
      setRents(response.data.data || []);
      setTotalPages(response.data.total_pages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch rents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReturned = async () => {
    setActionLoading(true);
    try {
      await markReturned(selectedRentId);
      setIsReturnOpen(false);
      fetchRents();
    } catch (error) {
      console.error('Failed to mark returned:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteRent(selectedRentId);
      setIsDeleteOpen(false);
      fetchRents();
    } catch (error) {
      console.error('Failed to delete rent:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Riwayat Peminjaman</h1>
        <Button as={Link} to="/rents/new" color="primary" startContent={<Plus size={18} />}>
          Peminjaman Baru
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari klien..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          startContent={<Search size={18} />}
          className="w-64"
        />
        <Select
          placeholder="Semua Status"
          selectedKeys={statusFilter ? [statusFilter] : []}
          onSelectionChange={(keys) => { setStatusFilter([...keys][0] ?? ''); setPage(1); }}
          className="w-40"
        >
          <SelectItem key="">Semua Status</SelectItem>
          <SelectItem key="active">Aktif</SelectItem>
          <SelectItem key="returned">Dikembalikan</SelectItem>
          <SelectItem key="overdue">Terlambat</SelectItem>
        </Select>
      </div>

      <p className="text-sm text-[var(--muted)]">Ditemukan {total} peminjaman</p>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Spinner />
        </div>
      ) : rents.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <h3 className="text-lg font-semibold">Tidak ada peminjaman</h3>
            <p className="text-sm text-[var(--muted)]">Belum ada data peminjaman</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <Table>
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Klien</TableColumn>
                <TableColumn>Kostum</TableColumn>
                <TableColumn>Tanggal</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Aksi</TableColumn>
              </TableHeader>
              <TableBody>
                {rents.map((rent) => (
                  <TableRow key={rent.id}>
                    <TableCell>#{rent.id}</TableCell>
                    <TableCell>{rent.client_name}</TableCell>
                    <TableCell>{rent.items?.length || 0} kostum</TableCell>
                    <TableCell>{rent.rent_start} - {rent.rent_end}</TableCell>
                    <TableCell>
                      <Chip size="sm" color={statusColors[rent.status] ?? 'default'}>
                        {statusLabels[rent.status] || rent.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button as={Link} to={`/rents/${rent.id}`} variant="bordered" size="sm">Detail</Button>
                        {rent.status !== 'returned' && (
                          <Button color="success" size="sm" onPress={() => { setSelectedRentId(rent.id); setIsReturnOpen(true); }} startContent={<CheckCircle size={14} />}>Kembalikan</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination total={totalPages} page={page} onChange={setPage} />
        </div>
      )}

      <Modal isOpen={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <ModalContent>
          <ModalHeader>Konfirmasi</ModalHeader>
          <ModalBody>Tandai kostum sudah dikembalikan?</ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={() => setIsReturnOpen(false)}>Batal</Button>
            <Button color="success" onPress={handleMarkReturned} isLoading={actionLoading}>Kembalikan</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default RentHistoryPage;