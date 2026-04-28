import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRents, markReturned, deleteRent } from '../api/rentApi';
import { Plus, Search, CheckCircle } from 'lucide-react';
import {
  Input, Button, Select, ListBox, Label,
  Table, Chip, Spinner, Pagination, Card
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
        <Button as={Link} to="/rents/new" variant="primary" startContent={<Plus size={18} />}>
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
          value={statusFilter || null}
          onChange={(value) => { setStatusFilter(value ? String(value) : ''); setPage(1); }}
          className="w-40"
        >
          <Label>Semua Status</Label>
          <Select.Trigger>
            <Select.Value placeholder="Semua Status" />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="" textValue="Semua Status">Semua Status</ListBox.Item>
              <ListBox.Item id="active" textValue="Aktif">Aktif</ListBox.Item>
              <ListBox.Item id="returned" textValue="Dikembalikan">Dikembalikan</ListBox.Item>
              <ListBox.Item id="overdue" textValue="Terlambat">Terlambat</ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <p className="text-sm text-[var(--muted)]">Ditemukan {total} peminjaman</p>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Spinner />
        </div>
      ) : rents.length === 0 ? (
        <Card>
          <Card.Content className="text-center py-12">
            <h3 className="text-lg font-semibold">Tidak ada peminjaman</h3>
            <p className="text-sm text-[var(--muted)]">Belum ada data peminjaman</p>
          </Card.Content>
        </Card>
      ) : (
        <Card>
          <Card.Content>
            <Table aria-label="Rent history">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header>
                    <Table.Column isRowHeader>ID</Table.Column>
                    <Table.Column>Klien</Table.Column>
                    <Table.Column>Kostum</Table.Column>
                    <Table.Column>Tanggal</Table.Column>
                    <Table.Column>Status</Table.Column>
                    <Table.Column>Aksi</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {rents.map((rent) => (
                      <Table.Row key={rent.id}>
                        <Table.Cell>#{rent.id}</Table.Cell>
                        <Table.Cell>{rent.client_name}</Table.Cell>
                        <Table.Cell>{rent.items?.length || 0} kostum</Table.Cell>
                        <Table.Cell>{rent.rent_start} - {rent.rent_end}</Table.Cell>
                        <Table.Cell>
                          <Chip size="sm" variant={statusColors[rent.status]}>
                            {statusLabels[rent.status] || rent.status}
                          </Chip>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex gap-2">
                            <Button as={Link} to={`/rents/${rent.id}`} variant="bordered" size="sm">Detail</Button>
                            {rent.status !== 'returned' && (
                              <Button variant="secondary" size="sm" onPress={() => { setSelectedRentId(rent.id); setIsReturnOpen(true); }} startContent={<CheckCircle size={14} />}>Kembalikan</Button>
                            )}
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Card.Content>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination total={totalPages} page={page} onChange={setPage} />
        </div>
      )}

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
                <Button variant="secondary" onPress={handleMarkReturned} isPending={actionLoading}>Kembalikan</Button>
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
                <Button variant="danger" onPress={handleDelete} isPending={actionLoading}>Hapus</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
};

export default RentHistoryPage;