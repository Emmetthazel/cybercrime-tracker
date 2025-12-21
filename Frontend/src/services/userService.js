import api from './api';

export const userService = {
  /**
   * Get all users (admin only)
   * @param {Object} params - Query parameters
   * @returns {Promise} List of users
   */
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  /**
   * Get user by ID (admin only)
   * @param {string} id - User ID
   * @returns {Promise} User details
   */
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Create new user (admin only)
   * @param {Object} userData - User data
   * @returns {Promise} Created user
   */
  create: async (userData) => {
    const response = await api.post('/users/register', userData);
    // The register endpoint returns { message, token, refreshToken, user }
    // We'll fetch the full user details after creation
    if (response.data.user && response.data.user.id) {
      try {
        const fullUser = await api.get(`/users/${response.data.user.id}`);
        return fullUser.data;
      } catch (error) {
        // If fetching fails, return the basic user data
        console.warn('Could not fetch full user details, returning basic data:', error);
        return response.data.user || response.data;
      }
    }
    return response.data.user || response.data;
  },

  /**
   * Update user (admin only)
   * @param {string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} Updated user
   */
  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  /**
   * Delete user (admin only)
   * @param {string} id - User ID
   * @returns {Promise} Deletion result
   */
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  /**
   * Get user statistics (attacks reported, etc.)
   * This would need a backend endpoint - for now we'll calculate from attacks
   */
  getStatistics: async (userId) => {
    // This would ideally be a backend endpoint like /users/:id/statistics
    // For now, we'll need to fetch attacks and calculate
    try {
      const response = await api.get('/attacks', {
        params: { reported_by: userId }
      });
      const attacks = response.data.attacks || [];
      return {
        attacks_reported: attacks.length,
        attacks_resolved: attacks.filter(a => a.status === 'Resolved').length,
        average_severity: attacks.reduce((sum, a) => {
          const severityScores = { Low: 1, Medium: 2, High: 3, Critical: 4 };
          return sum + (severityScores[a.severity] || 0);
        }, 0) / (attacks.length || 1)
      };
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      return { attacks_reported: 0, attacks_resolved: 0, average_severity: 0 };
    }
  }
};

