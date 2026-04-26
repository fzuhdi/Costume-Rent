import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRents, markReturned, deleteRent } from '../api/rentApi';
import { Plus, Search, CheckCircle } from 'lucide-react';
import './RentHistoryPage.css';

const RentHistoryPage = () => {
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

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

  const handleMarkReturned = async (id) => {
    if (!window.confirm('Tandai kostum sudah dikembalikan?')) return;
    try {
      await markReturned(id);
      fetchRents();
    } catch (error) {
      alert('Gagal menandai pengembalian');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus peminjaman ini?')) return;
    try {
      await deleteRent(id);
      fetchRents();
    } catch (error) {
      alert('Gagal menghapus peminjaman');
    }
  };

  return (
    <div className="rent-history-page">
      <div className="page-header">
        <h1 className="page-title">Riwayat Peminjaman</h1>
        <Link to="/rents/new" className="btn btn-primary">
          <Plus size={18} />
          Peminjaman Baru
        </Link>
      </div>

      <div className="filter-row">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Cari klien..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="form-select"
          name="status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="returned">Dikembalikan</option>
          <option value="overdue">Terlambat</option>
        </select>
      </div>

      <div className="results-info">
        Ditemukan {total} peminjaman
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : rents.length === 0 ? (
        <div className="empty-state">
          <h3>Tidak ada peminjaman</h3>
          <p>Belum ada data peminjaman</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Klien</th>
                <th>Kostum</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rents.map((rent) => (
                <tr key={rent.id}>
                  <td>#{rent.id}</td>
                  <td>{rent.client_name}</td>
                  <td>{rent.items?.length || 0} kostum</td>
                  <td>
                    {rent.rent_start} - {rent.rent_end}
                  </td>
                  <td>
                    <span className={`badge badge-${rent.status}`}>
                      {rent.status === 'active' && 'Aktif'}
                      {rent.status === 'returned' && 'Dikembalikan'}
                      {rent.status === 'overdue' && 'Terlambat'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/rents/${rent.id}`} className="btn btn-outline btn-sm">
                        Detail
                      </Link>
                      {rent.status !== 'returned' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleMarkReturned(rent.id)}
                        >
                          <CheckCircle size={14} />
                          Kembalikan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Previous
          </button>
          <span className="page-info">
            Halaman {page} dari {totalPages}
          </span>
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default RentHistoryPage;