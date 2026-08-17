# imc-manager

Sistema web para uma academia acompanhar a evolução do IMC (Índice de Massa Corporal) dos seus alunos.

**Dono do projeto (aprova PRDs e RFCs):** Felipe Borba.

## Stack padrão

Salvo RFC aprovado dizendo o contrário, o projeto usa a stack padrão — decisão registrada no [RFC 0001](docs/rfcs/0001-stack-padrao.md):

- **Linguagem:** JavaScript puro (sem TypeScript), Node.js 24, imports absolutos via `jsconfig.json`
- **Backend:** Next.js API routes, versionadas em `pages/api/v1/`
- **Frontend:** React + Next.js (pages router)
- **Banco de dados:** PostgreSQL via Docker Compose em dev local; PostgreSQL gerenciado em homologação/produção
- **Migrations:** node-pg-migrate, em `infra/migrations/`
- **Testes:** Jest, integration-first (HTTP real contra `next dev`, banco real)

Regras decorrentes:

- **Seguir a stack padrão não exige RFC.** Desviar dela (outro framework, outro banco, dependência estrutural nova) exige.
- **Toda feature deve ser verificável localmente**, sem depender de infra de produção — banco e serviços sobem com `npm run services:up`.

## Convenções de código

Todo código segue [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — estrutura de pastas, idioma, tratamento de erros, padrão de testes, lint/format e commits. **Leia antes de implementar qualquer coisa.** Formatação e estilo não se discutem: Prettier e ESLint (configs na raiz) são a autoridade.

## Fluxo de desenvolvimento (obrigatório)

O processo canônico — ciclo, aprovação, statuses, convenção de commits e regras para agentes — está em [docs/WORKFLOW.md](docs/WORKFLOW.md). **Leia antes de qualquer mudança que não seja uma correção pequena.** Resumo mínimo:

| Tamanho da mudança                                                                   | O que fazer antes de codar                                                                                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Correção pequena** (bug, ajuste de texto/estilo)                                   | Nada — pode implementar direto.                                                                                    |
| **Feature nova**                                                                     | Mini-PRD em `docs/prds/` (template: [docs/templates/PRD.md](docs/templates/PRD.md)) aprovado pelo dono do projeto. |
| **Decisão técnica estrutural** (arquitetura, stack, banco, auth, dependência grande) | RFC em `docs/rfcs/` (template: [docs/templates/RFC.md](docs/templates/RFC.md)) aprovado pelo dono do projeto.      |

Arquivos nomeados como `docs/prds/NNNN-nome-da-feature.md` e `docs/rfcs/NNNN-titulo.md`, numeração sequencial e independente entre PRDs e RFCs.
