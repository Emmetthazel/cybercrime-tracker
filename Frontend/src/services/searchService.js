import api from './api';

export const searchService = {
  /**
   * Unified search across all resources
   * @param {Object} params - Search parameters
   * @returns {Promise} Search results
   */
  unifiedSearch: async (params = {}) => {
    const response = await api.get('/search', { params });
    return response.data;
  },

  /**
   * Search attacks with filters
   * @param {Object} params - Search parameters
   * @returns {Promise} Attack search results
   */
  searchAttacks: async (params = {}) => {
    const response = await api.get('/search/attacks', { params });
    return response.data;
  },

  /**
   * Search IPs with filters
   * @param {Object} params - Search parameters
   * @returns {Promise} IP search results
   */
  searchIPs: async (params = {}) => {
    const response = await api.get('/search/ips', { params });
    return response.data;
  },

  /**
   * Search attacks by IP address (graph-based)
   * @param {string} ipAddress - IP address to search
   * @param {Object} params - Additional parameters
   * @returns {Promise} Related attacks
   */
  searchAttacksByIP: async (ipAddress, params = {}) => {
    const response = await api.get(`/search/ip/${ipAddress}/attacks`, { params });
    return response.data;
  },

  /**
   * Get available filter options
   * @returns {Promise} Filter options (attack types, severities, countries, etc.)
   */
  getFilterOptions: async () => {
    const response = await api.get('/search/filters');
    return response.data;
  }
};

