
import { Card, Input, Select, ListBox, TextField, Label, Chip } from '@heroui/react';
import { User, Calendar as CalendarIcon, CreditCard, Globe, ArrowUpRight, ArrowDownLeft, StickyNote, Clock, AlertTriangle, TrendingDown, Tag, CheckCircle2 } from 'lucide-react';
import ClientSelect from '@/components/ClientSelect';
import HeroDatePicker from '@/components/HeroDatePicker';

const dateFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

export default function RentDetailInfo({
  rent,
  isEditing,
  editData,
  setEditData,
  formatCurrency,
  openPreview
}) {
  // Calculations for Insights
  let durationText = '-';
  let isOverdue = false;
  let overdueDays = 0;

  if (rent.expected_return_date) {
    const start = rent.pickup_date ? new Date(rent.pickup_date) : (rent.event_date ? new Date(new Date(rent.event_date).setDate(new Date(rent.event_date).getDate() - 2)) : null);
    const end = new Date(rent.expected_return_date);
    if (start) {
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      durationText = `${diffDays} Hari, ${Math.max(1, diffDays - 1)} Malam`;
    }

    if (rent.status !== 'returned' && rent.status !== 'cancelled') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endClean = new Date(end);
      endClean.setHours(0, 0, 0, 0);
      if (endClean < today) {
        isOverdue = true;
        overdueDays = Math.ceil(Math.abs(today - endClean) / (1000 * 60 * 60 * 24));
      }
    }
  }

  let totalNormal = 0;
  let totalRented = 0;
  rent.items?.forEach(item => {
    totalNormal += (item.costume?.rental_fee || 0) * item.quantity;
    totalRented += (item.rental_fee || 0) * item.quantity;
  });
  const discount = totalNormal - totalRented;
  const discountPercent = totalNormal > 0 ? Math.round((discount / totalNormal) * 100) : 0;

  const parsedReturnPhotos = parsePhotos(rent.return_photos);
  const parsedPickupPhotos = parsePhotos(rent.pickup_photos);
  const parsedDamagePhotos = parsePhotos(rent.damage_photos);

  function parsePhotos(photos) {
    if (Array.isArray(photos)) return photos;
    if (typeof photos === 'string') {
      try {
        return JSON.parse(photos || '[]');
      } catch {
        return [];
      }
    }
    return [];
  }

  return (
    <Card>
      <Card.Content>
        {isEditing ? (
          <div className="flex flex-col gap-4 mt-1">
            <h2 className="text-xl font-semibold mb-2">Edit Informasi Order</h2>
            <div className="flex flex-col gap-2">
              <ClientSelect value={editData.client} onChange={(c) => {
                setEditData(p => ({ ...p, client: c, client_phone: c?.client?.phone || p.client_phone, client_address: c?.client?.address || p.client_address }));
              }} />
              {editData.client?.type === 'new' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <TextField value={editData.client_phone} onChange={(val) => setEditData(p => ({ ...p, client_phone: val }))}>
                    <Input size="sm" placeholder="No HP" aria-label="No HP" />
                  </TextField>
                  <TextField value={editData.client_address} onChange={(val) => setEditData(p => ({ ...p, client_address: val }))}>
                    <Input size="sm" placeholder="Alamat" aria-label="Alamat" />
                  </TextField>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
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

            <TextField value={editData.notes} onChange={v => setEditData(p => ({ ...p, notes: v }))}>
              <Label className="text-xs font-semibold mb-1 text-default-600 block">Catatan</Label>
              <Input aria-label="Catatan" placeholder="Catatan tambahan..." />
            </TextField>
          </div>
        ) : (
          <div className="flex flex-col gap-5 text-sm">
            <h3 className="font-semibold text-lg border-b border-[var(--border)] pb-2 m-0 flex items-center gap-2">
              Informasi Order
            </h3>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Left Column */}
              <div className="flex-1 flex flex-col gap-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-[var(--muted)]" />
                    <span className="font-medium text-[var(--foreground)]">{rent.client?.name || rent.client_name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-[var(--muted)]" />
                    <span className="text-[var(--foreground)]">
                      Acara: {rent.event_date ? dateFormatter.format(new Date(rent.event_date)) : '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                    <div className="flex items-center gap-1.5 bg-[var(--surface-sunken)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                      <CreditCard size={14} />
                      <span>Jaminan: <span className="font-medium text-[var(--foreground)]">{rent.guarantee_type}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[var(--surface-sunken)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                      <Globe size={14} />
                      <span className="font-medium text-[var(--foreground)] capitalize">{rent.order_source || 'Offline'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-sm text-[var(--muted)] uppercase tracking-wider mb-1 border-t border-[var(--border)] pt-4">Jadwal Sewa</h4>

                  {rent.pickup_date ? (
                    <div className="flex items-center gap-2">
                      <ArrowUpRight size={16} className="text-[var(--primary)]" />
                      <span className="text-[var(--foreground)]">
                        Diambil: <span className="font-medium">{dateFormatter.format(new Date(rent.pickup_date))}</span>
                      </span>
                    </div>
                  ) : rent.event_date ? (
                    <div className="flex items-center gap-2">
                      <ArrowUpRight size={16} className="text-[var(--primary)]" />
                      <span className="text-[var(--foreground)]">
                        Jendela Ambil: <span className="font-medium">{dateFormatter.format(new Date(new Date(rent.event_date).setDate(new Date(rent.event_date).getDate() - 2)))} - {dateFormatter.format(new Date(new Date(rent.event_date).setDate(new Date(rent.event_date).getDate() - 1)))}</span>
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <ArrowDownLeft size={16} className="text-[var(--success)]" />
                    <span className="text-[var(--foreground)]">
                      Kembali: <span className="font-medium">{rent.expected_return_date ? dateFormatter.format(new Date(rent.expected_return_date)) : '-'}</span>
                    </span>
                  </div>
                </div>

                {rent.notes && (
                  <div className="flex gap-2 text-[var(--muted)] border-t border-[var(--border)] pt-4">
                    <StickyNote size={16} className="mt-0.5 shrink-0" />
                    <p className="text-sm italic">{rent.notes}</p>
                  </div>
                )}

                {rent.shipping_address && (
                  <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-4">
                    <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Alamat Pengiriman</span>
                    <p className="font-medium text-sm text-[var(--foreground)]">{rent.shipping_address}</p>
                  </div>
                )}
              </div>

              {/* Right Column (Insights) */}
              <div className="flex-1 flex flex-col gap-5 md:border-l border-[var(--border)] md:pl-8">

                {/* Durasi Sewa */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-semibold text-sm text-[var(--muted)] uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Clock size={16} /> Durasi Sewa
                  </h4>
                  <div className="flex flex-col gap-2">
                    <div className="text-[var(--foreground)] font-medium text-base">
                      {durationText}
                    </div>
                    {isOverdue && !['returned', 'inspected', 'completed'].includes(rent.status) ? (
                      <Chip color="danger" variant="flat" size="sm">
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={14} /> Overdue {overdueDays} Hari
                        </div>
                      </Chip>
                    ) : ['returned', 'inspected', 'completed'].includes(rent.status) ? (
                      <Chip color="success" variant="flat" size="sm">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={14} /> Telah Dikembalikan
                        </div>
                      </Chip>
                    ) : (
                      <span className="text-[var(--muted)] text-xs">Dalam jadwal normal</span>
                    )}
                  </div>
                </div>

                {/* Insight Harga */}
                <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5">
                  <h4 className="font-semibold text-sm text-[var(--muted)] uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Tag size={16} /> Insight Harga
                  </h4>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--muted)]">Harga Katalog</span>
                      <span className="font-medium line-through decoration-default-400">{formatCurrency ? formatCurrency(totalNormal) : totalNormal}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--muted)]">Harga Diberikan</span>
                      <span className="font-bold">{formatCurrency ? formatCurrency(totalRented) : totalRented}</span>
                    </div>

                    {discount > 0 ? (
                      <div className="flex justify-between items-center text-sm mt-1 p-2 bg-success/10 rounded-md border border-success/20">
                        <span className="text-success font-semibold flex items-center gap-1">
                          <TrendingDown size={14} /> Diskon ({discountPercent}%)
                        </span>
                        <span className="text-success font-bold">-{formatCurrency ? formatCurrency(discount) : discount}</span>
                      </div>
                    ) : discount < 0 ? (
                      <div className="flex justify-between items-center text-sm mt-1 p-2 bg-warning/10 rounded-md border border-warning/20">
                        <span className="text-warning-600 font-semibold">Markup Harga</span>
                        <span className="text-warning-600 font-bold">+{formatCurrency ? formatCurrency(Math.abs(discount)) : Math.abs(discount)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-[var(--muted)]">Diskon</span>
                        <span className="text-[var(--muted)]">-</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Dokumentasi */}
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <h4 className="font-semibold text-sm text-[var(--muted)] uppercase tracking-wider mb-3">
                Dokumentasi
              </h4>
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-xs font-semibold text-[var(--muted)] block mb-2">Foto Pickup</span>
                  {parsedPickupPhotos?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {parsedPickupPhotos.map((photo, i) => (
                        <div key={`pickup-${i}`} className="w-20 h-20 relative">
                          <img src={photo} onClick={() => openPreview(parsedPickupPhotos, i)} alt="Pickup" className="w-full h-full object-cover rounded-md border border-default-200 hover:opacity-80 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--muted)]">-</span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-semibold text-[var(--muted)] block mb-2">Foto Return</span>
                  {parsedReturnPhotos?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {parsedReturnPhotos.map((photo, i) => (
                        <div key={`return-${i}`} className="w-20 h-20 relative">
                          <img src={photo} onClick={() => openPreview(parsedReturnPhotos, i)} alt="Return" className="w-full h-full object-cover rounded-md border border-default-200 hover:opacity-80 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--muted)]">-</span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-semibold text-[var(--muted)] block mb-2">Foto Kerusakan</span>
                  {parsedDamagePhotos?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {parsedDamagePhotos.map((photo, i) => (
                        <div key={`damage-${i}`} className="w-20 h-20 relative">
                          <a href={photo} target="_blank" rel="noopener noreferrer">
                            <img src={photo} alt="Damage" className="w-full h-full object-cover rounded-md border border-default-200 hover:opacity-80 transition-opacity" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--muted)]">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
