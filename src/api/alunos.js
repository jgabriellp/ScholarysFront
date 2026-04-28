import client from './client';

export const getAlunos = (page = 1, pageSize = 10) =>
  client.get('/api/aluno', { params: { page, pageSize } });

export const createAluno = (data) =>
  client.post('/api/aluno', data);

export const updateAluno = (id, data) =>
  client.put(`/api/aluno/${id}`, data);

export const deleteAluno = (id) =>
  client.delete(`/api/aluno/${id}`);
