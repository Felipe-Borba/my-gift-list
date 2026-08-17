#!/bin/bash
# Inicializa o spec-kit no workspace na primeira criação do container e instala
# deps do projeto, se houver. Roda inteiro no postCreateCommand.
set -euo pipefail

cd /workspace

if [ -d .specify ]; then
  echo "spec-kit já inicializado (.specify/ existe) — nada a fazer."
else
  # --force: necessário porque o repo já tem conteúdo (não está vazio); o guard
  # acima (.specify já existe) é quem garante a idempotência, não esta flag.
  specify init --here --force --integration claude
  echo "spec-kit inicializado. Comece pelo /speckit-constitution dentro do Claude Code."
fi

if [ -f package.json ]; then
  npm install
fi

# rtk: registra o hook de auto-rewrite do Claude Code em ~/.claude/settings.json
# (volume nomeado, só existe depois que o container sobe — por isso aqui, não
# no Dockerfile). --auto-patch: não interativo e idempotente, seguro em rebuilds.
rtk init -g --auto-patch

# Claude Code: dentro do sandbox, inicia direto em bypassPermissions. A config
# vive no volume ~/.claude (só existe no container) — fora dele, o Claude Code
# segue com os prompts normais de permissão. Merge via jq para preservar o que
# o rtk init gravou acima; idempotente em rebuilds.
SETTINGS=/home/node/.claude/settings.json
[ -f "$SETTINGS" ] || echo '{}' > "$SETTINGS"
jq '.permissions.defaultMode = "bypassPermissions"' "$SETTINGS" > "$SETTINGS.tmp" \
  && mv "$SETTINGS.tmp" "$SETTINGS"
