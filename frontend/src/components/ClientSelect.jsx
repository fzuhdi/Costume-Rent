import React, { useState, useEffect } from 'react';
import { Collection, ComboBox, Input, Label, ListBox, Spinner, Button, Chip } from '@heroui/react';
import { useAsyncList } from '@react-stately/data';
import { searchClients } from '../api/clientApi';

const ClientSelect = ({ value, onChange, error }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isCreating, setIsCreating] = useState(value?.type === 'new' || false);

  if (value !== prevValue) {
    setPrevValue(value);
    setIsCreating(value?.type === 'new' || false);
  }

  const list = useAsyncList({
    async load({ filterText, signal }) {
      if (!filterText || filterText.length < 1) return { items: [] };
      await new Promise(resolve => setTimeout(resolve, 500));
      if (signal.aborted) return { items: [] };

      try {
        const response = await searchClients(filterText, 10, { signal });
        return { items: response.data || [] };
      } catch (err) {
        if (err?.name === 'AbortError') return { items: [] };
        console.error('Failed to search clients:', err);
        return { items: [] };
      }
    },
  });

  const prevValueRef = React.useRef(value);
  useEffect(() => {
    if (value === prevValueRef.current) return;
    prevValueRef.current = value;

    if (!value && list.filterText !== '') {
      list.setFilterText('');
    } else if (value && value.name && value.name !== list.filterText) {
      list.setFilterText(value.name);
    }
  }, [value, list.filterText, list.setFilterText]);

  const handleSelect = (key) => {
    if (!key) return;
    const client = list.items.find(c => String(c.id) === String(key));
    if (!client) return;
    list.setFilterText(client.name);
    setIsCreating(false);
    onChange({ type: 'existing', client });
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    onChange({ type: 'new', name: list.filterText });
    // Don't clear filterText — we need it for the confirm pill display
  };

  const handleClear = () => {
    list.setFilterText('');
    setIsCreating(false);
    onChange(null);
  };

  const canCreate =
    list.filterText.length >= 1 &&
    !isCreating &&
    !list.isLoading &&
    !list.items.some(c => c.name.toLowerCase() === list.filterText.toLowerCase());

  // Only show popover when user has typed something AND not in creating state
  const shouldShowPopover = list.filterText.length >= 1 && !isCreating;

  return (
    <div className="flex flex-col gap-1">
      {/* When creating, show plain input-like display instead of ComboBox
          to avoid the empty popover flash problem entirely */}
      {isCreating ? (
        <div className="flex flex-col gap-1">
          <Label className="text-sm font-medium">Klien</Label>
          <Chip 
            onClose={handleClear} 
            radius="sm" 
            classNames={{
              base: "w-full justify-between px-3 py-4 bg-default-100 border border-default-200 h-auto",
              content: "text-sm text-default-700 font-normal w-full"
            }}
          >
            Klien baru: <strong className="font-semibold text-default-900">{list.filterText}</strong>
          </Chip>
        </div>
      ) : (
        <ComboBox
          allowsEmptyCollection={shouldShowPopover}
          allowsCustomValue
          inputValue={list.filterText}
          onInputChange={(val) => {
            list.setFilterText(val);
            if (!val) onChange(null);
          }}
          onSelectionChange={handleSelect}
          isInvalid={!!error}
          errorMessage={error}
          aria-label="Pilih Klien"
          className="w-full"
        >
          <Label>Klien</Label>
          <ComboBox.InputGroup>
            <Input placeholder="Cari atau ketik nama klien..." />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>

          {shouldShowPopover && (
            <ComboBox.Popover>
              <ListBox
                renderEmptyState={() => {
                  if (list.isLoading) {
                    return (
                      <div className="flex items-center gap-2 px-3 py-3 text-sm text-[var(--muted)]">
                        <Spinner size="sm" />
                        <span>Memuat...</span>
                      </div>
                    );
                  }
                  if (canCreate) {
                    return (
                      <Button
                        variant="light"
                        onPress={handleCreateNew}
                        className="w-full justify-start h-auto py-3 px-3 rounded-none bg-transparent hover:bg-[var(--border)]"
                      >
                        <span className="text-base font-bold text-[var(--primary)]">+</span>
                        <span className="text-sm">
                          Buat klien baru: <strong>&quot;{list.filterText}&quot;</strong>
                        </span>
                      </Button>
                    );
                  }
                  return null;
                }}
              >
                <Collection items={list.items}>
                  {(client) => (
                    <ListBox.Item
                      id={String(client.id)}
                      textValue={client.name}
                    >
                      <div className="flex flex-col py-0.5">
                        <span className="text-sm font-medium">{client.name}</span>
                        {client.phone && (
                          <span className="text-xs text-[var(--muted)]">{client.phone}</span>
                        )}
                      </div>
                    </ListBox.Item>
                  )}
                </Collection>
              </ListBox>
            </ComboBox.Popover>
          )}
        </ComboBox>
      )}
      {canCreate && !isCreating && (
        <Button
          variant="flat"
          color="primary"
          onPress={handleCreateNew}
          className="w-full justify-start mt-1 bg-primary/10 hover:bg-primary/20 border border-primary/20"
        >
          <span className="text-base font-bold">+</span>
          <span className="text-sm font-semibold">
            Tambah Klien Baru: &quot;{list.filterText}&quot;
          </span>
        </Button>
      )}
    </div>
  );
};

export default ClientSelect;