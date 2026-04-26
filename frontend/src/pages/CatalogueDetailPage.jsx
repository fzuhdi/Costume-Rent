import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCostumeById, deleteCostume } from '../api/costumeApi';
import { ArrowLeft, Edit, Trash2, MapPin, Tag, Calendar } from 'lucide-react';
import './CatalogueDetailPage.css';

const CatalogueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [costume, setCostume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
    if (!window.confirm('Apakah Anda yakin ingin menghapus kostum ini?')) return;
    setDeleting(true);
    try {
      await deleteCostume(id);
      navigate('/catalogue');
    } catch (error) {
      alert('Gagal menghapus kostum');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!costume) {
    return (
      <div className="empty-state">
        <h3>Kostum tidak ditemukan</h3>
        <Link to="/catalogue" className="btn btn-primary">
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="catalogue-detail-page">
      <Link to="/catalogue" className="back-link">
        <ArrowLeft size={18} />
        Kembali ke Katalog
      </Link>

      <div className="detail-layout">
        <div className="detail-images">
          {costume.images?.length > 0 ? (
            <div className="image-gallery">
              {costume.images.map((img) => (
                <img key={img.id} src={img.path} alt={costume.name} />
              ))}
            </div>
          ) : costume.cover_image ? (
            <img src={costume.cover_image} alt={costume.name} className="main-image" />
          ) : (
            <div className="no-image-large">Tidak Ada Gambar</div>
          )}
        </div>

        <div className="detail-info">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{costume.name}</h2>
              <div className="detail-actions">
                <Link to={`/catalogue/${id}/edit`} className="btn btn-outline">
                  <Edit size={16} />
                  Edit
                </Link>
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Wilayah</span>
                <span className="detail-value">
                  {costume.region?.name || '-'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Kategori</span>
                <span className="detail-value">
                  {costume.category?.name || '-'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Kondisi</span>
                <span className={`badge badge-${costume.condition}`}>
                  {costume.condition}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Stok</span>
                <span className="detail-value">{costume.quantity} unit</span>
              </div>
              {costume.acquired_at && (
                <div className="detail-item">
                  <span className="detail-label">Tanggal Perolehan</span>
                  <span className="detail-value">{costume.acquired_at}</span>
                </div>
              )}
            </div>

            {costume.description && (
              <div className="detail-description">
                <h3>Deskripsi</h3>
                <p>{costume.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogueDetailPage;