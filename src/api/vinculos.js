import client from './client';

export const getVinculosByTurma = (turmaId) =>
  client.get(`/api/turmadisciplinaprofessor/turma/${turmaId}`);

// O backend não filtra por ano neste endpoint: filtra no front pelo anoLetivoId
export const getVinculosByProfessor = async (professorId, anoLetivoId) => {
  const res = await client.get(`/api/turmadisciplinaprofessor/professor/${professorId}`);
  const lista = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
  return anoLetivoId
    ? lista.filter((v) => String(v.anoLetivoId) === String(anoLetivoId))
    : lista;
};

export const createVinculo = (data) =>
  client.post('/api/turmadisciplinaprofessor', data);

export const updateVinculo = (id, data) =>
  client.put(`/api/turmadisciplinaprofessor/${id}`, data);

export const deleteVinculo = (id) =>
  client.delete(`/api/turmadisciplinaprofessor/${id}`);
