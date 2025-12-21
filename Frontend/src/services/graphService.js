import api from './api';

export const graphService = {
  /**
   * Get graph visualization data
   * @param {number} maxNodes - Maximum number of nodes
   * @returns {Promise} Graph data with nodes and links
   */
  getVisualization: async (maxNodes = 100) => {
    const response = await api.get('/graph/visualization', {
      params: { maxNodes }
    });
    return response.data;
  },

  /**
   * Detect campaigns
   * @param {number} minAttacks - Minimum attacks in campaign
   * @param {number} days - Number of days to look back
   * @returns {Promise} Detected campaigns
   */
  detectCampaigns: async (minAttacks = 3, days = 30) => {
    const response = await api.get('/graph/campaigns/detect', {
      params: { minAttacks, days }
    });
    return response.data;
  },

  /**
   * Get graph statistics
   * @returns {Promise} Graph statistics
   */
  getStatistics: async () => {
    const response = await api.get('/graph/statistics');
    return response.data;
  },

  /**
   * Get related attacks
   * @param {string} attackId - Attack ID
   * @param {number} maxDepth - Maximum depth
   * @returns {Promise} Related attacks
   */
  getRelatedAttacks: async (attackId, maxDepth = 3) => {
    const response = await api.get(`/graph/attacks/${attackId}/related`, {
      params: { maxDepth }
    });
    return response.data;
  },

  /**
   * Get IP attack chain
   * @param {string} ipId - IP ID
   * @returns {Promise} Attack chain
   */
  getIPAttackChain: async (ipId) => {
    const response = await api.get(`/graph/ips/${ipId}/attack-chain`);
    return response.data;
  }
};

