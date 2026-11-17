import client from './client';

export const getTurmas = (page = 1, pageSize = 100) =>
  client.get('/api/turma', { params: { page, pageSize } });

export const getTurmasByAnoLetivo = (anoLetivoId) =>
  client.get(`/api/turma/ano-letivo/${anoLetivoId}`);

// Sempre envie anoLetivoId: sem ele o backend mistura turmas de todos os anos
export const getTurmasByProfessor = (professorId, anoLetivoId) =>
  client.get(`/api/turma/professor/${professorId}`, {
    params: anoLetivoId ? { anoLetivoId } : {},
  });

export const createTurma = (data) =>
  client.post('/api/turma', data);

export const updateTurma = (id, data) =>
  client.put(`/api/turma/${id}`, data);

export const deleteTurma = (id) =>
  client.delete(`/api/turma/${id}`);
