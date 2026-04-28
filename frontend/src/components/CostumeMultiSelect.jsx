import { useState, useEffect, useRef } from 'react';
import { searchCostumes } from '../api/costumeApi';
import { X, Search, Minus, Plus } from 'lucide-react';
import { Input, Button, Chip } from '@heroui/react';

const CostumeMultiSelect = ({ value = [], onChange, error }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2) {
        fetchCostumes();
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCostumes = async (forceShow = false) => {
    try {
      const response = await searchCostumes(search, 10);
      const filtered = response.data.filter(c =>
        !value.some(v => v.costume_id === c.id)
      );
      setResults(filtered);
      if (filtered.length > 0 || forceShow) {
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Failed to search costumes:', error);
    }
  };

  const handleFocus = () => {
    if (search.length >= 2) {
      setShowDropdown(true);
    } else {
      fetchCostumes(true);
    }
  };

  const handleSelect = (costume) => {
    const newItem = {
      costume_id: costume.id,
      costume: costume,
      quantity: 1
    };
    onChange([...value, newItem]);
    setSearch('');
    setShowDropdown(false);
  };

  const handleClearAndSearch = async () => {
    setSearch('');
    setShowDropdown(false);
    try {
      const response = await searchCostumes('', 10);
      const filtered = response.data.filter(c =>
        !value.some(v => v.costume_id === c.id)
      );
      setResults(filtered);
      setShowDropdown(true);
    } catch (error) {
      console.error('Failed to search costumes:', error);
    }
  };

  const handleQuantityChange = (costumeId, delta) => {
    const updated = value.map(item => {
      if (item.costume_id === costumeId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    onChange(updated);
  };

  const handleRemove = (costumeId) => {
    onChange(value.filter(item => item.costume_id !== costumeId));
  };

  return (
    <div ref={dropdownRef}>
      <Input
        type="text"
        placeholder="Cari kostum..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={handleFocus}
        onClick={handleClearAndSearch}
        startContent={<Search size={18} />}
        className="mb-2"
      />

      {error && <span className="text-danger text-sm">{error}</span>}

      {showDropdown && results.length > 0 && (
        <div className="border border-[var(--border)] rounded-lg shadow-lg p-1 max-h-48 overflow-y-auto mb-2">
          {results.map((costume) => (
            <div
              key={costume.id}
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[var(--border)]"
              onClick={() => handleSelect(costume)}
            >
              <div className="flex flex-col">
                <span className="text-sm">{costume.name}</span>
                <span className="text-xs text-[var(--muted)]">Stok: {costume.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((item) => (
            <div key={item.costume_id} className="flex items-center gap-3 p-2 border border-[var(--border)] rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                {item.costume?.cover_image && (
                  <img src={item.costume.cover_image} alt="" className="w-10 h-10 object-cover rounded" />
                )}
                <span className="text-sm">{item.costume?.name || `Costume #${item.costume_id}`}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant="bordered"
                  onPress={() => handleQuantityChange(item.costume_id, -1)}
                  isDisabled={item.quantity <= 1}
                >
                  <Minus size={14} />
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="bordered"
                  onPress={() => handleQuantityChange(item.costume_id, 1)}
                >
                  <Plus size={14} />
                </Button>
                <Chip
                  variant="secondary"
                  onClose={() => handleRemove(item.costume_id)}
                  className="cursor-pointer"
                >
                  <X size={14} />
                </Chip>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CostumeMultiSelect;