# <nome-do-projeto>

<Uma frase descrevendo o que o projeto é e para quem.>

## Como trabalhar neste projeto

O desenvolvimento é dirigido por especificação com o [spec-kit](https://github.com/github/spec-kit). As regras são poucas:

1. **Os princípios do projeto vivem em `.specify/memory/constitution.md`** — leia antes de qualquer mudança; se ainda não existe, crie com `/speckit-constitution` junto do dono do projeto.
2. **Toda feature segue o fluxo spec-kit:** `/speckit-specify` (o quê e por quê) → `/speckit-plan` (como, com a stack escolhida) → `/speckit-tasks` → `/speckit-implement`. Os artefatos ficam em `specs/<feature>/`.
3. **Correções pequenas** (bug, texto, estilo) não precisam de spec — implemente direto.
4. Em caso de ambiguidade na spec, use `/speckit-clarify` antes de planejar, em vez de assumir.

---

_Este repositório é um template. Ao iniciar um projeto novo: preencha os campos `<...>` acima, remova esta nota e rode `/speckit-constitution` para estabelecer os princípios do projeto. O spec-kit é inicializado automaticamente na primeira criação do devcontainer._

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
