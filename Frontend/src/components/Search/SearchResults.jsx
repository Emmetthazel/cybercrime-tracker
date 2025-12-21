import React from 'react';
import './SearchResults.css';

const SearchResults = ({ results, loading, error, onAttackClick, onIPClick }) => {
  if (loading) {
    return (
      <div className="search-results-loading">
        <div className="spinner"></div>
        <p>Searching...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-results-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!results || (results.attacks?.length === 0 && results.ips?.length === 0)) {
    return (
      <div className="search-results-empty">
        <div className="empty-icon">🔍</div>
        <h3>No results found</h3>
        <p>Try adjusting your search criteria or filters</p>
      </div>
    );
  }

  const totalResults = (results.attacks?.length || 0) + (results.ips?.length || 0);

  return (
    <div className="search-results">
      <div className="search-results-header">
        <h2>Search Results</h2>
        <div className="search-results-count">
          {totalResults} result{totalResults !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Attacks Results */}
      {results.attacks && results.attacks.length > 0 && (
        <div className="search-results-section">
          <h3 className="results-section-title">
            Attacks ({results.attacks.length})
          </h3>
          <div className="results-grid">
            {results.attacks.map((attack) => (
              <div
                key={attack._id}
                className="result-card attack-card"
                onClick={() => onAttackClick && onAttackClick(attack)}
              >
                <div className="result-card-header">
                  <span className="attack-type">{attack.type}</span>
                  <span className={`severity-badge severity-${attack.severity?.toLowerCase()}`}>
                    {attack.severity}
                  </span>
                </div>
                <div className="result-card-body">
                  <p className="result-description">{attack.description}</p>
                  <div className="result-meta">
                    <span className="result-meta-item">
                      📍 {attack.target_country || 'Unknown'}
                    </span>
                    <span className="result-meta-item">
                      🌐 {attack.source_ip}
                    </span>
                    <span className="result-meta-item">
                      📅 {new Date(attack.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="result-card-footer">
                  <span className={`status-badge status-${attack.status?.toLowerCase().replace(/\s+/g, '_')}`}>
                    {attack.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IPs Results */}
      {results.ips && results.ips.length > 0 && (
        <div className="search-results-section">
          <h3 className="results-section-title">
            IP Addresses ({results.ips.length})
          </h3>
          <div className="results-grid">
            {results.ips.map((ip) => (
              <div
                key={ip._id}
                className="result-card ip-card"
                onClick={() => onIPClick && onIPClick(ip)}
              >
                <div className="result-card-header">
                  <span className="ip-address">{ip.ip_address}</span>
                  {ip.is_blacklisted && (
                    <span className="blacklist-badge">🚫 Blacklisted</span>
                  )}
                </div>
                <div className="result-card-body">
                  <div className="result-meta">
                    <span className="result-meta-item">
                      🌍 {ip.country || 'Unknown'}
                    </span>
                    {ip.isp && (
                      <span className="result-meta-item">
                        🏢 {ip.isp}
                      </span>
                    )}
                    {ip.threat_score !== undefined && (
                      <span className="result-meta-item">
                        ⚠️ Threat Score: {ip.threat_score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;

