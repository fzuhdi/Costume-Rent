import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCostumeById, deleteCostume } from '../api/costumeApi';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button, Card, Chip, Spinner, Modal, ModalDialog, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';

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
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Kostum tidak ditemukan</h3>
          <Button as={Link} to="/catalogue" variant="primary">Kembali ke Katalog</Button>
        </CardContent>
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
          <Card.Content className="p-0">
            {costume.images?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 p-2">
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
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{costume.name}</h2>
              <div className="flex gap-2">
                <Button variant="bordered" size="sm" onPress={() => window.location.href = `/catalogue/${id}/edit`} startContent={<Edit size={16} />}>Edit</Button>
                 <Button variant="danger" size="sm" onPress={() => setIsDeleteOpen(true)} isPending={deleting} startContent={<Trash2 size={16} />}>Hapus</Button>
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
                <Chip size="sm" variant={conditionColors[costume.condition] === 'success' ? 'secondary' : conditionColors[costume.condition] === 'warning' ? 'secondary' : 'danger-soft'}>
                  {costume.condition}
                </Chip>
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
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-1">Deskripsi</h3>
                <p className="text-sm text-[var(--muted)]">{costume.description}</p>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
{/* 
      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ModalDialog>
          <ModalHeader>
            Konfirmasi
          </ModalHeader>
          <ModalBody>
            Apakah Anda yakin ingin menghapus kostum ini?
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button variant="danger" onPress={handleDelete} isPending={deleting}>Hapus</Button>
          </ModalFooter>
        </ModalDialog>
      </Modal> */}
      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger /> {/* Optional: Close button */}
              <Modal.Header>
                <Modal.Icon /> {/* Optional: Icon */}
                <Modal.Heading />
              </Modal.Header>
              <Modal.Body>
                Apakah Anda yakin ingin menghapus kostum ini?
              </Modal.Body>
              <Modal.Footer>
                <Button variant="bordered" onPress={() => setIsDeleteOpen(false)} slot="close">Batal</Button>
                <Button variant="danger" onPress={handleDelete} isPending={deleting} slot="close">Hapus</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
};

export default CatalogueDetailPage;