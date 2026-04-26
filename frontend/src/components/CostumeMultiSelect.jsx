import { useState, useEffect, useRef } from 'react';
import { searchCostumes } from '../api/costumeApi';
import { X, Search, Minus, Plus } from 'lucide-react';
import './CostumeMultiSelect.css';

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
    console.log('CostumeMultiSelect handleSelect:', costume);
    const newItem = { 
      costume_id: costume.id, 
      costume: costume, 
      quantity: 1 
    };
    console.log('Adding item:', newItem);
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
      console.error('Failed to fetch costumes:', error);
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
    <div className="costume-multi-select" ref={dropdownRef}>
      <div className="search-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="form-input"
          placeholder="Cari kostum..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={handleFocus}
          onClick={handleClearAndSearch}
        />
      </div>

      {error && <span className="error-text">{error}</span>}

      {showDropdown && results.length > 0 && (
        <div className="costume-dropdown">
          {results.map((costume) => (
            <div
              key={costume.id}
              className="costume-option"
              onClick={() => handleSelect(costume)}
            >
              <div className="costume-option-info">
                <span className="costume-name">{costume.name}</span>
                <span className="costume-stock">Stok: {costume.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="selected-costumes">
          {value.map((item) => (
            <div key={item.costume_id} className="selected-item">
              <div className="selected-info">
                {item.costume?.cover_image && (
                  <img src={item.costume.cover_image} alt="" className="item-thumb" />
                )}
                <span className="item-name">{item.costume?.name || `Costume #${item.costume_id}`}</span>
              </div>
              <div className="quantity-control">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item.costume_id, -1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={14} />
                </button>
                <span className="quantity-value">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item.costume_id, 1)}
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => handleRemove(item.costume_id)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CostumeMultiSelect;