import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../Common/Layout';
import { AuthContext } from '../../context/AuthContext';
import { attackService } from '../../services/attackService';
import './AttackDetail.css';

const AttackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [attack, setAttack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAttack();
  }, [id]);

  const loadAttack = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await attackService.getById(id);
      setAttack(data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load attack';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this attack: ${attack.type}?`)) {
      return;
    }

    try {
      await attackService.delete(id);
      toast.success('Attack deleted successfully');
      navigate('/attacks');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete attack';
      toast.error(errorMsg);
    }
  };

  const canEdit = () => {
    if (!user || !attack) return false;
    if (user.role === 'admin' || user.role === 'analyst') return true;
    if (user.role === 'user') {
      // Users can only edit attacks they reported
      const reporterId = attack.reported_by?._id || attack.reported_by;
      return reporterId === user._id || reporterId?.toString() === user._id?.toString();
    }
    return false;
  };

  const canDelete = () => {
    return user?.role === 'admin';
  };

  if (loading) {
    return (
      <Layout>
        <div className="attack-detail-loading">
          <div className="spinner"></div>
          <p>Loading attack details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !attack) {
    return (
      <Layout>
        <div className="attack-detail-error">
          <h2>Error</h2>
          <p>{error || 'Attack not found'}</p>
          <button onClick={() => navigate('/attacks')} className="btn-back">
            Back to Attacks
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="attack-detail">
        <div className="attack-detail-header">
          <div>
            <button onClick={() => navigate('/attacks')} className="btn-back-inline">
              ← Back
            </button>
            <h1>Attack Details</h1>
            <div className="attack-header-info">
              <span className="attack-type-badge">{attack.type}</span>
              <span className={`severity-badge severity-${attack.severity?.toLowerCase()}`}>
                {attack.severity}
              </span>
              <span className={`status-badge status-${attack.status?.toLowerCase().replace(/\s+/g, '_')}`}>
                {attack.status}
              </span>
            </div>
          </div>
          <div className="action-buttons">
            {canEdit() && (
              <button
                onClick={() => navigate(`/attacks/${id}/edit`)}
                className="btn-edit"
              >
                ✏️ Edit
              </button>
            )}
            {canDelete() && (
              <button
                onClick={handleDelete}
                className="btn-delete"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </div>

        <div className="attack-detail-content">
          <div className="detail-section">
            <h3>Basic Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Attack Type:</label>
                <span>{attack.type}</span>
              </div>
              {attack.subtype && (
                <div className="detail-item">
                  <label>Subtype:</label>
                  <span>{attack.subtype}</span>
                </div>
              )}
              <div className="detail-item">
                <label>Severity:</label>
                <span className={`severity-badge severity-${attack.severity?.toLowerCase()}`}>
                  {attack.severity}
                </span>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <span className={`status-badge status-${attack.status?.toLowerCase().replace(/\s+/g, '_')}`}>
                  {attack.status}
                </span>
              </div>
              <div className="detail-item">
                <label>Date:</label>
                <span>{new Date(attack.date).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Source Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Source IP:</label>
                <span>{attack.source_ip}</span>
              </div>
              {attack.source_country && (
                <div className="detail-item">
                  <label>Source Country:</label>
                  <span>{attack.source_country}</span>
                </div>
              )}
              {attack.attack_vector && (
                <div className="detail-item">
                  <label>Attack Vector:</label>
                  <span>{attack.attack_vector}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>Target Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Target Country:</label>
                <span>{attack.target_country || 'Unknown'}</span>
              </div>
              {attack.target_org && (
                <div className="detail-item">
                  <label>Target Organization:</label>
                  <span>{attack.target_org}</span>
                </div>
              )}
              {attack.target_sector && (
                <div className="detail-item">
                  <label>Target Sector:</label>
                  <span>{attack.target_sector}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>Description</h3>
            <p className="description-text">{attack.description}</p>
          </div>

          {(attack.financial_impact || attack.affected_users) && (
            <div className="detail-section">
              <h3>Impact Assessment</h3>
              <div className="detail-grid">
                {attack.financial_impact && (
                  <div className="detail-item">
                    <label>Financial Impact:</label>
                    <span>${attack.financial_impact.toLocaleString()}</span>
                  </div>
                )}
                {attack.affected_users && (
                  <div className="detail-item">
                    <label>Affected Users:</label>
                    <span>{attack.affected_users.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>Reporting Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Reported By:</label>
                <span>{attack.reported_by?.username || attack.reported_by?.email || 'Unknown'}</span>
              </div>
              <div className="detail-item">
                <label>Reported At:</label>
                <span>{new Date(attack.reported_at || attack.created_at).toLocaleString()}</span>
              </div>
              {attack.assigned_to && (
                <div className="detail-item">
                  <label>Assigned To:</label>
                  <span>{attack.assigned_to?.username || attack.assigned_to?.email || 'Unassigned'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AttackDetail;

