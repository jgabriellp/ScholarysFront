import client from './client';

export const getDisciplinas = (page = 1, pageSize = 100) =>
  client.get('/api/disciplina', { params: { page, pageSize } });

export const createDisciplina = (data) =>
  client.post('/api/disciplina', data);

export const updateDisciplina = (id, data) =>
  client.put(`/api/disciplina/${id}`, data);

export const deleteDisciplina = (id) =>
  client.delete(`/api/disciplina/${id}`);
