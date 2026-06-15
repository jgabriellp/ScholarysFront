import client from './client';

export const getRelatosByTurmaAno = (turmaId, anoLetivoId) =>
  client.get(`/api/relatoAula/turma/${turmaId}/ano/${anoLetivoId}`);

export const saveRelato = (data) =>
  client.post('/api/relatoAula', data);
