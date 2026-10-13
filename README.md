# Laboratório de Compiladores — Etapa 1

Projeto educacional da disciplina de **Compiladores**. Esta primeira entrega prepara uma aplicação web e seu ambiente reproduzível com Docker. O frontend exibe **Hello, World!**, recebido de uma API no backend.

> **Escopo desta entrega:** estrutura inicial, escolha e delimitação da linguagem, integração frontend/backend, Docker Compose, testes básicos e documentação. **Ainda não** há analisadores léxico, sintático ou semântico: eles serão desenvolvidos nas próximas etapas.

## 1. Linguagem escolhida e subconjunto inicial

A linguagem **a ser analisada pelo software é C**. Ela foi escolhida por apresentar uma sintaxe explícita e didática para estudar tokens, gramáticas, precedência de operadores e verificações semânticas. Delimitar um recorte pequeno também permite evoluir o analisador gradualmente.

O subconjunto **planejado** para as próximas etapas será:

- **Tipos e variáveis:** declarações `int`, inicialização, atribuições e identificadores.
- **Expressões:** números inteiros, parênteses e operadores `+`, `-`, `*`, `/`.
- **Comparações:** `==`, `!=`, `<`, `<=`, `>` e `>=`.
- **Controle de fluxo:** `if` e `else`, com blocos `{ ... }`.
- **Sintaxe auxiliar:** ponto e vírgula ao fim de comandos e comentários de linha `//`.

Exemplo de código que o analisador poderá receber nas etapas futuras:

```c
int idade = 18;
int proximo = idade + 1;

if (proximo >= 18) {
    proximo = proximo + 1;
}
```

Neste recorte inicial, estão fora do escopo ponteiros, vetores, funções, bibliotecas externas, laços e tipos diferentes de `int`.

**Observação:** C é a linguagem **estudada**. A aplicação web foi implementada com HTML/CSS/JavaScript no frontend e Node.js no backend, uma escolha independente da linguagem que será analisada.

## 2. Estrutura do repositório

```text
compiladores-educacional/
├── .github/
│   └── workflows/
│       └── ci.yml           # Testes automáticos em instalação limpa
├── backend/
│   ├── src/
│   │   ├── app.js          # Rotas e respostas HTTP
│   │   └── server.js       # Inicialização do servidor
│   ├── test/
│   │   └── app.test.js     # Testes básicos da API
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── frontend/
│   ├── index.html          # Página principal
│   ├── app.js              # Consulta à API
│   ├── style.css           # Estilos da interface
│   ├── nginx.conf          # Servidor web e proxy /api
│   ├── Dockerfile
│   └── .dockerignore
├── scripts/
│   └── smoke-test.sh       # Verificação da integração dos serviços
├── compose.yaml
├── .gitignore
└── README.md
```

## 3. Pré-requisitos

- **Docker Engine 24+** com **Docker Compose V2** (`docker compose`), ou Docker Desktop com Compose integrado.
- Acesso à internet na **primeira execução**, para obter as imagens Docker.
- Porta **8080** disponível no computador.
- **Git** é necessário apenas para clonar o projeto do GitHub.

Confira a instalação:

```bash
docker --version
docker compose version
```

Não é preciso instalar Node.js ou Nginx no computador para executar via Docker; eles ficam dentro dos contêineres.

## 4. Como iniciar

Abra um terminal na pasta raiz do projeto (a que contém `compose.yaml`):

```bash
docker compose up --build -d
```

O Compose inicia dois serviços:

1. `backend`: Node.js na porta **3000**, acessível aos outros serviços pela rede interna do Compose.
2. `frontend`: Nginx na porta **8080 do computador**, que serve a página e encaminha `/api/...` para o backend.

Acesse **http://localhost:8080** pelo navegador. Quando a aplicação carregar, o texto **Hello, World!** aparecerá na página. Ele é obtido pela rota `/api/hello` do backend, através do proxy do frontend.

Rotas para conferir manualmente:

- Interface web: http://localhost:8080
- Mensagem retornada pela API: http://localhost:8080/api/hello
- Status do backend: http://localhost:8080/api/health

Exemplo de retorno em `/api/hello`:

```json
{"message":"Hello, World!","language":"C","stage":1}
```

## 5. Como verificar e encerrar

Verificar os contêineres:

```bash
docker compose ps
```

Visualizar os logs:

```bash
docker compose logs -f
```

Encerrar e remover os contêineres e a rede do projeto:

```bash
docker compose down
```

As imagens construídas não são removidas pelo `down` padrão, o que acelera futuras inicializações.

## 6. Validação de uma instalação limpa

Para reproduzir o projeto em uma máquina que só tenha os pré-requisitos acima:

```bash
git clone URL_DO_REPOSITORIO
cd compiladores-educacional
docker compose up --build --force-recreate -d
docker compose ps
```

Substitua `URL_DO_REPOSITORIO` pelo endereço real do repositório criado no GitHub. Depois:

1. Abra **http://localhost:8080** e confirme a mensagem **Hello, World!**.
2. Abra **http://localhost:8080/api/hello** e confirme o JSON com a mesma mensagem.
3. Abra **http://localhost:8080/api/health** e confirme `{"status":"ok"}`.
4. Para uma checagem automatizada em macOS/Linux/WSL/Git Bash, execute `sh scripts/smoke-test.sh` (requer `curl`).
5. Execute `docker compose down` para encerrar.

O workflow em `.github/workflows/ci.yml` repete essa instalação em um ambiente novo do **GitHub Actions** a cada push ou pull request. Ele também executa os testes unitários do backend. Um resultado verde no workflow demonstra que a inicialização e as verificações automáticas foram concluídas naquele ambiente.

> Se houver erro, consulte `docker compose logs`, confirme que o Docker está em execução e verifique se a porta 8080 não está ocupada.

## 7. Publicação no GitHub e acesso do professor

1. Crie um repositório chamado **`compiladores-educacional`** na sua conta do GitHub (sem adicionar outro README automaticamente).
2. Na pasta deste projeto, execute:

```bash
git init
git add .
git commit -m "feat: estrutura inicial com Docker e Hello World"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/compiladores-educacional.git
git push -u origin main
```

3. Substitua `SEU_USUARIO` pelo seu login do GitHub.
4. Envie ao professor o link `https://github.com/SEU_USUARIO/compiladores-educacional`.
5. Se o repositório for privado, em **Settings → Collaborators → Add people**, convide o usuário **`rocha3runo`** e confira se o convite foi aceito. Se for público, o professor já poderá visualizar o código pelo link, mas pode ser convidado como colaborador se a disciplina exigir.
6. Confirme na aba **Actions** do repositório que os testes foram aprovados.

## 8. Próximas etapas

Em versões futuras, a aplicação poderá oferecer um editor para receber código C, identificar tokens (análise léxica), validar a gramática do subconjunto (análise sintática) e detectar problemas simples como uso de variáveis não declaradas (análise semântica). Essas funcionalidades **não fazem parte** da primeira entrega.
