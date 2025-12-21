import React, { useState, useEffect } from 'react';
import { graphService } from '../../services/graphService';

const CampaignDetection = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    minAttacks: 3,
    days: 30
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await graphService.detectCampaigns(filters.minAttacks, filters.days);
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campaigns');
      console.error('Campaign detection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: parseInt(value) }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      // Handle different date formats from Neo4j
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      return date.toLocaleDateString();
    } catch (e) {
      return dateStr.toString();
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div>Detecting campaigns...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <div>Error: {error}</div>
        <button onClick={loadCampaigns} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Attack Campaigns</h2>
          <p style={styles.subtitle}>
            Detected {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} with {filters.minAttacks}+ related attacks
          </p>
        </div>
        <div style={styles.filters}>
          <div style={styles.filterGroup}>
            <label style={styles.filterGroupLabel}>Min Attacks:</label>
            <input
              type="number"
              value={filters.minAttacks}
              onChange={(e) => handleFilterChange('minAttacks', e.target.value)}
              min="2"
              max="20"
              style={styles.input}
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterGroupLabel}>Days:</label>
            <input
              type="number"
              value={filters.days}
              onChange={(e) => handleFilterChange('days', e.target.value)}
              min="1"
              max="365"
              style={styles.input}
            />
          </div>
          <button 
            onClick={loadCampaigns} 
            style={styles.searchButton}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#5568d3'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#667eea'}
          >
            Detect
          </button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div style={styles.empty}>
          <div>No campaigns detected with current filters.</div>
          <div style={styles.emptySubtext}>
            Try lowering the minimum attacks threshold or increasing the days range.
          </div>
        </div>
      ) : (
        <div style={styles.campaignsList}>
          {campaigns.map((campaign, index) => (
            <div key={index} style={styles.campaignCard}>
              <div style={styles.campaignHeader}>
                <div>
                  <h3 style={styles.campaignTitle}>
                    Campaign #{index + 1}
                    {campaign.campaign_id && ` - ${campaign.campaign_id}`}
                  </h3>
                  {campaign.threat_actor && (
                    <div style={styles.threatActor}>
                      <strong>Threat Actor:</strong> {campaign.threat_actor}
                    </div>
                  )}
                </div>
                <div style={styles.campaignStats}>
                  <div style={styles.stat}>
                    <div style={styles.statValue}>{campaign.attack_count}</div>
                    <div style={styles.statLabel}>Attacks</div>
                  </div>
                </div>
              </div>

              <div style={styles.campaignDetails}>
                <div style={styles.detailRow}>
                  <strong>Timeframe:</strong>
                  <span>
                    {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                  </span>
                </div>
                {campaign.attacks && campaign.attacks.length > 0 && (
                  <div style={styles.attacksList}>
                    <strong>Attacks in Campaign:</strong>
                    <div style={styles.attacksGrid}>
                      {campaign.attacks.slice(0, 10).map((attack, idx) => (
                        <div key={idx} style={styles.attackTag}>
                          {attack.type || 'Unknown'} - {attack.severity || 'Unknown'}
                        </div>
                      ))}
                      {campaign.attacks.length > 10 && (
                        <div style={styles.attackTag}>
                          +{campaign.attacks.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '1.5rem',
    backgroundColor: 'transparent',
    borderRadius: '0',
    boxShadow: 'none'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  title: {
    margin: '0 0 0.5rem 0',
    color: '#333',
    fontSize: '1.5rem'
  },
  subtitle: {
    margin: 0,
    color: '#666',
    fontSize: '0.875rem'
  },
  filters: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-end'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  filterGroupLabel: {
    fontSize: '0.875rem',
    color: '#666',
    fontWeight: '500'
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '80px',
    fontSize: '0.875rem'
  },
  searchButton: {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'background-color 0.2s'
  },
  campaignsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  campaignCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '1.5rem',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  campaignHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  campaignTitle: {
    margin: '0 0 0.5rem 0',
    color: '#333',
    fontSize: '1.25rem'
  },
  threatActor: {
    fontSize: '0.875rem',
    color: '#666'
  },
  campaignStats: {
    display: 'flex',
    gap: '1.5rem'
  },
  stat: {
    textAlign: 'center'
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#667eea'
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#666',
    marginTop: '0.25rem'
  },
  campaignDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  detailRow: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.875rem',
    color: '#333'
  },
  attacksList: {
    fontSize: '0.875rem'
  },
  attacksGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.5rem'
  },
  attackTag: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#e9ecef',
    borderRadius: '12px',
    fontSize: '0.75rem',
    color: '#495057'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '3rem',
    fontSize: '1.1rem',
    color: '#666'
  },
  error: {
    padding: '2rem',
    textAlign: 'center',
    color: '#dc3545'
  },
  retryButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  empty: {
    padding: '3rem',
    textAlign: 'center',
    color: '#666'
  },
  emptySubtext: {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: '#999'
  }
};

export default CampaignDetection;

