#!/bin/sh
# Requer curl e os contêineres iniciados via: docker compose up --build -d
set -eu

BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
i=0

printf 'Aguardando aplicacao em %s ...\n' "$BASE_URL"
while [ "$i" -lt 30 ]; do
  if curl --fail --silent --output /dev/null "$BASE_URL/" && \
     curl --fail --silent --output /dev/null "$BASE_URL/api/health"; then
    break
  fi
  i=$((i + 1))
  sleep 2
done

if [ "$i" -eq 30 ]; then
  echo 'ERRO: Aplicacao indisponivel apos 60 segundos.' >&2
  exit 1
fi

curl --fail --silent "$BASE_URL/" | grep -q 'Laboratório de Compiladores' || {
  echo 'ERRO: Frontend nao apresentou a interface esperada.' >&2
  exit 1
}

curl --fail --silent "$BASE_URL/api/hello" | grep -q 'Hello, World!' || {
  echo 'ERRO: Backend nao retornou Hello, World! pelo proxy do frontend.' >&2
  exit 1
}

curl --fail --silent "$BASE_URL/api/health" | grep -q '"status":"ok"' || {
  echo 'ERRO: Health check da API falhou.' >&2
  exit 1
}

printf 'OK: Frontend acessivel, proxy ativo, API saudavel e Hello, World! retornado.\n'
