import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClients, deleteClient } from '../api/clientApi';
import { Search, Trash2 } from 'lucide-react';
import {
  Input, Button, Chip,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Spinner, Pagination, Card, CardBody,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
} from '@heroui/react';

const ClientListPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [search, page]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await getClients({ search, page, limit: 10 });
      setClients(response.data.data || []);
      setTotalPages(response.data.total_pages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteClient(selectedClientId);
      setIsDeleteOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Daftar Klien</h1>

      <Input
        placeholder="Cari nama klien..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        startContent={<Search size={18} />}
        className="w-64"
      />

      <p className="text-sm text-[var(--muted)]">Ditemukan {total} klien</p>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Spinner />
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <h3 className="text-lg font-semibold">Tidak ada klien</h3>
            <p className="text-sm text-[var(--muted)]">Klien akan muncul setelah membuat peminjaman</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <Table>
              <TableHeader>
                <TableColumn>Nama</TableColumn>
                <TableColumn>Telepon</TableColumn>
                <TableColumn>Alamat</TableColumn>
                <TableColumn>Total Pinjaman</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Aksi</TableColumn>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link to={`/clients/${client.id}`} className="text-[var(--primary)] hover:underline">
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>{client.address || '-'}</TableCell>
                    <TableCell>{client.total_rents}</TableCell>
                    <TableCell>
                      {client.has_overdue && (
                        <Chip size="sm" color="danger">Ada Terlambat</Chip>
                      )}
                      {client.active_rents > 0 && !client.has_overdue && (
                        <Chip size="sm" color="primary">{client.active_rents} Aktif</Chip>
                      )}
                      {client.active_rents === 0 && (
                        <Chip size="sm" color="success">Tidak Ada Aktif</Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button as={Link} to={`/clients/${client.id}`} variant="bordered" size="sm">Detail</Button>
                        <Button color="danger" size="sm" isIconOnly onPress={() => { setSelectedClientId(client.id); setIsDeleteOpen(true); }}>
                          <Trash2 size={14} />
                        </Button>
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

      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ModalContent>
          <ModalHeader>Konfirmasi</ModalHeader>
          <ModalBody>Hapus klien ini?</ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button color="danger" onPress={handleDelete} isLoading={actionLoading}>Hapus</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ClientListPage;