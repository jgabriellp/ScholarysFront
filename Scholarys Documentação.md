# Scholarys — Documentação do Sistema

> Sistema de Gestão Escolar desenvolvido para facilitar o acompanhamento acadêmico de alunos, o lançamento de registros pedagógicos e a geração de relatórios consolidados para gestores, professores e responsáveis.

---

## Visão Geral

O Scholarys centraliza toda a vida acadêmica de uma instituição de ensino em uma única plataforma web. Gestores têm visibilidade completa sobre turmas, vínculos e indicadores; professores acessam rapidamente as turmas em que lecionam para registrar frequências, notas e avaliações de desenvolvimento; alunos consultam seu próprio diário escolar a qualquer momento.

---

## Perfis de Usuário e Permissões

O sistema possui cinco perfis com acesso progressivamente mais restrito:

| Perfil | Nível de Acesso |
|---|---|
| **Administrador** | Acesso total — gerencia anos letivos, turmas, disciplinas, usuários, alunos e todos os lançamentos acadêmicos |
| **Diretor** | Visualização e relatórios — acessa todos os registros acadêmicos em modo leitura, sem poder alterar dados |
| **Coordenador** | Visualização e relatórios — mesmas permissões do Diretor |
| **Professor** | Lançamento — acessa apenas as turmas em que possui vínculo ativo; registra frequência, notas e desenvolvimento |
| **Aluno** | Consulta própria — acessa exclusivamente o seu Diário, com frequências, notas e avaliações consolidadas |

> **Importante:** o Professor nunca visualiza turmas de outros professores. Todos os filtros de turma são automáticos com base no vínculo cadastrado pela gestão.

---

## Módulo Acadêmico

O módulo Acadêmico é o coração operacional do Scholarys. É aqui que professores registram o dia a dia da sala de aula e que gestores acompanham o desempenho das turmas.

---

### Frequência

**O que é:** registro diário de presença e falta de cada aluno por turma.

**Como funciona:**

1. O professor seleciona o **Ano Letivo** e, em seguida, a **Turma** — o sistema exibe automaticamente apenas as turmas vinculadas àquele professor no ano escolhido.
2. A **Data** já vem preenchida com o dia atual; pode ser alterada para registrar frequências retroativas.
3. O sistema carrega a lista de alunos e, se já houver um registro para aquela data, exibe o estado salvo anteriormente.
4. Por padrão, todos os alunos são marcados como **Presentes**. O professor alterna individualmente para **Falta** ou usa os botões de atalho **"Todos presentes"** / **"Todos faltaram"**.
5. Ao clicar em **Salvar**, o registro é enviado e confirmado na tela.

**Regras de negócio:**

- Diretores e Coordenadores visualizam os registros em modo leitura (sem os botões de salvar e marcar).
- O registro funciona como **upsert**: salvar novamente para a mesma turma e data substitui o registro anterior — não cria duplicatas.
- A frequência acumulada do aluno ao longo do ano letivo é exibida no Diário.

---

### Notas

**O que é:** lançamento de notas por disciplina e unidade letiva para cada aluno da turma.

**Como funciona:**

1. O professor seleciona o **Ano Letivo**, a **Turma**, a **Disciplina** e a **Unidade** (1 a 6 + Recuperação Final).
2. O sistema carrega os alunos da turma e preenche automaticamente as notas já salvas para aquela combinação.
3. O professor insere valores de **0 a 10** (aceita decimais com uma casa, ex: 7,5). Notas abaixo de 6 são destacadas em vermelho.
4. Ao clicar em **Salvar Notas**, todos os valores preenchidos são enviados.

**Unidades disponíveis:**

| Código | Descrição |
|---|---|
| Unidade 1, 2, 3 | 1º Semestre |
| Unidade 4, 5, 6 | 2º Semestre |
| Recuperação Final | Recuperação anual |

**Regras de negócio:**

- Diretores e Coordenadores visualizam as notas em modo leitura.
- O sistema calcula médias semestrais e anuais automaticamente, exibidas no Diário do aluno.
- O lançamento também funciona como **upsert**: regravar a mesma unidade atualiza a nota existente.

---

### Desenvolvimento Bimestral (Maternal)

**O que é:** avaliação qualitativa do desenvolvimento individual de alunos do segmento **Maternal**, organizada por bimestre.

**Como funciona:**

1. O professor seleciona o **Ano Letivo** e a **Turma** — o sistema filtra automaticamente apenas turmas do segmento Maternal vinculadas àquele professor.
2. Em seguida, seleciona o **Aluno** dentro da turma.
3. São exibidos quatro campos de texto, um por bimestre (1º ao 4º). O professor descreve livremente o desenvolvimento da criança em cada período.
4. Ao clicar em **Salvar Desenvolvimento**, os bimestres preenchidos são enviados.

**Regras de negócio:**

- Exclusivo para turmas do segmento **Maternal**. Turmas do Fundamental não aparecem nesta tela.
- Apenas Admin e Professor podem realizar lançamentos. Demais perfis não têm acesso a esta seção.
- O conteúdo descrito é exibido integralmente no Diário do aluno.

---

### Diário

**O que é:** relatório consolidado e individual de cada aluno, reunindo frequência acumulada, notas por disciplina e avaliações de desenvolvimento em um único documento.

**Como funciona — Professores e Gestores:**

1. Selecionam o **Ano Letivo** e a **Turma** (professor vê apenas suas turmas).
2. Selecionam o **Aluno** dentro da turma.
3. O sistema monta o diário automaticamente de acordo com o segmento:
   - **Fundamental:** exibe tabela completa de notas (U1 a U6, médias semestrais, média anual, nota de recuperação, média final e resultado — Aprovado ou Reprovado), além do histórico de frequência por mês com total de faltas e dias específicos.
   - **Maternal:** exibe o histórico de frequência e as avaliações qualitativas por bimestre.

**Como funciona — Aluno:**

- O aluno acessa o Diário e o sistema carrega automaticamente o seu próprio registro, sem necessidade de selecionar turma ou aluno.
- Apenas o Diário fica visível na barra de navegação; nenhum outro módulo é exibido.

**Exportar PDF:**

- Com o diário carregado, o botão **"Exportar PDF"** aciona a impressão do documento diretamente pelo navegador.
- O layout de impressão exibe apenas o conteúdo do diário, ocultando menus e elementos de navegação.

**Regras de negócio:**

- O Diário é o único módulo acessível para o perfil Aluno.
- O conteúdo exibido é sempre o consolidado do ano letivo selecionado.
- O sistema identifica automaticamente se o aluno é do segmento Maternal ou Fundamental e exibe as seções correspondentes.

---

## Resumo de Acessos por Módulo Acadêmico

| Módulo | Admin | Diretor | Coordenador | Professor | Aluno |
|---|:---:|:---:|:---:|:---:|:---:|
| Frequência — visualizar | ✓ | ✓ | ✓ | ✓ | — |
| Frequência — lançar/editar | ✓ | — | — | ✓ | — |
| Notas — visualizar | ✓ | ✓ | ✓ | ✓ | — |
| Notas — lançar/editar | ✓ | — | — | ✓ | — |
| Desenvolvimento Maternal — visualizar | ✓ | — | — | ✓ | — |
| Desenvolvimento Maternal — lançar/editar | ✓ | — | — | ✓ | — |
| Diário — visualizar (qualquer aluno) | ✓ | ✓ | ✓ | ✓ (suas turmas) | — |
| Diário — visualizar (próprio) | — | — | — | — | ✓ |
| Exportar PDF do Diário | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Segmentos de Ensino

O Scholarys suporta dois segmentos com fluxos pedagógicos distintos:

| Segmento | Avaliação de notas | Avaliação de desenvolvimento | Frequência |
|---|:---:|:---:|:---:|
| **Fundamental** | ✓ (6 unidades + recuperação) | — | ✓ |
| **Maternal** | — | ✓ (4 bimestres, qualitativo) | ✓ |

---

## Fluxo Recomendado de Uso

```
Administrador cadastra:
  └─ Ano Letivo → Turmas → Disciplinas → Usuários → Alunos → Vínculos

Professor, a cada aula:
  └─ Frequência: seleciona turma e data → marca presença → salva

Professor, ao fim de cada unidade:
  └─ Notas: seleciona turma, disciplina e unidade → lança notas → salva

Professor maternal, a cada bimestre:
  └─ Desenvolvimento: seleciona turma e aluno → descreve → salva

Gestão / Aluno:
  └─ Diário: seleciona turma e aluno (ou acesso automático para Aluno)
              → visualiza ou exporta PDF
```

---

*Scholarys — Sistema de Gestão Escolar*
