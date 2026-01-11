import api from './api';

/**
 * Service pour gérer les sources de Threat Intelligence
 */

// Get all sources
export const getAllSources = async () => {
  const response = await api.get('/sources');
  return response.data;
};

// Get source by ID
export const getSourceById = async (id) => {
  const response = await api.get(`/sources/${id}`);
  return response.data;
};

// Create source
export const createSource = async (sourceData) => {
  const response = await api.post('/sources', sourceData);
  return response.data;
};

// Update source
export const updateSource = async (id, sourceData) => {
  const response = await api.put(`/sources/${id}`, sourceData);
  return response.data;
};

// Delete source
export const deleteSource = async (id) => {
  const response = await api.delete(`/sources/${id}`);
  return response.data;
};

// Sync a specific source
export const syncSource = async (id) => {
  const response = await api.post(`/sources/${id}/sync`);
  return response.data;
};

// Sync all sources
export const syncAllSources = async () => {
  const response = await api.post('/sources/sync/all');
  return response.data;
};

// Get ingestion statistics
export const getIngestionStats = async () => {
  const response = await api.get('/sources/stats/ingestion');
  return response.data;
};

// Get active sources
export const getActiveSources = async () => {
  const response = await api.get('/sources/stats/active');
  return response.data;
};
