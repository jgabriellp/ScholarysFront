# Scholarys — Frontend

Interface web do sistema de gestão escolar Scholarys, construída em React + Vite. Consome a API REST **SchoolAPI** (.NET 8) rodando localmente.

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | UI e gerenciamento de estado |
| Vite | 8 | Bundler e dev server |
| React Bootstrap | 2.x | Componentes de UI (Cards, Tables, Modals, Forms…) |
| Bootstrap | 5.3 | Base de estilos |
| Tailwind CSS | 3.x | Classes utilitárias de layout e sidebar |
| Axios | 1.x | Cliente HTTP |
| React Router DOM | 7 | Roteamento SPA |
| lucide-react | latest | Ícones |

---

## Pré-requisitos

- Node.js 18+
- API SchoolAPI rodando em `http://localhost:5009`

---

## Instalação e execução

```bash
npm install
npm run dev
```

O app estará disponível em `http://localhost:5173`.

---

## Estrutura de pastas

```
src/
├── api/                  # Módulos Axios por recurso da API
│   ├── client.js         # Instância Axios com interceptors de JWT e 401
│   ├── auth.js
│   ├── anoLetivo.js
│   ├── turmas.js
│   ├── disciplinas.js
│   ├── usuarios.js
│   ├── alunos.js
│   ├── vinculos.js
│   ├── frequencia.js
│   ├── notas.js
│   ├── desenvolvimentoMaternal.js
│   ├── diasLetivos.js
│   ├── relatoAula.js
│   └── diario.js
├── components/
│   ├── Layout.jsx        # Sidebar retrátil + Outlet
│   └── PrivateRoute.jsx  # Guard de autenticação e autorização por role
├── contexts/
│   └── AuthContext.jsx   # Estado global de autenticação (user, signIn, signOut)
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── AnoLetivo.jsx
│   ├── Turmas.jsx
│   ├── Disciplinas.jsx
│   ├── Usuarios.jsx
│   ├── Alunos.jsx
│   ├── Vinculos.jsx
│   ├── Frequencia.jsx
│   ├── Notas.jsx
│   ├── Maternal.jsx
│   ├── RelatoAula.jsx
│   └── Diario.jsx
├── utils/
│   └── constants.js      # Enums de roles e segmentos
├── App.jsx               # Rotas e guards
├── main.jsx
└── index.css             # Tailwind + estilos sidebar + @media print
```

---

## Autenticação

O login é feito via `POST /api/auth/login`. A resposta retorna:

```json
{
  "token": "...",
  "userName": "...",
  "userEmail": "...",
  "userRole": 0,
  "userId": 1
}
```

Esses dados são persistidos em `localStorage` (`token` e `user`) e gerenciados pelo `AuthContext`. Todas as requisições subsequentes incluem automaticamente o header `Authorization: Bearer {token}` via interceptor do Axios. Em caso de resposta `401`, o interceptor limpa o localStorage e redireciona para `/login`.

### Estrutura do usuário em contexto

```js
{
  token: string,
  nome: string,
  email: string,
  role: number,   // ver tabela de roles abaixo
  id: number,
}
```

---

## Roles e permissões

| Valor | Label | Acesso |
|---|---|---|
| `0` | Admin | Tudo, incluindo gestão de usuários e anos letivos |
| `1` | Diretor | Gestão (turmas, alunos, vínculos) + acadêmico |
| `2` | Coordenador | Gestão (turmas, alunos, vínculos) + acadêmico |
| `3` | Professor | Acadêmico (frequência, notas, maternal, relato) + alunos |
| `4` | Aluno | Apenas dashboard e diário |

### Grupos de acesso usados nas rotas

```js
const adminOnly = [Admin]                              // /anoletivo, /usuarios
const gestao    = [Admin, Diretor, Coordenador]        // /turmas, /disciplinas, /vinculos
const academico = [Admin, Diretor, Coordenador,
                   Professor]                          // /frequencia, /notas, /relato-aula
```

O `PrivateRoute` redireciona para `/login` se não autenticado, ou para `/` se autenticado mas sem permissão para a rota.

---

## Segmentos

| Valor | Label |
|---|---|
| `0` | Maternal |
| `1` | Fundamental |

O segmento é aplicado tanto em **Turmas** quanto em **Disciplinas** e determina quais módulos acadêmicos estão disponíveis (desenvolvimento maternal vs. notas por unidade).

---

## Sidebar

A sidebar é retrátil. Um botão circular na borda direita alterna entre os dois estados:

| Estado | Largura | Exibição |
|---|---|---|
| Expandido | `w-64` | Ícone + rótulo de texto, seções de separação, nome/cargo do usuário |
| Recolhido | `w-16` | Apenas ícones centralizados, tooltip nativo (`title`) ao passar o mouse |

### Menu condicional para Professor

Ao fazer login como Professor, o `Layout` chama `GET /api/turma/professor/{id}` e verifica os segmentos das turmas vinculadas:

| Situação | Notas | Desenvolvimento Maternal |
|---|---|---|
| Professor com turmas só Fundamental | ✅ | ❌ |
| Professor com turmas só Maternal | ❌ | ✅ |
| Professor com turmas de ambos | ✅ | ✅ |
| Admin / Diretor / Coordenador | ✅ | ✅ |

---

## Módulos

### Cadastro (gestão)

#### Ano Letivo `/anoletivo`
- **Acesso:** Admin
- CRUD completo. Campo: `ano` (número inteiro, ex: 2026).
- Deve ser criado antes de turmas.

#### Turmas `/turmas`
- **Acesso:** Gestão
- CRUD completo. Campos: `nome`, `segmento` (Maternal/Fundamental), `anoLetivoId`.
- Requer ao menos um Ano Letivo cadastrado.

#### Disciplinas `/disciplinas`
- **Acesso:** Gestão (Admin, Diretor, Coordenador). Professor não tem acesso a este módulo.
- CRUD completo. Campos: `nome`, `segmento` (Maternal/Fundamental).
- O segmento determina em quais contextos a disciplina aparece (ex: disciplinas Maternal não aparecem na tela de Notas).

#### Usuários `/usuarios`
- **Acesso:** Admin
- CRUD com paginação (10 por página). Campos: `nome`, `email`, `senha`, `role`.
- A senha é obrigatória tanto na criação quanto na edição (API não suporta atualização parcial).
- Soft delete: o campo `ativo` é setado como `false`.

#### Alunos `/alunos`
- **Acesso:** Gestão + Professor
- CRUD com paginação. Campos: `nome`, `numeroChamada`, `dataNascimento`, `turmaId`, `anoLetivoId`, `userId`.
- O campo `userId` vincula o aluno a uma conta de usuário com role `4` (Aluno).
- Requer turmas e usuários com role Aluno cadastrados.

#### Vínculos `/vinculos`
- **Acesso:** Gestão
- Vincula um Professor a uma Disciplina em uma Turma/Ano Letivo.
- Sem edição: para alterar um vínculo, deletar e recriar.
- A listagem é filtrada por turma selecionada.

---

### Acadêmico (operacional)

#### Frequência `/frequencia`
- **Acesso:** Acadêmico
- Filtros: turma (filtrada por professor quando role=Professor), ano letivo, data (padrão: hoje).
- Ao selecionar turma + data, carrega os alunos e tenta buscar frequência existente para a data. Se não houver registro, todos ficam marcados como presentes.
- Toggle por aluno (switch Presente/Falta) com destaque vermelho na linha.
- **Campo de justificativa de falta:** ao marcar um aluno como ausente, aparece um input de texto para registrar a observação (ex: "Atestado médico"). As observações existentes são carregadas junto com as presenças e salvas no payload do `POST /api/frequencia`.
- Botões rápidos: "Todos presentes" / "Todos faltaram".
- Salva via `POST /api/frequencia` (upsert na API — a mesma rota cria ou atualiza).

#### Notas `/notas`
- **Acesso:** Acadêmico
- Filtros: ano letivo, turma, disciplina, unidade (1–6 + recuperação final).
- **Turmas Maternal são excluídas** da lista — notas são exclusivas do segmento Fundamental.
- **Para Professor:** ao selecionar a turma, o select de disciplinas é preenchido apenas com as disciplinas que o professor leciona naquela turma, consultando `GET /api/turmadisciplinaprofessor/turma/{id}` e filtrando por `professorId`. Para outros roles, todas as disciplinas são exibidas.
- Ao selecionar os filtros, carrega alunos e notas existentes para a unidade escolhida.
- Input numérico por aluno (0–10, passo 0.1). Campo fica vermelho se nota < 6.
- Salva apenas alunos com campo preenchido via `POST /api/nota` (upsert).
- As médias (1º semestre, 2º semestre, anual, final) são calculadas pela API, não pelo frontend.

**Mapeamento de unidades:**

| Unidade | Semestre |
|---|---|
| 1, 2, 3 | 1º Semestre |
| 4, 5, 6 | 2º Semestre |
| 7 | Recuperação Final |

#### Desenvolvimento Maternal `/maternal`
- **Acesso:** Admin, Professor (com turmas Maternal)
- Exibe apenas turmas do segmento `Maternal`.
- Filtros: turma, ano letivo, aluno.
- 4 textareas, uma por bimestre. Carrega registros existentes ao selecionar o aluno.
- Salva apenas bimestres com conteúdo preenchido via `POST /api/desenvolvimentomaternal` (upsert).

#### Relato de Aula `/relato-aula`
- **Acesso:** Acadêmico
- Filtros: ano letivo, turma (filtrada por professor quando role=Professor).
- Lista todos os dias letivos do ano com status **Registrado** / **Pendente** e preview truncado do texto.
- Ao clicar em um dia, abre modal com textarea para redigir ou editar o relato.
- Salva via `POST /api/relatoAula` (upsert).
- **Exportar PDF:** gera um documento HTML com a tabela completa de relatos (data, nº da aula, resumo de atividade, coluna de rúbrica) e chama `window.print()` em uma nova aba. Não utiliza bibliotecas externas.

#### Diário `/diario`
- **Acesso:** Todos autenticados
- Filtros: turma, ano letivo, aluno.
- Detecta o segmento da turma e chama o endpoint correto:
  - Maternal → `GET /api/diario/maternal/{alunoId}/{anoLetivoId}`
  - Fundamental → `GET /api/diario/fundamental/{alunoId}/{anoLetivoId}`
- Exibe:
  - **Cabeçalho:** nome, número de chamada, turma, ano, badge de segmento e resultado geral.
  - **Frequência:** percentual total, total de faltas, breakdown por mês com dias de falta.
  - **Notas** (Fundamental): tabela com U1–U6, médias de semestre, média anual, recuperação, média final e resultado por disciplina.
  - **Desenvolvimentos** (Maternal): cards com descrição por bimestre.
- Botão **Exportar PDF** chama `window.print()`. O `@media print` em `index.css` oculta toda a UI e exibe apenas `#diario-content`.

---

## Camada de API (`src/api/`)

Todos os módulos exportam funções que retornam promises do Axios. A paginação padrão dos endpoints de listagem é `pageSize=100` (suficiente para selects de combos). Endpoints de lançamento (frequência, nota, desenvolvimento, relato) sempre usam `POST` pois a API implementa upsert.

| Arquivo | Endpoints principais |
|---|---|
| `client.js` | Interceptors de auth e 401 |
| `auth.js` | `POST /api/auth/login` |
| `anoLetivo.js` | CRUD `/api/anoletivo` |
| `turmas.js` | CRUD `/api/turma` · `GET /api/turma/professor/{id}` · `GET /api/turma/ano-letivo/{id}` |
| `disciplinas.js` | CRUD `/api/disciplina` |
| `usuarios.js` | CRUD `/api/user` |
| `alunos.js` | CRUD `/api/aluno` · `GET /api/aluno/turma/{id}` |
| `vinculos.js` | `POST/DELETE /api/turmadisciplinaprofessor` · `GET /api/turmadisciplinaprofessor/turma/{id}` |
| `frequencia.js` | `POST /api/frequencia` · `GET /api/frequencia/turma/{id}/data/{data}` |
| `notas.js` | `POST /api/nota` · `GET /api/nota/turma/{t}/disciplina/{d}/ano/{a}` |
| `desenvolvimentoMaternal.js` | `POST /api/desenvolvimentomaternal` · `GET /api/desenvolvimentomaternal/aluno/{a}/ano/{ano}` |
| `diasLetivos.js` | `GET /api/diaLetivo/ano-letivo/{id}` · `POST /api/diaLetivo/lote` · `DELETE /api/diaLetivo/{id}` |
| `relatoAula.js` | `POST /api/relatoAula` · `GET /api/relatoAula/turma/{t}/ano/{a}` |
| `diario.js` | `GET /api/diario/maternal/{a}/{ano}` · `GET /api/diario/fundamental/{a}/{ano}` |

---

## Padrões de implementação

### Cancelamento de requisições assíncronas

Páginas com múltiplas dependências de filtro usam flag `cancelled` para evitar `setState` em componentes desmontados:

```js
useEffect(() => {
  let cancelled = false;
  async function load() {
    const data = await fetchSomething();
    if (!cancelled) setState(data);
  }
  load();
  return () => { cancelled = true; };
}, [dep]);
```

### Carregamento paralelo

`Promise.all` é usado quando múltiplas requisições independentes podem ser disparadas simultaneamente (ex: carregar turmas + anos letivos + disciplinas no mount).

### Upsert nos lançamentos

Os endpoints de frequência, notas, desenvolvimento maternal e relato de aula aceitam `POST` para criar ou atualizar. O frontend sempre usa `POST`, sem lógica de diferenciação create/update.

### Soft delete

Usuários, turmas e alunos têm o campo `ativo`. O delete na API seta `ativo = false`; o frontend remove o item da lista localmente após confirmação.

---

## Fluxo recomendado de cadastro

A sequência abaixo respeita as dependências entre entidades:

1. **Ano Letivo** — base para tudo
2. **Turmas** — dependem do ano letivo e do segmento
3. **Disciplinas** — independentes, mas com segmento definido
4. **Usuários** — criar contas com roles adequados (Admin, Professor, Aluno…)
5. **Alunos** — vinculam um usuário role=Aluno a uma turma/ano
6. **Vínculos** — associam Professor + Disciplina + Turma/Ano
7. **Dias Letivos** — calendário do ano (POST /lote)
8. **Lançamentos** — Frequência, Notas, Desenvolvimento Maternal, Relato de Aula

---

## Exportação de PDF

### Diário

O diário usa `window.print()` com CSS nativo, sem dependências adicionais. O conteúdo a ser impresso deve estar dentro de `<div id="diario-content">`. O `@media print` em `index.css`:

- Oculta todos os elementos da página (`body * { visibility: hidden }`)
- Exibe somente `#diario-content` e seus filhos
- Remove sombras e ajusta bordas para impressão
- Evita quebra de página dentro de cards e linhas de tabela

### Relato de Aula

O relato usa uma abordagem diferente: gera um documento HTML completo em memória com estilos inline, abre numa nova aba via `window.open` e chama `print()`. Isso permite um layout de tabela dedicado (data, nº da aula, resumo, rúbrica) sem depender do CSS global da aplicação.

---

## Variáveis de ambiente

Atualmente a base URL da API está hardcoded em `src/api/client.js`:

```js
baseURL: 'http://localhost:5009'
```

Para ambientes diferentes, extraia para `.env`:

```env
VITE_API_URL=http://localhost:5009
```

```js
baseURL: import.meta.env.VITE_API_URL
```
