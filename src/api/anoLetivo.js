import client from './client';

export const getAnoLetivos = (page = 1, pageSize = 100) =>
  client.get('/api/anoletivo', { params: { page, pageSize } });

export const getAnoLetivoAtivo = () =>
  client.get('/api/anoletivo/ativo');

// Tenta a lista completa; se 403 (não-Admin), cai no ano ativo
export async function getAnosLetivosAccessivel() {
  try {
    const { data } = await getAnoLetivos();
    return data.data;
  } catch {
    const { data } = await getAnoLetivoAtivo();
    return [data];
  }
}

export const createAnoLetivo = (data) =>
  client.post('/api/anoletivo', data);

export const updateAnoLetivo = (id, data) =>
  client.put(`/api/anoletivo/${id}`, data);

export const deleteAnoLetivo = (id) =>
  client.delete(`/api/anoletivo/${id}`);
