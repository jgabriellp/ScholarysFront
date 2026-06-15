import client from './client';

export const getDiasLetivosByAno = (anoLetivoId) =>
  client.get(`/api/diaLetivo/ano-letivo/${anoLetivoId}`);

export const createDiasLetivosLote = (data) =>
  client.post('/api/diaLetivo/lote', data);

export const deleteDiaLetivo = (id) =>
  client.delete(`/api/diaLetivo/${id}`);
