# Convenções de código

Este documento define **como o código deste projeto é escrito** — por pessoas ou por agentes de IA. As convenções seguem as práticas do [clone-tabnews](https://github.com/filipedeschamps/clone-tabnews) (curso.dev). O processo (PRD/RFC/aprovação) está em [WORKFLOW.md](WORKFLOW.md); a decisão de stack, no [RFC 0001](rfcs/0001-stack-padrao.md).

## Idioma

- **Código** (identificadores, nomes de arquivos, variáveis, funções): **inglês**.
- **Mensagens voltadas ao usuário** (erros com `message`/`action`, textos de UI): **português**.
- **Documentos** (PRDs, RFCs, comentários quando necessários) e **descrição de commits**: **português**. O tipo do commit (`feat:`, `fix:`) é o do Conventional Commits, em inglês.

## Estrutura de pastas

```text
infra/               ← código de infraestrutura, não de negócio
  compose.yaml       ← serviços locais (Postgres, mailcatcher) via Docker Compose
  database.js        ← acesso ao banco (única porta de entrada para queries)
  errors.js          ← classes de erro customizadas (ver seção Erros)
  controller.js      ← handlers compartilhados de erro/rota da API
  migrations/        ← migrations do node-pg-migrate
  scripts/           ← scripts utilitários (ex.: wait-for-postgres)
models/              ← regra de negócio; um módulo por conceito (user.js, session.js)
components/          ← design system + componentes compartilhados (RFC 0003); única casa de estilização
services/            ← acesso à API no frontend; httpClient.js é o único que conhece o transporte
hooks/               ← hooks de dados do frontend (tela chama hook; hook chama service)
styles/              ← globals.css: import do Tailwind, reset e tokens do design system
pages/               ← Next.js pages router
  api/v1/            ← API versionada; um index.js por rota
tests/
  orchestrator.js    ← sobe/espera serviços, limpa banco, roda migrations
  integration/       ← espelha as rotas da API; um arquivo por método HTTP
  unit/              ← só para lógica pura, sem I/O
docs/                ← processo, PRDs, RFCs (ver WORKFLOW.md)
```

- **`models/` não conhece HTTP.** Recebe e retorna dados puros; quem fala HTTP é `pages/api/`.
- **Todo acesso a banco passa por `infra/database.js`**, sempre com queries parametrizadas (`$1`, `$2`) — nunca interpolação de string.

## Imports

Imports absolutos a partir da raiz, habilitados por `jsconfig.json` (`baseUrl: "."`):

```js
import database from "infra/database.js";
import user from "models/user.js";
```

Nada de `../../..`.

## Tratamento de erros

Erros são classes customizadas em `infra/errors.js`, todas com o mesmo contrato:

```js
export class ValidationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Um erro de validação ocorreu.", { cause });
    this.name = "ValidationError";
    this.action = action || "Ajuste os dados enviados e tente novamente.";
    this.statusCode = 400;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
```

Regras:

- **`message` diz o que aconteceu; `action` diz o que o usuário deve fazer.** Ambos em português, acionáveis.
- **`cause` preserva o erro original** para depuração; nunca é exposto na resposta.
- **API nunca vaza erro cru.** `infra/controller.js` centraliza `onErrorHandler`/`onNoMatchHandler`: erros conhecidos respondem com seu `statusCode`; qualquer outro vira `InternalServerError` (500), logado com `console.error`.
- Erros novos seguem o mesmo contrato (`name`, `message`, `action`, `statusCode`, `toJSON`).

## API

- Rotas versionadas: `pages/api/v1/<recurso>/index.js`. Quebra de contrato → nova versão, não mudança silenciosa.
- Campos JSON de resposta em **snake_case** (`created_at`, `status_code`).
- Recursos no plural (`/users`), parâmetros dinâmicos com colchetes (`[username]/index.js`).

## Testes

Filosofia **integration-first**: o teste padrão sobe a aplicação de verdade e bate na API via `fetch`, com banco real — sem mock de banco ou de HTTP.

- Estrutura espelha as rotas: `tests/integration/api/v1/users/post.test.js` testa `POST /api/v1/users`. **Um arquivo por método HTTP.**
- Organização interna: `describe("POST /api/v1/users")` → `describe` por tipo de usuário (`"Anonymous user"`, `"Authenticated user"`) → `test("With unique and valid data")`, `test("With duplicated 'email'")`.
- Todo arquivo de integração começa com o orchestrator:

  ```js
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();
  });
  ```

- Asserções verificam o **corpo completo** da resposta (`expect(responseBody).toEqual({...})`), não campos isolados.
- `tests/unit/` apenas para lógica pura sem I/O (ex.: autorização, validadores).
- Fluxos multi-passo (cadastro → ativação → login) vivem em `tests/integration/_use-cases/`.
- **Critérios de aceitação do PRD viram testes ou verificação manual registrada** — ver WORKFLOW.md.

## Formatação e lint

**Estilo não se discute em review — a ferramenta decide.**

- **Prettier** com configuração padrão (sem `.prettierrc`) é a autoridade de formatação.
- **ESLint** flat config (`eslint.config.mjs`), com zero warnings tolerados (`--max-warnings 0`).
- `.editorconfig` cobre editores sem Prettier: 2 espaços, LF, newline final.
- Esses arquivos são criados no bootstrap do projeto, com o conteúdo canônico registrado no [RFC 0001](rfcs/0001-stack-padrao.md#arquivos-de-configuração-conteúdo-canônico).
- Antes de qualquer commit: `npm run lint:prettier:fix` e `npm run lint:eslint:check`.

### VSCode

O repositório versiona `.vscode/extensions.json` (extensões recomendadas: Prettier, ESLint, EditorConfig) e `.vscode/settings.json` (format on save com Prettier + fix do ESLint ao salvar). **Ao abrir o projeto pela primeira vez, aceite a instalação das extensões recomendadas** — sem elas o editor não aplica o padrão automaticamente.

## Commits

- **Conventional Commits estrito**, validado por commitlint (`@commitlint/config-conventional`) via husky no hook `commit-msg`. `npm run commit` abre o assistente do commitizen.
- Tipo em inglês, descrição em português: `feat: editor de posts (PRD 0001)`.
- Mudanças documentadas referenciam o PRD/RFC — ver [WORKFLOW.md](WORKFLOW.md#convenção-de-commits).

## Dependências e scripts

- **Versões exatas** no `package.json` (sem `^` ou `~`); Node fixado em `engines` e `.nvmrc`.
- Scripts npm padronizados (nomes com namespace por dois-pontos):

  | Script                                            | Função                                  |
  | ------------------------------------------------- | --------------------------------------- |
  | `dev`                                             | sobe serviços + migrations + `next dev` |
  | `test` / `test:watch`                             | testes com serviços de pé               |
  | `services:up` / `services:stop` / `services:down` | Docker Compose local                    |
  | `migrations:create` / `migrations:up`             | node-pg-migrate                         |
  | `lint:prettier:check` / `lint:prettier:fix`       | formatação                              |
  | `lint:eslint:check`                               | lint                                    |

## Variáveis de ambiente

- `.env.development` é **versionado** e contém apenas credenciais locais inofensivas (Postgres do Docker local).
- **Segredos reais nunca entram no repositório** — vivem no ambiente de produção/homologação. `.env` e `.env*.local` estão no `.gitignore`.
