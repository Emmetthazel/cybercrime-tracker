import api from './api';

export const attackService = {
  getAll: async (params = {}) => {
    const response = await api.get('/attacks', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/attacks/${id}`);
    return response.data;
  },

  create: async (attackData) => {
    const response = await api.post('/attacks', attackData);
    return response.data;
  },

  update: async (id, attackData) => {
    const response = await api.put(`/attacks/${id}`, attackData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/attacks/${id}`);
    return response.data;
  },

  getStatistics: async (params = {}) => {
    const response = await api.get('/attacks/statistics', { params });
    return response.data;
  }
};

