import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClients, deleteClient } from '../api/clientApi';
import { Plus, Search, Trash2, AlertCircle } from 'lucide-react';
import './ClientListPage.css';

const ClientListPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

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

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Hapus klien ini?')) return;
    try {
      await deleteClient(id);
      fetchClients();
    } catch (error) {
      alert('Gagal menghapus klien');
    }
  };

  return (
    <div className="client-list-page">
      <div className="page-header">
        <h1 className="page-title">Daftar Klien</h1>
      </div>

      <div className="filter-row">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Cari nama klien..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="results-info">
        Ditemukan {total} klien
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <h3>Tidak ada klien</h3>
          <p>Klien akan muncul setelah membuat peminjaman</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Telepon</th>
                <th>Alamat</th>
                <th>Total Pinjaman</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <Link to={`/clients/${client.id}`} className="client-link">
                      {client.name}
                    </Link>
                  </td>
                  <td>{client.phone || '-'}</td>
                  <td>{client.address || '-'}</td>
                  <td>{client.total_rents}</td>
                  <td>
                    {client.has_overdue && (
                      <span className="badge badge-danger">
                        <AlertCircle size={12} />
                        Ada Terlambat
                      </span>
                    )}
                    {client.active_rents > 0 && !client.has_overdue && (
                      <span className="badge badge-active">
                        {client.active_rents} Aktif
                      </span>
                    )}
                    {client.active_rents === 0 && (
                      <span className="badge badge-success">
                        Tidak Ada Aktif
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/clients/${client.id}`} className="btn btn-outline btn-sm">
                        Detail
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => handleDelete(client.id, e)}
                      >
                        <Trash2 size={14} />
                      </button>
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

export default ClientListPage;