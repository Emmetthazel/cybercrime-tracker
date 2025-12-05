import React from 'react';

const AttackStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div style={styles.container}>
      <div style={styles.stat}>
        <h3>Total Attacks</h3>
        <p style={styles.value}>{stats.total || 0}</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    gap: '1rem'
  },
  stat: {
    flex: 1,
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  value: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#007bff'
  }
};

export default AttackStats;

