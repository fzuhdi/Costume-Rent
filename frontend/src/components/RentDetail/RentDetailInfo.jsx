
import { Card, Chip, Button, Input, Select, ListBox, TextField, Label } from '@heroui/react';
import { XCircle, CheckCircle, Edit, Trash2, User, Calendar, Shield, FileText, Globe, MapPin } from 'lucide-react';
import ClientSelect from '../ClientSelect';
import HeroDatePicker from '../HeroDatePicker';

const dateFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

export default function RentDetailInfo({
  rent,
  isEditing,
  processing,
  editData,
  setEditData,
  toggleEditMode,
  handleEditSave,
  setIsDeleteOpen,
  statusColors,
  statusLabels
}) {
  return (
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
            <div className="flex items-start gap-3">
              <User size={20} className="text-[var(--muted)]" />
              <div>
                <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Klien</span>
                <p className="font-medium text-sm text-[var(--foreground)]">{rent.client?.name || rent.client_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-[var(--muted)]" />
              <div>
                <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Acara</span>
                <p className="font-medium text-sm text-[var(--foreground)]">
                  {rent.event_date 
                    ? dateFormatter.format(new Date(rent.event_date))
                    : '-'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-[var(--muted)]" />
              <div>
                <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Jaminan</span>
                <p className="font-medium text-sm text-[var(--foreground)]">{rent.guarantee_type}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText size={20} className="text-[var(--muted)]" />
              <div>
                <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Catatan</span>
                <p className="font-medium text-sm text-[var(--foreground)]">{rent.notes || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Globe size={20} className="text-[var(--muted)]" />
              <div>
                <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Sumber Order</span>
                <p className="font-medium text-sm text-[var(--foreground)]">{rent.order_source || 'Offline'}</p>
              </div>
            </div>

            {rent.shipping_address && (
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-[var(--muted)]" />
                <div>
                  <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Alamat Pengiriman</span>
                  <p className="font-medium text-sm text-[var(--foreground)]">{rent.shipping_address}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
