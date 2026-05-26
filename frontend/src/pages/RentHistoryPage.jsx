import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRents, markReturned, deleteRent } from '../api/rentApi';
import { CheckCircle } from 'lucide-react';
import {
  Input, Button, Select, ListBox, Label,
  Table, Chip, Spinner, Modal, Card, Separator
} from '@heroui/react';
import CustomPagination from '../components/CustomPagination';

const statusColors = {
  active: { variant: 'secondary' },
  returned: { variant: 'soft', color: 'success' },
  overdue: { variant: 'soft', color: 'danger' },
};

const statusLabels = {
  active: 'Aktif',
  returned: 'Dikembalikan',
  overdue: 'Terlambat',
};

const statusA11yLabels = {
  active: 'status active',
  returned: 'status returned',
  overdue: 'status overdue',
};

const RentHistoryPage = () => {
  const navigate = useNavigate();
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRentId, setSelectedRentId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchRents();
  }, [debouncedSearch, statusFilter, page, limit]);

  const fetchRents = async () => {
    setLoading(true);
    try {
      const isSearching = Boolean(debouncedSearch.trim());
      const response = await getRents({
        search: '',
        status: statusFilter,
        page: isSearching ? 1 : page,
        limit: isSearching ? 100 : limit,
      });
      const data = response.data.data || [];
      const filteredData = isSearching
        ? data.filter((rent) => rent.client_name?.toLowerCase().includes(debouncedSearch.trim().toLowerCase()))
        : data;
      setRents(filteredData);
      setTotalPages(isSearching ? 1 : response.data.total_pages || 1);
      setTotal(isSearching ? filteredData.length : response.data.total || 0);
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
    <Card>
      <Card.Header className="flex flex-col gap-4 px-6 py-5">
        {/* Title + Add button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold">Riwayat Peminjaman</h1>
          <Button
            onPress={() => navigate('/rents/new')}
            variant="primary"
            aria-label="Tambah Peminjaman Baru"
          >
            Peminjaman Baru
          </Button>
        </div>

        <Separator />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <Input
            placeholder="Cari klien..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Cari klien"
            className="w-full sm:w-64"
          />
          <Select
            placeholder="Semua Status"
            value={statusFilter || null}
            onChange={(key) => {
              setStatusFilter(key ? String(key) : '');
              setPage(1);
            }}
            className="w-full sm:w-40"
          >
            <Label className="sr-only">Status</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="" textValue="Semua Status">Semua Status<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="active" textValue="Aktif">Aktif<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="returned" textValue="Dikembalikan">Dikembalikan<ListBox.ItemIndicator /></ListBox.Item>
                <ListBox.Item id="overdue" textValue="Terlambat">Terlambat<ListBox.ItemIndicator /></ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        <Separator />
      </Card.Header>

      <Card.Content>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner />
          </div>
        ) : rents.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">Tidak ada peminjaman</h3>
            <p className="text-sm text-[var(--muted)]">Belum ada data peminjaman</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {rents.map((rent) => (
                <article
                  key={rent.id}
                  data-testid={`rent-card-${rent.id}`}
                  className="rent-card rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {rent.client_name}
                      </p>
                      <p className="text-xs text-[var(--muted)]">Peminjaman #{rent.id}</p>
                    </div>
                    <Chip size="sm" {...statusColors[rent.status]}>
                      {statusLabels[rent.status] || rent.status}
                    </Chip>
                  </div>
                  <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[var(--muted)]">Kostum</dt>
                      <dd className="font-medium">{rent.items?.length || 0} kostum</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[var(--muted)]">Tanggal</dt>
                      <dd className="text-right font-medium">{rent.rent_start} - {rent.rent_end}</dd>
                    </div>
                  </dl>
                  <span className="sr-only">{statusA11yLabels[rent.status] || `status ${rent.status}`}</span>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      onPress={() => navigate(`/rents/${rent.id}`)}
                      variant="bordered"
                      size="sm"
                      aria-label={`Detail peminjaman #${rent.id}`}
                    >
                      Detail
                    </Button>
                    {rent.status !== 'returned' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onPress={() => { setSelectedRentId(rent.id); setIsReturnOpen(true); }}
                        aria-label="Kembalikan peminjaman"
                      >
                        <CheckCircle size={14} aria-hidden="true" />
                        Kembalikan
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden md:block">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="Rent history">
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
                        <Table.Row key={rent.id} aria-label={`Peminjaman #${rent.id} oleh ${rent.client_name}`}>
                          <Table.Cell>#{rent.id}</Table.Cell>
                          <Table.Cell>{rent.client_name}</Table.Cell>
                          <Table.Cell>{rent.items?.length || 0} kostum</Table.Cell>
                          <Table.Cell>{rent.rent_start} - {rent.rent_end}</Table.Cell>
                          <Table.Cell>
                             <Chip size="sm" {...statusColors[rent.status]}>
                              {statusLabels[rent.status] || rent.status}
                            </Chip>
                            <span className="sr-only">{statusA11yLabels[rent.status] || `status ${rent.status}`}</span>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex flex-col sm:flex-row gap-2">
                               <Button onPress={() => navigate(`/rents/${rent.id}`)} variant="bordered" size="sm" aria-label={`Detail peminjaman #${rent.id}`}>Detail</Button>
                               {rent.status !== 'returned' && (
                                 <Button variant="secondary" size="sm" onPress={() => { setSelectedRentId(rent.id); setIsReturnOpen(true); }} aria-label="Kembalikan peminjaman"><CheckCircle size={14} aria-hidden="true" />Kembalikan</Button>
                               )}
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </div>
          </>
        )}
      </Card.Content>

      <Card.Footer>
        <CustomPagination
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      </Card.Footer>

      <Modal.Backdrop isOpen={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Konfirmasi</Modal.Heading>
            </Modal.Header>
            <Modal.Body>Tandai kostum sudah dikembalikan?</Modal.Body>
            <Modal.Footer>
               <Button variant="bordered" onPress={() => setIsReturnOpen(false)} aria-label="Batal">Batal</Button>
               <Button variant="secondary" onPress={handleMarkReturned} isPending={actionLoading} aria-label="Kembalikan peminjaman">Kembalikan</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Konfirmasi</Modal.Heading>
            </Modal.Header>
            <Modal.Body>Hapus peminjaman ini?</Modal.Body>
            <Modal.Footer>
              <Button variant="bordered" onPress={() => setIsDeleteOpen(false)} aria-label="Batal">Batal</Button>
              <Button variant="danger" onPress={handleDelete} isPending={actionLoading} aria-label="Hapus peminjaman">Hapus</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Card>
  );
};

export default RentHistoryPage;
