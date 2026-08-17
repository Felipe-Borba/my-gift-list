# RFC 0002 — Autenticação e modelagem do banco

- **Status:** implementado
- **Autor:** Claude (agente)
- **Data:** 2026-07-04
- **Aprovado por / em:** Felipe Borba / 2026-07-04
- **PRD relacionado:** [PRD 0001](../prds/0001-acompanhamento-de-imc.md)

## Contexto e problema

O PRD 0001 exige autenticação com usuário e senha, três perfis com permissões distintas, e persistência de usuários e avaliações de IMC. Estratégia de auth e esquema de banco são decisões estruturais (WORKFLOW, regra 2) e precisam ser fixadas antes da implementação. O DER do PDF do teste sugere JWT com refresh token (`usuario_token`) e nomes em português; este RFC adapta o modelo às convenções do projeto (código em inglês, stack do RFC 0001).

## Decisão proposta

### Autenticação: sessão em banco + cookie httpOnly

- Login (`POST /api/v1/sessions`) valida usuário/senha e cria uma linha em `sessions` com token opaco aleatório (48 bytes hex); o token vai num cookie `session_id` httpOnly, `SameSite=Lax`, `Secure` em produção.
- A cada request autenticado, o controller resolve a sessão: existe, não expirou (validade de 30 dias) **e o usuário está ativo** — inativar um usuário derruba o acesso imediatamente, como o PRD exige.
- Logout (`DELETE /api/v1/sessions`) apaga a sessão e limpa o cookie.
- Senhas com hash **bcryptjs** (custo 14 em produção, 1 em teste para velocidade); nunca retornadas pela API.

### Esquema do banco (Postgres, node-pg-migrate)

Identificadores em inglês (CONVENTIONS.md); valores exibidos ao usuário em português.

```text
users
  id          uuid PK default gen_random_uuid()
  name        varchar(60)  not null
  username    varchar(30)  not null unique
  password    varchar(72)  not null            ← hash bcrypt
  role        varchar(20)  not null check (role in ('admin','teacher','student'))
  active      boolean      not null default true
  created_at  timestamptz  not null default now()
  updated_at  timestamptz  not null default now()

sessions
  id          uuid PK
  token       varchar(96)  not null unique
  user_id     uuid         not null → users(id) on delete cascade
  expires_at  timestamptz  not null
  created_at / updated_at

evaluations
  id             uuid PK
  student_id     uuid          not null → users(id) on delete restrict
  evaluator_id   uuid          not null → users(id) on delete restrict
  height         numeric(3,2)  not null   ← metros (ex.: 1.70)
  weight         numeric(5,2)  not null   ← kg
  bmi            numeric(4,2)  not null   ← peso / altura², 2 casas
  classification varchar(30)   not null   ← português, tabela do PRD 0001
  created_at / updated_at
```

- **`on delete restrict`** nas FKs de `evaluations` garante no banco a regra "não excluir usuário com avaliações vinculadas"; a aplicação valida antes e devolve erro amigável.
- `role` em inglês no código/banco (`admin`/`teacher`/`student`); a UI traduz. `classification` fica em português por ser dado exibido ao usuário e exigência do PDF ("gravar a classificação").
- **Primeiro admin por migration de seed**: username `admin`, senha vinda de `ADMIN_INITIAL_PASSWORD` (definida no `.env.development` para dev; obrigatória em produção).

### Camadas e APIs afetadas

- `models/user.js`, `models/password.js`, `models/session.js`, `models/evaluation.js` (cálculo do IMC e classificação — lógica pura, testável em `tests/unit/`), `models/authorization.js` (matriz de permissões do PRD).
- Rotas: `POST/DELETE /api/v1/sessions`; `GET/POST /api/v1/users`; `GET/PATCH/DELETE /api/v1/users/[username]`; `GET/POST /api/v1/evaluations` (filtros `?student=` e `?evaluator=`); `PATCH/DELETE /api/v1/evaluations/[id]`.
- Novas dependências (versões exatas): `bcryptjs`, `cookie`.

## Alternativas consideradas

| Alternativa                              | Prós                                   | Contras                                                                               | Por que não                                                                    |
| ---------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| JWT + refresh token (DER do PDF)         | Fiel ao enunciado; stateless no access | Mais partes móveis (renovação, revogação); inativar usuário não derruba token vigente | Sessão em banco é mais simples e revogável na hora; decisão do dono do projeto |
| NextAuth / Auth.js                       | Pronto, OAuth fácil                    | Dependência estrutural grande; abstrai o que o teste quer demonstrar                  | O objetivo é mostrar domínio do fluxo; auth manual é pequena aqui              |
| Argon2 para hash                         | Estado da arte                         | Binding nativo (build por plataforma)                                                 | bcryptjs é JS puro, zero fricção de build, suficiente para o caso              |
| Nomes de tabelas em português (DER fiel) | Zero tradução mental em relação ao PDF | Viola CONVENTIONS.md (código em inglês); mistura idiomas no código                    | Convenção do projeto prevalece; o mapeamento fica documentado aqui             |

## Trade-offs e consequências

- Uma query a mais por request autenticado (lookup da sessão) — irrelevante nesta escala.
- Cookie de sessão exige atenção a CSRF; mitigado com `SameSite=Lax` e mutações apenas via JSON (sem forms cross-site).
- bcryptjs é mais lento que o bcrypt nativo — aceito em troca de instalação sem toolchain de build.
- Divergência deliberada do DER do PDF (nomes em inglês, sessão em vez de JWT): se a avaliação do teste cobrar fidelidade, a discussão já está registrada aqui e no PRD 0001 (riscos).

## Impacto no código existente

Nenhum código de feature existe ainda. Este RFC gera as primeiras migrations (`users`, `sessions`, `evaluations`, seed do admin), os models listados e as rotas novas. `infra/controller.js` ganha um helper para resolver a sessão/usuário autenticado e aplicar autorização.

### Notas da implementação (2026-07-04)

- Rota adicional `GET /api/v1/user` (usuário autenticado corrente) — necessária para o frontend montar layout e navegação por perfil.
- O pacote `cookie` v2 mudou de API: usa-se `stringifySetCookie({ name, value, ... })` em vez de `serialize(name, value, opts)`.
- O cálculo/classificação de IMC vive em `models/bmi.js` (lógica pura, sem I/O) para ser reutilizado pelo backend e pelo preview do formulário no frontend.
