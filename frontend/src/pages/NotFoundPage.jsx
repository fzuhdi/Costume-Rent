import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button, Card } from '@heroui/react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <Card>
        <Card.Content className="text-center gap-4 py-12">
          <h1 className="text-6xl font-bold text-[var(--primary)]">404</h1>
          <h2 className="text-xl font-semibold">Halaman Tidak Ditemukan</h2>
          <p className="text-[var(--muted)]">Halaman yang Anda cari tidak tersedia atau telah dipindahkan.</p>
           <Link to="/catalogue" aria-label="Kembali ke Beranda">
             <Button variant="primary" className="mx-auto">
               Kembali ke Beranda
             </Button>
           </Link>
        </Card.Content>
      </Card>
    </div>
  );
};

export default NotFoundPage;