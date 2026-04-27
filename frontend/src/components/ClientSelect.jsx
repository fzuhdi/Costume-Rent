import { useState, useEffect, useRef } from 'react';
import { searchClients } from '../api/clientApi';
import { X, User } from 'lucide-react';
import { Autocomplete, AutocompleteItem } from '@heroui/react';

const ClientSelect = ({ value, onChange, error }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
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
    setSelectedClient(client);
    setSearch(client.name);
    setIsOpen(false);
    setIsCreating(false);
    onChange({ type: 'existing', client });
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedClient(null);
    setIsOpen(false);
    onChange({ type: 'new', name: search });
  };

  const handleClear = () => {
    setSelectedClient(null);
    setSearch('');
    setResults([]);
    setIsCreating(false);
    onChange(null);
  };

  return (
    <div>
      <Autocomplete
        inputValue={search}
        onInputChange={setSearch}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        items={results}
        placeholder="Cari atau ketik nama klien..."
        errorMessage={error}
        classNames={{
          trigger: 'group',
        }}
      >
        {(item) => (
          <AutocompleteItem
            key={item.id}
            onPress={() => handleSelect(item)}
          >
            <div className="flex flex-col">
              <span className="text-sm">{item.name}</span>
              {item.phone && (
                <span className="text-xs text-[var(--muted)]">{item.phone}</span>
              )}
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>
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