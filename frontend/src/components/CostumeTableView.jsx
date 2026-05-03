import { Button, Table } from '@heroui/react';
import { Link } from 'react-router-dom';
import { ChevronRight, Pencil } from 'lucide-react';

const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};

const CostumeTableView = ({ costumes, expandedKeys, onExpandedChange }) => {
  return (
    <Table aria-label="Table of costumes">
      <Table.ScrollContainer>
        <Table.Content aria-label="Tabel kostum" treeColumn="name" expandedKeys={expandedKeys} onExpandedChange={onExpandedChange}>
          <Table.Header>
            <Table.Column isRowHeader id="name">Nama</Table.Column>
            <Table.Column id="region">Wilayah</Table.Column>
            <Table.Column id="category">Kategori</Table.Column>
            <Table.Column id="stock">Stok</Table.Column>
            <Table.Column id="price">Harga/Set</Table.Column>
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
                 <Table.Cell>{costume.available_quantity ?? costume.quantity} unit</Table.Cell>
                <Table.Cell>{formatPrice(costume.price)}</Table.Cell>
                <Table.Cell>
                   <Button isIconOnly variant="bordered" size="sm" onPress={() => navigate(`/catalogue/${costume.id}/edit`)}>
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
                              <img src={detail.cover_image} alt={detail.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full text-[var(--muted)] text-xs">No Image</div>
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
                               <span className="text-[var(--muted)] text-xs">Stok Tersedia</span>
                               <p className="text-xs">{detail.available_quantity ?? detail.quantity} unit</p>
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
