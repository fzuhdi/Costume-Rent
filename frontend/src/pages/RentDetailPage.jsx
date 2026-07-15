import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRentById, cancelRent, deleteRent, updateRent, rollbackOrder } from '../api/rentApi';
import { updateClient } from '../api/clientApi';
import { ArrowLeft, Edit, Trash2, CheckCircle, Package, XCircle, User, Calendar, FileText, Shield, Upload, FileImage, ImageOff, Clock, Search } from 'lucide-react';
import { Button, Card, Chip, Spinner, Table, Modal, Select, ListBox, Label, Input, TextField, Switch } from '@heroui/react';
import ImagePreviewModal from '../components/ImagePreviewModal';
import ClientSelect from '../components/ClientSelect';
import MarkRentedModal from '../components/MarkRentedModal';
import MarkReturnedModal from '../components/MarkReturnedModal';
import MarkBookedModal from '../components/MarkBookedModal';
import AddPaymentModal from '../components/AddPaymentModal';
import ExtendRentModal from '../components/ExtendRentModal';
import ConfirmActionModal from '../components/ConfirmActionModal';
import HeroDatePicker from '../components/HeroDatePicker';

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

const itemStatusColors = {
  booked: { variant: 'flat', color: 'primary' },
  rented: { variant: 'flat', color: 'secondary' },
  returned: { variant: 'flat', color: 'success' },
  lost: { variant: 'flat', color: 'danger' },
};

const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const [isRollbackOpen, setIsRollbackOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  // Edit States
  const [editData, setEditData] = useState({});
  const [editItems, setEditItems] = useState([]);

  // Image Preview States
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Add Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

  const totalBaseFee = rent?.items?.reduce((sum, item) => sum + ((item.rental_fee || 0) * item.quantity), 0) || 0;
  
  // Ledger-based calculations
  // If a transaction has no type (unmigrated), default to CREDIT (payment)
  const totalDebits = rent?.transactions?.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const totalCredits = rent?.transactions?.filter(t => t.type === 'CREDIT' || !t.type).reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  const totalTagihan = totalDebits;
  
  const totalPaid = totalCredits;
  const isCancelled = rent?.status === 'cancelled';
  const sisaTagihan = isCancelled ? 0 : Math.max(0, totalTagihan - totalPaid);
  const isFullyPaid = rent?.payment_status === 'LUNAS' || sisaTagihan <= 0;

  let recommendedEarlyFee = 0;
  if (rent?.pickup_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickupDateObj = new Date(rent.pickup_date);
    pickupDateObj.setHours(0, 0, 0, 0);
    if (today < pickupDateObj) {
      const diffTime = pickupDateObj - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 2) {
        recommendedEarlyFee = (diffDays - 2) * totalBaseFee;
      }
    }
  }

  // Actions / State Management
  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false);
      return;
    }
    setEditData({
      client: {
        type: 'existing',
        client: rent.client,
        name: rent.client?.name || rent.client_name,
      },
      client_phone: rent.client?.phone || rent.client_phone || '',
      client_address: rent.client?.address || rent.client_address || '',
      event_date: rent.event_date ? rent.event_date.split('T')[0] : '',
      guarantee_type: rent.guarantee_type || 'KTP',
      notes: rent.notes || '',
    });
    setEditItems(rent.items.map(i => ({ ...i, custom_rental_fee: i.rental_fee })));
    setIsEditing(true);
  };

  const openRentModal = () => setIsRentOpen(true);
  const openReturnModal = () => setIsReturnOpen(true);
  const openUpgradeModal = () => setIsUpgradeOpen(true);

  // Actions
  const handleEditSave = async () => {
    setProcessing(true);
    try {
      const payload = { ...editData };
      if (editData.client?.type === 'existing' && editData.client.client.id !== rent.client_id) {
        payload.client_id = editData.client.client.id;
        // Optionally update the selected client's info if phone/address changed
        if (editData.client_phone !== editData.client.client.phone || editData.client_address !== editData.client.client.address) {
          await updateClient(editData.client.client.id, {
            name: editData.client.client.name,
            phone: editData.client_phone,
            address: editData.client_address
          });
        }
      } else if (editData.client?.type === 'new') {
        payload.client_name = editData.client.name;
        payload.client_phone = editData.client_phone;
        payload.client_address = editData.client_address;
      } else if (editData.client?.type === 'existing' && editData.client.client.id === rent.client_id) {
        if (editData.client_phone !== rent.client_phone || editData.client_address !== rent.client_address) {
          await updateClient(rent.client_id, {
            name: rent.client?.name || rent.client_name,
            phone: editData.client_phone,
            address: editData.client_address
          });
        }
      }

      delete payload.client;
      delete payload.client_name;
      delete payload.client_phone;
      delete payload.client_address;

      payload.early_takeaway_fee = payload.early_takeaway_fee === '' ? 0 : payload.early_takeaway_fee;
      payload.late_fee = payload.late_fee === '' ? 0 : payload.late_fee;
      payload.damage_fee = payload.damage_fee === '' ? 0 : payload.damage_fee;
      payload.extension_fee = payload.extension_fee === '' ? 0 : payload.extension_fee;


      payload.items = editItems.map(i => ({
        costume_id: i.costume_id,
        quantity: i.quantity,
        custom_rental_fee: Number(i.custom_rental_fee)
      }));
      await updateRent(id, payload);
      setIsEditing(false);
      fetchRent();
    } catch (error) {
      console.error('Failed to update rent:', error);
      alert(error.response?.data?.error || 'Gagal update pesanan');
    } finally {
      setProcessing(false);
    }
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

  const handleRollback = async () => {
    setProcessing(true);
    try {
      await rollbackOrder(id);
      setIsRollbackOpen(false);
      fetchRent();
    } catch (error) {
      console.error('Failed to rollback:', error);
    } finally {
      setProcessing(false);
    }
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

  const handleUploadGeneric = async (e, setProof, setFile, setUploading) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setTransitionError('');
    try {
      const res = await uploadPaymentProof(file);
      setProof(res.data.payment_proof);
      setFile(file.name);
    } catch (err) {
      setTransitionError('Gagal mengunggah file bukti pembayaran');
    } finally {
      setUploading(false);
    }
  };
  const groupedLogs = useMemo(() => {
    if (!rent?.activity_logs) return [];
    const groups = [];
    let currentGroup = null;

    rent.activity_logs.forEach(log => {
      const secondStamp = new Date(log.timestamp).toISOString().slice(0, 19);
      if (!currentGroup || currentGroup.secondStamp !== secondStamp) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          id: log.id,
          secondStamp,
          timestamp: log.timestamp,
          logs: [log]
        };
      } else {
        currentGroup.logs.push(log);
      }
    });
    if (currentGroup) groups.push(currentGroup);
    return groups;
  }, [rent?.activity_logs]);

  const renderLogContent = useCallback((log) => {
    if (log.action_type === 'UPDATED' && (log.new_value === 'updated' || !log.old_value)) {
      return 'Order details were updated';
    }
    if (log.old_value && log.new_value) {
      return `${log.old_value} ➞ ${log.new_value}`;
    }
    return log.new_value || log.old_value;
  }, []);


  if (loading) {
    return <div className="flex justify-center items-center h-48"><Spinner /></div>;
  }

  if (!rent) {
    return (
      <Card>
        <Card.Content className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Peminjaman tidak ditemukan</h3>
          <Button onPress={() => navigate('/rents')} variant="primary">Kembali ke Riwayat</Button>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full pb-10">
      <Link to="/rents" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft size={18} aria-hidden="true" />
        Kembali ke Riwayat
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card>
            <Card.Content>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold">Order #{rent.id}</h2>
                  <Chip className="mt-2 w-fit" {...(statusColors[rent.status] ?? { variant: 'secondary' })}>
                    {statusLabels[rent.status] || rent.status}
                  </Chip>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="light" size="sm" onPress={toggleEditMode}><XCircle size={16} className="mr-1" /> Batal</Button>
                      <Button color="primary" size="sm" onPress={handleEditSave} isPending={processing}><CheckCircle size={16} className="mr-1" /> Simpan Perubahan</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="light" size="sm" onPress={toggleEditMode}><Edit size={16} className="mr-1" /> Edit Order</Button>
                      <Button variant="light" color="danger" size="sm" onPress={() => setIsDeleteOpen(true)}><Trash2 size={16} className="mr-1" /> Hapus</Button>
                    </>
                  )}
                </div>
              </div>
              {isEditing ? (
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex flex-col gap-2">
                    <ClientSelect value={editData.client} onChange={(c) => {
                      setEditData(p => ({ ...p, client: c, client_phone: c?.client?.phone || p.client_phone, client_address: c?.client?.address || p.client_address }));
                    }} />
                    {editData.client?.type === 'new' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        <Input size="sm" placeholder="No HP" value={editData.client_phone} onChange={(e) => setEditData(p => ({ ...p, client_phone: e.target.value }))} />
                        <Input size="sm" placeholder="Alamat" value={editData.client_address} onChange={(e) => setEditData(p => ({ ...p, client_address: e.target.value }))} />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <HeroDatePicker
                        label="Tanggal Acara"
                        value={editData.event_date}
                        onChange={e => setEditData(p => ({ ...p, event_date: e.target.value }))}
                      />
                      <Select
                        value={editData.guarantee_type}
                        onChange={(v) => setEditData(p => ({ ...p, guarantee_type: v }))}
                        aria-label="Jaminan"
                      >
                        <Label className="text-xs font-semibold mb-1 text-default-600 block">Jaminan</Label>
                        <Select.Trigger><Select.Value /></Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {['KTP', 'SIM', 'KK', 'Paspor', 'Lainnya'].map(t => <ListBox.Item key={t} id={t} textValue={t}>{t}</ListBox.Item>)}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                  </div>

                  <TextField><Label className="text-xs font-semibold mb-1 text-default-600 block">Catatan</Label><Input aria-label="Catatan" value={editData.notes} onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))} /></TextField>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-[var(--muted)]" />
                    <div>
                      <span className="text-[var(--muted)]">Klien</span>
                      <p className="font-medium">{rent.client?.name || rent.client_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-[var(--muted)]" />
                    <div>
                      <span className="text-[var(--muted)]">Acara</span>
                      <p className="font-medium">{formatDate(rent.event_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-[var(--muted)]" />
                    <div>
                      <span className="text-[var(--muted)]">Jaminan</span>
                      <p className="font-medium">{rent.guarantee_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-[var(--muted)]" />
                    <div>
                      <span className="text-[var(--muted)]">Catatan</span>
                      <p className="font-medium">{rent.notes || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Content>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Daftar Item</h2>
              </div>
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="Daftar Item">
                    <Table.Header>
                      <Table.Column isRowHeader>Item</Table.Column>
                      <Table.Column>Harga</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {rent.items?.map((item) => {
                        const editItem = editItems.find(i => i.costume_id === item.costume_id);
                        return (
                          <Table.Row key={item.id}>
                            <Table.Cell className="font-medium text-xs">
                              {item.quantity}x{' '}
                              <Link to={`/catalogue/${item.costume_id}`} className="text-primary hover:underline" aria-label={`Lihat detail ${item.costume?.name}`}>
                                {item.costume?.name}
                              </Link>
                            </Table.Cell>
                            <Table.Cell className="font-semibold">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  aria-label={`Harga ${item.costume?.name}`}
                                  size="sm"
                                  value={editItem?.custom_rental_fee ?? item.rental_fee}
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (val === '') {
                                      setEditItems(prev => prev.map(i => i.costume_id === item.costume_id ? { ...i, custom_rental_fee: '' } : i));
                                      return;
                                    }
                                    const parsed = parseInt(val);
                                    if (isNaN(parsed) || parsed < 0) return;
                                    setEditItems(prev => prev.map(i => i.costume_id === item.costume_id ? { ...i, custom_rental_fee: parsed } : i));
                                  }}
                                />
                              ) : (
                                formatCurrency(item.rental_fee * item.quantity)
                              )}
                            </Table.Cell>
                          </Table.Row>
                        )
                      })}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content>
              <h2 className="text-xl font-semibold mb-4">Aksi Pesanan</h2>
              <div className="flex flex-wrap gap-3">
                {rent.status === 'draft' && (
                  <>
                    <Button color="primary" onPress={openUpgradeModal}>Ubah Status ke Booked</Button>
                    <Button color="danger" variant="flat" onPress={() => setIsCancelOpen(true)}>Batalkan</Button>
                  </>
                )}
                {rent.status === 'booked' && (
                  <>
                    <Button color="success" className="text-white font-bold" onPress={openRentModal}>Pickup (Mark Rented)</Button>
                    <Button color="danger" variant="flat" onPress={() => setIsCancelOpen(true)}>Batalkan</Button>
                  </>
                )}
                {(rent.status === 'rented' || rent.status === 'overdue') && (
                  <>
                    <Button color="secondary" onPress={() => setIsExtendOpen(true)}>Perpanjang Sewa (Extend)</Button>
                    <Button color="success" className="text-white font-bold" onPress={openReturnModal}>Pelunasan & Pengembalian</Button>
                    {rent.status === 'rented' && (
                      <Button color="danger" variant="flat" onPress={() => setIsRollbackOpen(true)}>Batalkan Status</Button>
                    )}
                  </>
                )}
                {rent.status === 'returned' && (
                  <>
                    <Button color="danger" variant="flat" onPress={() => setIsRollbackOpen(true)}>Batalkan Status (Rollback)</Button>
                  </>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          <Card>
            <Card.Content>
              <h2 className="text-xl font-semibold mb-4">Rincian Keuangan</h2>

              {/* Transaction ledger */}
              <div className="flex flex-col gap-3 text-sm">
                {rent.transactions && rent.transactions.length > 0 ? (
                  [...rent.transactions].sort((a, b) => a.id - b.id).map((trx, idx) => {
                    const isDebit = trx.type === 'DEBIT';
                    const isCredit = trx.type === 'CREDIT' || !trx.type; // empty means legacy payment
                    const amount = trx.amount || 0;
                    
                    let sign = '';
                    let colorClass = 'text-default-700';
                    let borderClass = 'border-default-200';
                    
                    if (isDebit) {
                      sign = '+';
                      colorClass = 'text-danger';
                      borderClass = 'border-danger/40';
                    } else if (isCredit) {
                      if (amount < 0) {
                        sign = '+'; // Negative payment is a refund (increases what they owe)
                        colorClass = 'text-warning-600';
                        borderClass = 'border-warning/40';
                      } else {
                        sign = '-'; // Normal payment
                        colorClass = 'text-success';
                        borderClass = 'border-success/40';
                      }
                    }

                    return (
                      <div
                        key={trx.id || idx}
                        className={`flex justify-between items-start pl-3 border-l-2 ${borderClass}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-default-700">
                            {trx.notes || (isDebit ? 'Biaya Tambahan' : 'Pembayaran')}
                          </span>
                          <span className="text-xs text-default-400 flex items-center flex-wrap gap-1">
                            {formatDate(trx.created_at)} {trx.payment_method ? `· ${trx.payment_method}` : ''}
                            {trx.payment_proof && (
                              <>
                                <span>·</span>
                                <button
                                  type="button"
                                  onClick={() => openPreview([trx.payment_proof], 0)}
                                  className="text-primary hover:underline bg-transparent border-none p-0 cursor-pointer text-xs flex items-center gap-1"
                                >
                                  Lihat Bukti
                                </button>
                              </>
                            )}
                          </span>
                        </div>
                        <span className={`${colorClass} font-semibold whitespace-nowrap ml-4`}>
                          {sign} {formatCurrency(Math.abs(amount))}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-default-400 text-sm italic">Belum ada pembayaran.</p>
                )}

                <hr className="border-default-200 mt-1" />

                {/* Totals */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-default-600">
                    <span>Total Tagihan</span>
                    <span className="font-medium">{formatCurrency(totalTagihan)}</span>
                  </div>
                  {totalPaid > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Total Dibayar</span>
                      <span className="font-medium">{formatCurrency(totalPaid)}</span>
                    </div>
                  )}
                </div>

                <hr className="border-default-200" />

                <div className="flex justify-between text-base font-bold text-primary">
                  <span>Sisa Tagihan</span>
                  <span>{formatCurrency(sisaTagihan)}</span>
                </div>

                {!isEditing && rent.status !== 'cancelled' && (
                  <div className="mt-3 pt-3 border-t border-default-200">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      className="w-full font-semibold"
                      onPress={() => setIsPaymentModalOpen(true)}
                    >
                      + Tambah Pembayaran
                    </Button>
                  </div>
                )}


              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content>
              <h3 className="text-lg font-semibold mb-3">Activity Log</h3>
              <div className="flex flex-col gap-3 relative before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-slate-200 ml-1">
                {groupedLogs.slice(0, 5).map((group) => (
                  <div key={group.id} className="flex gap-3 relative z-10 text-xs">
                    <div className="w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center shrink-0">
                      <Clock size={12} className="text-slate-400" />
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="font-semibold text-slate-700">
                        {group.logs.length > 1 ? 'Order Updated' : (group.logs[0].action_type === 'UPDATED' && (group.logs[0].new_value === 'updated' || !group.logs[0].old_value) ? 'Order Updated' : group.logs[0].action_type)}
                      </p>
                      {group.logs.length > 1 ? (
                        <ul className="list-disc list-inside text-slate-500 mt-1 space-y-0.5">
                          {group.logs.map(log => (
                            <li key={log.id}>
                              {log.action_type !== 'UPDATED' && log.action_type !== 'FEE_UPDATE' && log.action_type !== 'PRICE_OVERRIDE' && <span className="font-semibold">{log.action_type}: </span>}
                              {renderLogContent(log)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500">{renderLogContent(group.logs[0])}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(group.timestamp)}</p>
                    </div>
                  </div>
                ))}
                {rent.activity_logs?.length > 5 && (
                  <Button size="sm" variant="light" className="text-xs font-semibold" onPress={() => setIsHistoryOpen(true)}>
                    View Full History
                  </Button>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Return Modal */}
      <MarkReturnedModal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
        sisaTagihan={sisaTagihan}
      />

      {/* Pickup Modal */}
      <MarkRentedModal
        isOpen={isRentOpen}
        onClose={() => setIsRentOpen(false)}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
        sisaTagihan={sisaTagihan}
      />

      {/* Extend Modal */}
      <ExtendRentModal
        isOpen={isExtendOpen}
        onClose={() => setIsExtendOpen(false)}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
        dailyFee={totalBaseFee}
      />

      {/* Activity Log Full History Modal */}
      <Modal.Backdrop isOpen={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <Modal.Container>
          <Modal.Dialog className="max-w-lg max-h-[80vh] overflow-y-auto">
            <Modal.Header><Modal.Heading>Activity Log History</Modal.Heading></Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-3 relative before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-slate-200 ml-1">
                {groupedLogs.map((group) => (
                  <div key={group.id} className="flex gap-3 relative z-10 text-xs">
                    <div className="w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center shrink-0">
                      <Clock size={12} className="text-slate-400" />
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="font-semibold text-slate-700">
                        {group.logs.length > 1 ? 'Order Updated' : (group.logs[0].action_type === 'UPDATED' && (group.logs[0].new_value === 'updated' || !group.logs[0].old_value) ? 'Order Updated' : group.logs[0].action_type)}
                      </p>
                      {group.logs.length > 1 ? (
                        <ul className="list-disc list-inside text-slate-500 mt-1 space-y-0.5">
                          {group.logs.map(log => (
                            <li key={log.id}>
                              {log.action_type !== 'UPDATED' && log.action_type !== 'FEE_UPDATE' && log.action_type !== 'PRICE_OVERRIDE' && <span className="font-semibold">{log.action_type}: </span>}
                              {renderLogContent(log)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500">{renderLogContent(group.logs[0])}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(group.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="bordered" onPress={() => setIsHistoryOpen(false)}>Tutup</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Upgrade Draft → Booked Modal */}
      <MarkBookedModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
        minDp={Math.ceil(totalBaseFee / 2)}
      />

      {/* Cancel Modal */}
      <ConfirmActionModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancel}
        heading="Batalkan Pesanan"
        body="Yakin batalkan? DP hangus."
        confirmLabel="Batalkan"
        confirmColor="danger"
        loading={processing}
      />

      {/* Delete Modal */}
      <ConfirmActionModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        heading="Hapus Pesanan"
        body="Yakin hapus permanen?"
        confirmLabel="Hapus"
        confirmColor="danger"
        loading={processing}
      />

      {/* Rollback Modal */}
      <ConfirmActionModal
        isOpen={isRollbackOpen}
        onClose={() => setIsRollbackOpen(false)}
        onConfirm={handleRollback}
        heading="Batalkan Status (Rollback)"
        body={
          <>
            Apakah Anda yakin ingin mengembalikan status order ini ke status sebelumnya?
            <br /><br />
            <b>Perhatian:</b>
            <ul className="list-disc ml-5 mt-1 text-sm text-default-600">
              <li>Uang yang sudah dibayarkan tidak akan dihapus otomatis dari sistem.</li>
              <li>Denda terkait status saat ini akan dihapus.</li>
            </ul>
          </>
        }
        confirmLabel="Ya, Batalkan Status"
        confirmColor="danger"
        loading={processing}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={fetchRent}
        rentId={parseInt(id)}
      />

      <ImagePreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} images={previewImages} initialIndex={previewIndex} />
    </div>
  );
};

export default RentDetailPage;
