"use client";

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@/lib/router-shim';
import { getCostumes, getRegions, getCategories } from '@/api/costumeApi';
import { Grid, List, Filter, AlignLeft, Plus, Download, UploadCloud } from 'lucide-react';
import {
  Input, Button, ButtonGroup, Separator,
  ListBox, Select,
  Spinner, Card, Tooltip
} from '@heroui/react';
import CostumeTableView from '@/components/CostumeTableView';
import CostumeListView from '@/components/CostumeListView';
import CostumeCardView from '@/components/CostumeCardView';
import CustomPagination from '@/components/CustomPagination';
import ExcelImportModal from '@/components/ExcelImportModal';

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
  const [total, setTotal] = useState(0);
  const [expandedKeys, setExpandedKeys] = useState(() => new Set([]));
  const [isMobile, setIsMobile] = useState(isMobileViewport);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleExport = async () => {
    try {
      // For catalogue, the endpoint is public but we still send token if available
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/costumes/excel/export`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalogue_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [regionsRes, categoriesRes] = await Promise.all([
          getRegions(),
          getCategories()
        ]);
        setRegions(Array.isArray(regionsRes.data) ? regionsRes.data : regionsRes.data?.data || []);
        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch filters:', error);
      }
    };
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
        setTotal(response.data.total || 0);
      } catch (error) {
        console.error('Failed to fetch costumes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCostumes();
  }, [debouncedSearch, regionFilter, categoryFilter, page, limit, refreshTrigger]);

  const handleExpandedChange = (keys) => {
    setExpandedKeys(keys);
  };

  const visibleCostumes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return costumes;
    }

    return costumes.filter((costume) =>
      String(costume.name || '').toLowerCase().includes(query)
    );
  }, [costumes, search]);

  const showFilterControls = !isMobile || isMobileFiltersOpen;
  const displayTotal = search.trim() ? visibleCostumes.length : total;

  return (
    <Card>
      <Card.Header className="flex flex-col gap-4 px-6 pt-6 pb-4 border-b border-[var(--border)]">
        {/* Title + Add button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="page-title">Katalog Kostum</h1>
          <div className="flex flex-wrap gap-2">
            <Tooltip content="Eksport Excel">
              <Button isIconOnly onPress={handleExport} variant="outline" aria-label="Eksport">
                <Download size={18} />
              </Button>
            </Tooltip>
            <Tooltip content="Import Excel">
              <Button isIconOnly onPress={() => setIsImportOpen(true)} variant="outline" aria-label="Import">
                <UploadCloud size={18} />
              </Button>
            </Tooltip>
            <Button
              onPress={() => navigate('/admin/catalogue/new')}
              variant="primary"
              startContent={<Plus size={16} />}
              aria-label="Tambah Kostum"
            >
              Tambah Kostum
            </Button>
          </div>
        </div>

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
        ) : visibleCostumes.length === 0 ? (
          <div className="text-center py-12">
            <Filter size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Kostum tidak ditemukan.</h3>
            <p className="text-sm text-[var(--muted)]">Coba ubah filter atau tambahkan kostum baru</p>
          </div>
        ) : view === 'list' ? (
          <CostumeListView
            costumes={visibleCostumes}
            expandedKeys={expandedKeys}
            onExpandedChange={handleExpandedChange}
          />
        ) : view === 'table' ? (
          <CostumeTableView
            costumes={visibleCostumes}
            expandedKeys={expandedKeys}
            onExpandedChange={handleExpandedChange}
          />
        ) : (
          <CostumeCardView costumes={visibleCostumes} />
        )}
      </Card.Content>

      <Card.Footer>
        <CustomPagination
          total={displayTotal}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      </Card.Footer>

      <ExcelImportModal
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Import Katalog"
        templateUrl={`/api/costumes/excel/template`}
        uploadUrl={`/api/costumes/excel/import`}
        onSuccess={() => {
          setRefreshTrigger(prev => prev + 1);
          setPage(1);
          setSearch('');
        }}
      />
    </Card>
  );
};

export default CataloguePage;
