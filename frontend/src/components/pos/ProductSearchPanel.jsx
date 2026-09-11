/**
 * components/pos/ProductSearchPanel.jsx
 * POS product search with debounce and barcode scanner integration.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Package, AlertTriangle } from 'lucide-react';
import { Badge, Spinner } from '../ui';
import api from '../../services/api';

const ProductSearchPanel = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const searchInputRef = useRef(null);
  const barcodeBuffer = useRef('');
  const barcodeTimeout = useRef(null);

  // Focus search input on mount and F2 key
  useEffect(() => {
    searchInputRef.current?.focus();
    
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Barcode scanner listener (listens globally for rapid keypresses)
  useEffect(() => {
    const handleScanner = (e) => {
      // Ignore if typing in an input (other than our search bar)
      if (e.target.tagName === 'INPUT' && e.target !== searchInputRef.current) return;
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 3) {
          // It's a scanned barcode
          searchProduct(barcodeBuffer.current, true);
        }
        barcodeBuffer.current = '';
        return;
      }
      
      // Accumulate keys
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        clearTimeout(barcodeTimeout.current);
        barcodeTimeout.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 100); // 100ms timeout for human typing vs scanner speed
      }
    };

    window.addEventListener('keydown', handleScanner);
    return () => window.removeEventListener('keydown', handleScanner);
  }, []);

  const searchProduct = useCallback(async (searchTerm, isBarcode = false) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const endpoint = isBarcode 
        ? `/products/search?barcode=${encodeURIComponent(searchTerm)}`
        : `/products/search?q=${encodeURIComponent(searchTerm)}`;
        
      const res = await api.get(endpoint);
      
      if (isBarcode && res.data.length === 1) {
        // Auto-select if barcode finds exactly one product
        onSelect(res.data[0]);
        setQuery('');
        setResults([]);
      } else {
        setResults(res.data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [onSelect]);

  // Debounce text search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() && !barcodeBuffer.current) {
        searchProduct(query);
      } else if (!query.trim()) {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, searchProduct]);

  return (
    <div className="flex flex-col h-full bg-surface border border-divider rounded-xl overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-divider bg-surface-hover">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-content-muted" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results.length > 0) {
                e.preventDefault();
                onSelect(results[0]);
                setQuery('');
                setResults([]);
              }
            }}
            placeholder="Scan Barcode or Search by Name/SKU (F2)"
            className="w-full bg-background border border-divider rounded-lg py-3 pl-11 pr-4 text-content placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-lg"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-2">
        {results.length === 0 && query.trim() && !loading && (
          <div className="p-6 text-center text-content-muted flex flex-col items-center">
            <Package className="h-10 w-10 mb-3 opacity-20" />
            <p>No products found for "{query}"</p>
          </div>
        )}

        <div className="space-y-1.5">
          {results.map((product) => (
            <button
              key={product._id}
              onClick={() => {
                onSelect(product);
                setQuery('');
                setResults([]);
                searchInputRef.current?.focus();
              }}
              disabled={product.stock < 1}
              className={`w-full flex items-start text-left p-3 rounded-xl border transition-all ${
                product.stock < 1 
                  ? 'border-red-900/30 bg-red-900/10 opacity-75 cursor-not-allowed' 
                  : 'border-transparent hover:border-divider hover:bg-surface-hover'
              }`}
            >
              <div className="flex-1 pr-4">
                <h4 className="font-medium text-content line-clamp-1">{product.name}</h4>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="text-content-muted font-mono">{product.sku}</span>
                  <span className="text-primary-400 font-medium">₹{product.sellingPrice}</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                {product.stock < 1 ? (
                  <Badge variant="danger" size="xs">Out of Stock</Badge>
                ) : product.stock <= product.minStock ? (
                  <Badge variant="warning" size="xs">Low: {product.stock}</Badge>
                ) : (
                  <Badge variant="success" size="xs">Stock: {product.stock}</Badge>
                )}
                <span className="text-xs text-content-muted mt-1">GST: {product.gstRate}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductSearchPanel;
