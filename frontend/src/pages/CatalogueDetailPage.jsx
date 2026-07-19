import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCostumeById, deleteCostume } from '../api/costumeApi';
import { getRents } from '../api/rentApi';
import { ArrowLeft, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Card, Spinner, Modal } from '@heroui/react';

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const dayNamesShort = ["Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"];

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateStr = (y, m, d) => {
  const mm = String(m + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
};

const CatalogueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [costume, setCostume] = useState(null);
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [costumeRes, rentsRes] = await Promise.all([
          getCostumeById(id),
          getRents({ limit: 1000 })
        ]);
        setCostume(costumeRes.data);
        // Filter rents that contain this costume
        const relevantRents = (rentsRes.data?.data || []).filter(r => 
          ['pending', 'booked', 'rented', 'overdue'].includes(r.status?.toLowerCase()) &&
          r.items.some(item => String(item.costume_id) === String(id))
        );
        setRents(relevantRents);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  // Calendar Logic
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = new Date(year, month, 1).getDay();

  // Create grid cells
  const grid = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOffset + 1;
    if (day > 0 && day <= daysInMonth) {
      const dateStr = formatDateStr(year, month, day);
      return { day, dateStr, isCurrentMonth: true };
    }
    return { day: null, dateStr: null, isCurrentMonth: false };
  });

  // Calculate booked days map: { "YYYY-MM-DD": bookedQuantity }
  const bookedDates = useMemo(() => {
    const map = new Map();
    rents.forEach(rent => {
      const item = rent.items.find(i => String(i.costume_id) === String(id));
      if (!item) return;
      const qty = item.quantity;
      const start = parseLocalDate(rent.pickup_date);
      const end = parseLocalDate(rent.expected_return_date);
      if (start && end) {
        let current = new Date(start);
        while (current <= end) {
          const dStr = formatDateStr(current.getFullYear(), current.getMonth(), current.getDate());
          map.set(dStr, (map.get(dStr) || 0) + qty);
          current.setDate(current.getDate() + 1);
        }
      }
    });
    return map;
  }, [rents, id]);

  if (loading) return <div className="flex justify-center items-center h-48"><Spinner /></div>;

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
    <Card className="max-w-6xl mx-auto">
      <Card.Header className="flex flex-col gap-4 px-6 pt-6 pb-4 border-b border-[var(--border)]">
        <Link to="/catalogue" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] w-fit" aria-label="Kembali ke Katalog">
          <ArrowLeft size={18} />
          Kembali ke Katalog
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{costume.name}</h2>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="bordered" size="sm" onPress={() => navigate(`/catalogue/${id}/edit`)} aria-label="Edit kostum"><Edit size={16} />Edit</Button>
            <Button variant="flat" color="danger" size="sm" onPress={handleDeleteRequest} isPending={deleting} aria-label="Hapus kostum"><Trash2 size={16} />Hapus</Button>
          </div>
        </div>
      </Card.Header>

      <Card.Content className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Image */}
          <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-default-50/30">
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
              <div className="aspect-square flex items-center justify-center bg-default-100 rounded-lg text-default-400">
                Tidak Ada Gambar
              </div>
            )}
          </div>

          {/* Right Column: Details & Schedule */}
          <div className="flex flex-col gap-8 w-full">
            {/* Details Section */}
            <div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="info-label block mb-1">Wilayah</span>
                  <p className="font-medium">{costume.region?.name || '-'}</p>
                </div>
                <div>
                  <span className="info-label block mb-1">Kategori</span>
                  <p className="font-medium">{costume.category?.name || '-'}</p>
                </div>
                <div>
                  <span className="info-label block mb-1">Ukuran</span>
                  <p className="font-medium">{costume.size || '-'}</p>
                </div>
                <div>
                  <span className="info-label block mb-1">Harga Sewa/Set</span>
                  <p className="font-medium text-success">{idrFormatter.format(costume.rental_fee)}</p>
                </div>
                <div>
                   <span className="info-label block mb-1">Total Stok</span>
                   <p className="font-medium">{costume.total_quantity} unit</p>
                 </div>
                 <div>
                   <span className="info-label block mb-1">Stok Tersedia</span>
                   <p className="font-medium">{costume.available_quantity ?? costume.total_quantity} unit</p>
                 </div>
              </div>

              {costume.description && (
                <div className="mt-6 pt-6 border-t border-default-100">
                  <h3 className="text-sm font-semibold mb-2">Deskripsi</h3>
                  <p className="text-sm text-default-600 leading-relaxed">{costume.description}</p>
                </div>
              )}
            </div>

            {/* Availability Schedule Section */}
            <div className="pt-6 border-t border-[var(--border)] w-full">
              <h3 className="font-bold text-sm mb-4">📅 Jadwal Ketersediaan</h3>
              <div>
                <div className="flex items-center justify-between mb-4">
                <Button isIconOnly variant="light" size="sm" onPress={prevMonth}><ChevronLeft size={18} /></Button>
                <span className="font-semibold text-sm">{monthNames.at(month)} {year}</span>
                <Button isIconOnly variant="light" size="sm" onPress={nextMonth}><ChevronRight size={18} /></Button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                {dayNamesShort.map(d => (
                  <div key={d} className="text-xs font-semibold text-default-400 py-1">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {grid.map((cell, idx) => {
                  if (!cell.isCurrentMonth) {
                    return <div key={idx} className="aspect-square"></div>;
                  }
                  const bookedQty = bookedDates.get(cell.dateStr) || 0;
                  const isFullyBooked = bookedQty >= costume.total_quantity;
                  const isPartiallyBooked = bookedQty > 0 && bookedQty < costume.total_quantity;

                  let bgClass = "bg-default-50 hover:bg-default-100";
                  let textClass = "text-default-700";
                  
                  if (isFullyBooked) {
                    bgClass = "bg-red-100";
                    textClass = "text-red-700 font-bold line-through";
                  } else if (isPartiallyBooked) {
                    bgClass = "bg-yellow-100";
                    textClass = "text-yellow-800 font-semibold";
                  }

                  return (
                    <div key={idx} className={`aspect-square flex items-center justify-center rounded text-sm transition-colors cursor-default ${bgClass} ${textClass}`} title={bookedQty > 0 ? `${bookedQty} unit disewa` : 'Tersedia'}>
                      {cell.day}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex flex-wrap gap-4 mt-5 text-xs text-default-500">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-default-50 border border-default-200"></div> Tersedia</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-yellow-100"></div> Sebagian Disewa</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-100"></div> Habis (Fully Booked)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card.Content>

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
                <Button color="danger" onPress={handleDelete} isPending={deleting}>Hapus</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
      </Modal.Backdrop>
    </Card>
  );
};

export default CatalogueDetailPage;
