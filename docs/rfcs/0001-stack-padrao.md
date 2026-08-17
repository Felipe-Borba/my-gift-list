# RFC 0001 — Escolha da stack padrão

- **Status:** implementado
- **Autor:** template (baseado no clone-tabnews, curso.dev)
- **Data:** 2026-07-04
- **Aprovado por / em:** Felipe Borba / 2026-07-04
- **PRD relacionado:** —

## Contexto e problema

Todo projeto novo precisa de uma primeira decisão estrutural: linguagem, framework, banco e ferramental de qualidade. Repetir essa discussão a cada projeto custa tempo e produz codebases inconsistentes entre si — o que encarece manutenção e confunde agentes de IA que trabalham em vários projetos. Este RFC fixa uma stack padrão única, baseada em uma referência pública e battle-tested ([clone-tabnews](https://github.com/filipedeschamps/clone-tabnews)).

## Decisão proposta

- **Linguagem:** JavaScript puro (sem TypeScript), Node.js 24 (fixado em `engines` do `package.json` e `.nvmrc`). Imports absolutos a partir da raiz via `jsconfig.json` (`baseUrl: "."`).
- **Framework:** Next.js com pages router — frontend React e backend nas API routes (`pages/api/v1/`).
- **Banco:** PostgreSQL nos dois ambientes — via Docker Compose (`infra/compose.yaml`) em dev local, gerenciado em produção. Migrations com node-pg-migrate em `infra/migrations/`, acesso via `pg` encapsulado em `infra/database.js`.
- **Testes:** Jest, integration-first (HTTP real contra `next dev`, banco real, orquestrado por `tests/orchestrator.js`).
- **Qualidade automatizada:** Prettier (config padrão) + ESLint flat config + EditorConfig; Conventional Commits validado por commitlint + husky; CI no GitHub Actions rodando lint, testes e commitlint em todo PR.
- **Dependências:** versões exatas no `package.json` (sem `^`/`~`).

As convenções de código decorrentes estão em [docs/CONVENTIONS.md](../CONVENTIONS.md).

## Alternativas consideradas

| Alternativa           | Prós                                                                   | Contras                                                                                 | Por que não                                                                                       |
| --------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| TypeScript            | Checagem estática; útil com código majoritariamente gerado por agentes | Build/config extra; desvia da base de referência do curso.dev                           | Fidelidade à referência e simplicidade; lint + testes de integração cobrem a maior parte do risco |
| Next.js app router    | Direção atual do framework                                             | Base de referência usa pages router; convenções de teste/estrutura mapeadas para ele    | Consistência com a referência; migração pode ser RFC futuro                                       |
| SQLite em dev         | Zero Docker                                                            | Banco diferente entre dev e produção é fonte clássica de bug que só aparece em produção | Postgres via Docker mantém paridade dev/prod                                                      |
| ORM (Prisma, Drizzle) | Produtividade, tipos                                                   | Camada extra de abstração; a referência usa SQL parametrizado direto                    | SQL explícito via `infra/database.js`; adotar ORM exigiria novo RFC                               |

## Trade-offs e consequências

- Sem TypeScript, erros de tipo só aparecem em runtime/teste — mitigado por testes de integração cobrindo o contrato completo das respostas.
- Pages router envelhece em relação ao app router; migrar depois terá custo (RFC próprio).
- Docker é pré-requisito de ambiente local.
- Testes de integração com banco real são mais lentos que unit com mock — aceito em troca de confiança no comportamento real.

## Impacto no código existente

Nenhum — este é o RFC inaugural. Ao iniciar o projeto, executar o bootstrap:

1. Gerar o scaffold do Next.js (pages router, sem TypeScript): `npx create-next-app@latest . --js --no-app --no-tailwind --no-src-dir --use-npm` — ajuste o que o scaffold criar para as convenções abaixo (ex.: remova arquivos de exemplo que não serão usados).
2. Fixar Node 24: campo `engines: { "node": "24" }` no `package.json`.
3. **Criar os arquivos de configuração** com o conteúdo canônico da seção [Arquivos de configuração](#arquivos-de-configuração-conteúdo-canônico) abaixo: `.editorconfig`, `.nvmrc`, `.prettierignore`, `eslint.config.mjs` e `jsconfig.json` (substitua os que o scaffold tiver gerado).
4. Instalar dependências (versões exatas, sem `^`): `pg`, `node-pg-migrate`, `dotenv`; dev: `jest`, `@faker-js/faker`, `concurrently`, `prettier`, `eslint` + `eslint-config-next` + `eslint-config-prettier` + `eslint-plugin-jest` + `@eslint/js`/`json`/`markdown`/`css` + `globals`, `husky`, `@commitlint/cli` + `@commitlint/config-conventional`, `commitizen` + `cz-conventional-changelog`. Remover os `^` das dependências que o scaffold instalou.
5. Criar `infra/compose.yaml` (Postgres alpine lendo `.env.development`), `infra/database.js`, `infra/errors.js`, `infra/controller.js`, `infra/scripts/wait-for-postgres.js`.
6. Criar `.env.development` versionado com credenciais locais.
7. Criar `jest.config.js` (via `next/jest`, `moduleDirectories: ["node_modules", "<rootDir>"]`), `tests/orchestrator.js`, `commitlint.config.js`, hook husky `commit-msg` com `npx commitlint --edit $1`.
8. Copiar os scripts npm padronizados (ver tabela em [CONVENTIONS.md](../CONVENTIONS.md#dependências-e-scripts)).
9. Criar `.github/workflows/` com jobs de Prettier, ESLint, commitlint e Jest em `pull_request`.
10. Marcar este RFC como **implementado**.

_(Já vêm prontos no template e não precisam ser criados: `.gitignore`, `.vscode/` e `.github/PULL_REQUEST_TEMPLATE.md`.)_

### Notas da implementação (2026-07-04)

O bootstrap foi executado com estes desvios em relação ao checklist acima:

- **Scaffold manual em vez de `create-next-app`:** o CLI recusa diretórios com arquivos não reconhecidos (`CLAUDE.md`, `.vscode/`, `.github/`); o resultado equivalente foi criado à mão (`package.json`, `pages/`).
- **`typescript` como devDependency:** o `eslint-config-next` 16 exige o pacote presente para o linter funcionar, mesmo em projeto JavaScript puro. O código continua sem TypeScript.
- **ESLint fixado na série 9 (9.39.4):** o parser embutido no `eslint-config-next` 16.2 ainda não é compatível com o runtime do ESLint 10.
- **`next.config.js` com `transpilePackages: ["node-pg-migrate"]`:** o node-pg-migrate 8 é ESM-only e o Jest (CJS via `next/jest`) precisa que ele seja transpilado.
- **Endpoint `GET /api/v1/status` + teste de integração:** criado como smoke test do bootstrap — é o que o `tests/orchestrator.js` usa em `waitForAllServices()` e o que prova banco, migrations e controller funcionando de ponta a ponta.

## Arquivos de configuração (conteúdo canônico)

Criados no passo 3 do bootstrap, exatamente com este conteúdo:

### `.editorconfig`

```ini
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
```

### `.nvmrc`

```text
24
```

### `.prettierignore`

```text
.next
```

### `jsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": "."
  }
}
```

### `eslint.config.mjs`

```js
import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import jest from "eslint-plugin-jest";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  ...nextVitals,
  {
    files: ["tests/**/*.test.js"],
    ...jest.configs["flat/recommended"],
  },
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
    ignores: ["package-lock.json"],
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/gfm",
    extends: ["markdown/recommended"],
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
  },
  prettier,
]);
```

_(Prettier roda com a configuração padrão — deliberadamente não há `.prettierrc`.)_
