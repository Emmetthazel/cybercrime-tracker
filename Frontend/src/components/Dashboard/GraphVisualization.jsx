import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { graphService } from '../../services/graphService';

const GraphVisualization = ({ maxNodes = 100 }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const fgRef = useRef();

  useEffect(() => {
    loadGraphData();
  }, [maxNodes]);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await graphService.getVisualization(maxNodes);
      setGraphData({
        nodes: data.nodes || [],
        links: data.links || []
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load graph data');
      console.error('Graph loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Color nodes by type
  const getNodeColor = (node) => {
    switch (node.label) {
      case 'Attack':
        return node.severity === 'Critical' ? '#dc3545' : 
               node.severity === 'High' ? '#fd7e14' :
               node.severity === 'Medium' ? '#ffc107' : '#28a745';
      case 'IP':
        return node.is_blacklisted ? '#6f42c1' : '#17a2b8';
      case 'User':
        return '#6c757d';
      default:
        return '#007bff';
    }
  };

  // Size nodes by importance
  const getNodeSize = (node) => {
    if (node.label === 'Attack') {
      return node.severity_score ? node.severity_score * 2 + 5 : 8;
    } else if (node.label === 'IP') {
      return node.threat_score ? node.threat_score / 10 + 5 : 8;
    }
    return 6;
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div>Loading graph visualization...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <div>Error: {error}</div>
        <button onClick={loadGraphData} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (!graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div style={styles.empty}>
        <div>No graph data available. Sync your data to Neo4j first.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.info}>
          <strong>Graph Network</strong>
          <span style={styles.stats}>
            {graphData.nodes.length} nodes • {graphData.links.length} relationships
          </span>
        </div>
        <div style={styles.controls}>
          <button 
            onClick={() => fgRef.current?.zoomToFit(400)} 
            style={styles.button}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#5568d3'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#667eea'}
          >
            Fit to Screen
          </button>
          <button 
            onClick={loadGraphData} 
            style={styles.button}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#5568d3'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#667eea'}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={styles.graphContainer}>
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeLabel={(node) => {
            if (node.label === 'Attack') {
              return `${node.type} - ${node.severity || 'Unknown'}`;
            } else if (node.label === 'IP') {
              return `${node.ip_address || node.id} (${node.country || 'Unknown'})`;
            } else if (node.label === 'User') {
              return node.username || node.id;
            }
            return node.id;
          }}
          nodeColor={getNodeColor}
          nodeVal={getNodeSize}
          linkLabel={(link) => link.type || 'Related'}
          linkWidth={2}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          onNodeClick={(node) => setSelectedNode(node)}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.label;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#333';
            ctx.fillText(label, node.x, node.y + getNodeSize(node) + fontSize);
          }}
          cooldownTicks={100}
          onEngineStop={() => fgRef.current?.zoomToFit(400, 20)}
        />
      </div>

      {selectedNode && (
        <div style={styles.nodeDetails}>
          <div style={styles.nodeDetailsHeader}>
            <strong>Node Details</strong>
            <button onClick={() => setSelectedNode(null)} style={styles.closeButton}>
              ×
            </button>
          </div>
          <div style={styles.nodeDetailsContent}>
            <div><strong>Type:</strong> {selectedNode.label}</div>
            {selectedNode.label === 'Attack' && (
              <>
                <div><strong>Type:</strong> {selectedNode.type}</div>
                <div><strong>Severity:</strong> {selectedNode.severity}</div>
                <div><strong>Target:</strong> {selectedNode.target_country}</div>
                {selectedNode.date && (
                  <div><strong>Date:</strong> {new Date(selectedNode.date).toLocaleDateString()}</div>
                )}
              </>
            )}
            {selectedNode.label === 'IP' && (
              <>
                <div><strong>IP Address:</strong> {selectedNode.ip_address}</div>
                <div><strong>Country:</strong> {selectedNode.country}</div>
                <div><strong>Threat Score:</strong> {selectedNode.threat_score || 'N/A'}</div>
                <div><strong>Blacklisted:</strong> {selectedNode.is_blacklisted ? 'Yes' : 'No'}</div>
              </>
            )}
            {selectedNode.label === 'User' && (
              <>
                <div><strong>Username:</strong> {selectedNode.username}</div>
                <div><strong>Role:</strong> {selectedNode.role}</div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={styles.legendContainer}>
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{...styles.legendColor, backgroundColor: '#dc3545'}}></div>
          <span>Critical Attack</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendColor, backgroundColor: '#fd7e14'}}></div>
          <span>High Attack</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendColor, backgroundColor: '#ffc107'}}></div>
          <span>Medium Attack</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendColor, backgroundColor: '#17a2b8'}}></div>
          <span>IP Address</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendColor, backgroundColor: '#6f42c1'}}></div>
          <span>Blacklisted IP</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendColor, backgroundColor: '#6c757d'}}></div>
          <span>User</span>
        </div>
      </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'transparent',
    padding: 0
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fff'
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  stats: {
    fontSize: '0.875rem',
    color: '#666'
  },
  controls: {
    display: 'flex',
    gap: '0.5rem'
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  buttonHover: {
    backgroundColor: '#5568d3'
  },
  graphContainer: {
    flex: 1,
    minHeight: '600px',
    height: 'calc(100vh - 300px)',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    margin: '1.5rem',
    backgroundColor: '#fafafa'
  },
  nodeDetails: {
    position: 'absolute',
    top: '80px',
    right: '20px',
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1rem',
    minWidth: '250px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: 1000
  },
  nodeDetailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #e0e0e0'
  },
  nodeDetailsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    fontSize: '0.875rem'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  legendContainer: {
    backgroundColor: '#fff',
    borderTop: '1px solid #e0e0e0'
  },
  legend: {
    display: 'flex',
    gap: '1.5rem',
    padding: '1rem 1.5rem',
    flexWrap: 'wrap',
    fontSize: '0.875rem'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '1px solid #ccc'
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
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  empty: {
    padding: '3rem',
    textAlign: 'center',
    color: '#666'
  }
};

export default GraphVisualization;

