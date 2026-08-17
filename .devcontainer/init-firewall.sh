#!/bin/bash
# Firewall default-deny do sandbox — adaptado do init-firewall.sh oficial do Claude Code
# (github.com/anthropics/claude-code) para conviver com Docker-in-Docker:
#   - não mexe na tabela nat nem nas chains do Docker (senão as portas publicadas
#     pelo `npm run services:up`, como localhost:5432, param de funcionar);
#   - gerencia apenas INPUT/OUTPUT e filtra o egress dos containers internos
#     pela chain DOCKER-USER, que o Docker respeita e não sobrescreve.
# Roda a cada start do container (postStartCommand). Saída permitida apenas para
# os ranges do GitHub e os domínios listados em allowed-domains.txt.
set -euo pipefail
IFS=$'\n\t'

# IPv6 bloqueado por completo: a allowlist abaixo só resolve registros A (IPv4),
# então deixar IPv6 em ACCEPT seria uma brecha para escapar do default-deny.
if command -v ip6tables >/dev/null 2>&1; then
    ip6tables -P INPUT DROP
    ip6tables -P OUTPUT DROP
    ip6tables -P FORWARD DROP
    ip6tables -F
fi

# Zera só o que este script gerencia. Políticas voltam a ACCEPT durante o setup
# para que as resoluções DNS e o curl abaixo funcionem também em re-execuções.
iptables -P INPUT ACCEPT
iptables -P OUTPUT ACCEPT
iptables -F INPUT
iptables -F OUTPUT
# DOCKER-USER também referencia o ipset — precisa ser esvaziada antes do destroy
iptables -F DOCKER-USER 2>/dev/null || true
ipset destroy allowed-domains 2>/dev/null || true

# Localhost e conexões já estabelecidas
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# DNS e SSH de saída
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT

# Redes internas do Docker-in-Docker (Postgres e demais serviços do compose)
iptables -A OUTPUT -d 172.16.0.0/12 -j ACCEPT

# Cria o set, ou esvazia se sobreviveu de uma execução anterior
ipset create allowed-domains hash:net 2>/dev/null || ipset flush allowed-domains

# Ranges oficiais do GitHub (web, api e git)
echo "Buscando ranges de IP do GitHub..."
gh_ranges=$(curl -s https://api.github.com/meta)
if [ -z "$gh_ranges" ]; then
    echo "ERRO: não foi possível buscar os ranges do GitHub"
    exit 1
fi
if ! echo "$gh_ranges" | jq -e '.web and .api and .git' >/dev/null; then
    echo "ERRO: resposta da API do GitHub sem os campos esperados"
    exit 1
fi
while read -r cidr; do
    if [[ ! "$cidr" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/[0-9]{1,2}$ ]]; then
        echo "ERRO: CIDR inválido vindo do GitHub meta: $cidr"
        exit 1
    fi
    ipset add allowed-domains "$cidr"
done < <(echo "$gh_ranges" | jq -r '(.web + .api + .git)[]' | aggregate -q)

# Demais domínios permitidos — lista mantida em allowed-domains.txt, copiado
# para a imagem no build (root-owned, como este script; ver Dockerfile)
ALLOWED_DOMAINS_FILE="/usr/local/etc/allowed-domains.txt"
if [ ! -f "$ALLOWED_DOMAINS_FILE" ]; then
    echo "ERRO: $ALLOWED_DOMAINS_FILE não encontrado"
    exit 1
fi
while read -r domain; do
    echo "Resolvendo $domain..."
    ips=$(dig +noall +answer A "$domain" | awk '$4 == "A" {print $5}')
    if [ -z "$ips" ]; then
        # Não-fatal: o domínio só fica fora da allowlist (default-deny continua valendo)
        echo "AVISO: não foi possível resolver $domain — seguindo sem ele"
        continue
    fi
    while read -r ip; do
        if [[ ! "$ip" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo "AVISO: IP inválido para $domain ($ip) — ignorado"
            continue
        fi
        ipset add allowed-domains "$ip" 2>/dev/null || true
    done < <(echo "$ips")
done < <(grep -vE '^\s*(#|$)' "$ALLOWED_DOMAINS_FILE" | tr -d ' \t\r')

# Rede do host (gateway do Docker Desktop/OrbStack)
HOST_IP=$(ip route | grep default | cut -d" " -f3)
if [ -z "$HOST_IP" ]; then
    echo "ERRO: não foi possível detectar o IP do host"
    exit 1
fi
HOST_NETWORK=$(echo "$HOST_IP" | sed "s/\.[0-9]*$/.0\/24/")
echo "Rede do host: $HOST_NETWORK"
iptables -A INPUT -s "$HOST_NETWORK" -j ACCEPT
iptables -A OUTPUT -d "$HOST_NETWORK" -j ACCEPT

# Saída liberada apenas para a allowlist; todo o resto é rejeitado
iptables -A OUTPUT -m set --match-set allowed-domains dst -j ACCEPT
iptables -P INPUT DROP
iptables -A OUTPUT -j REJECT --reject-with icmp-admin-prohibited
iptables -P OUTPUT DROP

# Egress dos containers internos (tráfego encaminhado) segue a mesma allowlist.
# O Docker cria o jump FORWARD -> DOCKER-USER; se o daemon ainda não subiu,
# criamos a chain e ele a reaproveita.
iptables -N DOCKER-USER 2>/dev/null || true
iptables -F DOCKER-USER
iptables -A DOCKER-USER -d 172.16.0.0/12 -j RETURN
iptables -A DOCKER-USER -m state --state ESTABLISHED,RELATED -j RETURN
iptables -A DOCKER-USER -p udp --dport 53 -j RETURN
iptables -A DOCKER-USER -m set --match-set allowed-domains dst -j RETURN
iptables -A DOCKER-USER -j REJECT --reject-with icmp-admin-prohibited

echo "Firewall configurado. Verificando..."
if curl --connect-timeout 5 -s https://example.com >/dev/null 2>&1; then
    echo "ERRO: verificação falhou — https://example.com está acessível"
    exit 1
else
    echo "OK: https://example.com bloqueado, como esperado"
fi
if ! curl --connect-timeout 5 -s https://api.github.com/zen >/dev/null 2>&1; then
    echo "ERRO: verificação falhou — https://api.github.com está inacessível"
    exit 1
else
    echo "OK: https://api.github.com acessível, como esperado"
fi
