import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCostumes, getRegions, getCategories } from '../api/costumeApi';
import { Plus, Search, Grid, List, Filter } from 'lucide-react';
import {
  Input, Button, ButtonGroup, Select, SelectItem,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Spinner, Pagination, Card, CardBody
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Katalog Kostum</h1>
        <Button as={Link} to="/catalogue/new" color="primary" startContent={<Plus size={18} />}>
          Tambah Kostum
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari kostum..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          startContent={<Search size={18} />}
          className="w-64"
        />
        <Select
          placeholder="Semua Wilayah"
          selectedKeys={regionFilter ? [String(regionFilter)] : []}
          onSelectionChange={(keys) => { setRegionFilter([...keys][0] ?? ''); setPage(1); }}
          className="w-40"
        >
          <SelectItem key="">Semua Wilayah</SelectItem>
          {regions.map((r) => (
            <SelectItem key={String(r.id)}>{r.name}</SelectItem>
          ))}
        </Select>
        <Select
          placeholder="Semua Kategori"
          selectedKeys={categoryFilter ? [String(categoryFilter)] : []}
          onSelectionChange={(keys) => { setCategoryFilter([...keys][0] ?? ''); setPage(1); }}
          className="w-40"
        >
          <SelectItem key="">Semua Kategori</SelectItem>
          {categories.map((c) => (
            <SelectItem key={String(c.id)}>{c.name}</SelectItem>
          ))}
        </Select>
        <ButtonGroup>
          <Button isIconOnly variant={view === 'table' ? 'solid' : 'bordered'} onPress={() => setView('table')}>
            <List size={18} />
          </Button>
          <Button isIconOnly variant={view === 'grid' ? 'solid' : 'bordered'} onPress={() => setView('grid')}>
            <Grid size={18} />
          </Button>
        </ButtonGroup>
      </div>

      <p className="text-sm text-[var(--muted)]">Ditemukan {total} kostum</p>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Spinner />
        </div>
      ) : costumes.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Filter size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Tidak ada kostum</h3>
            <p className="text-sm text-[var(--muted)]">Coba ubah filter atau tambahkan kostum baru</p>
          </CardBody>
        </Card>
      ) : view === 'table' ? (
        <Card>
          <CardBody>
            <Table>
              <TableHeader>
                <TableColumn>Nama</TableColumn>
                <TableColumn>Wilayah</TableColumn>
                <TableColumn>Kategori</TableColumn>
                <TableColumn>Kondisi</TableColumn>
                <TableColumn>Stok</TableColumn>
                <TableColumn>Aksi</TableColumn>
              </TableHeader>
              <TableBody>
                {costumes.map((costume) => (
                  <TableRow key={costume.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {costume.cover_image && (
                          <img src={costume.cover_image} alt="" className="w-10 h-10 object-cover rounded" />
                        )}
                        <span>{costume.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{costume.region || '-'}</TableCell>
                    <TableCell>{costume.category || '-'}</TableCell>
                    <TableCell>
                      <Chip size="sm" color={conditionColors[costume.condition] ?? 'default'}>
                        {costume.condition}
                      </Chip>
                    </TableCell>
                    <TableCell>{costume.quantity}</TableCell>
                    <TableCell>
                      <Button as={Link} to={`/catalogue/${costume.id}`} variant="bordered" size="sm">
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {costumes.map((costume) => (
            <Link to={`/catalogue/${costume.id}`} key={costume.id} className="block">
              <Card isHoverable isPressable>
                <CardBody className="p-0">
                  <div className="aspect-square bg-[var(--border)] relative">
                    {costume.cover_image ? (
                      <img src={costume.cover_image} alt={costume.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[var(--muted)]">No Image</div>
                    )}
                    <Chip size="sm" className="absolute top-2 right-2" color={conditionColors[costume.condition] ?? 'default'}>
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
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination total={totalPages} page={page} onChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default CataloguePage;