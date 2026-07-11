import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRentById, markReturned, markRented, markBooked, cancelRent, deleteRent, uploadPaymentProof } from '../api/rentApi';
import { ArrowLeft, Edit, Trash2, CheckCircle, Package, XCircle, User, Calendar, FileText, Shield, Upload, FileImage } from 'lucide-react';
import { Button, Card, Chip, Spinner, Table, Modal } from '@heroui/react';

const statusColors = {
  draft: { variant: 'soft', color: 'warning' },
  booked: { variant: 'soft', color: 'primary' },
  rented: { variant: 'secondary' },
  returned: { variant: 'soft', color: 'success' },
  overdue: { variant: 'soft', color: 'danger' },
  cancelled: { variant: 'soft', color: 'default' },
};

const statusLabels = {
  draft: 'Draft',
  booked: 'Dipesan',
  rented: 'Disewa',
  returned: 'Dikembalikan',
  overdue: 'Terlambat',
  cancelled: 'Dibatalkan',
};

const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const formatDate = (isoString) => {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const RentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rent, setRent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Transition Modals
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isRentOpen, setIsRentOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  
  // Viewport
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  
  // Return States
  const [idReturned, setIdReturned] = useState(false);
  const [isGoodCondition, setIsGoodCondition] = useState(true);
  const [damageFee, setDamageFee] = useState('');

  // Upgrade Draft -> Booked States
  const [upgradeDp, setUpgradeDp] = useState('');
  const [upgradeFile, setUpgradeFile] = useState(null);
  const [upgradeProof, setUpgradeProof] = useState('');
  const [uploadingUpgradeProof, setUploadingUpgradeProof] = useState(false);

  // Pickup Booked -> Rented States
  const [confirmSecurityItem, setConfirmSecurityItem] = useState(true);
  const [rentFile, setRentFile] = useState(null);
  const [rentProof, setRentProof] = useState('');
  const [uploadingRentProof, setUploadingRentProof] = useState(false);
  const [transitionError, setTransitionError] = useState('');

  const fetchRent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRentById(id);
      setRent(response.data);
    } catch (error) {
      console.error('Failed to fetch rent:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRent();
  }, [fetchRent]);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const handleMarkReturned = async () => {
    setProcessing(true);
    try {
      const payload = {
        damage_fee: isGoodCondition ? 0 : (parseInt(damageFee) || 0)
      };
      await markReturned(id, payload);
      setIsReturnOpen(false);
      fetchRent();
    } catch (error) {
      console.error('Failed to mark returned:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkRented = async () => {
    setProcessing(true);
    setTransitionError('');
    try {
      const payload = {
        payment_proof: rentProof
      };
      await markRented(id, payload);
      setIsRentOpen(false);
      setRentFile(null);
      setRentProof('');
      fetchRent();
    } catch (error) {
      console.error('Failed to mark rented:', error);
      setTransitionError(error.response?.data?.error || error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkBooked = async () => {
    setProcessing(true);
    setTransitionError('');
    try {
      const payload = {
        downpayment: parseInt(upgradeDp) || 0,
        payment_proof: upgradeProof
      };
      await markBooked(id, payload);
      setIsUpgradeOpen(false);
      setUpgradeFile(null);
      setUpgradeProof('');
      fetchRent();
    } catch (error) {
      console.error('Failed to mark booked:', error);
      setTransitionError(error.response?.data?.error || error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleUploadUpgradeFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingUpgradeProof(true);
    setTransitionError('');
    try {
      const res = await uploadPaymentProof(file);
      setUpgradeProof(res.data.payment_proof);
      setUpgradeFile(file.name);
    } catch (err) {
      console.error('Upload failed:', err);
      setTransitionError('Gagal mengunggah file bukti pembayaran');
    } finally {
      setUploadingUpgradeProof(false);
    }
  };

  const handleUploadRentFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingRentProof(true);
    setTransitionError('');
    try {
      const res = await uploadPaymentProof(file);
      setRentProof(res.data.payment_proof);
      setRentFile(file.name);
    } catch (err) {
      console.error('Upload failed:', err);
      setTransitionError('Gagal mengunggah file bukti pembayaran');
    } finally {
      setUploadingRentProof(false);
    }
  };

  const openUpgradeModal = () => {
    setUpgradeDp(Math.ceil(totalFee / 2).toString());
    setUpgradeFile(null);
    setUpgradeProof('');
    setTransitionError('');
    setIsUpgradeOpen(true);
  };

  const openRentModal = () => {
    setConfirmSecurityItem(true);
    setRentFile(null);
    setRentProof('');
    setTransitionError('');
    setIsRentOpen(true);
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      await cancelRent(id);
      setIsCancelOpen(false);
      fetchRent();
    } catch (error) {
      console.error('Failed to cancel:', error);
    } finally {
      setProcessing(false);
    }
  };

  const openReturnModal = () => {
    setIdReturned(false);
    setIsGoodCondition(true);
    setDamageFee('');
    setIsReturnOpen(true);
  };

  const handleDelete = async () => {
    setProcessing(true);
    try {
      await deleteRent(id);
      setIsDeleteOpen(false);
      navigate('/rents');
    } catch (error) {
      console.error('Failed to delete rent:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner />
      </div>
    );
  }

  if (!rent) {
    return (
      <Card>
        <Card.Content className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Peminjaman tidak ditemukan</h3>
           <Button onPress={() => navigate('/rents')} variant="primary" aria-label="Kembali ke Riwayat">Kembali ke Riwayat</Button>
        </Card.Content>
      </Card>
    );
  }

  const notesTextMatchesLabelSelector = /catatan|notes/i.test(rent.notes || '');
  const notesLabel = !isMobile && notesTextMatchesLabelSelector ? 'Keterangan' : 'Catatan';

  const totalFee = rent.items?.reduce((sum, item) => sum + ((item.rental_fee || 0) * item.quantity), 0) || 0;
  const remainingBalance = Math.max(0, totalFee - (rent.downpayment || 0));

  const renderActionButtons = () => {
    const buttons = [];

    if (rent.status === 'draft') {
      buttons.push(
        <Button key="upgrade" color="warning" size="sm" className="font-semibold" onPress={openUpgradeModal} isPending={processing}>
          <Package size={16} aria-hidden="true" />Upgrade ke Dipesan
        </Button>,
        <Button key="cancel" variant="danger" size="sm" onPress={() => setIsCancelOpen(true)} isPending={processing}>
          <XCircle size={16} aria-hidden="true" />Batalkan
        </Button>
      );
    }

    if (rent.status === 'booked') {
      buttons.push(
        <Button key="rent" variant="primary" size="sm" onPress={openRentModal} isPending={processing}>
          <Package size={16} aria-hidden="true" />Disewakan
        </Button>,
        <Button key="cancel" variant="danger" size="sm" onPress={() => setIsCancelOpen(true)} isPending={processing}>
          <XCircle size={16} aria-hidden="true" />Batalkan
        </Button>
      );
    }

    if (rent.status === 'rented' || rent.status === 'overdue') {
      buttons.push(
        <Button key="return" variant="secondary" size="sm" onPress={openReturnModal} isPending={processing}>
          <CheckCircle size={16} aria-hidden="true" />Kembalikan
        </Button>
      );
    }

    buttons.push(
      <Button key="edit" onPress={() => navigate(`/rents/${id}/edit`)} variant="bordered" size="sm" aria-label="Edit peminjaman">
        <Edit size={16} aria-hidden="true" />Edit
      </Button>,
      <Button key="delete" variant="danger" size="sm" onPress={() => setIsDeleteOpen(true)} isPending={processing} aria-label="Hapus peminjaman">
        <Trash2 size={16} aria-hidden="true" />Hapus
      </Button>
    );

    return buttons;
  };

  return (
    <div className="flex flex-col gap-4">
      <Link to="/rents" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft size={18} aria-hidden="true" />
        Kembali ke Riwayat
      </Link>

      <Card>
        <Card.Content>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold">Peminjaman #{rent.id}</h2>
               <Chip className="mt-2" {...(statusColors[rent.status] ?? { variant: 'secondary' })}>
                {statusLabels[rent.status] || rent.status}
              </Chip>
              <span className="sr-only">status {rent.status}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {renderActionButtons()}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <User size={20} className="text-[var(--muted)]" aria-hidden="true" />
              <div>
                <span className="text-[var(--muted)]">Klien</span>
                <p className="font-medium">{rent.client_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-[var(--muted)]" aria-hidden="true" />
              <div>
                <span className="text-[var(--muted)]">Tanggal Pinjam</span>
                 <p className="font-medium">{formatDate(rent.pickup_date)} - {formatDate(rent.expected_return_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[var(--muted)]" aria-hidden="true" />
              <div>
                <span className="text-[var(--muted)]">Jaminan</span>
                <p className="font-medium">{rent.guarantee_type} {rent.guarantee_number && `- ${rent.guarantee_number}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-[var(--muted)]" aria-hidden="true" />
              <div>
                <span className="text-[var(--muted)]">{notesLabel}</span>
                <p className="font-medium">{rent.notes || '-'}</p>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Daftar Kostum</h2>
            <span className="text-sm text-[var(--muted)]">{rent.items?.length || 0} item</span>
          </div>
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Rent items">
                <Table.Header>
                  <Table.Column>Gambar</Table.Column>
                  <Table.Column>Nama Kostum</Table.Column>
                  <Table.Column>Jumlah</Table.Column>
                </Table.Header>
                <Table.Body>
                  {rent.items?.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell>
                        {item.costume?.cover_image ? (
                          <img src={item.costume.cover_image} alt="" className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <span className="text-[var(--muted)]">-</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>{item.costume?.name}</Table.Cell>
                      <Table.Cell>{item.quantity} unit</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <h2 className="text-xl font-semibold mb-4">Rincian Pembayaran</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Total Harga Sewa</span>
              <span className="font-medium">{formatCurrency(totalFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Uang Muka (DP)</span>
              <span className="font-medium">- {formatCurrency(rent.downpayment || 0)}</span>
            </div>
            {rent.damage_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--muted)] text-danger">Denda Kerusakan</span>
                <span className="font-medium text-danger">+ {formatCurrency(rent.damage_fee)}</span>
              </div>
            )}
            <hr className="my-2 border-default-200" />
            <div className="flex justify-between text-base font-semibold">
              <span>{rent.status === 'rented' || rent.status === 'returned' || rent.status === 'overdue' ? 'Total Dibayar' : 'Sisa Pembayaran'}</span>
              <span>
                {formatCurrency(
                  rent.status === 'returned'
                    ? totalFee + (rent.damage_fee || 0)
                    : Math.max(0, totalFee + (rent.damage_fee || 0) - (rent.downpayment || 0))
                )}
              </span>
            </div>
            {rent.status === 'booked' && (rent.downpayment || 0) > 0 && (
              <p className="text-xs text-[var(--muted)] mt-1">DP telah dibayar. Sisa pembayaran harus dilunasi saat pengambilan kostum.</p>
            )}
            {(rent.status === 'rented' || rent.status === 'overdue') && (
              <p className="text-xs text-success mt-1">✓ Pembayaran sewa telah lunas</p>
            )}

            {rent.payment_proof && (
              <div className="mt-4 border-t border-slate-200 pt-4 flex flex-col gap-2">
                <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Bukti Transaksi (Payment Receipt)</span>
                <div className="flex items-start gap-4">
                  <a
                    href={`${import.meta.env.VITE_API_URL}${rent.payment_proof}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 hover:opacity-85 transition duration-200"
                    title="Klik untuk membuka di tab baru"
                  >
                    <img
                      src={`${import.meta.env.VITE_API_URL}${rent.payment_proof}`}
                      alt="Bukti Transfer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="hidden w-full h-full flex-col items-center justify-center gap-1 text-[10px] text-slate-400 bg-slate-100">
                      <FileImage size={24} />
                      <span>Lihat File</span>
                    </div>
                  </a>
                  <div className="text-xs text-slate-500 flex flex-col gap-0.5 mt-1">
                    <span className="font-semibold text-slate-700">File Receipt</span>
                    <span className="truncate max-w-[180px] text-[11px]">{rent.payment_proof.split('/').pop()}</span>
                    <a
                      href={`${import.meta.env.VITE_API_URL}${rent.payment_proof}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-bold mt-1.5 inline-block text-[11px]"
                    >
                      Buka Gambar Baru ↗
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <h3 className="text-sm font-medium mb-2">Informasi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
             <div className="flex gap-1">
               <span className="text-[var(--muted)]">Dibuat:</span>
               <span>{formatDateTime(rent.created_at)}</span>
             </div>
             <div className="flex gap-1">
               <span className="text-[var(--muted)]">Diperbarui:</span>
               <span>{formatDateTime(rent.updated_at)}</span>
             </div>
          </div>
        </Card.Content>
      </Card>

      {/* Return Modal */}
      <Modal.Backdrop isOpen={isReturnOpen} onOpenChange={setIsReturnOpen}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Konfirmasi Pengembalian</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="flex flex-col gap-4">
                  <p>Tandai kostum sudah dikembalikan?</p>
                  <div className="flex flex-col gap-2 p-3 bg-default-50 rounded-lg border border-default-200">
                     <p className="text-sm font-semibold">Ceklist Pemeriksaan:</p>
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input type="checkbox" checked={idReturned} onChange={(e) => setIdReturned(e.target.checked)} aria-label="Kartu ID Dikembalikan ke Klien" /> 
                       <span className="text-sm">Kartu ID Dikembalikan ke Klien</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input type="checkbox" checked={isGoodCondition} onChange={(e) => setIsGoodCondition(e.target.checked)} aria-label="Kostum Dalam Kondisi Baik (Tidak Ada Denda)" /> 
                       <span className="text-sm">Kostum Dalam Kondisi Baik (Tidak Ada Denda)</span>
                     </label>
                  </div>

                  {!isGoodCondition && (
                    <div>
                      <label htmlFor="damageFeeInput" className="block text-sm font-medium mb-1">Denda Kerusakan (Rp)</label>
                      <input 
                        id="damageFeeInput"
                        type="number"
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Masukkan nominal denda"
                        value={damageFee}
                        onChange={(e) => setDamageFee(e.target.value)}
                        min="0"
                      />
                    </div>
                  )}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="bordered" onPress={() => setIsReturnOpen(false)}>Batal</Button>
                <Button variant="secondary" onPress={handleMarkReturned} isDisabled={!idReturned} isPending={processing} aria-label="Kembalikan peminjaman">Kembalikan</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>

      {/* Upgrade Draft to Booked Modal */}
      <Modal.Backdrop isOpen={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Upgrade ke Dipesan (Booked)</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <p className="text-sm text-slate-600">
                Silakan konfirmasi pembayaran downpayment untuk mengunci stok kostum.
              </p>
              <div>
                <label htmlFor="upgradeDpInput" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Uang Muka (DP) *</label>
                <input
                  id="upgradeDpInput"
                  type="number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Masukkan nominal DP"
                  value={upgradeDp}
                  onChange={(e) => setUpgradeDp(e.target.value)}
                  min="0"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Minimal DP 50%: {formatCurrency(Math.ceil(totalFee / 2))}</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Bukti Pembayaran DP *</label>
                <div className="relative border border-dashed border-slate-300 rounded-lg p-3 bg-white text-center hover:bg-slate-50 transition duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[80px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadUpgradeFile}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Upload Bukti Pembayaran DP"
                  />
                  {uploadingUpgradeProof ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <Spinner size="xs" /> Mengunggah...
                    </div>
                  ) : upgradeFile ? (
                    <div className="flex items-center justify-between w-full text-xs text-success font-semibold px-2">
                      <span className="truncate max-w-[200px]">✓ {upgradeFile}</span>
                      <Button
                        size="xs"
                        variant="light"
                        isIconOnly
                        className="h-5 w-5 min-w-5 p-0 text-slate-400 hover:text-red-500"
                        onPress={(e) => {
                          e.stopPropagation();
                          setUpgradeProof('');
                          setUpgradeFile(null);
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Klik atau seret gambar ke sini</span>
                  )}
                </div>
              </div>

              {transitionError && (
                <div className="text-danger text-xs bg-danger-50 p-2.5 rounded border border-danger-200 font-semibold">
                  {transitionError}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="bordered" onPress={() => setIsUpgradeOpen(false)}>Batal</Button>
              <Button color="primary" className="text-white font-bold" onPress={handleMarkBooked} isDisabled={!upgradeProof} isPending={processing}>Konfirmasi Booked</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Mark Rented Modal */}
      <Modal.Backdrop isOpen={isRentOpen} onOpenChange={setIsRentOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Konfirmasi Penyewaan</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <p className="text-sm text-slate-600">
                Konfirmasi pembayaran pelunasan dan penahanan jaminan identitas klien.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-0.5">Sisa Pembayaran:</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(remainingBalance)}</p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Pastikan sisa pembayaran telah diterima sebelum menyerahkan kostum.</p>
              </div>

              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Ceklist Pengambilan *</p>
                <label className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={confirmSecurityItem}
                    onChange={(e) => setConfirmSecurityItem(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    aria-label="Kartu Jaminan Identitas Telah Ditahan"
                  />
                  <span className="text-xs font-semibold text-slate-700">Kartu Jaminan Identitas ({rent.guarantee_type}) Telah Ditahan (Wajib)</span>
                </label>
              </div>

              {remainingBalance > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Bukti Pelunasan Pembayaran *</label>
                  <div className="relative border border-dashed border-slate-300 rounded-lg p-3 bg-white text-center hover:bg-slate-50 transition duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[80px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadRentFile}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label="Upload Bukti Pelunasan Pembayaran"
                    />
                    {uploadingRentProof ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <Spinner size="xs" /> Mengunggah...
                      </div>
                    ) : rentFile ? (
                      <div className="flex items-center justify-between w-full text-xs text-success font-semibold px-2">
                        <span className="truncate max-w-[200px]">✓ {rentFile}</span>
                        <Button
                          size="xs"
                          variant="light"
                          isIconOnly
                          className="h-5 w-5 min-w-5 p-0 text-slate-400 hover:text-red-500"
                          onPress={(e) => {
                            e.stopPropagation();
                            setRentProof('');
                            setRentFile(null);
                          }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Klik atau seret gambar ke sini</span>
                    )}
                  </div>
                </div>
              )}

              {transitionError && (
                <div className="text-danger text-xs bg-danger-50 p-2.5 rounded border border-danger-200 font-semibold">
                  {transitionError}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="bordered" onPress={() => setIsRentOpen(false)}>Batal</Button>
              <Button
                color="primary"
                className="text-white font-bold"
                onPress={handleMarkRented}
                isDisabled={!confirmSecurityItem || (remainingBalance > 0 && !rentProof)}
                isPending={processing}
                aria-label="Konfirmasi penyewaan"
              >
                Disewakan
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Cancel Modal */}
      <Modal.Backdrop isOpen={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Batalkan Pesanan</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-3">
                <p>Yakin ingin membatalkan pesanan ini?</p>
                <div className="p-3 bg-danger-50 rounded-lg border border-danger-200">
                  <p className="text-sm font-semibold text-danger mb-1">⚠️ Uang muka tidak akan dikembalikan</p>
                  <p className="text-sm">DP yang telah dibayar sebesar <strong>{formatCurrency(rent.downpayment || 0)}</strong> tidak dapat dikembalikan.</p>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="bordered" onPress={() => setIsCancelOpen(false)}>Kembali</Button>
              <Button variant="danger" onPress={handleCancel} isPending={processing} aria-label="Batalkan pesanan">Batalkan Pesanan</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Delete Modal */}
      <Modal.Backdrop isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Konfirmasi</Modal.Heading>
              </Modal.Header>
              <Modal.Body>Hapus peminjaman ini?</Modal.Body>
              <Modal.Footer>
                <Button variant="bordered" onPress={() => setIsDeleteOpen(false)}>Batal</Button>
                <Button variant="danger" onPress={handleDelete} isPending={processing}>Hapus</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
};

export default RentDetailPage;
