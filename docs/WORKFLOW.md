# Fluxo de desenvolvimento

Este documento é a **fonte canônica** do processo de desenvolvimento. Ele define como qualquer pessoa (ou agente de IA) contribui com este projeto. O objetivo não é burocracia — é evitar gastar tempo de implementação construindo a coisa errada, e deixar um registro do porquê das decisões.

Quem é o **dono do projeto** (quem aprova PRDs e RFCs) está definido no `CLAUDE.md` do repositório.

## O ciclo

Cada mudança relevante passa pelas fases clássicas do SDLC, em versão leve:

```text
1. Requisitos   → mini-PRD (o quê e por quê)
2. Design       → RFC, se houver decisão técnica estrutural (como)
3. Implementação
4. Verificação  → testes + exercitar o fluxo de ponta a ponta
5. Entrega      → commit/PR referenciando o PRD/RFC
```

## Quando cada documento é necessário

A regra prática: **o peso da documentação é proporcional ao custo de errar.**

- **Correção pequena** (bug, typo, ajuste de estilo): sem documento. Vai direto para implementação + verificação.
- **Feature nova** (qualquer coisa que adicione comportamento visível): mini-PRD antes. Meia página basta na maioria dos casos.
- **Decisão estrutural** (arquitetura, banco, auth, framework, dependência significativa): RFC antes. É o documento que responde "por que fizemos assim?" daqui a seis meses.

Na dúvida entre "pequeno" e "feature", escreva o mini-PRD — se ele sair trivial em cinco minutos, o custo foi baixo; se travar em alguma pergunta, era exatamente o sinal de que precisava ser escrito.

## Regras de processo

1. **PRD antes de código de feature.** O PRD é aprovado pelo dono do projeto antes da implementação começar.
2. **RFC antes de decisão estrutural.** Alternativas consideradas e trade-offs ficam registrados, mesmo que em poucos parágrafos.
3. **Critérios de aceitação viram verificação.** Ao terminar, cada critério do PRD é checado exercitando o app de verdade, não só rodando testes.
4. **Documentos vivem com o código.** Se a implementação divergiu do PRD/RFC, atualize o documento no mesmo commit.
5. **Numeração sequencial**: `docs/prds/0001-editor-de-posts.md`, `docs/rfcs/0001-escolha-do-banco.md`. PRDs e RFCs têm numerações independentes.

## Como funciona a aprovação

Aprovação é o que separa "ideia" de "pode implementar", então ela fica registrada no próprio documento:

1. O autor escreve o documento com **Status: rascunho** e submete ao dono do projeto (PR, mensagem ou conversa com um agente).
2. O dono do projeto aprova explicitamente (um "ok"/"aprovado" registrável basta).
3. Quem recebeu a aprovação atualiza o cabeçalho: **Status: aprovado** e preenche **Aprovado por / em**. Essa edição entra no mesmo commit que registra o documento aprovado.
4. Ao fim da implementação verificada, o status muda para **implementado**.

Status possíveis:

- **PRD:** `rascunho → aprovado → implementado`, ou `cancelado` (a feature foi descartada; o documento fica como registro).
- **RFC:** `rascunho → aprovado → implementado`, ou `superado por RFC NNNN` (uma decisão posterior substituiu esta).

## Convenção de commits

Commits seguem **Conventional Commits estrito**, validado por commitlint (hook `commit-msg` do husky) — tipo em inglês, descrição em português. Commits e PRs de uma mudança documentada referenciam o documento no título ou corpo:

```text
feat: editor de posts (PRD 0001)
fix: corrige contraste do botão salvar
refactor: migra camada de dados para o novo esquema (RFC 0002)
```

Correções pequenas não precisam de referência — só de uma mensagem clara.

## Regras para agentes de IA

0. **Situe e confirme antes de produzir PRDs, RFCs ou código de feature.** Antes de escrever um desses artefatos: (a) informe em qual etapa do SDLC o trabalho está — requisitos, design, implementação, verificação ou entrega; (b) faça perguntas ao dono do projeto até ter ~95% de confiança sobre o que a etapa precisa entregar; (c) confirme explicitamente se ele quer prosseguir. **Correções pequenas estão isentas** — nelas, implemente e verifique direto, como a tabela acima promete.
1. **Não implemente feature sem PRD aprovado.** Se o usuário pedir uma feature diretamente, primeiro proponha o mini-PRD (meia página resolve) e só implemente após o "ok".
2. **Não tome decisões estruturais em silêncio.** Escolha de framework, ORM, esquema de banco, estratégia de auth → RFC antes, mesmo que curto.
3. **Toda feature termina com verificação.** Os critérios de aceitação do PRD são o checklist.
4. **Atualize o documento se a implementação divergir.** PRD/RFC desatualizado é pior que nenhum.
5. **Todo código segue [CONVENTIONS.md](CONVENTIONS.md)** — estrutura, idioma, erros, testes, lint. Rode `lint:prettier:fix` e `lint:eslint:check` antes de encerrar.

## Estrutura de pastas

```text
docs/
  WORKFLOW.md          ← este documento (fonte canônica do processo)
  CONVENTIONS.md       ← convenções de código (fonte canônica do "como codar")
  templates/
    PRD.md             ← template de mini-PRD
    RFC.md             ← template de RFC
  prds/                ← um arquivo por feature
  rfcs/                ← um arquivo por decisão técnica (0001 = stack padrão)
```
