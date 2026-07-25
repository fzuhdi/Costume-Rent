import { useState, useEffect } from 'react';
import { Collection, ComboBox, Input, Label, ListBox, Spinner } from '@heroui/react';

import { searchClients } from '@/api/clientApi';

const ClientSelect = ({ value, onChange, error }) => {
  const [filterText, setFilterText] = useState('');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!filterText || filterText.length < 1) {
        setItems([]);
        return;
      }
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        if (controller.signal.aborted) return;
        const response = await searchClients(filterText, 10, { signal: controller.signal });
        setItems(response.data || []);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        setItems([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [filterText]);

  // Sync external value to filterText when it resets or changes from outside
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (!value) {
      setFilterText('');
    } else if (value.type === 'existing' && value.client?.name && value.client.name !== filterText) {
      setFilterText(value.client.name);
    }
  }

  const handleSelect = (key) => {
    if (!key) return;
    if (key === 'NEW_CLIENT') {
      onChange({ type: 'new', name: filterText });
      return;
    }
    const client = items.find(c => String(c.id) === String(key));
    if (!client) return;
    setFilterText(client.name);
    onChange({ type: 'existing', client });
  };

  const handleInputChange = (val) => {
    setFilterText(val);
    if (!val) {
      onChange(null);
    } else {
      if (value && value.type === 'new' && val !== value.name) {
        onChange(null);
      } else if (value && value.type === 'existing' && val !== value.client?.name) {
        onChange(null);
      }
    }
  };

  const canCreate = filterText.length >= 1 && !isLoading && !items.some(c => c.name.toLowerCase() === filterText.toLowerCase());
  const displayItems = [...items];
  if (canCreate) {
    displayItems.push({ id: 'NEW_CLIENT', name: `+ Tambah klien baru: "${filterText}"`, isNew: true });
  }

  // Only show popover when user has typed something
  const shouldShowPopover = filterText.length >= 1;

  return (
    <div className="flex flex-col gap-1 w-full">
      <ComboBox
        allowsEmptyCollection={shouldShowPopover}
        allowsCustomValue
        inputValue={filterText}
        onInputChange={handleInputChange}
        onSelectionChange={handleSelect}
        isInvalid={!!error}
        errorMessage={error}
        aria-label="Pilih atau Ketik Nama Klien"
        className="w-full"
      >
        <Label>Klien</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Cari klien lama atau ketik nama klien baru..." className="w-full" />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>

        {shouldShowPopover && (
          <ComboBox.Popover>
            <ListBox
              renderEmptyState={() => {
                if (isLoading) {
                  return (
                    <div className="flex items-center gap-2 px-3 py-3 text-sm text-[var(--muted)]">
                      <Spinner size="sm" />
                      <span>Mencari klien...</span>
                    </div>
                  );
                }
                return null;
              }}
            >
              <Collection items={displayItems}>
                {(client) => (
                  <ListBox.Item
                    id={String(client.id)}
                    textValue={client.isNew ? filterText : client.name}
                  >
                    {client.isNew ? (
                      <div className="flex items-center gap-2 text-primary font-medium py-0.5">
                        <span className="text-lg font-bold">+</span>
                        <span>Tambah klien baru: <strong>&quot;{filterText}&quot;</strong></span>
                      </div>
                    ) : (
                      <div className="flex flex-col py-0.5">
                        <span className="text-sm font-medium">{client.name}</span>
                        {client.phone && (
                          <span className="text-xs text-[var(--muted)]">{client.phone}</span>
                        )}
                      </div>
                    )}
                  </ListBox.Item>
                )}
              </Collection>
            </ListBox>
          </ComboBox.Popover>
        )}
      </ComboBox>
    </div>
  );
};

export default ClientSelect;