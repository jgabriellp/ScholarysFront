import client from './client';

// Sem anoLetivoId o backend devolve os números do ano corrente
export const getDashboard = (anoLetivoId) =>
  client.get('/api/Dashboard', { params: anoLetivoId ? { anoLetivoId } : {} });
