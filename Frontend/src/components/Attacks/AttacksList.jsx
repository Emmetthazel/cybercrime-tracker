import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../Common/Layout';
import { AuthContext } from '../../context/AuthContext';
import { attackService } from '../../services/attackService';
import './AttacksList.css';

const AttacksList = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: '',
    source: '' // Filter by source: Manual Report, API Sync, Automated Detection
  });

  const loadAttacks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 20,
        ...filters
      };
      if (searchQuery) {
        params.search = searchQuery;
      }
      const data = await attackService.getAll(params);
      setAttacks(data.attacks || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load attacks';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [page, filters, searchQuery]);

  useEffect(() => {
    loadAttacks();
  }, [loadAttacks]);

  const handleDelete = async (attackId, attackType) => {
    if (!window.confirm(`Are you sure you want to delete this attack: ${attackType}?`)) {
      return;
    }

    try {
      await attackService.delete(attackId);
      toast.success('Attack deleted successfully');
      loadAttacks();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete attack';
      toast.error(errorMsg);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    // loadAttacks will be called by useEffect when page changes
  };

  const canEdit = (attack) => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'analyst') return true;
    if (user.role === 'user') {
      // Users can only edit attacks they reported
      // Handle different formats: populated object with _id, or just _id string/ObjectId
      // Note: user object from login uses 'id' field, not '_id'
      const reporterId = attack.reported_by?._id || attack.reported_by;
      const userId = user.id || user._id; // Login returns 'id', but check both for safety
      
      // Convert both to strings for reliable comparison
      const reporterIdStr = reporterId?.toString();
      const userIdStr = userId?.toString();
      
      return reporterIdStr === userIdStr && reporterIdStr && userIdStr;
    }
    return false;
  };

  const canDelete = () => {
    return user?.role === 'admin';
  };

  if (loading && attacks.length === 0) {
    return (
      <Layout>
        <div className="attacks-list-loading">
          <div className="spinner"></div>
          <p>Loading attacks...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="attacks-list">
        <div className="attacks-list-header">
          <div>
            <h1>Attacks</h1>
            <p className="subtitle">View and manage security incidents</p>
          </div>
          {user?.role && ['admin', 'analyst', 'user'].includes(user.role) && (
            <button 
              onClick={() => navigate('/report-attack')} 
              className="btn-report-attack"
            >
              + Report Attack
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="attacks-filters">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search attacks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn-search">Search</button>
          </form>
          <div className="filter-group">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="Phishing">Phishing</option>
              <option value="DDoS">DDoS</option>
              <option value="Ransomware">Ransomware</option>
              <option value="Malware">Malware</option>
              <option value="SQL Injection">SQL Injection</option>
              <option value="XSS">XSS</option>
              <option value="Brute Force">Brute Force</option>
            </select>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            >
              <option value="">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Detected">Detected</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Contained">Contained</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            >
              <option value="">All Sources</option>
              <option value="Manual Report">Manual Reports</option>
              <option value="API Sync">Auto (API Sync)</option>
              <option value="Automated Detection">Automated Detection</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadAttacks} className="retry-btn">Retry</button>
          </div>
        )}

        {/* Attacks Table */}
        <div className="attacks-table-container">
          <table className="attacks-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Date</th>
                <th>Reported By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attacks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-attacks">
                    No attacks found
                  </td>
                </tr>
              ) : (
                attacks.map((attack) => (
                  <tr key={attack._id}>
                    <td>
                      <span className="attack-type">{attack.type}</span>
                      {attack.source === 'API Sync' && (
                        <span className="badge-auto" title="Automatically created from Threat Intelligence API">
                          🤖 Auto
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`severity-badge severity-${attack.severity?.toLowerCase()}`}>
                        {attack.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${attack.status?.toLowerCase().replace(/\s+/g, '_')}`}>
                        {attack.status}
                      </span>
                    </td>
                    <td>{new Date(attack.date).toLocaleDateString()}</td>
                    <td>
                      {attack.reported_by?.username || attack.reported_by?.email || 'Unknown'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => navigate(`/attacks/${attack._id}`)}
                          className="btn-view"
                          title="View Details"
                        >
                          👁️
                        </button>
                        {canEdit(attack) && (
                          <button
                            onClick={() => navigate(`/attacks/${attack._id}/edit`)}
                            className="btn-edit"
                            title="Edit Attack"
                          >
                            ✏️
                          </button>
                        )}
                        {canDelete() && (
                          <button
                            onClick={() => handleDelete(attack._id, attack.type)}
                            className="btn-delete"
                            title="Delete Attack"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AttacksList;

