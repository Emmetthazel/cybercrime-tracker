import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import AttackStats from './AttackStats';
import AttackChart from './AttackChart';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getOverview(30);
      setOverview(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }

  if (!overview) {
    return <div>No data available</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Cybercrime Dashboard</h1>
      
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>Total Attacks</h3>
          <p style={styles.statValue}>{overview.attacks.total}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Blacklisted IPs</h3>
          <p style={styles.statValue}>{overview.ips.blacklisted}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Active Alerts</h3>
          <p style={styles.statValue}>{overview.alerts.active}</p>
        </div>
        <div style={styles.statCard}>
          <h3>High Threat IPs</h3>
          <p style={styles.statValue}>{overview.ips.high_threat}</p>
        </div>
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3>Attacks by Type</h3>
          <AttackChart data={overview.attacks.by_type} />
        </div>
        <div style={styles.chartCard}>
          <h3>Attacks by Severity</h3>
          <AttackChart data={overview.attacks.by_severity} type="doughnut" />
        </div>
      </div>

      <div style={styles.section}>
        <h2>Recent Attacks</h2>
        <div style={styles.table}>
          <table style={styles.tableStyle}>
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
                  <td>{attack.type}</td>
                  <td>{attack.target_country}</td>
                  <td>{attack.severity}</td>
                  <td>{new Date(attack.date).toLocaleDateString()}</td>
                  <td>{attack.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  title: {
    marginBottom: '2rem',
    color: '#333'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem'
  },
  error: {
    color: 'red',
    padding: '1rem',
    backgroundColor: '#ffe6e6',
    borderRadius: '4px',
    margin: '1rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#007bff',
    margin: '0.5rem 0 0 0'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  },
  chartCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  section: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: '2rem'
  },
  table: {
    overflowX: 'auto'
  },
  tableStyle: {
    width: '100%',
    borderCollapse: 'collapse'
  }
};

export default Dashboard;

