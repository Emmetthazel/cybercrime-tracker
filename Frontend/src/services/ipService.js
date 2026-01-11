import api from './api';

/**
 * Service pour gérer les IPs
 */

// Get all IPs
export const getAllIPs = async (params = {}) => {
  const response = await api.get('/ips', { params });
  return response.data;
};

// Get IP by ID
export const getIPById = async (id) => {
  const response = await api.get(`/ips/${id}`);
  return response.data;
};

// Get IP by address
export const getIPByAddress = async (address) => {
  const response = await api.get(`/ips/address/${address}`);
  return response.data;
};

// Create or update IP
export const createOrUpdateIP = async (ipData) => {
  const response = await api.post('/ips', ipData);
  return response.data;
};

// Update IP
export const updateIP = async (id, ipData) => {
  const response = await api.put(`/ips/${id}`, ipData);
  return response.data;
};

// Delete IP
export const deleteIP = async (id) => {
  const response = await api.delete(`/ips/${id}`);
  return response.data;
};

// Get top dangerous IPs
export const getTopDangerousIPs = async (limit = 20) => {
  const response = await api.get('/ips/top-dangerous', { params: { limit } });
  return response.data;
};

// Enrich IP with external APIs
export const enrichIP = async (id) => {
  const response = await api.post(`/ips/${id}/enrich`);
  return response.data;
};

// Check IP manually with Threat Intelligence APIs (Option A from ChatGPT)
export const checkIP = async (ipAddress, source = 'all') => {
  const response = await api.post('/ips/check', {
    ip_address: ipAddress,
    source: source
  });
  return response.data;
};
