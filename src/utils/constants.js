export const ROLES = {
  Admin: 0,
  Diretor: 1,
  Coordenador: 2,
  Professor: 3,
  Aluno: 4,
};

export const ROLE_LABELS = {
  0: 'Admin',
  1: 'Diretor',
  2: 'Coordenador',
  3: 'Professor',
  4: 'Aluno',
};

export const SEGMENTOS = {
  Maternal: 0,
  Fundamental: 1,
};

export const SEGMENTO_LABELS = {
  0: 'Maternal',
  1: 'Fundamental',
};

export const SEGMENTO_OPTIONS = [
  { value: 0, label: 'Maternal' },
  { value: 1, label: 'Fundamental' },
];

export const SEGMENTO_COLORS = { 0: 'warning', 1: 'primary' };

// Padrão DayOfWeek (.NET): 0 = domingo ... 6 = sábado
export const DIAS_SEMANA_OPTIONS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
];

export const DIAS_SEMANA_LABELS = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
};
