import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRentById, markReturned, markRented, markBooked, cancelRent, deleteRent, uploadPaymentProof } from '../api/rentApi';
import { ArrowLeft, Edit, Trash2, CheckCircle, Package, XCircle, User, Calendar, FileText, Shield, Upload, FileImage, ImageOff } from 'lucide-react';
import { Button, Card, Chip, Spinner, Table, Modal, Checkbox } from '@heroui/react';
import ImagePreviewModal from '../components/ImagePreviewModal';

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

  // Image Preview States
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const openPreview = (images, index) => {
    setPreviewImages(images);
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

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

  const calculatedDamageFee = rent.damage_fee || 0;
  const totalTagihan = totalFee + calculatedDamageFee;
  const dp = rent.downpayment || 0;
  const sisaTagihan = Math.max(0, totalTagihan - dp);
  const isFullyPaid = ['rented', 'returned', 'overdue'].includes(rent.status);

  const renderActionButtons = () => {
    const primary = [];
    const secondary = [];

    if (rent.status === 'draft') {
      primary.push(
        <Button key="upgrade" color="primary" size="md" className="font-bold text-white shadow-sm" onPress={openUpgradeModal} isPending={processing}>
          <Package size={18} aria-hidden="true" />Upgrade ke Dipesan
        </Button>
      );
      secondary.push(
        <Button key="cancel" variant="light" color="danger" size="sm" onPress={() => setIsCancelOpen(true)} isPending={processing}>
          <XCircle size={16} className="sm:mr-1" aria-hidden="true" /><span className="hidden sm:inline">Batalkan</span>
        </Button>
      );
    }

    if (rent.status === 'booked') {
      primary.push(
        <Button key="rent" color="success" size="md" className="font-bold text-white shadow-sm" onPress={openRentModal} isPending={processing}>
          <Package size={18} aria-hidden="true" />Disewakan
        </Button>
      );
      secondary.push(
        <Button key="cancel" variant="light" color="danger" size="sm" onPress={() => setIsCancelOpen(true)} isPending={processing}>
          <XCircle size={16} className="sm:mr-1" aria-hidden="true" /><span className="hidden sm:inline">Batalkan</span>
        </Button>
      );
    }

    if (rent.status === 'rented' || rent.status === 'overdue') {
      primary.push(
        <Button key="return" color="secondary" size="md" className="font-bold text-white shadow-sm" onPress={openReturnModal} isPending={processing}>
          <CheckCircle size={18} aria-hidden="true" />Kembalikan
        </Button>
      );
    }

    secondary.push(
      <Button key="edit" onPress={() => navigate(`/rents/${id}/edit`)} variant="light" size="sm" aria-label="Edit peminjaman">
        <Edit size={16} className="sm:mr-1" aria-hidden="true" /><span className="hidden sm:inline">Edit</span>
      </Button>,
      <Button key="delete" variant="light" color="danger" size="sm" onPress={() => setIsDeleteOpen(true)} isPending={processing} aria-label="Hapus peminjaman">
        <Trash2 size={16} className="sm:mr-1" aria-hidden="true" /><span className="hidden sm:inline">Hapus</span>
      </Button>
    );

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border-r border-default-200 pr-3 mr-1">
          {secondary}
        </div>
        {primary}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
      <Link to="/rents" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft size={18} aria-hidden="true" />
        Kembali ke Riwayat
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left Column (Main Info & Items) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
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
                <p className="font-medium">{rent.client_name || rent.client?.name || <span className="italic font-normal text-default-400">Walk-in Customer</span>}</p>
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
                  <Table.Column className="w-16">Gambar</Table.Column>
                  <Table.Column isRowHeader>Nama Kostum</Table.Column>
                  <Table.Column className="w-32">Harga Sewa</Table.Column>
                  <Table.Column className="w-24">Jumlah</Table.Column>
                  <Table.Column align="end" className="w-32">Subtotal</Table.Column>
                </Table.Header>
                <Table.Body>
                  {rent.items?.length > 0 ? rent.items.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell>
                        {item.costume?.cover_image ? (
                          <img src={item.costume.cover_image} alt="" className="w-12 h-12 object-cover rounded shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 flex flex-col items-center justify-center text-default-400 bg-default-50 border border-default-200 rounded">
                            <ImageOff size={16} className="opacity-40" />
                          </div>
                        )}
                      </Table.Cell>
                      <Table.Cell className="font-medium">{item.costume?.name}</Table.Cell>
                      <Table.Cell>{formatCurrency(item.rental_fee || 0)}</Table.Cell>
                      <Table.Cell>{item.quantity} unit</Table.Cell>
                      <Table.Cell className="font-semibold text-right">{formatCurrency((item.rental_fee || 0) * item.quantity)}</Table.Cell>
                    </Table.Row>
                  )) : (
                    <Table.Row>
                      <Table.Cell colSpan={5} className="text-center text-[var(--muted)] py-4">Belum ada kostum dipilih</Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>
    </div>

    {/* Right Column (Payment) */}
    <div className="flex flex-col gap-4">
      <Card>
        <Card.Content>
          <h2 className="text-xl font-semibold mb-4">Rincian Pembayaran</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-default-500">Total Harga Sewa</span>
              <span className="font-medium">{formatCurrency(totalFee)}</span>
            </div>
            
            {calculatedDamageFee > 0 && (
              <div className="flex justify-between">
                <span className="text-danger">Denda Kerusakan</span>
                <span className="font-medium text-danger">+ {formatCurrency(calculatedDamageFee)}</span>
              </div>
            )}
            
            {(calculatedDamageFee > 0 || dp > 0) && (
              <hr className="my-1 border-default-200" />
            )}

            {(calculatedDamageFee > 0 || dp > 0) && (
              <div className="flex justify-between font-semibold">
                <span>Total Tagihan</span>
                <span>{formatCurrency(totalTagihan)}</span>
              </div>
            )}

            {dp > 0 && (
              <div className="flex justify-between text-default-600">
                <span>Telah Dibayar (DP)</span>
                <span>{formatCurrency(dp)}</span>
              </div>
            )}

            {isFullyPaid && sisaTagihan > 0 && (
              <div className="flex justify-between text-default-600">
                <span>Pelunasan</span>
                <span>{formatCurrency(sisaTagihan)}</span>
              </div>
            )}

            <hr className="my-1 border-default-200" />

            {isFullyPaid ? (
              <div className="flex justify-between text-base font-bold text-success">
                <span>Total Lunas Dibayar</span>
                <span>{formatCurrency(totalTagihan)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-base font-bold text-primary">
                <span>Sisa Pembayaran</span>
                <span>{formatCurrency(sisaTagihan)}</span>
              </div>
            )}

            {rent.status === 'booked' && dp > 0 && (
              <p className="text-xs text-default-500 mt-1">Sisa pembayaran wajib dilunasi saat pengambilan kostum.</p>
            )}
            {isFullyPaid && (
              <p className="text-xs text-success mt-1">✓ Pembayaran sewa telah lunas</p>
            )}

            {rent.payment_proof && (
              <div className="mt-4 border-t border-default-200 pt-4 flex flex-col gap-2">
                <span className="font-semibold text-xs text-default-500 uppercase tracking-wider">Bukti Transaksi (Payment Receipt)</span>
                <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                  {rent.payment_proof.split(',').map((proof, i) => (
                    <div key={i} className="flex flex-col gap-2 shrink-0 snap-start">
                      <button
                        onClick={() => openPreview(rent.payment_proof.split(','), i)}
                        className="w-24 h-24 rounded-lg overflow-hidden border border-default-200 bg-default-50 flex items-center justify-center hover:opacity-85 transition duration-200 relative group cursor-pointer"
                        title="Klik untuk memperbesar"
                      >
                        <img
                          src={`${import.meta.env.VITE_API_URL || ''}${proof}`}
                          alt={`Bukti Transfer ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="hidden w-full h-full flex-col items-center justify-center gap-1 text-[10px] text-default-400 bg-default-100">
                          <FileImage size={24} />
                          <span>Lihat File</span>
                        </div>
                      </button>
                      <div className="text-xs text-default-500 flex flex-col mt-1">
                        <span className="font-semibold text-default-700">Receipt {i + 1}</span>
                        <span className="truncate max-w-[96px] text-[10px]">{proof.split('/').pop()}</span>
                      </div>
                    </div>
                  ))}
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
    </div>
    {/* End Right Column */}
  </div>
  {/* End Grid Layout */}

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
                     <label className="flex items-center gap-3 cursor-pointer py-1">
                       <input type="checkbox" checked={idReturned} onChange={(e) => setIdReturned(e.target.checked)} className="w-4 h-4 rounded border-default-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer" /> 
                       <span className="text-sm">Kartu ID Dikembalikan ke Klien</span>
                     </label>
                     <label className="flex items-center gap-3 cursor-pointer py-1">
                       <input type="checkbox" checked={isGoodCondition} onChange={(e) => setIsGoodCondition(e.target.checked)} className="w-4 h-4 rounded border-default-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer" /> 
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
              <p className="text-sm text-default-600">
                Penyewaan ini akan diupgrade ke status <strong className="text-warning">Dipesan (Booked)</strong>.
              </p>

              <div>
                <label htmlFor="upgradeDpInput" className="block text-xs font-bold text-default-500 uppercase tracking-wider mb-1">Uang Muka (DP) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400 font-semibold text-sm">Rp</span>
                  <input
                    id="upgradeDpInput"
                    type="number"
                    value={upgradeDp}
                    onChange={(e) => setUpgradeDp(e.target.value)}
                    className="w-full px-3 py-2 pl-9 border border-default-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-[var(--input-bg)]"
                    placeholder="Masukkan jumlah DP"
                    required
                  />
                </div>
                <p className="text-[11px] text-default-500 mt-1 font-medium">Minimal DP 50%: {formatCurrency(Math.ceil(totalFee / 2))}</p>
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <label className="text-xs font-bold text-default-500 uppercase tracking-wider block">Bukti Pembayaran DP *</label>
                <div className="relative border border-dashed border-default-300 rounded-lg p-3 bg-[var(--input-bg)] text-center hover:bg-default-50 transition duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[80px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadUpgradeFile}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploadingUpgradeProof ? (
                    <div className="flex items-center gap-1.5 text-xs text-default-500 font-semibold">
                      <Spinner size="xs" /> Mengunggah...
                    </div>
                  ) : upgradeFile ? (
                    <div className="flex items-center justify-between w-full text-xs text-success font-semibold px-2">
                      <span className="truncate max-w-[200px]">✓ {upgradeFile}</span>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        className="h-5 w-5 min-w-5 p-0 text-default-400 hover:text-red-500"
                        onPress={(e) => {
                          e.stopPropagation();
                          setUpgradeProof('');
                          setUpgradeFile(null);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-default-400 font-medium">Klik atau seret gambar ke sini</span>
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
              <p className="text-sm text-default-600">
                Ubah status ke <strong className="text-success">Disewakan (Rented)</strong>.
              </p>
              <div className="p-3 bg-default-50 rounded-lg border border-default-200">
                <p className="text-xs text-default-500 font-medium mb-0.5">Sisa Pembayaran:</p>
                <p className="font-bold text-lg text-primary">{formatCurrency(totalFee - (rent.downpayment || 0))}</p>
                <p className="text-[11px] text-default-500 mt-1 font-medium">Pastikan sisa pembayaran telah diterima sebelum menyerahkan kostum.</p>
              </div>

              <div className="flex flex-col gap-2 p-3 bg-default-50 rounded-lg border border-default-200">
                <p className="text-xs font-bold text-default-500 uppercase tracking-wider block mb-1">Ceklist Pengambilan *</p>
                <label className="flex items-center gap-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={confirmSecurityItem}
                    onChange={(e) => setConfirmSecurityItem(e.target.checked)}
                    className="w-4 h-4 rounded border-default-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-default-700">Kartu Jaminan Identitas ({rent.guarantee_type}) Telah Ditahan (Wajib)</span>
                </label>
              </div>

              {((totalFee - (rent.downpayment || 0)) > 0) && (
                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-bold text-default-500 uppercase tracking-wider block">Bukti Pelunasan Pembayaran *</label>
                  <div className="relative border border-dashed border-default-300 rounded-lg p-3 bg-[var(--input-bg)] text-center hover:bg-default-50 transition duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[80px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadRentFile}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {uploadingRentProof ? (
                      <div className="flex items-center gap-1.5 text-xs text-default-500 font-semibold">
                        <Spinner size="xs" /> Mengunggah...
                      </div>
                    ) : rentFile ? (
                      <div className="flex items-center justify-between w-full text-xs text-success font-semibold px-2">
                        <span className="truncate max-w-[200px]">✓ {rentFile}</span>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          className="h-5 w-5 min-w-5 p-0 text-default-400 hover:text-red-500"
                          onPress={(e) => {
                            e.stopPropagation();
                            setRentProof('');
                            setRentFile(null);
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-default-400 font-medium">Klik atau seret gambar ke sini</span>
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

      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        images={previewImages}
        initialIndex={previewIndex}
      />
    </div>
  );
};

export default RentDetailPage;
