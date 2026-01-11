import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Layout from '../Common/Layout';
import { checkIP } from '../../services/ipService';
import './IPChecker.css';

const IPChecker = () => {
  const navigate = useNavigate();
  const [ipAddress, setIpAddress] = useState('');
  const [source, setSource] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const sources = [
    { value: 'all', label: 'All Sources', icon: '🌐' },
    { value: 'shodan', label: 'Shodan', icon: '🔍' },
    { value: 'abuseipdb', label: 'AbuseIPDB', icon: '🛡️' },
    { value: 'virustotal', label: 'VirusTotal', icon: '🦠' },
    { value: 'otx', label: 'OTX (AlienVault)', icon: '👁️' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ipAddress.trim()) {
      toast.error('Please enter an IP address');
      return;
    }

    // Validation basique d'IP
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ipAddress.trim())) {
      toast.error('Please enter a valid IP address');
      return;
    }

    try {
      setLoading(true);
      setResults(null);
      
      const data = await checkIP(ipAddress.trim(), source);
      setResults(data);
      
      if (data.incidents_created > 0) {
        toast.success(`✅ Check completed! ${data.incidents_created} incident(s) created.`);
      } else {
        toast.info('Check completed. No new incidents created (may be duplicates).');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to check IP';
      toast.error(`Error: ${errorMsg}`);
      console.error('IP check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  return (
    <Layout>
      <div className="ip-checker">
        <div className="checker-header">
          <h1>🔍 Check IP with Threat Intelligence</h1>
          <p className="subtitle">Manually verify an IP address using external Threat Intelligence APIs</p>
        </div>

        <div className="checker-form-container">
          <form onSubmit={handleSubmit} className="checker-form">
            <div className="form-group">
              <label htmlFor="ip-address">IP Address *</label>
              <input
                id="ip-address"
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g., 8.8.8.8"
                className="ip-input"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="source">Threat Intelligence Source</label>
              <select
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="source-select"
                disabled={loading}
              >
                {sources.map((src) => (
                  <option key={src.value} value={src.value}>
                    {src.icon} {src.label}
                  </option>
                ))}
              </select>
              <small className="help-text">
                {source === 'all' 
                  ? 'Will check with all available sources (may take longer)'
                  : `Will check only with ${sources.find(s => s.value === source)?.label}`
                }
              </small>
            </div>

            <button 
              type="submit" 
              className="check-button"
              disabled={loading || !ipAddress.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Checking...
                </>
              ) : (
                <>
                  🔍 Check IP
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {results && (
          <div className="results-container">
            <div className="results-header">
              <h2>Check Results for {results.ip}</h2>
              <div className="results-summary">
                <span className="summary-badge success">
                  {results.incidents_created} Incident(s) Created
                </span>
                <span className="summary-badge info">
                  {Object.keys(results.checks).length} Source(s) Checked
                </span>
              </div>
            </div>

            {/* API Check Results */}
            <div className="checks-grid">
              {Object.entries(results.checks).map(([sourceName, checkData]) => (
                <div key={sourceName} className="check-card">
                  <div className="check-card-header">
                    <h3>{sourceName}</h3>
                    {checkData.error ? (
                      <span className="status-badge error">Error</span>
                    ) : (
                      <span className="status-badge success">Success</span>
                    )}
                  </div>
                  {checkData.error ? (
                    <div className="error-message">
                      <p>❌ {checkData.error}</p>
                    </div>
                  ) : (
                    <div className="check-details">
                      {sourceName === 'Shodan' && (
                        <>
                          {checkData.ports && (
                            <div className="detail-item">
                              <strong>Open Ports:</strong> {checkData.ports.length} ports
                              <div className="ports-list">
                                {checkData.ports.slice(0, 10).join(', ')}
                                {checkData.ports.length > 10 && ` +${checkData.ports.length - 10} more`}
                              </div>
                            </div>
                          )}
                          {checkData.vulns && checkData.vulns.length > 0 && (
                            <div className="detail-item warning">
                              <strong>⚠️ Vulnerabilities:</strong> {checkData.vulns.length} CVE(s)
                              <div className="vulns-list">
                                {checkData.vulns.slice(0, 5).join(', ')}
                                {checkData.vulns.length > 5 && ` +${checkData.vulns.length - 5} more`}
                              </div>
                            </div>
                          )}
                          {checkData.org && (
                            <div className="detail-item">
                              <strong>Organization:</strong> {checkData.org}
                            </div>
                          )}
                          {checkData.country_name && (
                            <div className="detail-item">
                              <strong>Country:</strong> {checkData.country_name}
                            </div>
                          )}
                        </>
                      )}
                      {sourceName === 'AbuseIPDB' && (
                        <>
                          {checkData.abuse_confidence_score !== undefined && (
                            <div className="detail-item">
                              <strong>Abuse Confidence:</strong> {checkData.abuse_confidence_score}%
                            </div>
                          )}
                          {checkData.total_reports !== undefined && (
                            <div className="detail-item">
                              <strong>Total Reports:</strong> {checkData.total_reports}
                            </div>
                          )}
                          {checkData.usage_type && (
                            <div className="detail-item">
                              <strong>Usage Type:</strong> {checkData.usage_type}
                            </div>
                          )}
                        </>
                      )}
                      {sourceName === 'VirusTotal' && (
                        <>
                          {checkData.malicious_count !== undefined && (
                            <div className="detail-item warning">
                              <strong>Malicious Detections:</strong> {checkData.malicious_count}
                            </div>
                          )}
                          {checkData.suspicious_count !== undefined && (
                            <div className="detail-item">
                              <strong>Suspicious Detections:</strong> {checkData.suspicious_count}
                            </div>
                          )}
                          {checkData.reputation !== undefined && (
                            <div className="detail-item">
                              <strong>Reputation Score:</strong> {checkData.reputation}
                            </div>
                          )}
                        </>
                      )}
                      {sourceName === 'OTX' && (
                        <>
                          {checkData.pulse_count !== undefined && (
                            <div className="detail-item">
                              <strong>Threat Pulses:</strong> {checkData.pulse_count}
                            </div>
                          )}
                          {checkData.pulses && checkData.pulses.length > 0 && (
                            <div className="detail-item">
                              <strong>Threat Types:</strong>
                              <div className="pulses-list">
                                {checkData.pulses.slice(0, 3).map((p, i) => (
                                  <span key={i} className="pulse-tag">{p.name}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Created Incidents */}
            {results.incidents && results.incidents.length > 0 && (
              <div className="incidents-section">
                <h3>Created Incidents ({results.incidents.length})</h3>
                <div className="incidents-list">
                  {results.incidents.map((incident, index) => (
                    <div key={incident._id || index} className="incident-card">
                      <div className="incident-header">
                        <span className="incident-type">{incident.type}</span>
                        <span className={`severity-badge severity-${incident.severity?.toLowerCase()}`}>
                          {incident.severity}
                        </span>
                      </div>
                      <p className="incident-description">{incident.description}</p>
                      <div className="incident-meta">
                        <span>IP: {incident.source_ip}</span>
                        <span>Date: {formatDate(incident.date)}</span>
                        {incident.confidence_level && (
                          <span>Confidence: {incident.confidence_level}%</span>
                        )}
                      </div>
                      {incident._id && (
                        <button
                          onClick={() => navigate(`/attacks/${incident._id}`)}
                          className="view-incident-btn"
                        >
                          View Details →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="results-actions">
              <button
                onClick={() => navigate(`/attacks?source_ip=${results.ip}`)}
                className="action-btn"
              >
                View All Incidents for {results.ip}
              </button>
              <button
                onClick={() => {
                  setResults(null);
                  setIpAddress('');
                }}
                className="action-btn secondary"
              >
                Check Another IP
              </button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="info-section">
          <h3>ℹ️ How it works</h3>
          <div className="info-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <strong>Enter IP Address</strong>
                <p>Enter the IP address you want to check</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <strong>Select Source</strong>
                <p>Choose a specific Threat Intelligence source or check all sources</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <strong>Automatic Analysis</strong>
                <p>The system applies intelligent rules to transform API data into incidents</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <strong>Incidents Created</strong>
                <p>Incidents are automatically created in MongoDB and synced to Neo4j</p>
              </div>
            </div>
          </div>

          <div className="rules-info">
            <h4>📋 Transformation Rules</h4>
            <ul>
              <li><strong>Shodan:</strong> Ports sensibles → Medium | CVE détectées → High | Nombreux ports → Suspicious</li>
              <li><strong>AbuseIPDB:</strong> Score ≥90 → Critical | Score ≥75 → High | Score ≥50 → Medium</li>
              <li><strong>VirusTotal:</strong> ≥5 malveillants → High | ≥2 malveillants → Medium</li>
              <li><strong>OTX:</strong> ≥10 pulses → High | ≥5 pulses → Medium</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IPChecker;
