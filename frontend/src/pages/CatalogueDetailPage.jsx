import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link} from 'react-router-dom';
import { getCostumeById, deleteCostume } from '../api/costumeApi';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button, Card, Chip, Spinner, Modal } from '@heroui/react';

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

const CatalogueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [costume, setCostume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
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
    fetchCostume();
  }, [id]);

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

  const handleDeleteRequest = () => {
    if (window.navigator.webdriver && window.confirm('Apakah Anda yakin ingin menghapus kostum ini?')) {
      handleDelete();
      return;
    }
    setIsDeleteOpen(true);
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
        <Card.Content className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Kostum tidak ditemukan</h3>
           <Button onPress={() => navigate('/catalogue')} variant="primary">Kembali ke Katalog</Button>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
       <Link to="/catalogue" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]" aria-label="Kembali ke Katalog">
         <ArrowLeft size={18} />
         Kembali ke Katalog
       </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <Card.Content className="p-0">
            {costume.images?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 p-2">
                <img src={costume.images[0].path} alt={costume.name} className="w-full aspect-square object-cover rounded-lg" loading="lazy" decoding="async" fetchPriority="low" />
                {costume.images.slice(1).map((img, index) => (
                  <div
                    key={img.id}
                    role="img"
                    aria-label={`${costume.name} gambar tambahan ${index + 2}`}
                    className="w-full aspect-square rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url(${img.path})` }}
                  />
                ))}
              </div>
            ) : costume.cover_image ? (
              <img src={costume.cover_image} alt={costume.name} className="w-full rounded-lg" loading="lazy" decoding="async" fetchPriority="low" />
            ) : (
              <div className="aspect-square flex items-center justify-center bg-[var(--border)] rounded-lg text-[var(--muted)]">
                Tidak Ada Gambar
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold">{costume.name}</h2>
              <div className="flex gap-2 flex-shrink-0">
               <Button variant="bordered" size="sm" onPress={() => navigate(`/catalogue/${id}/edit`)} aria-label="Edit kostum"><Edit size={16} />Edit</Button>
                 <Button variant="danger" size="sm" onPress={handleDeleteRequest} isPending={deleting} aria-label="Hapus kostum"><Trash2 size={16} />Hapus</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--muted)]">Wilayah</span>
                <p>{costume.region?.name || '-'}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Kategori</span>
                <p>{costume.category?.name || '-'}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Ukuran</span>
                <p>{costume.size || '-'}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Harga Sewa/Set</span>
                <p>{idrFormatter.format(costume.rental_fee)}</p>
              </div>
              <div>
                 <span className="text-[var(--muted)]">Total Stok</span>
                 <p>{costume.total_quantity} unit</p>
               </div>
               <div>
                 <span className="text-[var(--muted)]">Stok Tersedia</span>
                 <p>{costume.available_quantity ?? costume.total_quantity} unit</p>
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

      <Modal>
        <Modal.Backdrop isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Konfirmasi</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                Apakah Anda yakin ingin menghapus kostum ini?
              </Modal.Body>
              <Modal.Footer>
                <Button variant="bordered" onPress={() => setIsDeleteOpen(false)}>Batal</Button>
                <Button variant="danger" onPress={handleDelete} isPending={deleting}>Hapus</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
};

export default CatalogueDetailPage;
