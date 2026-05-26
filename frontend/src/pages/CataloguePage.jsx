import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCostumes, getRegions, getCategories } from '../api/costumeApi';
import { Search, Grid, List, Filter, AlignLeft } from 'lucide-react';
import {
  Input, Button, ButtonGroup, Separator,
  Label, ListBox, Select,
  Spinner, Card
} from '@heroui/react';
import CostumeTableView from '../components/CostumeTableView';
import CostumeListView from '../components/CostumeListView';
import CostumeCardView from '../components/CostumeCardView';
import CustomPagination from '../components/CustomPagination';

const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth < 640;

const CataloguePage = () => {
  const navigate = useNavigate();
  const [costumes, setCostumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => (isMobileViewport() ? 'grid' : 'list'));
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedKeys, setExpandedKeys] = useState(new Set([]));
  const [isMobile, setIsMobile] = useState(isMobileViewport);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = isMobileViewport();
      setIsMobile(mobile);

      if (!mobile) {
        setIsMobileFiltersOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchCostumes();
  }, [debouncedSearch, regionFilter, categoryFilter, page, limit]);

  const fetchFilters = async () => {
    try {
      const [regionsRes, categoriesRes] = await Promise.all([
        getRegions(),
        getCategories(),
      ]);
      setRegions(regionsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  };

  const fetchCostumes = async () => {
    setLoading(true);
    try {
      const response = await getCostumes({
        search: debouncedSearch,
        region_id: regionFilter,
        category_id: categoryFilter,
        page,
        limit,
      });
      const uniqueCostumes = [];
      const seenNames = new Set();
      for (const costume of response.data.data || []) {
        const key = String(costume.name || '').trim().toLowerCase();
        if (debouncedSearch.trim() && seenNames.has(key)) {
          continue;
        }
        seenNames.add(key);
        uniqueCostumes.push(costume);
      }

      const data = uniqueCostumes.map((c) => ({
        ...c,
        children: [{
          id: `detail-${c.id}`,
          name: c.name,
          description: c.description,
          region: c.region,
          category: c.category,
          quantity: c.quantity,
          cover_image: c.cover_image,
          acquired_at: c.acquired_at,
        }],
      }));
      setCostumes(data);
      setTotalPages(debouncedSearch.trim() ? 1 : response.data.total_pages || 1);
      setTotal(debouncedSearch.trim() ? data.length : response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch costumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandedChange = (keys) => {
    setExpandedKeys(keys);
  };

  const showFilterControls = !isMobile || isMobileFiltersOpen;

  return (
    <Card>
      <Card.Header className="flex flex-col gap-4 px-6 py-5">
        {/* Title + Add button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold">Katalog Kostum</h1>
          <Button
            onPress={() => navigate('/catalogue/new')}
             variant="primary"
             aria-label="Tambah Kostum"
           >
            Tambah Kostum
          </Button>
        </div>

        <Separator />

        {/* Filters + View toggle */}
        <div className="flex flex-col gap-3 w-full">
          {isMobile && (
            <Button
              variant="outline"
              className="sm:hidden w-full justify-center"
              aria-label={isMobileFiltersOpen ? 'Sembunyikan filter katalog' : 'Buka filter katalog'}
              onPress={() => setIsMobileFiltersOpen((open) => !open)}
            >
              <Filter size={16} />
              {isMobileFiltersOpen ? 'Sembunyikan Filter' : 'Buka Filter'}
            </Button>
          )}

          {showFilterControls && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
              <Input
                placeholder="Cari kostum..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                aria-label="Cari kostum"
                className="w-full sm:w-[200px]"
              />
              <Select
                placeholder="Semua Wilayah"
                value={regionFilter || null}
                onChange={(key) => {
                  setRegionFilter(key ? String(key) : '');
                  setPage(1);
                }}
                className="w-full sm:w-[160px]"
                aria-label="Filter Wilayah"
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="" textValue="Semua Wilayah">
                      Semua Wilayah
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {regions.map((r) => (
                      <ListBox.Item key={String(r.id)} id={String(r.id)} textValue={r.name}>
                        {r.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <Select
                placeholder="Semua Kategori"
                value={categoryFilter || null}
                onChange={(key) => {
                  setCategoryFilter(key ? String(key) : '');
                  setPage(1);
                }}
                className="w-full sm:w-[160px]"
                aria-label="Filter Kategori"
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="" textValue="Semua Kategori">
                      Semua Kategori
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {categories.map((c) => (
                      <ListBox.Item key={String(c.id)} id={String(c.id)} textValue={c.name}>
                        {c.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <div className="flex-1" />

              <ButtonGroup>
                <Button
                  isIconOnly
                  variant={view === 'list' ? 'primary' : 'outline'}
                  aria-label="Tampilkan tampilan list"
                  onPress={() => setView('list')}
                >
                  <AlignLeft size={18} />
                </Button>
                <Button
                  isIconOnly
                  variant={view === 'table' ? 'primary' : 'outline'}
                  aria-label="Tampilkan tampilan tabel"
                  onPress={() => setView('table')}
                >
                  <List size={18} />
                </Button>
                <Button
                  isIconOnly
                  variant={view === 'grid' ? 'primary' : 'outline'}
                  aria-label="Tampilkan tampilan grid"
                  onPress={() => setView('grid')}
                >
                  <Grid size={18} />
                </Button>
              </ButtonGroup>
            </div>
          )}
        </div>
        

        <Separator />
      </Card.Header>
      
      <Card.Content>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner aria-label="Memuat data kostum" />
          </div>
        ) : costumes.length === 0 ? (
          <div className="text-center py-12">
            <Filter size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Tidak ada kostum</h3>
            <p className="text-sm text-[var(--muted)]">Coba ubah filter atau tambahkan kostum baru</p>
          </div>
        ) : view === 'list' ? (
          <CostumeListView
            costumes={costumes}
            expandedKeys={expandedKeys}
            onExpandedChange={handleExpandedChange}
          />
        ) : view === 'table' ? (
          <CostumeTableView
            costumes={costumes}
            expandedKeys={expandedKeys}
            onExpandedChange={handleExpandedChange}
          />
        ) : (
          <CostumeCardView costumes={costumes} />
        )}
      </Card.Content>

      <Card.Footer>
        <CustomPagination
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      </Card.Footer>
    </Card>
  );
};

export default CataloguePage;
