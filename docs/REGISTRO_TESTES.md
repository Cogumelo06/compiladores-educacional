# Registro de Testes — Trabalho 2

Registro das verificações executadas durante o desenvolvimento, sem presumir testes não realizados.

## Ambiente utilizado para a execução

- Data: 21/10/2026.
- Node.js: **v22.16.0**.
- Sistema: ambiente Linux.
- Nginx disponível localmente (v1.26.3), usado para verificar o proxy em um servidor temporário.
- Docker/Compose: **não instalados no ambiente de preparação**; portanto, a construção de contêineres não foi executada aqui.

## Execuções concluídas

| Módulo | Tipo | Comando ou procedimento | Aprovados | Reprovados | Resultado |
|---|---|---|---:|---:|---|
| Backend | API, validação e regressão | `npm --prefix backend test` | 11 | 0 | **APROVADO** |
| Frontend | Unitários e interações com DOM simulado | `npm --prefix frontend test` | 10 | 0 | **APROVADO** |
| Nginx local | Validação de configuração de proxy temporário | `nginx -t -c <configuração de teste>` | 1 verificação | 0 | **APROVADO** |
| Integração HTTP local | Frontend via Nginx, proxy, endpoints e erros | `BASE_URL=http://127.0.0.1:18765 sh scripts/smoke-test.sh` (backend Node em porta 18766 e Nginx local em 18765) | 1 fluxo | 0 | **APROVADO** |
| Docker Compose | Instalação reproduzível com contêineres | `docker compose up --build -d` | — | — | **NÃO EXECUTADO** (Docker ausente) |
| Interface no navegador | Teste ponta a ponta com navegador real e screenshot | Chromium/Playwright | — | — | **NÃO EXECUTADO** (navegador bloqueia acesso a páginas locais por política do ambiente) |

O smoke test local foi realizado usando a mesma estrutura de frontend e backend, com uma configuração de Nginx temporária equivalente ao encaminhamento da rota `/api/` para o servidor Node. **Não comprova a inicialização real dos contêineres.**

## Comportamentos validados

**Backend:** `/api/hello` e `/api/health` mantidos; rota 404; envio de código C e confirmação integral; aceitação de caracteres especiais e entradas propositalmente incorretas; rejeição de código vazio ou só espaços; rejeição de campo ausente e tipos incorretos; JSON malformado; `Content-Type` inválido; limite de 32 KB; backend saudável após erros.

**Frontend:** existência dos controles obrigatórios; presença e carregamento individual dos três exemplos; edição e limpeza do editor; preservação do texto após envio; contagem de caracteres e linhas; bloqueio de campo vazio; envio de JSON; apresentação do conteúdo devolvido pela API; mensagens de falha de comunicação e de resposta inesperada; reabilitação do botão após a requisição.

**Integração HTTP local:** página e scripts servidos pelo Nginx; proxy `GET /api/hello`, `GET /api/health` e `POST /api/analyze` funcional; resposta HTTP 422 para texto contendo somente espaços.

## Problemas encontrados e correções

- A interface inicial continha apenas um painel de Hello World: foi substituída por editor, exemplos e painel de processamento.
- O backend inicial não recebia código: foi adicionado `POST /api/analyze`, com validações e respostas estruturadas.
- A interface não tratava falhas de envio: foram adicionadas mensagens específicas e recuperação do estado do botão.
- As rotas anteriores foram preservadas e incluídas nos testes de regressão.

## Pendências antes da submissão

1. Executar `docker compose up --build -d`, `sh scripts/smoke-test.sh` e `docker compose down` numa máquina com Docker.
2. Executar o fluxo completo em um navegador e salvar o print solicitado em `docs/evidencias/interface-funcionando.png`.
3. Realizar commit e push no repositório real e verificar a aba **Actions** do GitHub.
4. Confirmar que o professor possui acesso ao repositório.

O pipeline GitHub Actions está configurado para testar os dois módulos e o Docker Compose após o push. Seu resultado **ainda não foi observado** nesta preparação.
