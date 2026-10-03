import client from './client';

export const getDiasLetivosByAno = (anoLetivoId, segmento, filtros = {}) => {
  const params = {};
  if (segmento !== undefined && segmento !== null) params.segmento = segmento;
  if (filtros.turmaId && filtros.professorId) {
    params.turmaId = filtros.turmaId;
    params.professorId = filtros.professorId;
  }
  return client.get(`/api/diaLetivo/ano-letivo/${anoLetivoId}`, { params });
};

export const createDiasLetivosLote = (data) =>
  client.post('/api/diaLetivo/lote', data);

export const deleteDiaLetivo = (id) =>
  client.delete(`/api/diaLetivo/${id}`);
