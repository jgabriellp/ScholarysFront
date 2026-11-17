import client from './client';

export const getAnoLetivos = (page = 1, pageSize = 100) =>
  client.get('/api/anoletivo', { params: { page, pageSize } });

// Ano corrente definido pelo backend (ano letivo igual ao ano atual; vira sozinho em 01/01)
export const getAnoLetivoAtivo = () =>
  client.get('/api/anoletivo/ativo');

/**
 * Carrega os anos letivos para os seletores e o ano corrente (padrão das telas).
 * Nunca usar o "maior ano" da lista como padrão: com 2027 já cadastrado para
 * matrículas, as telas abririam no ano seguinte.
 * Retorna { anos, anoCorrenteId } — anoCorrenteId é string ('' se não houver).
 */
export async function carregarAnosLetivos() {
  const [listaRes, ativoRes] = await Promise.allSettled([
    getAnoLetivos(),
    getAnoLetivoAtivo(),
  ]);

  let anos = listaRes.status === 'fulfilled' ? (listaRes.value.data.data ?? []) : [];
  const ativo = ativoRes.status === 'fulfilled' ? ativoRes.value.data : null;

  if (ativo && !anos.some((a) => a.id === ativo.id)) anos = [ativo, ...anos];

  const anoCorrente =
    ativo ?? anos.find((a) => a.ano === new Date().getFullYear()) ?? null;

  return { anos, anoCorrenteId: anoCorrente ? String(anoCorrente.id) : '' };
}

export async function getAnoLetivoCorrenteId() {
  try {
    const { data } = await getAnoLetivoAtivo();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export const createAnoLetivo = (data) =>
  client.post('/api/anoletivo', data);

export const updateAnoLetivo = (id, data) =>
  client.put(`/api/anoletivo/${id}`, data);

export const deleteAnoLetivo = (id) =>
  client.delete(`/api/anoletivo/${id}`);
