import React, { useState, useEffect } from 'react';
import { searchService } from '../../services/searchService';
import './FilterSidebar.css';

const FilterSidebar = ({ filters, onChange, onClose }) => {
  const [filterOptions, setFilterOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters || {});

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    setLocalFilters(filters || {});
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      setLoading(true);
      const data = await searchService.getFilterOptions();
      setFilterOptions(data.filters);
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    if (onChange) {
      onChange(newFilters);
    }
  };

  const handleMultiSelectChange = (key, value, checked) => {
    const currentValues = localFilters[key] || [];
    let newValues;
    
    if (checked) {
      newValues = Array.isArray(currentValues) 
        ? [...currentValues, value]
        : [value];
    } else {
      newValues = Array.isArray(currentValues)
        ? currentValues.filter(v => v !== value)
        : [];
    }
    
    handleFilterChange(key, newValues.length > 0 ? newValues : undefined);
  };

  const handleClearFilter = (key) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    if (onChange) {
      onChange(newFilters);
    }
  };

  const handleClearAll = () => {
    setLocalFilters({});
    if (onChange) {
      onChange({});
    }
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  if (loading) {
    return (
      <div className="filter-sidebar">
        <div className="filter-sidebar-header">
          <h3>Filters</h3>
          {onClose && (
            <button onClick={onClose} className="filter-close">×</button>
          )}
        </div>
        <div className="filter-loading">Loading filters...</div>
      </div>
    );
  }

  return (
    <div className="filter-sidebar">
      <div className="filter-sidebar-header">
        <h3>Filters</h3>
        <div className="filter-header-actions">
          {hasActiveFilters && (
            <button onClick={handleClearAll} className="filter-clear-all">
              Clear All
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="filter-close">×</button>
          )}
        </div>
      </div>

      <div className="filter-content">
        {/* Search Query */}
        <div className="filter-group">
          <label className="filter-label">Search Query</label>
          <input
            type="text"
            value={localFilters.q || ''}
            onChange={(e) => handleFilterChange('q', e.target.value || undefined)}
            placeholder="Search keywords..."
            className="filter-input"
          />
        </div>

        {/* Date Range */}
        <div className="filter-group">
          <label className="filter-label">Date Range</label>
          <div className="date-range-inputs">
            <input
              type="date"
              value={localFilters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
              className="filter-input"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              value={localFilters.end_date || ''}
              onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
              className="filter-input"
            />
          </div>
        </div>

        {/* Attack Type */}
        {filterOptions?.attackTypes && (
          <div className="filter-group">
            <label className="filter-label">Attack Type</label>
            <div className="filter-checkboxes">
              {filterOptions.attackTypes.slice(0, 10).map((type) => (
                <label key={type} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={localFilters.type?.includes(type) || false}
                    onChange={(e) => handleMultiSelectChange('type', type, e.target.checked)}
                  />
                  <span>{type}</span>
                </label>
              ))}
              {filterOptions.attackTypes.length > 10 && (
                <div className="filter-more">+{filterOptions.attackTypes.length - 10} more</div>
              )}
            </div>
          </div>
        )}

        {/* Severity */}
        {filterOptions?.severities && (
          <div className="filter-group">
            <label className="filter-label">Severity</label>
            <div className="filter-checkboxes">
              {filterOptions.severities.map((severity) => (
                <label key={severity} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={localFilters.severity?.includes(severity) || false}
                    onChange={(e) => handleMultiSelectChange('severity', severity, e.target.checked)}
                  />
                  <span className={`severity-badge severity-${severity.toLowerCase()}`}>
                    {severity}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        {filterOptions?.statuses && (
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <div className="filter-checkboxes">
              {filterOptions.statuses.map((status) => (
                <label key={status} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={localFilters.status?.includes(status) || false}
                    onChange={(e) => handleMultiSelectChange('status', status, e.target.checked)}
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Target Country */}
        {filterOptions?.targetCountries && (
          <div className="filter-group">
            <label className="filter-label">Target Country</label>
            <select
              value={localFilters.target_country || ''}
              onChange={(e) => handleFilterChange('target_country', e.target.value || undefined)}
              className="filter-select"
            >
              <option value="">All Countries</option>
              {filterOptions.targetCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Target Sector */}
        {filterOptions?.sectors && (
          <div className="filter-group">
            <label className="filter-label">Target Sector</label>
            <div className="filter-checkboxes">
              {filterOptions.sectors.map((sector) => (
                <label key={sector} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={localFilters.target_sector?.includes(sector) || false}
                    onChange={(e) => handleMultiSelectChange('target_sector', sector, e.target.checked)}
                  />
                  <span>{sector}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="filter-active">
          <div className="filter-active-label">Active Filters:</div>
          <div className="filter-active-tags">
            {Object.entries(localFilters).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
              const displayValue = Array.isArray(value) ? value.join(', ') : value;
              return (
                <span key={key} className="filter-tag">
                  {key}: {displayValue}
                  <button onClick={() => handleClearFilter(key)} className="filter-tag-remove">×</button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSidebar;

