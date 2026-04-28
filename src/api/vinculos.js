import client from './client';

export const getVinculosByTurma = (turmaId) =>
  client.get(`/api/turmadisciplinaprofessor/turma/${turmaId}`);

export const createVinculo = (data) =>
  client.post('/api/turmadisciplinaprofessor', data);

export const deleteVinculo = (id) =>
  client.delete(`/api/turmadisciplinaprofessor/${id}`);
