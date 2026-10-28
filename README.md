# Laboratório de Compiladores — Trabalho 3: Análise Léxica

Aplicação web educacional para visualizar como um **scanner** reconhece os tokens de programas escritos em um **subconjunto de C**. Esta versão continua os Trabalhos 1 (estrutura Docker e Hello World) e 2 (editor, três exemplos, API e testes). **Não executa código e ainda não faz análise sintática ou semântica.**

**Tecnologias preservadas:** frontend HTML/CSS/JavaScript servido por Nginx, backend Node.js 22 (sem dependências externas), Docker Compose e testes nativos do Node.js. O scanner foi implementado em JavaScript no backend para manter o projeto simples e reutilizar a validação HTTP anterior. Não foi incorporado um compilador C externo.

## 1. Funcionalidades desta etapa

- O editor permite digitar, colar, selecionar um dos três exemplos do Trabalho 2, editar e limpar o conteúdo.
- `POST /api/analyze` recebe o mesmo JSON e devolve **tokens, lexemas, linha, coluna, deslocamentos no texto original e erros léxicos**, com indicador `sucesso`.
- O scanner percorre o texto caractere a caractere; ignora espaços e comentários; agrupa lexemas; identifica sequências inválidas; recupera-se de erros quando possível.
- O frontend exibe o número de tokens e erros, **sequência interativa** (clique no token ou navegue por Anterior/Próximo), tabela com categorias e posições, contagem por categoria e diagnósticos didáticos.
- A tabela e a visualização usam `textContent` para exibir código potencialmente inválido sem interpretá-lo como HTML.
- As rotas `/api/hello` e `/api/health`, o limite de tamanho e as validações anteriores foram preservados.

## 2. Escopo léxico documentado (subconjunto didático de C)

| Categoria | Regra e exemplos | Observação |
|---|---|---|
| Palavras reservadas | `int`, `if`, `else`, `while`, `return` | Identificação léxica não significa suporte sintático a essas construções |
| Identificadores | `[A-Za-z_][A-Za-z0-9_]*` | Sensíveis a maiúsculas e minúsculas; sem letras Unicode |
| Inteiros | Dígitos decimais (`0`, `42`, `123`) | Não reconhece números hexadecimais, binários ou sufixos |
| Reais | Dígitos `.` dígitos (`3.14`) | Sem notação científica, sufixos ou `.5`; aceitos lexicalmente, não avaliados |
| Strings | `"texto"`, aceitando `\\n`, `\\r`, `\\t`, `\\0`, `\\\\`, `\\"` e `\\'` | String não fechada ou escape não previsto gera erro |
| Caracteres | `'x'`, `'\\n'` | Exatamente um caractere/escape entre aspas simples |
| Operadores aritméticos e de atribuição | `+`, `-`, `*`, `/`, `=` | Operadores compostos como `+=`, `++` não estão no escopo |
| Relacionais e lógicos | `<`, `>`, `<=`, `>=`, `==`, `!=`, `!`, `&&`, `||` | O scanner reconhece o maior operador compatível primeiro |
| Delimitadores | `(`, `)`, `{`, `}`, `[`, `]`, `;`, `,` | Pontuação reconhecida, sem parser |
| Comentários | `//` até o fim da linha; `/* ... */` em uma ou mais linhas | Ignorados; bloco não fechado gera erro |
| Espaços | Espaço, tab, CR, LF, CRLF, VT, FF | Ignorados; posição de linha/coluna começa em 1 |
| Fora do subconjunto | `@`, `#`, `$`, `12abc`, `3.`, escapes inválidos | Gera `ERRO_LEXICO` com trecho e localização; o scanner tenta continuar |

**Distinção importante:** o scanner pode reconhecer tokens de um código **sintaticamente incorreto**; por exemplo, `int x = ;` não produz erro léxico. Não declara tipos, não verifica escopo, não analisa expressão, não compila e não executa o código.

## 3. Três exemplos mantidos

**Variável e inicialização:** `int numero = 10;`

**Expressão aritmética:** `int resultado = 10 + 5 * 2;`

**Estrutura condicional:**

```c
int numero = 10;

if (numero > 0) {
    numero = numero + 1;
}
```

Para testar erros, experimente `int @numero = 10;` ou `/* comentário sem fechamento`.

## 4. Organização dos arquivos

```text
compiladores-educacional/
├── .github/workflows/ci.yml   # Testes e Docker em GitHub Actions
├── backend/
│   ├── src/app.js              # Contrato HTTP, validação de entrada e scanner
│   ├── src/scanner.js          # Scanner C com posição, tokens e erros
│   ├── src/server.js           # API Node.js
│   └── test/                   # Scanner e endpoints
├── frontend/
│   ├── index.html, style.css   # Layout e responsividade
│   ├── app.js                  # Integração editor e API
│   ├── examples.js             # Exemplos e cliente HTTP
│   ├── token-view.js           # Mapa didático, tabela, navegação e erros
│   ├── test/                   # Interações com DOM simulado
│   ├── nginx.conf, Dockerfile
│   └── package.json
├── docs/
│   └── REGISTRO_TESTES.md      # Evidências verificáveis da execução
├── scripts/smoke-test.sh      # Integração HTTP real
├── compose.yaml
└── README.md
```

## 5. Executar o sistema

**Pré-requisitos:** Docker Engine + Docker Compose V2; porta 8080 disponível. No Linux, pode ser necessário executar comandos Docker com `sudo` quando o usuário não tiver permissão para acessar o daemon.

```bash
docker compose up --build -d
docker compose ps
```

Abra **http://localhost:8080**. Escolha um exemplo ou cole seu próprio código C; clique em **Analisar código**; consulte a sequência interativa, a tabela e os erros apresentados abaixo do editor. O botão **Limpar editor** restaura o estado inicial.

O frontend Nginx é publicado em `127.0.0.1:8080` e encaminha `/api/` ao backend Node.js na rede interna do Compose. Nenhuma porta externa é aberta diretamente para o backend. Para encerrar:

```bash
docker compose down
```

## 6. Contrato da API

### `POST /api/analyze`

Requisição: `Content-Type: application/json`.

```json
{ "codigo": "int numero = 10;" }
```

Exemplo da resposta HTTP 200 (abreviado para os campos pedagógicos principais; os tokens também contêm `inicio` e `fim`):

```json
{
  "recebido": true,
  "linguagem": "C",
  "etapa": 3,
  "mensagem": "Análise léxica concluída: 5 token(s) identificado(s).",
  "caracteres": 16,
  "linhas": 1,
  "codigo": "int numero = 10;",
  "sucesso": true,
  "tokens": [
    { "tipo": "PALAVRA_RESERVADA", "lexema": "int", "linha": 1, "coluna": 1, "inicio": 0, "fim": 3 },
    { "tipo": "IDENTIFICADOR", "lexema": "numero", "linha": 1, "coluna": 5, "inicio": 4, "fim": 10 },
    { "tipo": "OPERADOR", "lexema": "=", "linha": 1, "coluna": 12, "inicio": 11, "fim": 12 },
    { "tipo": "LITERAL_INTEIRO", "lexema": "10", "linha": 1, "coluna": 14, "inicio": 13, "fim": 15 },
    { "tipo": "DELIMITADOR", "lexema": ";", "linha": 1, "coluna": 16, "inicio": 15, "fim": 16 }
  ],
  "erros": []
}
```

Resposta com erro léxico para `int @x;`: **HTTP 200** (requisição válida), `sucesso: false`, tokens reconhecidos e:

```json
"erros": [
  { "tipo": "ERRO_LEXICO", "lexema": "@", "linha": 1, "coluna": 5,
    "inicio": 4, "fim": 5,
    "mensagem": "Caractere não reconhecido: \"@\". Verifique o subconjunto de C suportado." }
]
```

Um erro léxico **não** é erro HTTP. `sucesso` sinaliza o resultado da tokenização, e `erros` traz os diagnósticos. Erros de formato da requisição mantêm as regras da Etapa 2:

| HTTP | Situação |
|---|---|
| 200 | Código recebido; scanner executado, com `sucesso: true` ou `false` |
| 400 | JSON inválido, campo ausente ou tipo incorreto |
| 413 | Requisição acima de 32 KB |
| 415 | `Content-Type` incompatível |
| 422 | Código vazio ou apenas espaços |
| 404 | Rota desconhecida |
| 500 | Falha inesperada, sem detalhes internos |

`GET /api/hello` e `GET /api/health` preservam os contratos originais de Trabalho 1.

## 7. Testes e regressão

No terminal, a partir da raiz do projeto, com **Node.js 22**:

```bash
npm --prefix backend test
npm --prefix frontend test
```

Os testes incluem: palavras reservadas, identificadores, literais, operadores, delimitadores, comentários, posição em CRLF/LF/CR, erros léxicos, casos de borda, API, interface, interações e regressões dos Trabalhos 1 e 2. Testes de frontend utilizam DOM simulado — não substituem teste manual em navegador.

Com Docker Compose iniciado:

```bash
sh scripts/smoke-test.sh
```

Este script verifica a página, os exemplos, os arquivos de visualização, o proxy HTTP, tokens, erros léxicos, `/api/hello`, `/api/health` e validação de entrada vazia. Os testes também são executados pela configuração do **GitHub Actions** após um push.

Consulte [`docs/REGISTRO_TESTES.md`](docs/REGISTRO_TESTES.md) para os resultados efetivamente observados e pendências não verificadas.

## 8. Demonstração, evidências e publicação

Para o **print** exigido pelo professor, abra o aplicativo; selecione `Estrutura condicional`; clique em **Analisar código** e capture o editor junto da sequência/tabela de tokens. Para evidenciar diagnóstico, envie também `int @numero = 10;` e capture a lista de erros. Guarde as imagens em `docs/evidencias/` caso deseje versioná-las.

Para atualizar **o mesmo repositório**, usando a pasta local já conectada ao GitHub e preservando a pasta `.git`:

```bash
git status
git add -A
git commit -m "Trabalho 3: scanner lexico C, visualizacao e testes"
git push origin main
```

Repositório anteriormente utilizado: https://github.com/Cogumelo06/compiladores-educacional. Não crie um segundo repositório; mantenha a continuidade histórica dos Trabalhos 1 e 2. Se o push for rejeitado por alterações remotas, investigue antes de qualquer correção; **não use `git push --force`**.

## 9. Limitações e próximas etapas

- **Não há parser**: não são verificados parênteses equilibrados, gramática ou construções válidas de C. O significado das variáveis também não é analisado.
- O scanner cobre **um subconjunto lexical didático**, e não o padrão completo de C (sem pré-processador, números com expoente, Unicode, macros, sufixos de tipos, etc.).
- A interface mostra categorias/lexemas, não uma árvore sintática ou tabela de símbolos. Essas estruturas caberão a etapas futuras.
- O frontend mantém código apenas durante a sessão da página; recarregar restaura o editor.
- Responsividade visual foi prevista; acessibilidade com leitores de tela e usabilidade em celulares exigem avaliação prática adicional.
- A integração em contêineres deve ser confirmada no computador do usuário/GitHub Actions se o ambiente de preparação não tiver Docker.

O scanner foi estruturado em módulo separado (`backend/src/scanner.js`) para facilitar a futura implementação do parser (Trabalho 4) e da análise semântica (Trabalho 5).
