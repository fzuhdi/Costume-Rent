import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRentById, markReturned, deleteRent } from '../api/rentApi';
import { ArrowLeft, Edit, Trash2, CheckCircle, User, Calendar, FileText, Shield } from 'lucide-react';
import './RentDetailPage.css';

const RentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rent, setRent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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
    if (!window.confirm('Tandai kostum sudah dikembalikan?')) return;
    setProcessing(true);
    try {
      await markReturned(id);
      fetchRent();
    } catch (error) {
      alert('Gagal menandai pengembalian');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Hapus peminjaman ini?')) return;
    setProcessing(true);
    try {
      await deleteRent(id);
      navigate('/rents');
    } catch (error) {
      alert('Gagal menghapus peminjaman');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!rent) {
    return (
      <div className="empty-state">
        <h3>Peminjaman tidak ditemukan</h3>
        <Link to="/rents" className="btn btn-primary">
          Kembali ke Riwayat
        </Link>
      </div>
    );
  }

  return (
    <div className="rent-detail-page">
      <Link to="/rents" className="back-link">
        <ArrowLeft size={18} />
        Kembali ke Riwayat
      </Link>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Peminjaman #{rent.id}</h2>
                <span className={`badge badge-${rent.status} mt-2`}>
                  {rent.status === 'active' && 'Aktif'}
                  {rent.status === 'returned' && 'Dikembalikan'}
                  {rent.status === 'overdue' && 'Terlambat'}
                </span>
              </div>
              <div className="detail-actions">
                {rent.status !== 'returned' && (
                  <button
                    className="btn btn-success"
                    onClick={handleMarkReturned}
                    disabled={processing}
                  >
                    <CheckCircle size={16} />
                    Kembalikan
                  </button>
                )}
                <Link to={`/rents/${id}/edit`} className="btn btn-outline">
                  <Edit size={16} />
                  Edit
                </Link>
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={processing}
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            </div>

            <div className="rent-summary">
              <div className="summary-item">
                <div className="summary-icon">
                  <User size={20} />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Klien</span>
                  <span className="summary-value">{rent.client_name}</span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-icon">
                  <Calendar size={20} />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Tanggal Pinjam</span>
                  <span className="summary-value">{rent.rent_start} - {rent.rent_end}</span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-icon">
                  <Shield size={20} />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Jaminan</span>
                  <span className="summary-value">
                    {rent.guarantee_type} {rent.guarantee_number && `- ${rent.guarantee_number}`}
                  </span>
                </div>
              </div>

              {rent.notes && (
                <div className="summary-item">
                  <div className="summary-icon">
                    <FileText size={20} />
                  </div>
                  <div className="summary-content">
                    <span className="summary-label">Catatan</span>
                    <span className="summary-value">{rent.notes}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h3 className="card-title">Daftar Kostum</h3>
              <span className="item-count">{rent.items?.length || 0} item</span>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Gambar</th>
                  <th>Nama Kostum</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {rent.items?.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.cover_image ? (
                        <img src={item.cover_image} alt="" className="item-thumb" />
                      ) : (
                        <div className="no-thumb">-</div>
                      )}
                    </td>
                    <td>{item.costume_name}</td>
                    <td>{item.quantity} unit</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="card">
            <h3 className="sidebar-title">Informasi</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Dibuat</span>
                <span className="info-value">{rent.created_at}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Diperbarui</span>
                <span className="info-value">{rent.updated_at}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentDetailPage;