import client from './client';

export const getUsuarios = (page = 1, pageSize = 10) =>
  client.get('/api/user', { params: { page, pageSize } });

export const getAllUsuarios = () =>
  client.get('/api/user', { params: { page: 1, pageSize: 200 } });

export const createUsuario = (data) =>
  client.post('/api/user', data);

export const updateUsuario = (id, data) =>
  client.put(`/api/user/${id}`, data);

export const deleteUsuario = (id) =>
  client.delete(`/api/user/${id}`);
