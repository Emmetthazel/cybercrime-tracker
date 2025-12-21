import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import Layout from '../Common/Layout';
import SearchBar from './SearchBar';
import FilterSidebar from './FilterSidebar';
import SearchResults from './SearchResults';
import { searchService } from '../../services/searchService';
import './SearchPage.css';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const performSearch = useCallback(async (query, currentFilters) => {
    if (!query && Object.keys(currentFilters).length === 0) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchParams = {
        q: query,
        resourceType: 'all',
        ...currentFilters
      };

      const data = await searchService.unifiedSearch(searchParams);
      setResults({
        attacks: data.attacks || [],
        ips: data.ips || []
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Search failed';
      setError(errorMsg);
      toast.error(errorMsg);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    performSearch(query, filters);
  }, [filters, performSearch]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    performSearch(searchQuery, newFilters);
  }, [searchQuery, performSearch]);

  const handleAttackClick = (attack) => {
    // Navigate to attack detail page or show details
    console.log('Attack clicked:', attack);
    toast.info(`Viewing attack: ${attack.type}`);
  };

  const handleIPClick = (ip) => {
    // Navigate to IP detail page or show details
    console.log('IP clicked:', ip);
    toast.info(`Viewing IP: ${ip.ip_address}`);
  };

  return (
    <Layout>
      <div className="search-page">
      <div className="search-page-header">
        <h1>Advanced Search</h1>
        <p className="search-page-subtitle">
          Search across attacks, IPs, and threat intelligence
        </p>
      </div>

      <div className="search-page-content">
        <div className="search-page-main">
          <div className="search-controls">
            <div className="search-bar-container">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search attacks, IPs, descriptions, threat actors..."
                autoFocus
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            >
              {showFilters ? '✓ Hide Filters' : '⚙️ Show Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="filter-container">
              <FilterSidebar
                filters={filters}
                onChange={handleFilterChange}
                onClose={() => setShowFilters(false)}
              />
            </div>
          )}

          <SearchResults
            results={results}
            loading={loading}
            error={error}
            onAttackClick={handleAttackClick}
            onIPClick={handleIPClick}
          />
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default SearchPage;

