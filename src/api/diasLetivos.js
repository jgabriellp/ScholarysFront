import client from './client';

export const getDiasLetivosByAno = (anoLetivoId, segmento) =>
  client.get(`/api/diaLetivo/ano-letivo/${anoLetivoId}`, {
    params: segmento !== undefined && segmento !== null ? { segmento } : {},
  });

export const createDiasLetivosLote = (data) =>
  client.post('/api/diaLetivo/lote', data);

export const deleteDiaLetivo = (id) =>
  client.delete(`/api/diaLetivo/${id}`);
