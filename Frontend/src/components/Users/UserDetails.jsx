import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { userService } from '../../services/userService';
import './UserDetails.css';

const UserDetails = ({ user, onClose, onEdit }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [user]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await userService.getStatistics(user._id);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading user statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: '#dc3545',
      analyst: '#fd7e14',
      user: '#007bff',
      viewer: '#6c757d'
    };
    return colors[role] || '#6c757d';
  };

  return (
    <div className="user-details">
      <div className="user-details-header">
        <div>
          <h2>User Details</h2>
          <p className="user-email">{user.email}</p>
        </div>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="user-details-content">
        {/* Basic Information */}
        <div className="details-section">
          <h3>Basic Information</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Username:</label>
              <span>{user.username}</span>
            </div>
            <div className="detail-item">
              <label>Full Name:</label>
              <span>{user.full_name || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Role:</label>
              <span className="role-badge" style={{ backgroundColor: getRoleColor(user.role) }}>
                {user.role}
              </span>
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                {user.is_active ? '✓ Active' : '✗ Inactive'}
              </span>
            </div>
            <div className="detail-item">
              <label>Email Verified:</label>
              <span>{user.is_verified ? '✓ Yes' : '✗ No'}</span>
            </div>
            <div className="detail-item">
              <label>Department:</label>
              <span>{user.department || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Job Title:</label>
              <span>{user.job_title || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Phone:</label>
              <span>{user.phone || '-'}</span>
            </div>
          </div>
        </div>

        {/* Activity Information */}
        <div className="details-section">
          <h3>Activity</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Last Login:</label>
              <span>{formatDate(user.last_login)}</span>
            </div>
            <div className="detail-item">
              <label>Login Count:</label>
              <span>{user.login_count || 0}</span>
            </div>
            <div className="detail-item">
              <label>Account Created:</label>
              <span>{formatDate(user.created_at)}</span>
            </div>
            <div className="detail-item">
              <label>Last Updated:</label>
              <span>{formatDate(user.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {loading ? (
          <div className="details-section">
            <h3>Statistics</h3>
            <div className="loading-stats">Loading statistics...</div>
          </div>
        ) : statistics && (
          <div className="details-section">
            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{statistics.attacks_reported || 0}</div>
                <div className="stat-label">Attacks Reported</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{statistics.attacks_resolved || 0}</div>
                <div className="stat-label">Attacks Resolved</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {statistics.attacks_reported > 0
                    ? Math.round((statistics.attacks_resolved / statistics.attacks_reported) * 100)
                    : 0}%
                </div>
                <div className="stat-label">Resolution Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* User Statistics from Model */}
        {user.statistics && (
          <div className="details-section">
            <h3>System Statistics</h3>
            <div className="details-grid">
              {user.statistics.attacks_created !== undefined && (
                <div className="detail-item">
                  <label>Attacks Created:</label>
                  <span>{user.statistics.attacks_created}</span>
                </div>
              )}
              {user.statistics.attacks_resolved !== undefined && (
                <div className="detail-item">
                  <label>Attacks Resolved:</label>
                  <span>{user.statistics.attacks_resolved}</span>
                </div>
              )}
              {user.statistics.reports_generated !== undefined && (
                <div className="detail-item">
                  <label>Reports Generated:</label>
                  <span>{user.statistics.reports_generated}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="user-details-actions">
        <button onClick={onClose} className="btn-close">
          Close
        </button>
        <button onClick={onEdit} className="btn-edit">
          Edit User
        </button>
      </div>
    </div>
  );
};

export default UserDetails;

