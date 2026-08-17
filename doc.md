# Lista de presentes — decisão de arquitetura

## O que existe hoje

`app/` é servido estaticamente pelo GitHub Pages (`.github/workflows/pages.yml` só faz upload da pasta, sem build). A solução implementada mantém isso:

- `app/gifts.json` — lista de links do Mercado Livre. É o único arquivo que se edita para adicionar/remover um presente.
- `app/app.js` — no carregamento da página, extrai o ID do anúncio (`MLB\d+`) de cada URL e chama `https://api.mercadolibre.com/items/{id}` direto do navegador (a API libera CORS: `access-control-allow-origin: *`), preenchendo foto, título e preço. Se a chamada falhar, o card cai num fallback só com o link.
- `app/styles.css` / `app/index.html` — grid de cards, sem dependência do HTML/CSS que o Mercado Livre gera.

Custo: R$ 0. Sem backend, sem banco, sem build step.

### Risco observado (importante)

Ao testar a API pública do ML a partir do ambiente onde este trabalho foi feito, **todas** as chamadas — inclusive endpoints de referência sem dado sensível (`/sites/MLB/categories`) — voltaram `403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES`. Isso é consistente com bloqueio de IP de datacenter/cloud pelo antibot do ML, não necessariamente algo que afete o navegador do usuário final (residencial/mobile), já que o CORS aberto indica que a intenção é permitir consumo client-side.

Ainda assim, é um risco real: se o ML decidir bloquear ou exigir autenticação (`access_token`) de forma mais ampla, os cards passam a cair no fallback (link cru, sem foto/preço) — a página não quebra, mas perde a "graça" do preview automático. **Vale testar o resultado publicado no GitHub Pages a partir de uma rede doméstica/celular antes de confiar 100% nisso.**

---

## Alternativa: Git-based CMS (Decap/Sveltia)

Faz sentido só se o incômodo real for a **experiência de edição** (não o formato do dado) — ou seja, você quer uma telinha de formulário em vez de editar `gifts.json` pelo GitHub.

- Continua sendo o mesmo `gifts.json` no repo como fonte da verdade — o CMS é só uma UI que roda em `/admin`, mostra um formulário e, ao salvar, faz um commit no seu repo via API do GitHub. Não muda nada da arquitetura atual (JSON + fetch client-side na API do ML continuam iguais).
- Exige uma peça a mais que hoje você não tem: **um backend de autenticação OAuth com o GitHub**, porque o CMS precisa de permissão para commitar em seu nome. As opções gratuitas são o proxy OAuth do Netlify (só para essa autenticação — a página continua no GitHub Pages) ou uma Cloudflare Worker própria fazendo esse papel.
- Continua tendo o mesmo lag do GitHub Pages: salvar no CMS = commit = rebuild do Pages, não é instantâneo.
- Custo: R$ 0, mas com uma peça de infra a mais (o proxy OAuth) e mais uma dependência de terceiro (o próprio pacote do CMS, carregado via CDN).

## Alternativas com banco de dados gerenciado

Fazem sentido se, no futuro, você quiser: (a) um formulário de cadastro (sem editar JSON à mão), (b) múltiplas pessoas cadastrando itens, ou (c) parar de depender da API pública do ML em tempo real (guardando os dados já resolvidos).

### Opção A — Supabase

- Free tier: Postgres, Auth, Storage e **Edge Functions** num único projeto; o SDK JS fala com o banco direto do navegador via REST, protegido por Row Level Security — ou seja, mantém a mesma "sem backend próprio" que você tem hoje.
- Fluxo natural: uma Edge Function (roda no servidor deles, sem CORS/antibot) resolve o link do ML e grava título/foto/preço numa tabela `gifts`; a página só faz `select` nessa tabela.
- Pegadinha do free tier: projeto **pausa após ~1 semana sem uso** e precisa ser reativado manualmente pelo dashboard — ruim se a página fica meses sem visita.
- Custo: R$ 0 dentro do limite (500MB DB, 1 projeto ativo).

### Opção B — Neon

- Free tier: Postgres serverless com autosuspend (o compute "dorme" quando ocioso e acorda sob demanda) — mais generoso em storage/branching que o Supabase, mas **é só o banco**.
- Não existe um "cliente JS que fala com Neon com segurança direto do navegador" — a connection string é sensível, então você precisaria de uma camada de API própria (ex.: função serverless na Vercel/Cloudflare Workers, ambas com free tier) só para expor `GET /gifts` ao frontend. Isso é uma peça de infraestrutura a mais para manter.
- Custo: R$ 0 dentro do limite, mas conta com uma dependência extra (hospedagem da função) além do banco.

### Comparativo

| | JSON no repo (atual) | Git-based CMS | Supabase | Neon |
|---|---|---|---|---|
| Custo | R$ 0 | R$ 0 (+ proxy OAuth) | R$ 0 (com pausa por inatividade) | R$ 0 (+ hospedagem da API) |
| Peças de infra | 0 | 1 (proxy OAuth) | 1 (projeto Supabase) | 2 (banco + função serverless) |
| Onde fica o dado | `gifts.json` no repo | `gifts.json` no repo (igual) | tabela Postgres | tabela Postgres |
| Cadastro de item | editar `gifts.json` no GitHub | formulário em `/admin`, que commita no repo | formulário próprio | formulário próprio |
| Depende da API do ML em runtime | sim (no navegador do visitante) | sim (não resolve esse problema) | não, se resolvida 1x via Edge Function | não, se resolvida 1x via função |
| Complexidade de manter | mínima | baixa-média | média | média-alta |

## Recomendação

Para uma lista pessoal com poucos cadastros, o JSON estático resolve com a menor complexidade possível — o "custo" real é editar um arquivo no GitHub em vez de preencher um formulário. O Git-based CMS só vale a pena se esse "custo" (editar JSON pelo GitHub) incomodar de verdade e você quiser uma UI de formulário, mas ele não resolve o risco da API do ML nem elimina a necessidade de rebuild do Pages. Supabase só compensa a mudança se você quiser parar de depender da API do ML em tempo real (resolvendo o link uma vez, no servidor); Neon só entraria em jogo se você já tivesse (ou quisesse) uma API própria por outro motivo, porque sozinho ele não substitui o papel que o Supabase cobre de graça.
