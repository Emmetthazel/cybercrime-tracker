import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../Common/Layout';
import {
  getAllSources,
  createSource,
  updateSource,
  deleteSource,
  syncSource,
  syncAllSources,
  getIngestionStats,
  getActiveSources
} from '../../services/sourceService';
import './ThreatIntelSources.css';

const ThreatIntelSources = () => {
  const [sources, setSources] = useState([]);
  const [activeSources, setActiveSources] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    type: 'API',
    api_endpoint: '',
    api_key: '',
    authentication_method: 'API_KEY',
    sync_enabled: true,
    sync_interval: 3600,
    configuration: {
      default_params: {},
      timeout: 30000
    },
    data_mapping: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sourcesData, activeData, statsData] = await Promise.all([
        getAllSources(),
        getActiveSources(),
        getIngestionStats()
      ]);
      setSources(sourcesData);
      setActiveSources(activeData);
      setStats(statsData);
    } catch (error) {
      toast.error('Error loading sources: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('config.')) {
      const configKey = name.replace('config.', '');
      setFormData(prev => ({
        ...prev,
        configuration: {
          ...prev.configuration,
          [configKey]: type === 'number' ? parseInt(value) : value
        }
      }));
    } else if (name.startsWith('mapping.')) {
      const mappingKey = name.replace('mapping.', '');
      setFormData(prev => ({
        ...prev,
        data_mapping: {
          ...prev.data_mapping,
          [mappingKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSource) {
        await updateSource(editingSource._id, formData);
        toast.success('Source updated successfully');
      } else {
        await createSource(formData);
        toast.success('Source created successfully');
      }
      setShowForm(false);
      setEditingSource(null);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Error saving source: ' + error.message);
    }
  };

  const handleEdit = (source) => {
    setEditingSource(source);
    setFormData({
      name: source.name || '',
      display_name: source.display_name || '',
      type: source.type || 'API',
      api_endpoint: source.api_endpoint || '',
      api_key: source.api_key || '',
      authentication_method: source.authentication_method || 'API_KEY',
      sync_enabled: source.sync_enabled !== undefined ? source.sync_enabled : true,
      sync_interval: source.sync_interval || 3600,
      configuration: source.configuration || { default_params: {}, timeout: 30000 },
      data_mapping: source.data_mapping || {}
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this source?')) {
      return;
    }
    try {
      await deleteSource(id);
      toast.success('Source deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Error deleting source: ' + error.message);
    }
  };

  const handleSync = async (id) => {
    try {
      await syncSource(id);
      toast.success('Sync initiated successfully');
      setTimeout(loadData, 2000); // Reload after 2 seconds
    } catch (error) {
      toast.error('Error syncing source: ' + error.message);
    }
  };

  const handleSyncAll = async () => {
    try {
      await syncAllSources();
      toast.success('Sync all sources initiated');
      setTimeout(loadData, 2000);
    } catch (error) {
      toast.error('Error syncing all sources: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      type: 'API',
      api_endpoint: '',
      api_key: '',
      authentication_method: 'API_KEY',
      sync_enabled: true,
      sync_interval: 3600,
      configuration: {
        default_params: {},
        timeout: 30000
      },
      data_mapping: {}
    });
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const formatInterval = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading sources...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="threat-intel-sources">
        <div className="page-header">
          <h1>🕵️ Threat Intelligence Sources</h1>
          <div className="header-actions">
            <button onClick={handleSyncAll} className="btn btn-primary">
              🔄 Sync All Sources
            </button>
            <button onClick={() => { setShowForm(true); resetForm(); setEditingSource(null); }} className="btn btn-success">
              ➕ Add Source
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Sources</div>
              <div className="stat-value">{stats.totalSources}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Sources</div>
              <div className="stat-value">{stats.activeSources}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Auto Incidents</div>
              <div className="stat-value">{stats.totalAutoIncidents || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Records</div>
              <div className="stat-value">{stats.totalRecordsCollected || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Success Rate</div>
              <div className="stat-value">
                {stats.successRate !== undefined ? stats.successRate : 
                 (stats.totalSyncs > 0
                   ? Math.round((stats.successfulSyncs / stats.totalSyncs) * 100)
                   : 0)}%
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Last Sync</div>
              <div className="stat-value-small">{formatDate(stats.lastSync)}</div>
            </div>
          </div>
        )}

        {/* Sources Table */}
        <div className="sources-table-container">
          <table className="sources-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Sync Status</th>
                <th>Last Sync</th>
                <th>Next Sync</th>
                <th>Records</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No sources configured. Click "Add Source" to get started.
                  </td>
                </tr>
              ) : (
                sources.map((source) => (
                  <tr key={source._id} className={!source.is_active ? 'inactive' : ''}>
                    <td>
                      <strong>{source.display_name || source.name}</strong>
                      {source.sync_enabled && <span className="badge badge-success">Enabled</span>}
                      {!source.is_active && <span className="badge badge-danger">Inactive</span>}
                    </td>
                    <td>{source.type}</td>
                    <td>
                      <span className={`status-badge ${source.is_active ? 'active' : 'inactive'}`}>
                        {source.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className={`sync-status ${source.sync_status?.toLowerCase()}`}>
                        {source.sync_status || 'Unknown'}
                      </span>
                    </td>
                    <td>{formatDate(source.last_sync)}</td>
                    <td>{formatDate(source.next_sync)}</td>
                    <td>{source.records_collected || 0}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleSync(source._id)}
                          className="btn-icon"
                          title="Sync"
                          disabled={source.sync_status === 'In Progress'}
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => handleEdit(source)}
                          className="btn-icon"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(source._id)}
                          className="btn-icon btn-danger"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingSource(null); resetForm(); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingSource ? 'Edit Source' : 'Add New Source'}</h2>
                <button className="close-btn" onClick={() => { setShowForm(false); setEditingSource(null); resetForm(); }}>
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="source-form">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., AbuseIPDB Feed"
                  />
                </div>

                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    placeholder="e.g., AbuseIPDB Threat Intelligence Feed"
                  />
                </div>

                <div className="form-group">
                  <label>API Endpoint *</label>
                  <input
                    type="url"
                    name="api_endpoint"
                    value={formData.api_endpoint}
                    onChange={handleInputChange}
                    required
                    placeholder="https://api.example.com/endpoint"
                  />
                </div>

                <div className="form-group">
                  <label>API Key *</label>
                  <input
                    type="password"
                    name="api_key"
                    value={formData.api_key}
                    onChange={handleInputChange}
                    required
                    placeholder="Your API key"
                  />
                </div>

                <div className="form-group">
                  <label>Authentication Method</label>
                  <select
                    name="authentication_method"
                    value={formData.authentication_method}
                    onChange={handleInputChange}
                  >
                    <option value="API_KEY">API Key</option>
                    <option value="Bearer">Bearer Token</option>
                    <option value="Basic">Basic Auth</option>
                    <option value="OAuth">OAuth</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Sync Interval (seconds)</label>
                    <input
                      type="number"
                      name="sync_interval"
                      value={formData.sync_interval}
                      onChange={handleInputChange}
                      min="60"
                      placeholder="3600"
                    />
                    <small>Current: {formatInterval(formData.sync_interval)}</small>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="sync_enabled"
                        checked={formData.sync_enabled}
                        onChange={handleInputChange}
                      />
                      Enable Sync
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => { setShowForm(false); setEditingSource(null); resetForm(); }} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingSource ? 'Update' : 'Create'} Source
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ThreatIntelSources;
