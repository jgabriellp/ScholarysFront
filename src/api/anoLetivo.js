import client from './client';

export const getAnoLetivos = (page = 1, pageSize = 100) =>
  client.get('/api/anoletivo', { params: { page, pageSize } });

export const createAnoLetivo = (data) =>
  client.post('/api/anoletivo', data);

export const updateAnoLetivo = (id, data) =>
  client.put(`/api/anoletivo/${id}`, data);

export const deleteAnoLetivo = (id) =>
  client.delete(`/api/anoletivo/${id}`);
