import { Search, Calendar } from 'lucide-react';
import { Select, ListBox, InputGroup, Spinner, Checkbox } from '@heroui/react';
import CostumeCard from '@/components/CostumeCard';

export default function POSCostumeCatalog({
  formData,
  search, setSearch,
  selectedCategory, setSelectedCategory,
  selectedSize, setSelectedSize,
  showOnlyAvailable, setShowOnlyAvailable,
  categories, sizes,
  loadingCostumes,
  filteredCostumes,
  costumes,
  addToCart
}) {
  return (
    <div className="relative flex-1 flex flex-col gap-4">
      {/* Lock Overlay if no date selected */}
      {!formData.event_date && (
        <div className="absolute inset-0 z-20 bg-default-50/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-default-300 min-h-[350px]">
          <div className="bg-primary/10 text-primary p-4 rounded-full mb-3">
            <Calendar size={32} />
          </div>
          <h4 className="font-bold text-lg text-default-800">Tanggal Acara Belum Ditentukan</h4>
          <p className="text-sm text-default-500 max-w-sm mt-1 mb-4">
            Silakan tentukan tanggal acara terlebih dahulu di atas untuk memuat ketersediaan stok pakaian.
          </p>
        </div>
      )}

      <div className={`flex flex-col gap-4 ${!formData.event_date ? 'opacity-30 pointer-events-none' : ''}`}>
        <div className="flex flex-col gap-3 p-1">
          <h3 className="font-bold text-base text-default-800 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
            Pilih Kostum Tersedia
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <InputGroup className="flex-1 w-full !overflow-visible focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200">
              <InputGroup.Prefix>
                <Search size={18} className="text-default-400" />
              </InputGroup.Prefix>
              <InputGroup.Input
                placeholder="Cari Kostum atau Aksesoris..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Cari Kostum"
              />
            </InputGroup>

            <div className="flex gap-2 w-full sm:w-auto">
              <Select
                aria-label="Kategori"
                className="flex-1 sm:w-[160px]"
                selectedKey={selectedCategory}
                onSelectionChange={(key) => setSelectedCategory(key)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Kategori" />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="Semua Kategori">
                      Semua Kategori
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {categories.slice(1).map(cat => (
                      <ListBox.Item key={cat} id={cat} textValue={cat}>
                        {cat}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                aria-label="Ukuran"
                className="flex-1 sm:w-[120px]"
                selectedKey={selectedSize}
                onSelectionChange={(key) => setSelectedSize(key)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Ukuran" />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="Semua Ukuran">
                      Semua Ukuran
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {sizes.slice(1).map(sz => (
                      <ListBox.Item key={sz} id={sz} textValue={sz}>
                        {sz}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <Checkbox 
              isSelected={showOnlyAvailable} 
              onChange={setShowOnlyAvailable} 
              aria-label="Hanya Tampilkan Stok Tersedia"
              className="cursor-pointer"
            >
              <Checkbox.Content className="flex items-center gap-2">
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="text-xs text-default-600 font-medium">Hanya Tampilkan Stok Tersedia</span>
              </Checkbox.Content>
            </Checkbox>

            <span className="text-xs text-default-500 font-medium">
              Menampilkan {filteredCostumes.length} dari {costumes.length} kostum
            </span>
          </div>
        </div>

        <div className="overflow-y-auto">
          {loadingCostumes ? (
            <div className="flex justify-center items-center h-48"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10 items-start">
              {filteredCostumes.map(costume => (
                <CostumeCard
                  key={costume.id}
                  costume={costume}
                  showAvailabilityBadge
                  isDisabled={costume.available_quantity === 0}
                  onClick={() => costume.available_quantity > 0 && addToCart(costume)}
                  actionLabel="Pilih"
                  onAction={() => addToCart(costume)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
