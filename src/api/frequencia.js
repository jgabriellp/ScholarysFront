import client from './client';

export const getFrequenciaByTurmaData = (turmaId, data) =>
  client.get(`/api/frequencia/turma/${turmaId}/data/${data}`);

export const lancaFrequencia = (data) =>
  client.post('/api/frequencia', data);
