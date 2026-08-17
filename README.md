# project-template

Template para iniciar projetos com desenvolvimento dirigido por especificação ([spec-kit](https://github.com/github/spec-kit)) e um agente de IA rodando com **autonomia total** dentro de um sandbox.

## O que vem aqui

| Item                                           | O que faz                                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [.devcontainer/](.devcontainer/)               | Sandbox do agente: container com firewall default-deny, Docker-in-Docker e spec-kit pré-instalado |
| [.claude/settings.json](.claude/settings.json) | `defaultMode: "bypassPermissions"` — o agente age sem pedir confirmação (seguro só no sandbox)     |
| [CLAUDE.md](CLAUDE.md)                         | Ponto de entrada para o agente: o fluxo spec-kit em quatro regras                                  |

Não há stack pré-definida nem processo além do spec-kit: cada projeto estabelece seus princípios na constitution e decide a stack no `/speckit-plan`.

## Como usar

1. Clique em **Use this template** no GitHub (ou clone) para criar o projeto novo.
2. Abra no VS Code e rode **Dev Containers: Reopen in Container** (requer Docker Desktop ou OrbStack). Na primeira criação, o spec-kit é inicializado automaticamente — surgem `.specify/` e as skills `/speckit-*` do Claude Code.
3. Preencha os campos `<...>` do [CLAUDE.md](CLAUDE.md) e remova a nota de template.
4. Dentro do container, abra o Claude Code e estabeleça os princípios do projeto com `/speckit-constitution`.
5. Cada feature a partir daí: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement` (com `/speckit-clarify` e `/speckit-analyze` como apoio).

## O sandbox

O `bypassPermissions` só é seguro com uma fronteira de isolamento. O sandbox em [.devcontainer/](.devcontainer/) é adaptado do [devcontainer oficial do Claude Code](https://github.com/anthropics/claude-code/tree/main/.devcontainer):

- **Firewall default-deny de saída** ([init-firewall.sh](.devcontainer/init-firewall.sh)): só Anthropic, GitHub, npm, Docker Hub e domínios do VS Code. Roda a cada start do container.
- **Docker-in-Docker**: serviços do projeto (banco, etc.) sobem _dentro_ do sandbox; o egress dos containers internos passa pelo mesmo firewall (chain `DOCKER-USER`).
- **spec-kit instalado no build** (uv + CLI `specify`), inicializado no `postCreateCommand` — nada precisa ser baixado depois que o firewall sobe.
- **Limites conhecidos**: o workspace montado continua gravável (a proteção do repo é o git e o PR review), e o Docker-in-Docker permite a um agente deliberadamente malicioso desativar o firewall por dentro — o firewall é guarda-corpo contra acidentes e exfiltração casual; a fronteira dura da máquina é o próprio container. A allowlist também resolve os domínios (não-GitHub) para IPs uma única vez, no start do container — serviços atrás de CDN/anycast (npm, Docker Hub) podem trocar de IP depois disso e causar falhas intermitentes de rede; se acontecer, reinicie o container para o firewall re-resolver.

## Licença

[MIT](LICENSE).
