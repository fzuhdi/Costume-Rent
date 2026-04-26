import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Halaman Tidak Ditemukan</h2>
        <p>Halaman yang Anda cari tidak tersedia atau telah dipindahkan.</p>
        <Link to="/catalogue" className="btn btn-primary">
          <Home size={18} />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;