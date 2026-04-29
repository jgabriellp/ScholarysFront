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
│   └── diario.js
├── components/
│   ├── Layout.jsx        # Sidebar + Outlet
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
| `3` | Professor | Acadêmico (frequência, notas, maternal) + alunos |
| `4` | Aluno | Apenas dashboard e diário |

### Grupos de acesso usados nas rotas

```js
const adminOnly = [Admin]                              // /anoletivo, /usuarios
const gestao    = [Admin, Diretor, Coordenador]        // /turmas, /vinculos
const academico = [Admin, Diretor, Coordenador,
                   Professor]                          // /frequencia, /notas
```

O `PrivateRoute` redireciona para `/login` se não autenticado, ou para `/` se autenticado mas sem permissão para a rota.

---

## Segmentos de turma

| Valor | Label |
|---|---|
| `0` | Maternal |
| `1` | Fundamental |

O segmento determina quais módulos acadêmicos são exibidos (desenvolvimento maternal vs. notas por unidade).

---

## Módulos

### Cadastro (gestão)

#### Ano Letivo `/anoletivo`
- **Acesso:** Admin
- CRUD completo. Campo: `ano` (número inteiro, ex: 2025).
- Deve ser criado antes de turmas.

#### Turmas `/turmas`
- **Acesso:** Gestão
- CRUD completo. Campos: `nome`, `segmento` (Maternal/Fundamental), `anoLetivoId`.
- Requer ao menos um Ano Letivo cadastrado.

#### Disciplinas `/disciplinas`
- **Acesso:** Todos autenticados
- CRUD completo. Campo: `nome`.

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
- Filtros: turma, ano letivo, data (padrão: hoje).
- Ao selecionar turma + data, carrega os alunos e tenta buscar frequência existente para a data. Se não houver registro, todos ficam marcados como presentes.
- Toggle por aluno (switch Presente/Falta) com destaque vermelho na linha.
- Botões rápidos: "Todos presentes" / "Todos faltaram".
- Salva via `POST /api/frequencia` (upsert na API — a mesma rota cria ou atualiza).

#### Notas `/notas`
- **Acesso:** Acadêmico
- Filtros: turma, disciplina, ano letivo, unidade (1–6 + recuperação final).
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
- **Acesso:** Admin, Professor
- Exibe apenas turmas do segmento `Maternal`.
- Filtros: turma, ano letivo, aluno.
- 4 textareas, uma por bimestre. Carrega registros existentes ao selecionar o aluno.
- Salva apenas bimestres com conteúdo preenchido via `POST /api/desenvolvimentomaternal` (upsert).

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

Todos os módulos exportam funções que retornam promises do Axios. A paginação padrão dos endpoints de listagem é `pageSize=100` (suficiente para selects de combos). Endpoints de lançamento (frequência, nota, desenvolvimento) sempre usam `POST` pois a API implementa upsert.

| Arquivo | Endpoints principais |
|---|---|
| `client.js` | Interceptors de auth e 401 |
| `auth.js` | `POST /api/auth/login` |
| `anoLetivo.js` | CRUD `/api/anoletivo` |
| `turmas.js` | CRUD `/api/turma` |
| `disciplinas.js` | CRUD `/api/disciplina` |
| `usuarios.js` | CRUD `/api/usuario` |
| `alunos.js` | CRUD `/api/aluno` + `GET /api/aluno/turma/{id}` |
| `vinculos.js` | CRUD `/api/vinculo` |
| `frequencia.js` | `POST /api/frequencia` · `GET /api/frequencia/turma/{id}/data/{data}` |
| `notas.js` | `POST /api/nota` · `GET /api/nota/turma/{t}/disciplina/{d}/anoletivo/{a}` |
| `desenvolvimentoMaternal.js` | `POST /api/desenvolvimentomaternal` · `GET /api/desenvolvimentomaternal/aluno/{a}/anoletivo/{ano}` |
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

Os endpoints de frequência, notas e desenvolvimento maternal aceitam `POST` para criar ou atualizar. O frontend sempre usa `POST`, sem lógica de diferenciação create/update.

### Soft delete

Usuários, turmas e alunos têm o campo `ativo`. O delete na API seta `ativo = false`; o frontend remove o item da lista localmente após confirmação.

---

## Fluxo recomendado de cadastro

A sequência abaixo respeita as dependências entre entidades:

1. **Ano Letivo** — base para tudo
2. **Turmas** — dependem do ano letivo e do segmento
3. **Disciplinas** — independentes
4. **Usuários** — criar contas com roles adequados (Admin, Professor, Aluno…)
5. **Alunos** — vinculam um usuário role=Aluno a uma turma/ano
6. **Vínculos** — associam Professor + Disciplina + Turma/Ano
7. **Lançamentos** — Frequência, Notas, Desenvolvimento Maternal

---

## Exportação de PDF (Diário)

O diário usa `window.print()` com CSS nativo, sem dependências adicionais. O conteúdo a ser impresso deve estar dentro de `<div id="diario-content">`. O `@media print` em `index.css`:

- Oculta todos os elementos da página (`body * { visibility: hidden }`)
- Exibe somente `#diario-content` e seus filhos
- Remove sombras e ajusta bordas para impressão
- Evita quebra de página dentro de cards e linhas de tabela

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
