# Sandbox para agentes de IA — adaptado do .devcontainer oficial do Claude Code
# (github.com/anthropics/claude-code), com o spec-kit (github.com/github/spec-kit)
# como harness de desenvolvimento. Divergências da referência documentadas no README.
#
# Base trixie (Debian 13, glibc 2.41): bookworm (glibc 2.36) não roda o binário
# oficial do rtk em arm64 (exige glibc >=2.39) — ex.: Docker Desktop/OrbStack em
# Apple Silicon. Confirmado rodando o binário real em node:24-trixie.
FROM node:24-trixie

ARG TZ=America/Sao_Paulo
ENV TZ="$TZ"

ARG CLAUDE_CODE_VERSION=latest

# Ferramentas de desenvolvimento + iptables/ipset/bind9-dnsutils/aggregate para o firewall
# bind9-dnsutils: no trixie, dnsutils deixou de existir como pacote transitório.
RUN apt-get update && apt-get install -y --no-install-recommends \
  aggregate \
  bind9-dnsutils \
  ca-certificates \
  curl \
  gh \
  git \
  gnupg2 \
  iproute2 \
  ipset \
  iptables \
  jq \
  less \
  nano \
  procps \
  sudo \
  unzip \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

ARG USERNAME=node

# Pacotes npm globais instaláveis sem root
RUN mkdir -p /usr/local/share/npm-global && \
  chown -R $USERNAME:$USERNAME /usr/local/share/npm-global

# Histórico do bash persistido no volume /commandhistory
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
  && mkdir /commandhistory \
  && touch /commandhistory/.bash_history \
  && chown -R $USERNAME /commandhistory \
  && echo "$SNIPPET" >> "/home/$USERNAME/.bashrc"

# Sinaliza ao Claude Code que está num devcontainer
ENV DEVCONTAINER=true

RUN mkdir -p /workspace /home/$USERNAME/.claude && \
  chown -R $USERNAME:$USERNAME /workspace /home/$USERNAME/.claude

WORKDIR /workspace

USER $USERNAME

ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}

# spec-kit: uv + CLI `specify` instalados no build (rede livre nesta fase; em runtime
# o firewall só libera GitHub, de onde vêm os upgrades via `specify self upgrade`).
# Versão fixada para build reprodutível — para atualizar, suba o ARG abaixo.
ARG SPECKIT_VERSION=v0.9.5
RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
  /home/$USERNAME/.local/bin/uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@${SPECKIT_VERSION}
ENV PATH=$PATH:/home/node/.local/bin

# rtk (github.com/rtk-ai/rtk): proxy de CLI que filtra/compacta saída de comandos
# Bash antes de chegar no contexto do agente. Binário oficial pré-compilado —
# exige glibc >=2.39 em arm64, por isso a base trixie acima. Instala em
# ~/.local/bin (mesmo diretório do uv/specify, já no PATH). Versão fixada para
# build reprodutível — para atualizar, suba o ARG abaixo.
ARG RTK_VERSION=v0.43.0
RUN curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | RTK_VERSION=${RTK_VERSION} sh

# Firewall: script + allowlist de domínios embutidos na imagem; única permissão
# de sudo do usuário node é (re)aplicar o script, sem editar script nem allowlist
COPY init-firewall.sh /usr/local/bin/
COPY allowed-domains.txt /usr/local/etc/
USER root
RUN chmod +x /usr/local/bin/init-firewall.sh && \
  echo "node ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh" > /etc/sudoers.d/node-firewall && \
  chmod 0440 /etc/sudoers.d/node-firewall
USER $USERNAME
