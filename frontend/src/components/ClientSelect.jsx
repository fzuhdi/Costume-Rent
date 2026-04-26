import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchClients } from '../api/clientApi';
import { X, User } from 'lucide-react';
import './ClientSelect.css';

const ClientSelect = ({ value, onChange, error }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchClients = async () => {
    try {
      const response = await searchClients(search, 10);
      setResults(response.data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Failed to search clients:', error);
    }
  };

  const handleSelect = (client) => {
    setSelectedClient(client);
    setSearch(client.name);
    setShowDropdown(false);
    setIsCreating(false);
    onChange({ type: 'existing', client });
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedClient(null);
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
    <div className="client-select" ref={dropdownRef}>
      <div className="client-select-input-wrapper">
        <User size={18} className="input-icon" />
        <input
          ref={inputRef}
          type="text"
          className={`form-input ${error ? 'input-error' : ''}`}
          placeholder="Cari atau ketik nama klien..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedClient(null);
            setIsCreating(false);
          }}
          onFocus={() => search.length >= 2 && setShowDropdown(true)}
        />
        {(selectedClient || isCreating) && (
          <button className="clear-btn" onClick={handleClear}>
            <X size={16} />
          </button>
        )}
      </div>

      {error && <span className="error-text">{error}</span>}

      {showDropdown && results.length > 0 && (
        <div className="client-dropdown">
          {results.map((client) => (
            <div
              key={client.id}
              className="client-option"
              onClick={() => handleSelect(client)}
            >
              <div className="client-option-info">
                <span className="client-name">{client.name}</span>
                {client.phone && (
                  <span className="client-phone">{client.phone}</span>
                )}
              </div>
            </div>
          ))}
          {search.length >= 2 && !results.some(c => 
            c.name.toLowerCase() === search.toLowerCase()
          ) && (
            <div
              className="client-option create-option"
              onClick={handleCreateNew}
            >
              <span className="create-icon">+</span>
              <span>Buat klien baru: "{search}"</span>
            </div>
          )}
        </div>
      )}

      {showDropdown && search.length >= 2 && results.length === 0 && (
        <div className="client-dropdown">
          <div
            className="client-option create-option"
            onClick={handleCreateNew}
          >
            <span className="create-icon">+</span>
            <span>Buat klien baru: "{search}"</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSelect;