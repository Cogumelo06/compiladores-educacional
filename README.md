# Laboratório de Compiladores — Etapa 1

Projeto educacional da disciplina de Compiladores. Nesta primeira etapa, foi criada a estrutura de uma aplicação web com frontend, backend e configuração Docker para apresentar a mensagem **Hello, World!** retornada pela API.

## Linguagem escolhida

A linguagem a ser analisada nas próximas etapas é **C**, escolhida por sua sintaxe bem definida e por permitir estudar, de forma gradual, as análises léxica, sintática e semântica.

O subconjunto inicial planejado inclui declarações de variáveis do tipo `int`, atribuições, operações aritméticas (`+`, `-`, `*`, `/`), comparações e estruturas condicionais (`if` e `else`).

## Tecnologias e estrutura

- **Frontend:** HTML, CSS, JavaScript e Nginx.
- **Backend:** Node.js, com API HTTP.
- **Ambiente:** Docker e Docker Compose.

O projeto está organizado em pastas para frontend, backend, scripts de testes e configurações de execução.

## Como executar

**Pré-requisitos:** Docker Engine e Docker Compose V2 instalados, acesso à internet na primeira execução e porta 8080 disponível.

Clone o repositório:

`git clone https://github.com/Cogumelo06/compiladores-educacional.git`

Entre na pasta:

`cd compiladores-educacional`

Inicie a aplicação:

`docker compose up --build -d`

Acesse `http://localhost:8080` para visualizar a mensagem **Hello, World!**.

## Verificação e encerramento

- `docker compose ps` — verifica os contêineres.
- `http://localhost:8080/api/hello` — verifica a resposta da API.
- `http://localhost:8080/api/health` — verifica o estado do backend.
- `sh scripts/smoke-test.sh` — testa a integração (requer `curl`).
- `docker compose down` — encerra os serviços.

Esses comandos permitem reproduzir e verificar a aplicação em uma instalação limpa. O projeto também possui uma configuração de testes automatizados no GitHub Actions.

**Observação:** a execução local com Docker e a validação manual de instalação limpa ainda não foram concluídas.

## Repositório

https://github.com/Cogumelo06/compiladores-educacional
