import React, { useState, useEffect, useRef } from 'react';
import { Collection, ComboBox, Input, Label, ListBox, Spinner } from '@heroui/react';
import { useAsyncList } from '@react-stately/data';
import { searchClients } from '../api/clientApi';

const ClientSelect = ({ value, onChange, error }) => {
  const [isCreating, setIsCreating] = useState(value?.type === 'new' || false);

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
      setIsCreating(false);
    } else if (value && value.name && value.name !== list.filterText) {
      list.setFilterText(value.name);
      if (value.type === 'new') setIsCreating(true);
      else setIsCreating(false);
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
          <div className="flex items-center justify-between px-3 py-2 rounded-lg
                          bg-default-100 border border-default-200">
            <span className="text-sm text-default-700">
              Klien baru: <strong className="font-semibold text-default-900">{list.filterText}</strong>
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-default-400 hover:text-default-800 ml-2"
            >
              ✕
            </button>
          </div>
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
                      <button
                        type="button"
                        onClick={handleCreateNew}
                        className="flex w-full items-center gap-2 px-3 py-3
                                   text-left hover:bg-[var(--border)] transition-colors"
                      >
                        <span className="text-base font-bold text-[var(--primary)]">+</span>
                        <span className="text-sm">
                          Buat klien baru: <strong>"{list.filterText}"</strong>
                        </span>
                      </button>
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
        <button
          type="button"
          onClick={handleCreateNew}
          className="flex w-full items-center gap-2 px-3 py-2 mt-1 rounded-lg
                     text-left bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
        >
          <span className="text-base font-bold">+</span>
          <span className="text-sm font-semibold">
            Tambah Klien Baru: "{list.filterText}"
          </span>
        </button>
      )}
    </div>
  );
};

export default ClientSelect;