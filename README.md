# Laboratório de Compiladores — Trabalho 2

Software educacional desenvolvido **a partir do Trabalho 1**, preservando a arquitetura com **frontend HTML/CSS/JavaScript**, **backend Node.js**, **Nginx** e **Docker Compose**.

A linguagem **estudada é C**, conforme a escolha registrada no README original entregue no Trabalho 1. O recorte inicial contempla variáveis inteiras, operadores aritméticos, comparações, atribuições, comentários de linha e condicionais `if`/`else`. Não há suporte planejado nesta etapa a ponteiros, vetores, funções, bibliotecas externas, laços ou tipos além de `int`.

> **Limite da Etapa 2:** a aplicação **não compila, executa nem analisa** a sintaxe do código informado. O processamento atual consiste em **receber o texto pelo backend, validar o formato da requisição e confirmar seu recebimento**. A análise léxica, sintática e semântica fica para trabalhos posteriores.

## 1. O que mudou em relação ao Trabalho 1

- Interface principal com nome do projeto, linguagem C e indicação da etapa atual.
- Editor em fonte monoespaçada que permite digitar, colar, editar e limpar código-fonte.
- **Três exemplos selecionáveis**, que preenchem o editor e podem ser modificados.
- Botão **Solicitar processamento**, que usa uma requisição real `POST /api/analyze` através do proxy Nginx.
- Área de retorno que mostra sucesso, erros de entrada, falhas de rede e confirmação do código recebido.
- Validação no frontend **e no backend**, preservando código com caracteres especiais ou erros de sintaxe intencionais.
- Testes automatizados de backend, frontend, regressão e verificação de integração HTTP.
- Atualização do workflow do GitHub Actions e da documentação.
- **Preservadas** as rotas de demonstração `/api/hello` e de disponibilidade `/api/health` do Trabalho 1.

## 2. Os três exemplos da interface

### Exemplo 1 — Variável e inicialização

```c
int numero = 10;
```

Demonstra declaração e inicialização de uma variável `int`.

### Exemplo 2 — Expressão aritmética

```c
int resultado = 10 + 5 * 2;
```

Demonstra operadores aritméticos e a precedência de `*` e `+`.

### Exemplo 3 — Estrutura condicional

```c
int numero = 10;

if (numero > 0) {
    numero = numero + 1;
}
```

Demonstra uma comparação, bloco `if` e atribuição. Os códigos são apenas textos enviados ao servidor; o sistema ainda não verifica se estão corretos.

## 3. Estrutura do projeto

```text
compiladores-educacional/
├── .github/workflows/ci.yml     # Testes e verificação Docker na CI
├── backend/
│   ├── src/app.js                # API, contrato e validações de entrada
│   ├── src/server.js             # Inicialização HTTP
│   ├── test/app.test.js          # Testes da API e regressão
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── index.html                # Tela de experimentação
│   ├── style.css                 # Estilos e responsividade
│   ├── app.js                    # Interações da interface
│   ├── examples.js               # Exemplos, validação e requisição
│   ├── test/app.test.js          # Testes de componentes e interações
│   ├── nginx.conf                # Servidor estático e proxy /api
│   ├── Dockerfile
│   └── package.json
├── docs/REGISTRO_TESTES.md       # Evidências, execuções e pendências
├── scripts/smoke-test.sh         # Teste HTTP da integração completa
├── compose.yaml
├── .gitignore
└── README.md
```

## 4. Pré-requisitos

Para executar a aplicação:

- **Docker Engine 24+** e **Docker Compose V2** (ou Docker Desktop com Compose integrado).
- Internet na primeira execução para baixar imagens de Node.js e Nginx.
- Porta **8080** livre no computador.

Para rodar os testes de JavaScript **fora do Docker**, instale também **Node.js 22**. Para executar o smoke test HTTP, use `curl` em um terminal compatível com `sh` (Linux, macOS, WSL ou Git Bash). O frontend não usa bibliotecas JavaScript externas e o backend só utiliza módulos nativos do Node.js; não é preciso `npm install`.

## 5. Executar com Docker Compose

Na raiz do projeto, execute:

```bash
docker compose up --build -d
```

Aguarde os serviços iniciarem e abra **http://localhost:8080**.

O Compose gerencia dois serviços:

- `frontend`: Nginx publicado **apenas localmente** na porta `127.0.0.1:8080`.
- `backend`: Node.js na porta interna `3000`, acessado pelo Nginx por meio da rota `/api/`.

O navegador envia requisições para `/api/analyze` no mesmo endereço da interface. Não é necessário acessar o backend diretamente nem configurar CORS.

Comandos úteis:

```bash
docker compose ps
docker compose logs -f
docker compose down
```

## 6. Como usar a interface

1. Abra `http://localhost:8080`.
2. Digite um trecho em C no editor **ou** selecione um dos três exemplos.
3. Altere o texto como desejar.
4. Clique em **Solicitar processamento**.
5. Confira o retorno real do backend no painel à direita: código recebido, confirmação e informação de que a análise de compilação ainda não foi implementada.
6. Experimente apagar o texto, digitar apenas espaços e desativar o backend para observar os diferentes erros.

O editor mantém seu conteúdo após um envio ou falha. O botão **Limpar editor** apaga o campo e restaura o painel inicial.

## 7. Contrato da API

### `POST /api/analyze`

Requisição:

```http
Content-Type: application/json
```

```json
{
  "codigo": "int numero = 10;"
}
```

Resposta bem-sucedida (`HTTP 200`):

```json
{
  "recebido": true,
  "linguagem": "C",
  "etapa": 2,
  "mensagem": "Código-fonte recebido com sucesso. A análise de compilação será implementada nas próximas etapas.",
  "caracteres": 16,
  "linhas": 1,
  "codigo": "int numero = 10;"
}
```

O campo `codigo` é devolvido integralmente para confirmar que o texto recebido é exatamente o texto enviado; nenhum código-fonte é executado, analisado ou armazenado em banco de dados.

| HTTP | Situação | Comportamento |
|---|---|---|
| `200` | JSON válido e código com conteúdo | Confirma recebimento e devolve texto/metadados |
| `400` | JSON inválido, campo ausente ou tipo incorreto | Mensagem de validação apropriada |
| `413` | Corpo acima de 32 KB | Avisa sobre o limite de tamanho |
| `415` | `Content-Type` diferente de JSON | Solicita envio em JSON |
| `422` | Campo vazio ou só espaços | Solicita um código-fonte não vazio |
| `404` | Rota desconhecida | Retorna rota não encontrada |
| `500` | Falha interna imprevista | Mensagem genérica, sem expor detalhes internos |

Outros endpoints **preservados do Trabalho 1**:

- `GET /api/hello` → `{"message":"Hello, World!","language":"C","stage":1}`.
- `GET /api/health` → `{"status":"ok"}`.

## 8. Testes automatizados

Com Node.js 22 instalado:

```bash
npm --prefix backend test
npm --prefix frontend test
```

Os testes cobrem validações de entrada, contrato HTTP, erros, rotas anteriores, componentes esperados da interface, seleção dos três exemplos, edição, limpeza, envio e tratamento de falhas.

Com o Compose iniciado:

```bash
sh scripts/smoke-test.sh
```

Este script verifica a interface, a disponibilidade dos exemplos, o proxy `/api`, os endpoints antigos, o recebimento real do código por `POST` e a rejeição de um campo contendo só espaços.

**Resultados de execução e limitações** são registrados em [`docs/REGISTRO_TESTES.md`](docs/REGISTRO_TESTES.md). O GitHub Actions (`.github/workflows/ci.yml`) também está configurado para executar testes do backend, do frontend e uma instalação limpa com Docker Compose a cada push ou pull request.

## 9. Validar uma instalação limpa

Em uma máquina com Docker instalado:

```bash
git clone URL_REAL_DO_SEU_REPOSITORIO
cd compiladores-educacional
docker compose up --build --force-recreate -d
sh scripts/smoke-test.sh
docker compose down
```

Substitua `URL_REAL_DO_SEU_REPOSITORIO` pelo endereço do seu projeto no GitHub. O procedimento foi preparado para ser reproduzível, mas a execução completa **com Docker** deve ser confirmada na sua máquina ou no GitHub Actions, pois o ambiente usado nesta revisão não possuía o comando Docker.

## 10. Evidência visual e entrega no GitHub

Com a aplicação em funcionamento, selecione **Estrutura condicional**, clique em **Solicitar processamento** e faça uma captura de tela mostrando:

- O nome do software e a identificação da linguagem C.
- O código-fonte no editor.
- A confirmação do código recebido no painel de resultados.

Guarde o print como `docs/evidencias/interface-funcionando.png` e envie-o junto com o trabalho, como solicitado pelo professor. **A captura visual ainda precisa ser feita** em um navegador com acesso ao aplicativo; não foi gerado um print fictício.

Para atualizar seu repositório, na pasta já conectada ao GitHub:

```bash
git add .
git commit -m "feat: interface e envio de codigo C com testes automatizados"
git push
```

Se ainda não houver repositório Git remoto configurado, faça a configuração usando a URL real e confirme que o professor **`rocha3runo`** mantém acesso conforme a orientação da disciplina. **Nenhum push automático foi feito neste pacote.**

## 11. Limitações atuais

- O projeto **não** realiza análises léxica, sintática e semântica e **não** executa o programa digitado.
- Não há editor avançado, autocompletar ou numeração de linhas (não obrigatórios nesta etapa).
- A persistência do texto vale durante o uso da página; recarregá-la restaura o editor vazio.
- O retorno apresenta um recibo de processamento, não um diagnóstico da validade do código C.
- A execução local com Docker e a captura de tela real devem ser confirmadas fora deste ambiente, conforme indicado no registro de testes.
