import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../Common/Layout';
import { AuthContext } from '../../context/AuthContext';
import { attackService } from '../../services/attackService';
import './ReportAttack.css';

const ReportAttack = ({ attackId, onSuccess, onCancel }) => {
  // Get attackId from URL if not provided as prop (for route usage)
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const finalAttackId = attackId || id;
  const isEditing = !!finalAttackId;
  
  // Check if user can report/edit attacks
  // For editing: admin and analyst can edit any, users can edit their own (checked later)
  // For reporting: admin, analyst, and user can report (viewer cannot)
  const canEditAttack = user?.role && ['admin', 'analyst', 'user'].includes(user.role);
  const canReport = user?.role && ['admin', 'analyst', 'user'].includes(user.role);
  const hasAccess = isEditing ? canEditAttack : canReport;
  const [formData, setFormData] = useState({
    type: '',
    subtype: '',
    source_ip: '',
    source_country: '',
    target_country: '',
    target_org: '',
    target_sector: '',
    date: new Date().toISOString().split('T')[0],
    severity: 'Medium',
    description: '',
    attack_vector: '',
    financial_impact: '',
    affected_users: '',
    status: 'Detected'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const loadAttack = useCallback(async () => {
    try {
      setLoading(true);
      const attack = await attackService.getById(finalAttackId);
      setFormData({
        type: attack.type || '',
        subtype: attack.subtype || '',
        source_ip: attack.source_ip || '',
        source_country: attack.source_country || '',
        target_country: attack.target_country || '',
        target_org: attack.target_org || '',
        target_sector: attack.target_sector || '',
        date: attack.date ? new Date(attack.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        severity: attack.severity || 'Medium',
        description: attack.description || '',
        attack_vector: attack.attack_vector || '',
        financial_impact: attack.financial_impact || '',
        affected_users: attack.affected_users || '',
        status: attack.status || 'Detected'
      });
    } catch (err) {
      toast.error('Failed to load attack details');
      navigate('/attacks');
    } finally {
      setLoading(false);
    }
  }, [finalAttackId, navigate]);

  // Load attack data if editing
  useEffect(() => {
    if (isEditing && finalAttackId) {
      loadAttack();
    }
  }, [isEditing, finalAttackId, loadAttack]);

  const attackTypes = [
    'Phishing',
    'DDoS',
    'Ransomware',
    'Malware',
    'SQL Injection',
    'XSS',
    'Brute Force',
    'Man-in-the-Middle',
    'Other'
  ];

  const sectors = [
    'Education',
    'Finance',
    'Healthcare',
    'Government',
    'Technology',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'Attack type is required';
    }

    if (!formData.source_ip) {
      newErrors.source_ip = 'Source IP is required';
    } else if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(formData.source_ip)) {
      newErrors.source_ip = 'Invalid IP address format';
    }

    if (!formData.target_country) {
      newErrors.target_country = 'Target country is required';
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Description is required (minimum 10 characters)';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        date: new Date(formData.date),
        financial_impact: formData.financial_impact ? parseFloat(formData.financial_impact) : undefined,
        affected_users: formData.affected_users ? parseInt(formData.affected_users) : undefined,
      };

      // Remove empty optional fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      if (isEditing) {
        await attackService.update(finalAttackId, submitData);
        toast.success('Attack updated successfully!');
      } else {
        await attackService.create(submitData);
        toast.success('Attack reported successfully!');
      }
      
      // Reset form
      setFormData({
        type: '',
        subtype: '',
        source_ip: '',
        source_country: '',
        target_country: '',
        target_org: '',
        target_sector: '',
        date: new Date().toISOString().split('T')[0],
        severity: 'Medium',
        description: '',
        attack_vector: '',
        financial_impact: '',
        affected_users: '',
        status: 'Detected'
      });

      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to attacks list after successful save
        navigate('/attacks');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to report attack';
      toast.error(errorMsg);
      setErrors({ submit: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // If user doesn't have access, show access denied
  if (!hasAccess) {
    return (
      <Layout>
        <div className="report-attack-error">
          <h2>Access Denied</h2>
          <p>
            {isEditing 
              ? 'You do not have permission to edit attacks. Only users, analysts, and administrators can edit attacks.'
              : 'You do not have permission to report attacks. Only users, analysts, and administrators can report attacks.'}
          </p>
          <button onClick={() => navigate('/attacks')} className="btn-back">
            Back to Attacks
          </button>
        </div>
      </Layout>
    );
  }

  const content = (
    <div className="report-attack">
      <div className="report-attack-header">
        <div>
          <h2>{isEditing ? 'Edit Attack' : 'Report New Attack'}</h2>
          <p className="subtitle">{isEditing ? 'Update attack information' : 'Report a new cybercrime incident'}</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="close-btn">×</button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="report-attack-form">
        <div className="form-section">
          <h3>Attack Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">
                Attack Type <span className="required">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={errors.type ? 'error' : ''}
                required
              >
                <option value="">Select attack type...</option>
                {attackTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.type && <span className="error-text">{errors.type}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="subtype">Attack Subtype</label>
              <input
                type="text"
                id="subtype"
                name="subtype"
                value={formData.subtype}
                onChange={handleChange}
                placeholder="e.g., Spear Phishing, APT"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="severity">Severity</label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Detected">Detected</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Contained">Contained</option>
                <option value="Mitigated">Mitigated</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">
                Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? 'error' : ''}
                required
              />
              {errors.date && <span className="error-text">{errors.date}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className={errors.description ? 'error' : ''}
              placeholder="Provide a detailed description of the attack..."
              required
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>Source Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="source_ip">
                Source IP Address <span className="required">*</span>
              </label>
              <input
                type="text"
                id="source_ip"
                name="source_ip"
                value={formData.source_ip}
                onChange={handleChange}
                className={errors.source_ip ? 'error' : ''}
                placeholder="192.168.1.1"
                required
              />
              {errors.source_ip && <span className="error-text">{errors.source_ip}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="source_country">Source Country</label>
              <input
                type="text"
                id="source_country"
                name="source_country"
                value={formData.source_country}
                onChange={handleChange}
                placeholder="e.g., US, GB, DE"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="attack_vector">Attack Vector</label>
            <input
              type="text"
              id="attack_vector"
              name="attack_vector"
              value={formData.attack_vector}
              onChange={handleChange}
              placeholder="e.g., Email, Web Application, Network"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Target Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="target_country">
                Target Country <span className="required">*</span>
              </label>
              <input
                type="text"
                id="target_country"
                name="target_country"
                value={formData.target_country}
                onChange={handleChange}
                className={errors.target_country ? 'error' : ''}
                placeholder="e.g., US, GB, DE"
                required
              />
              {errors.target_country && <span className="error-text">{errors.target_country}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="target_sector">Target Sector</label>
              <select
                id="target_sector"
                name="target_sector"
                value={formData.target_sector}
                onChange={handleChange}
              >
                <option value="">Select sector...</option>
                {sectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="target_org">Target Organization</label>
            <input
              type="text"
              id="target_org"
              name="target_org"
              value={formData.target_org}
              onChange={handleChange}
              placeholder="Organization name"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Impact Assessment (Optional)</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="financial_impact">Financial Impact (USD)</label>
              <input
                type="number"
                id="financial_impact"
                name="financial_impact"
                value={formData.financial_impact}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="affected_users">Affected Users</label>
              <input
                type="number"
                id="affected_users"
                name="affected_users"
                value={formData.affected_users}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {errors.submit && (
          <div className="error-message">{errors.submit}</div>
        )}

        <div className="form-actions">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
          )}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (isEditing ? 'Updating...' : 'Reporting...') : (isEditing ? 'Update Attack' : 'Report Attack')}
          </button>
        </div>
      </form>
    </div>
  );

  // If used as a standalone page, wrap in Layout
  if (!onCancel && !onSuccess) {
    return <Layout>{content}</Layout>;
  }

  // If used as a modal/component, return content directly
  return content;
};

export default ReportAttack;

