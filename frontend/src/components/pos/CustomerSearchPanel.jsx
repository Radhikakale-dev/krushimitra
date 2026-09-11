import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X } from 'lucide-react';
import api from '../../services/api';

const CustomerSearchPanel = ({ customer, setCustomer }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchCustomer(query);
      } else {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const searchCustomer = async (searchTerm) => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/search?q=${encodeURIComponent(searchTerm)}`);
      setResults(res.data || []);
      setShowDropdown(true);
    } catch (err) {
      console.error('Customer search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (customer) {
    return (
      <div className="bg-surface border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <User className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">{customer.name}</p>
            <p className="text-xs text-content-muted">{customer.phone} • Limit: ₹{customer.creditLimit || 0}</p>
          </div>
        </div>
        <button 
          onClick={() => { setCustomer(null); setQuery(''); }}
          className="p-1.5 rounded-lg text-content-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative z-20" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-content-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          placeholder="Search customer by name or phone..."
          className="w-full bg-surface border border-divider rounded-xl py-3 pl-10 pr-4 text-content focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-slate-500 border-t-primary-500 rounded-full animate-spin"></div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-divider rounded-xl shadow-card overflow-hidden max-h-60 overflow-y-auto">
          {results.map(c => (
            <button
              key={c._id}
              onClick={() => {
                setCustomer(c);
                setShowDropdown(false);
                setQuery('');
              }}
              className="w-full text-left p-3 border-b border-divider hover:bg-surface-hover transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-content">{c.name}</p>
                <p className="text-xs text-content-muted">{c.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-content-muted">Due: <span className="text-red-400">₹{c.outstandingBalance || 0}</span></p>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {showDropdown && query.trim() && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-divider rounded-xl p-4 text-center">
          <p className="text-content-muted text-sm">No customers found</p>
        </div>
      )}
    </div>
  );
};

export default CustomerSearchPanel;
