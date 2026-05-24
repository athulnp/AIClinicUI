import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchFilterProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
  initialValue?: string;
}

export function SearchFilter({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  className = '',
  initialValue = '',
}: SearchFilterProps) {
  const [query, setQuery] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      onSearch(query.trim());
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3 pointer-events-none">
        <Search 
          size={18} 
          className={`transition-colors duration-200 ${
            isSearching ? 'text-[#005d90] animate-pulse' : 'text-[#707881]'
          }`} 
        />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#bfc7d1] bg-white text-sm text-[#191c1d] placeholder:text-[#707881]/70 outline-none transition-all duration-200 hover:border-[#9aa4b0] focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 focus:shadow-md"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 p-1 rounded-md hover:bg-[#f3f4f5] transition-colors duration-200 group"
          title="Clear search"
        >
          <X 
            size={16} 
            className="text-[#707881] group-hover:text-[#ba1a1a] transition-colors duration-200" 
          />
        </button>
      )}
    </div>
  );
}

// Hook for debounced search
export function useDebouncedSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  debounceMs = 300
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredItems(items);
      } else {
        const query = searchQuery.toLowerCase().trim();
        const filtered = items.filter((item) =>
          searchFields.some((field) => {
            const value = item[field];
            if (value == null) return false;
            return String(value).toLowerCase().includes(query);
          })
        );
        setFilteredItems(filtered);
      }
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [items, searchQuery, searchFields, debounceMs]);

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
    isSearching,
  };
}

export default SearchFilter;
