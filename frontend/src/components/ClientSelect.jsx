import { useState, useEffect, useRef } from 'react';
import { searchClients } from '../api/clientApi';
import { X, User } from 'lucide-react';
import { ComboBox, Label, ListBox, Input } from '@heroui/react';

const ClientSelect = ({ value, onChange, error }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2) {
        fetchClients();
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchClients = async (forceShow = false) => {
    try {
      const response = await searchClients(search, 10);
      setResults(response.data || []);
      if (response.data?.length > 0 || forceShow) {
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Failed to search clients:', error);
    }
  };

  const handleSelect = (client) => {
    setSearch(client.name);
    setIsOpen(false);
    setIsCreating(false);
    onChange({ type: 'existing', client });
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setResults([]);
    onChange({ type: 'new', name: search });
  };

  const handleClear = () => {
    setSearch('');
    setResults([]);
    setIsCreating(false);
    onChange(null);
  };

  return (
    <div>
      <ComboBox
        inputValue={search}
        onInputChange={setSearch}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        isInvalid={!!error}
        errorMessage={error}
        selectedKey={value?.client?.id ? String(value.client.id) : null}
      >
        <Label>Cari atau ketik nama klien...</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Cari atau ketik nama klien..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox>
            {results.map((item) => (
              <ListBox.Item
                key={item.id}
                id={String(item.id)}
                textValue={item.name}
                onAction={() => handleSelect(item)}
              >
                <div className="flex flex-col">
                  <span className="text-sm">{item.name}</span>
                  {item.phone && (
                    <span className="text-xs text-[var(--muted)]">{item.phone}</span>
                  )}
                </div>
              </ListBox.Item>
            ))}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      {search.length >= 2 && !results.some(c =>
        c.name.toLowerCase() === search.toLowerCase()
      ) && (
        <div
          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--border)]"
          onClick={handleCreateNew}
        >
          <span className="text-lg font-bold">+</span>
          <span className="text-sm">Buat klien baru: "{search}"</span>
        </div>
      )}
    </div>
  );
};

export default ClientSelect;