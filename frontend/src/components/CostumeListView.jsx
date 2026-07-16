import { ChevronRight, Pencil, Trash2, Eye, MoreVertical } from 'lucide-react';
import { Button, Dropdown, Chip, Label } from '@heroui/react';

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

const formatPrice = (price) => {
  return idrFormatter.format(price);
};

const CostumeListView = ({ costumes, expandedKeys, onExpandedChange }) => {
  const toggleExpand = (id) => {
    const next = new Set(expandedKeys || []);
    const key = String(id);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onExpandedChange?.(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {costumes.map((costume) => {
        const isExpanded = (expandedKeys || new Set()).has(String(costume.id));
        const detail = costume.children?.[0];

        return (
          <div key={costume.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
            {/* Card header row */}
            <div className="flex items-center gap-3 p-3 sm:p-4">
              {/* Expand chevron */}
              <Button
                isIconOnly
                variant="light"
                onPress={(e) => { e.stopPropagation(); toggleExpand(costume.id); }}
                className="flex-shrink-0 min-w-6 w-6 h-6 rounded"
                aria-label={isExpanded ? 'Tutup detail' : 'Lihat detail'}
              >
                <ChevronRight className={`w-4 h-4 text-[var(--muted)] transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
              </Button>

              {/* Clickable area that navigates to detail page */}
              <a href={`/catalogue/${costume.id}`} className="flex flex-1 items-center gap-3 min-w-0" onClick={(e) => e.stopPropagation()} aria-label={`Lihat detail ${costume.name}`}>
                {/* Thumbnail */}
                <div className="w-12 h-12 flex-shrink-0 bg-[var(--border)] rounded-lg overflow-hidden">
                  {costume.cover_image ? (
                    <img src={costume.cover_image} alt={costume.name} className="w-full h-full object-cover" loading="lazy" decoding="async" fetchPriority="low" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[var(--muted)]">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Name + Meta */}
                <div className="flex-1 min-w-0">
                  <p className="block font-semibold text-sm text-[var(--foreground)] truncate">
                    {costume.name}
                  </p>
                  <p className="text-xs text-[var(--muted)] truncate">
                    {costume.region || '-'} • {costume.category || '-'} • {costume.size || '-'}
                  </p>
                </div>
              </a>

              {/* Price + Stock */}
               <div className="flex flex-col items-end gap-1 flex-shrink-0">
                 <span className={`text-sm font-bold ${costume.available_quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                   {formatPrice(costume.rental_fee)} / hari
                 </span>
                  {costume.available_quantity === 0 ? (
                    <Chip size="sm" variant="soft" color="danger" className="h-5 text-[10px]">Habis</Chip>
                  ) : (
                   <span className="text-[10px] text-[var(--muted)]">{costume.available_quantity ?? costume.total_quantity} unit tersedia</span>
                 )}
               </div>

              {/* Action dropdown */}
              <div onClick={(e) => e.stopPropagation()}>
                <Dropdown>
                  <Button isIconOnly variant="ghost" size="sm" aria-label={`Aksi untuk ${costume.name}`}>
                    <MoreVertical className="w-4 h-4 text-[var(--muted)]" />
                  </Button>
                  <Dropdown.Popover className="w-48">
                    <Dropdown.Menu>
                      <Dropdown.Section>
                        <Dropdown.Item id="detail" href={`/catalogue/${costume.id}`} textValue="Detail">
                          <Eye className="w-4 h-4 mr-2" />
                          <Label>Detail</Label>
                        </Dropdown.Item>
                        <Dropdown.Item id="edit" href={`/catalogue/${costume.id}/edit`} textValue="Edit">
                          <Pencil className="w-4 h-4 mr-2" />
                          <Label>Edit</Label>
                        </Dropdown.Item>
                        <Dropdown.Item id="delete" className="text-red-500" textValue="Hapus">
                          <Trash2 className="w-4 h-4 mr-2" />
                          <Label className="text-red-500">Hapus</Label>
                        </Dropdown.Item>
                      </Dropdown.Section>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              </div>
            </div>

            {/* Expanded detail panel */}
            {isExpanded && detail && (
              <div className="border-t border-[var(--border)] p-3 sm:p-4 bg-[var(--background)]">
                <div className="flex gap-3">
                  {/* Detail image */}
                  <div className="w-20 h-20 flex-shrink-0 bg-[var(--border)] rounded-lg overflow-hidden">
                    {detail.cover_image ? (
                      <img src={detail.cover_image} alt={detail.name} className="w-full h-full object-cover" loading="lazy" decoding="async" fetchPriority="low" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[var(--muted)] text-xs">No Image</div>
                    )}
                  </div>

                  {/* Detail info */}
                  <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[var(--muted)] text-[10px] uppercase tracking-wide">Deskripsi</span>
                      <p className="text-sm text-[var(--foreground)]">{detail.description || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] text-[10px] uppercase tracking-wide">Wilayah</span>
                      <p className="text-sm text-[var(--foreground)]">{detail.region || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] text-[10px] uppercase tracking-wide">Kategori</span>
                      <p className="text-sm text-[var(--foreground)]">{detail.category || '-'}</p>
                    </div>
                    <div>
                       <span className="text-[var(--muted)] text-[10px] uppercase tracking-wide">Stok Tersedia / Total</span>
                       <p className="text-sm text-[var(--foreground)]">{detail.available_quantity ?? detail.total_quantity} / {detail.total_quantity} unit</p>
                     </div>
                    {detail.acquired_at && (
                      <div>
                        <span className="text-[var(--muted)] text-[10px] uppercase tracking-wide">Tanggal Perolehan</span>
                        <p className="text-sm text-[var(--foreground)]">{detail.acquired_at}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CostumeListView;
