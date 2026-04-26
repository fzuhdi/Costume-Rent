import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClientById, updateClient } from '../api/clientApi';
import { ArrowLeft, Edit, Save, X, User, Phone, MapPin, ClipboardList, AlertTriangle } from 'lucide-react';
import './ClientDetailPage.css';

const ClientDetailPage = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const response = await getClientById(id);
      setClient(response.data);
    } catch (error) {
      console.error('Failed to fetch client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditData({
      name: client.name,
      phone: client.phone || '',
      address: client.address || '',
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleChange = (e) => {
    setEditData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateClient(id, editData);
      setEditing(false);
      fetchClient();
    } catch (error) {
      alert('Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="empty-state">
        <h3>Klien tidak ditemukan</h3>
        <Link to="/clients" className="btn btn-primary">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const activeRents = client.rent_orders?.filter((r) => r.status === 'active') || [];
  const overdueRents = client.rent_orders?.filter((r) => r.status === 'overdue') || [];
  const returnedRents = client.rent_orders?.filter((r) => r.status === 'returned') || [];

  return (
    <div className="client-detail-page">
      <Link to="/clients" className="back-link">
        <ArrowLeft size={18} />
        Kembali ke Daftar Klien
      </Link>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Informasi Klien</h2>
              {!editing && (
                <button className="btn btn-outline" onClick={handleEdit}>
                  <Edit size={16} />
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label className="form-label">Nama</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={editData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telepon</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-input"
                    value={editData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Alamat</label>
                  <textarea
                    name="address"
                    className="form-textarea"
                    value={editData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="edit-actions">
                  <button className="btn btn-outline" onClick={handleCancel}>
                    <X size={16} />
                    Batal
                  </button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    <Save size={16} />
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="client-info">
                <div className="info-item">
                  <User size={20} className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Nama</span>
                    <span className="info-value">{client.name}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Phone size={20} className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Telepon</span>
                    <span className="info-value">{client.phone || '-'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <MapPin size={20} className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Alamat</span>
                    <span className="info-value">{client.address || '-'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h3 className="card-title">Riwayat Peminjaman</h3>
            </div>

            {client.rent_orders?.length === 0 ? (
              <div className="empty-history">
                <ClipboardList size={48} />
                <p>Belum ada riwayat peminjaman</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {client.rent_orders?.map((rent) => (
                    <tr key={rent.id}>
                      <td>#{rent.id}</td>
                      <td>{rent.rent_start} - {rent.rent_end}</td>
                      <td>
                        <span className={`badge badge-${rent.status}`}>
                          {rent.status === 'active' && 'Aktif'}
                          {rent.status === 'returned' && 'Dikembalikan'}
                          {rent.status === 'overdue' && 'Terlambat'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/rents/${rent.id}`} className="btn btn-outline btn-sm">
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="card">
            <h3 className="sidebar-title">Statistik</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{client.rent_orders?.length || 0}</span>
                <span className="stat-label">Total Pinjaman</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{activeRents.length}</span>
                <span className="stat-label">Aktif</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{overdueRents.length}</span>
                <span className="stat-label">Terlambat</span>
              </div>
            </div>

            {overdueRents.length > 0 && (
              <div className="overdue-warning">
                <AlertTriangle size={18} />
                <span>{overdueRents.length} peminjaman terlambat</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPage;