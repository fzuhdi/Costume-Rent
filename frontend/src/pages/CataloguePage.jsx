import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCostumes, getRegions, getCategories } from '../api/costumeApi';
import { Plus, Search, Grid, List, Filter } from 'lucide-react';
import './CataloguePage.css';

const CataloguePage = () => {
  const [costumes, setCostumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchCostumes();
  }, [search, regionFilter, categoryFilter, page]);

  const fetchFilters = async () => {
    try {
      const [regionsRes, categoriesRes] = await Promise.all([
        getRegions(),
        getCategories(),
      ]);
      setRegions(regionsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  };

  const fetchCostumes = async () => {
    setLoading(true);
    try {
      const response = await getCostumes({
        search,
        region_id: regionFilter,
        category_id: categoryFilter,
        page,
        limit: 12,
      });
      setCostumes(response.data.data || []);
      setTotalPages(response.data.total_pages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch costumes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="catalogue-page">
      <div className="page-header">
        <h1 className="page-title">Katalog Kostum</h1>
        <Link to="/catalogue/new" className="btn btn-primary">
          <Plus size={18} />
          Tambah Kostum
        </Link>
      </div>

      <div className="filter-row">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Cari kostum..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="form-select"
          value={regionFilter}
          onChange={(e) => {
            setRegionFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Semua Wilayah</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="view-toggle">
          <button
            className={`view-btn ${view === 'table' ? 'active' : ''}`}
            onClick={() => setView('table')}
          >
            <List size={18} />
          </button>
          <button
            className={`view-btn ${view === 'grid' ? 'active' : ''}`}
            onClick={() => setView('grid')}
          >
            <Grid size={18} />
          </button>
        </div>
      </div>

      <div className="results-info">
        Ditemukan {total} kostum
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : costumes.length === 0 ? (
        <div className="empty-state">
          <Filter size={64} />
          <h3>Tidak ada kostum</h3>
          <p>Coba ubah filter atau tambahkan kostum baru</p>
        </div>
      ) : view === 'table' ? (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Wilayah</th>
                <th>Kategori</th>
                <th>Kondisi</th>
                <th>Stok</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {costumes.map((costume) => (
                <tr key={costume.id}>
                  <td>
                    <div className="costume-name-cell">
                      {costume.cover_image && (
                        <img src={costume.cover_image} alt="" className="costume-thumb" />
                      )}
                      <span>{costume.name}</span>
                    </div>
                  </td>
                  <td>{costume.region || '-'}</td>
                  <td>{costume.category || '-'}</td>
                  <td>
                    <span className={`badge badge-${costume.condition}`}>
                      {costume.condition}
                    </span>
                  </td>
                  <td>{costume.quantity}</td>
                  <td>
                    <Link to={`/catalogue/${costume.id}`} className="btn btn-outline btn-sm">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="costume-grid">
          {costumes.map((costume) => (
            <Link to={`/catalogue/${costume.id}`} key={costume.id} className="costume-card">
              <div className="costume-image">
                {costume.cover_image ? (
                  <img src={costume.cover_image} alt={costume.name} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                <span className={`costume-condition ${costume.condition}`}>
                  {costume.condition}
                </span>
              </div>
              <div className="costume-info">
                <h3>{costume.name}</h3>
                <p>{costume.region} {costume.category && `• ${costume.category}`}</p>
                <div className="costume-stock">Stok: {costume.quantity}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && <span>...</span>}
                <button
                  onClick={() => setPage(p)}
                  className={page === p ? 'active' : ''}
                >
                  {p}
                </button>
              </span>
            ))}
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CataloguePage;