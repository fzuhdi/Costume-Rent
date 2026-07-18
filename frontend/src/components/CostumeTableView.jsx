import { Button, Table } from '@heroui/react';
import { ChevronRight, Pencil, ImageOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

const formatPrice = (price) => {
  return idrFormatter.format(price);
};

const CostumeTableView = ({ costumes, expandedKeys, onExpandedChange }) => {
  const navigate = useNavigate();
  return (
    <Table aria-label="Table of costumes">
      <Table.ScrollContainer>
        <Table.Content aria-label="Tabel kostum" treeColumn="name" expandedKeys={expandedKeys} onExpandedChange={onExpandedChange}>
          <Table.Header>
            <Table.Column isRowHeader id="name">Nama</Table.Column>
            <Table.Column id="region">Wilayah</Table.Column>
            <Table.Column id="category">Kategori</Table.Column>
            <Table.Column id="size">Ukuran</Table.Column>
            <Table.Column id="stock">Stok</Table.Column>
            <Table.Column id="price">Sewa/Set</Table.Column>
            <Table.Column id="actions">Aksi</Table.Column>
          </Table.Header>
          <Table.Body items={costumes}>
            {(costume) => (
              <Table.Row id={String(costume.id)} textValue={costume.name}>
                <Table.Cell textValue={costume.name}>
                  {({hasChildItems, isExpanded, isTreeColumn}) => (
                    <div className="flex items-center gap-2">
                      {hasChildItems && isTreeColumn ? (
                        <Button isIconOnly aria-label={`Toggle expand ${costume.name}`} size="sm" slot="chevron" variant="ghost">
                          <ChevronRight className={`size-4 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
                        </Button>
                      ) : null}
                      <a href={`/catalogue/${costume.id}`} className="hover:underline cursor-pointer" onClick={(e) => e.stopPropagation()} aria-label={`Lihat detail ${costume.name}`}>
                        {costume.name}
                      </a>
                    </div>
                  )}
                </Table.Cell>
                <Table.Cell>{costume.region || '-'}</Table.Cell>
                <Table.Cell>{costume.category || '-'}</Table.Cell>
                <Table.Cell>{costume.size || '-'}</Table.Cell>
                <Table.Cell>{costume.available_quantity ?? costume.total_quantity} unit</Table.Cell>
                <Table.Cell>{formatPrice(costume.rental_fee)}</Table.Cell>
                <Table.Cell>
                   <Button isIconOnly variant="bordered" size="sm" aria-label={`Edit ${costume.name}`} onPress={() => navigate(`/catalogue/${costume.id}/edit`)}>
                    <Pencil size={16} />
                  </Button>
                </Table.Cell>
                <Table.Collection items={costume.children}>
                  {(detail) => (
                    <Table.Row id={`detail-${costume.id}`} textValue={`Detail ${costume.name}`}>
                      <Table.Cell colSpan={6}>
                        <div className="flex items-start gap-4 p-2 bg-[var(--muted-fg)] rounded-lg">
                          <div className="w-24 h-24 flex-shrink-0 bg-[var(--border)] rounded-lg overflow-hidden">
                            {detail.cover_image ? (
                              <img src={detail.cover_image} alt={detail.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" fetchPriority="low" />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-[var(--muted)] text-[10px] uppercase font-medium bg-default-50 border border-default-100">
                                <ImageOff size={20} className="mb-1 opacity-40" />
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-[var(--muted)] text-xs">Deskripsi</span>
                              <p className="text-xs">{detail.description || '-'}</p>
                            </div>
                            <div>
                              <span className="text-[var(--muted)] text-xs">Wilayah</span>
                              <p className="text-xs">{detail.region || '-'}</p>
                            </div>
                            <div>
                              <span className="text-[var(--muted)] text-xs">Kategori</span>
                              <p className="text-xs">{detail.category || '-'}</p>
                            </div>
                            <div>
                               <span className="text-[var(--muted)] text-xs">Stok Tersedia / Total</span>
                               <p className="text-xs">{detail.available_quantity ?? detail.total_quantity} / {detail.total_quantity} unit</p>
                             </div>
                            {detail.acquired_at && (
                              <div>
                                <span className="text-[var(--muted)] text-xs">Tanggal Perolehan</span>
                                <p className="text-xs">{detail.acquired_at}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Collection>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
};

export default CostumeTableView;
