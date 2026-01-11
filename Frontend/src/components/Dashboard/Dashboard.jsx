import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../Common/Layout';
import { dashboardService } from '../../services/dashboardService';
import AttackStats from './AttackStats';
import AttackChart from './AttackChart';
import GraphVisualization from './GraphVisualization';
import CampaignDetection from './CampaignDetection';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboardService.getOverview(30);
      setOverview(data);
      toast.success('Dashboard loaded successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load dashboard';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'graph', label: 'Graph Network', icon: '🕸️' },
    { id: 'campaigns', label: 'Campaigns', icon: '🎯' },
  ];

  if (loading && !overview) {
    return (
      <Layout>
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Cybercrime Dashboard</h1>
          <p className="dashboard-subtitle">Real-time threat intelligence and analysis</p>
        </div>

        <div className="dashboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="dashboard-content">
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadDashboard} className="retry-btn">
                Retry
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="overview-tab">
              {overview && (
                <>
                  <div className="stats-grid">
                    <div className="stat-card stat-card-primary">
                      <div className="stat-icon">⚔️</div>
                      <div className="stat-content">
                        <h3>Total Attacks</h3>
                        <p className="stat-value">{overview.attacks.total}</p>
                        <p className="stat-change">All time</p>
                      </div>
                    </div>
                    <div className="stat-card stat-card-danger">
                      <div className="stat-icon">🚫</div>
                      <div className="stat-content">
                        <h3>Blacklisted IPs</h3>
                        <p className="stat-value">{overview.ips.blacklisted}</p>
                        <p className="stat-change">Active threats</p>
                      </div>
                    </div>
                    <div className="stat-card stat-card-warning">
                      <div className="stat-icon">⚠️</div>
                      <div className="stat-content">
                        <h3>Active Alerts</h3>
                        <p className="stat-value">{overview.alerts.active}</p>
                        <p className="stat-change">Requires attention</p>
                      </div>
                    </div>
                    <div className="stat-card stat-card-info">
                      <div className="stat-icon">🔴</div>
                      <div className="stat-content">
                        <h3>High Threat IPs</h3>
                        <p className="stat-value">{overview.ips.high_threat}</p>
                        <p className="stat-change">Threat score > 70</p>
                      </div>
                    </div>
                  </div>

                  <div className="charts-grid">
                    <div className="chart-card">
                      <h3>Attacks by Type</h3>
                      <AttackChart data={overview.attacks.by_type} />
                    </div>
                    <div className="chart-card">
                      <h3>Attacks by Severity</h3>
                      <AttackChart data={overview.attacks.by_severity} type="doughnut" />
                    </div>
                  </div>

                  <div className="section-card">
                    <h2>Recent Attacks</h2>
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Target Country</th>
                            <th>Severity</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.recent_attacks?.slice(0, 10).map((attack) => (
                            <tr key={attack._id}>
                              <td>
                                <span className="attack-type">{attack.type}</span>
                              </td>
                              <td>{attack.target_country || 'Unknown'}</td>
                              <td>
                                <span className={`severity-badge severity-${attack.severity?.toLowerCase()}`}>
                                  {attack.severity}
                                </span>
                              </td>
                              <td>{new Date(attack.date).toLocaleDateString()}</td>
                              <td>
                                <span className={`status-badge status-${attack.status?.toLowerCase().replace(/\s+/g, '_')}`}>
                                  {attack.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="graph-tab">
              <GraphVisualization maxNodes={150} />
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="campaigns-tab">
              <CampaignDetection />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
