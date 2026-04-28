import client from './client';

export const getNotasByTurmaDisciplinaAno = (turmaId, disciplinaId, anoLetivoId) =>
  client.get(`/api/nota/turma/${turmaId}/disciplina/${disciplinaId}/ano/${anoLetivoId}`);

export const lancaNota = (data) =>
  client.post('/api/nota', data);
