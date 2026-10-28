# Registro de testes — Trabalho 3 (scanner léxico)

Este documento apresenta apenas verificações efetivamente realizadas, sem supor execução de Docker, CI ou navegador visual não confirmada.

## Ambiente da preparação

- Data: 28/10/2026.
- Linux; Node.js v22.16.0; Nginx 1.26.3; curl.
- O comando Docker não está instalado neste ambiente de preparação. O usuário havia executado Docker Compose e o smoke-test com sucesso **no Trabalho 2** em seu próprio computador. Essa evidência anterior não substitui a verificação específica do Trabalho 3.

## Resultados verificados

| Módulo / tipo | Procedimento | Aprovados | Falhas | Resultado |
|---|---|---:|---:|---|
| Scanner + backend + endpoints + regressões | `npm --prefix backend test` | 33 | 0 | APROVADO |
| Interface (DOM simulado) + lógica frontend + regressões | `npm --prefix frontend test` | 16 | 0 | APROVADO |
| Sintaxe de módulos JavaScript | `node --check` em módulos principais | 4 verificações | 0 | APROVADO |
| Configuração Nginx de integração local | `nginx -t -c <configuração temporária>` | 1 | 0 | APROVADO |
| Integração HTTP real com Node e Nginx locais | `BASE_URL=http://127.0.0.1:18765 sh scripts/smoke-test.sh` | 1 fluxo | 0 | APROVADO |
| Docker Compose | `docker compose up --build -d` | — | — | NÃO EXECUTADO nesta preparação |
| Navegador Chromium (interface visual) | Navegação local / captura | — | — | BLOQUEADO por política do navegador deste ambiente |

**Total de testes automatizados Node.js: 49 aprovados e 0 reprovados.** Os logs completos das duas suítes estão em `docs/evidencias/testes-backend-trabalho3.txt` e `docs/evidencias/testes-frontend-trabalho3.txt`.

## Validações funcionais

- Tokens corretamente classificados em palavras reservadas, identificadores, literais, operadores e delimitadores.
- Posições de linha/coluna testadas, inclusive para CRLF, LF, CR, comentários e múltiplas linhas.
- Operadores com dois caracteres reconhecidos antes dos de um caractere; comentários de linha e de bloco ignorados.
- Diagnósticos para caractere desconhecido, comentário não fechado, literal numérico inválido, string não fechada, escape inválido e literal de caractere malformado.
- Scanner preserva tokens já encontrados e continua após caracteres não reconhecidos.
- Código com sintaxe inválida mas tokens conhecidos é tokenizado, sem parser.
- API devolve HTTP 200 com `sucesso: false` em erros léxicos, e mantém os códigos HTTP 400, 413, 415 e 422 para problemas com requisições.
- Interface simula envio real, apresenta tabela, contagens, erros e navegação Anterior/Próximo; código não é interpretado como HTML.
- Rotas legadas `/api/hello` e `/api/health`, seleção dos três exemplos, editor, limpeza, validações e restauração de controles continuam testados.
- Nginx local apresentou conteúdo estático, scripts e requisições pelo proxy ao backend real; smoke test verificou código válido, posição de token, erro `@` e HTTP 422 para código vazio.

## Falhas encontradas e correções

- Os testes da etapa anterior esperavam apenas o recebimento do texto: foram atualizados para verificar o contrato do scanner sem perder casos de regressão.
- O Dockerfile copiava apenas os scripts anteriores: foi incluído `token-view.js` na lista dos arquivos estáticos publicados pelo Nginx.
- O smoke-test validava somente `recebido:true`: foi ampliado para verificar tokens, localizações e erros léxicos reais.

## Pendências para validação no computador do aluno

1. Na pasta local conectada ao repositório, executar `sudo docker compose up --build -d` (se necessário devido às permissões do Docker).
2. Executar `sh scripts/smoke-test.sh`, confirmar frontend e backend saudáveis com `sudo docker compose ps`.
3. Abrir `http://localhost:8080` em um navegador, analisar um exemplo e conferir a sequência/tabela de tokens; depois testar `int @x = 10;` para visualizar erros.
4. Fazer print **real** da interface funcionando e anexá-lo à submissão, se solicitado pelo professor.
5. Criar commit e enviar ao repositório já existente; verificar o resultado do GitHub Actions após o push.

Não afirmar validação Docker ou screenshot real desta versão antes de executá-los. O código não executa o programa-fonte submetido; o processamento é exclusivamente léxico.
