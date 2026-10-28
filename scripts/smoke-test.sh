#!/bin/sh
# Teste de integração real: frontend Nginx -> backend Node.js pelo proxy /api.
# Requer curl, contêineres iniciados e sh. BASE_URL pode sobrescrever localhost.
set -eu
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
i=0
printf 'Aguardando a aplicação em %s ...\n' "$BASE_URL"
while [ "$i" -lt 30 ]; do
  if curl -fsS --output /dev/null "$BASE_URL/" 2>/dev/null && \
     curl -fsS --output /dev/null "$BASE_URL/api/health" 2>/dev/null; then
    break
  fi
  i=$((i + 1))
  sleep 2
done
if [ "$i" -eq 30 ]; then echo 'ERRO: aplicação indisponível após 60 segundos.' >&2; exit 1; fi
curl -fsS "$BASE_URL/" | grep -q 'Laboratório de Compiladores' || { echo 'ERRO: frontend não encontrado.' >&2; exit 1; }
curl -fsS "$BASE_URL/examples.js" | grep -q 'Variável e inicialização' || { echo 'ERRO: exemplos não encontrados.' >&2; exit 1; }
curl -fsS "$BASE_URL/api/hello" | grep -q 'Hello, World!' || { echo 'ERRO: regressão na rota hello.' >&2; exit 1; }
curl -fsS "$BASE_URL/api/health" | grep -q '"status":"ok"' || { echo 'ERRO: health indisponível.' >&2; exit 1; }
response="$(curl -fsS "$BASE_URL/api/analyze" -H 'Content-Type: application/json' -d '{"codigo":"int numero = 10;"}')"
printf '%s' "$response" | grep -q '"recebido":true' || { echo 'ERRO: código não recebido.' >&2; exit 1; }
printf '%s' "$response" | grep -q '"codigo":"int numero = 10;"' || { echo 'ERRO: código alterado.' >&2; exit 1; }
printf '%s' "$response" | grep -q '"sucesso":true' || { echo 'ERRO: scanner não aprovou exemplo C.' >&2; exit 1; }
printf '%s' "$response" | grep -q '"tipo":"PALAVRA_RESERVADA","lexema":"int"' || { echo 'ERRO: token int ausente.' >&2; exit 1; }
printf '%s' "$response" | grep -q '"linha":1,"coluna":5' || { echo 'ERRO: posição do identificador ausente.' >&2; exit 1; }
invalid="$(curl -fsS "$BASE_URL/api/analyze" -H 'Content-Type: application/json' -d '{"codigo":"int @x;"}')"
printf '%s' "$invalid" | grep -q '"sucesso":false' || { echo 'ERRO: falha léxica não indicada.' >&2; exit 1; }
printf '%s' "$invalid" | grep -q '"lexema":"@"' || { echo 'ERRO: erro lexical @ ausente.' >&2; exit 1; }
curl -fsS "$BASE_URL/token-view.js" | grep -q 'showLexicalResults' || { echo 'ERRO: visualização do scanner não encontrada.' >&2; exit 1; }
status="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/analyze" -H 'Content-Type: application/json' -d '{"codigo":"   "}')"
[ "$status" = 422 ] || { echo "ERRO: esperado 422 para entrada vazia, recebido $status" >&2; exit 1; }
printf 'OK: frontend, exemplos, scanner, tokens, erros léxicos, proxy, hello, health e validação 422.\n'
