import api from './api';

export const dashboardService = {
  getOverview: async (days = 30) => {
    const response = await api.get('/dashboard/overview', { params: { days } });
    return response.data;
  },

  getTrends: async (days = 30, groupBy = 'day') => {
    const response = await api.get('/dashboard/trends', { 
      params: { days, group_by: groupBy } 
    });
    return response.data;
  },

  getTopCountries: async (days = 30, limit = 10) => {
    const response = await api.get('/dashboard/top-countries', { 
      params: { days, limit } 
    });
    return response.data;
  }
};

