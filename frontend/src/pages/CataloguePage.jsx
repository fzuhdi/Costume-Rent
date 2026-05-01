import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCostumes, getRegions, getCategories } from '../api/costumeApi';
import { Plus, Search, Grid, List, Filter } from 'lucide-react';
import {
  Input, Button, ButtonGroup,
  Label, ListBox, Select,
  Table, Chip, Spinner, Pagination, Card
} from '@heroui/react';

const conditionColors = {
  baik: 'success',
  sedang: 'warning',
  rusak: 'danger',
};

const CataloguePage = () => {
  const [costumes, setCostumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchCostumes();
  }, [search, regionFilter, categoryFilter, page]);

  const fetchFilters = async () => {
    try {
      const [regionsRes, categoriesRes] = await Promise.all([
        getRegions(),
        getCategories(),
      ]);
      setRegions(regionsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  };

  const fetchCostumes = async () => {
    setLoading(true);
    try {
      const response = await getCostumes({
        search,
        region_id: regionFilter,
        category_id: categoryFilter,
        page,
        limit: 12,
      });
      setCostumes(response.data.data || []);
      setTotalPages(response.data.total_pages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch costumes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
      <Card>
        <Card.Header className="flex flex-col gap-4">
          <div className="flex flex-rowflex-wrap items-end justify-between gap-3">
              <h1 className="text-2xl font-bold mr-4">Katalog Kostum</h1>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-3 flex-1">
              <div className="min-w-[200px]">
                <Input
                  placeholder="Cari kostum..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="w-[180px]">
                <Select
                  placeholder="Semua Wilayah"
                  selectedKeys={regionFilter ? [regionFilter] : []}
                  onSelectionChange={(keys) => {
                    setRegionFilter(keys.currentKey ?? '');
                    setPage(1);
                  }}
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item key="wilayah-all" id="" aria-label="Filter wilayah Semua Wilayah">
                        Semua Wilayah
                      </ListBox.Item>
                      {regions.map((r) => (
                        <ListBox.Item key={"wilayah-" + r.id} id={String(r.id)} aria-label={`Filter wilayah ${r.name}`}>
                          {r.name}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              <div className="w-[180px]">
                <Select
                  placeholder="Semua Kategori"
                  selectedKeys={categoryFilter ? [categoryFilter] : []}
                  onSelectionChange={(keys) => {
                    setCategoryFilter(keys.currentKey ?? '');
                    setPage(1);
                  }}
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item key="kategori-all" id="" aria-label="Filter kategori Semua Kategori">
                        Semua Kategori
                      </ListBox.Item>
                      {categories.map((c) => (
                        <ListBox.Item key={"kategori-" + c.id} id={String(c.id)} aria-label={`Filter kategori ${c.name}`}>
                          {c.name}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ButtonGroup>
                <Button
                  isIconOnly
                  variant={view === 'table' ? 'primary' : 'bordered'}
                  onPress={() => setView('table')}
                >
                  <List size={18} />
                </Button>
                <Button
                  isIconOnly
                  variant={view === 'grid' ? 'primary' : 'bordered'}
                  onPress={() => setView('grid')}
                >
                  <Grid size={18} />
                </Button>
              </ButtonGroup>
              <Button
                onPress={() => window.location.href = '/catalogue/new'}
                variant="primary"
                aria-label='Tambah Kostum'
              >
                Tambah Kostum
              </Button>
            </div>
          </div>

          {/* Bottom info */}
          <p className="text-sm text-[var(--muted)]">
            Ditemukan {total} kostum
          </p>

        </Card.Header>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Spinner aria-label="Memuat data kostum" />
        </div>
      ) : costumes.length === 0 ? (
          <Card.Content className="text-center py-12">
            <Filter size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Tidak ada kostum</h3>
            <p className="text-sm text-[var(--muted)]">Coba ubah filter atau tambahkan kostum baru</p>
          </Card.Content>
      ) : view === 'table' ? (
        <Card>
          <Card.Content>
            <Table aria-label="Katalog kostum">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header>
                    <Table.Column isRowHeader>Nama</Table.Column>
                    <Table.Column>Wilayah</Table.Column>
                    <Table.Column>Kategori</Table.Column>
                    <Table.Column>Stok</Table.Column>
                    <Table.Column>Aksi</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {costumes.map((costume) => (
                      <Table.Row key={costume.id}>
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            {costume.cover_image && (
                              <img src={costume.cover_image} alt="" className="w-10 h-10 object-cover rounded" />
                            )}
                            <span>{costume.name}</span>
                          </div>
                        </Table.Cell>
                        <Table.Cell>{costume.region || '-'}</Table.Cell>
                        <Table.Cell>{costume.category || '-'}</Table.Cell>
                        <Table.Cell>{costume.quantity}</Table.Cell>
                        <Table.Cell>
                          <Button as={Link} to={`/catalogue/${costume.id}`} variant="bordered" size="sm" aria-label={`Detail ${costume.name}`}>
                            Detail
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {costumes.map((costume) => (
            <Link to={`/catalogue/${costume.id}`} key={costume.id} className="block" aria-label={`Lihat detail ${costume.name}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" aria-label={`Kostum ${costume.name}`}>
                <Card.Content className="p-0">
                  <div className="aspect-square bg-[var(--border)] relative">
                    {costume.cover_image ? (
                      <img src={costume.cover_image} alt={costume.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[var(--muted)]">No Image</div>
                    )}
                    <Chip size="sm" className="absolute top-2 right-2" variant={conditionColors[costume.condition] === 'success' ? 'secondary' : conditionColors[costume.condition] === 'warning' ? 'secondary' : 'danger-soft'}>
                      {costume.condition}
                    </Chip>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium truncate">{costume.name}</h3>
                    <p className="text-xs text-[var(--muted)] truncate">
                      {costume.region} {costume.category && `• ${costume.category}`}
                    </p>
                    <p className="text-xs text-[var(--muted)]">Stok: {costume.quantity}</p>
                  </div>
                </Card.Content>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination aria-label="Navigasi halaman" total={totalPages} page={page} onChange={setPage} />
        </div>
      )}
    
    </Card>
  );
};

export default CataloguePage;