import client from './client';

export const getDiarioMaternal = (alunoId, anoLetivoId) =>
  client.get(`/api/diario/maternal/aluno/${alunoId}/ano/${anoLetivoId}`);

export const getDiarioFundamental = (alunoId, anoLetivoId) =>
  client.get(`/api/diario/fundamental/aluno/${alunoId}/ano/${anoLetivoId}`);
