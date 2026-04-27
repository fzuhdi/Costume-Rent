import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCostumeById, deleteCostume } from '../api/costumeApi';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button, Card, CardBody, Chip, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';

const conditionColors = {
  baik: 'success',
  sedang: 'warning',
  rusak: 'danger',
};

const CatalogueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [costume, setCostume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    fetchCostume();
  }, [id]);

  const fetchCostume = async () => {
    setLoading(true);
    try {
      const response = await getCostumeById(id);
      setCostume(response.data);
    } catch (error) {
      console.error('Failed to fetch costume:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCostume(id);
      setIsDeleteOpen(false);
      navigate('/catalogue');
    } catch (error) {
      console.error('Failed to delete costume:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner />
      </div>
    );
  }

  if (!costume) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Kostum tidak ditemukan</h3>
          <Button as={Link} to="/catalogue" color="primary">Kembali ke Katalog</Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/catalogue" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft size={18} />
        Kembali ke Katalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            {costume.images?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {costume.images.map((img) => (
                  <img key={img.id} src={img.path} alt={costume.name} className="w-full aspect-square object-cover rounded-lg" />
                ))}
              </div>
            ) : costume.cover_image ? (
              <img src={costume.cover_image} alt={costume.name} className="w-full rounded-lg" />
            ) : (
              <div className="aspect-square flex items-center justify-center bg-[var(--border)] rounded-lg text-[var(--muted)]">
                Tidak Ada Gambar
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{costume.name}</h2>
              <div className="flex gap-2">
                <Button as={Link} to={`/catalogue/${id}/edit`} variant="bordered" size="sm" startContent={<Edit size={16} />}>Edit</Button>
                <Button color="danger" size="sm" onPress={() => setIsDeleteOpen(true)} isLoading={deleting} startContent={<Trash2 size={16} />}>Hapus</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--muted)]">Wilayah</span>
                <p>{costume.region?.name || '-'}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Kategori</span>
                <p>{costume.category?.name || '-'}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Kondisi</span>
                <Chip size="sm" color={conditionColors[costume.condition] ?? 'default'}>{costume.condition}</Chip>
              </div>
              <div>
                <span className="text-[var(--muted)]">Stok</span>
                <p>{costume.quantity} unit</p>
              </div>
              {costume.acquired_at && (
                <div>
                  <span className="text-[var(--muted)]">Tanggal Perolehan</span>
                  <p>{costume.acquired_at}</p>
                </div>
              )}
            </div>

            {costume.description && (
              <div>
                <h3 className="text-sm font-medium mb-1">Deskripsi</h3>
                <p className="text-sm text-[var(--muted)]">{costume.description}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ModalContent>
          <ModalHeader>Konfirmasi</ModalHeader>
          <ModalBody>Apakah Anda yakin ingin menghapus kostum ini?</ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button color="danger" onPress={handleDelete} isLoading={deleting}>Hapus</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CatalogueDetailPage;