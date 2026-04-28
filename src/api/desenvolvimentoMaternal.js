import client from './client';

export const getDesenvolvimentoByAlunoAno = (alunoId, anoLetivoId) =>
  client.get(`/api/desenvolvimentomaternal/aluno/${alunoId}/ano/${anoLetivoId}`);

export const lancaDesenvolvimento = (data) =>
  client.post('/api/desenvolvimentomaternal', data);
