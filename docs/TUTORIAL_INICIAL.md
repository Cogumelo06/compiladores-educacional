# Tutorial rápido — Explorando o scanner

1. Execute `docker compose up --build -d` na raiz do projeto e visite `http://localhost:8080`.
2. Escolha **Variável e inicialização** e clique em **Analisar código**. Para `int numero = 10;`, examine a tabela: `int` = palavra reservada, `numero` = identificador, `=` = operador, `10` = literal inteiro e `;` = delimitador.
3. Clique nos chips da sequência ou avance e retroceda token por token. Observe as posições de linha e coluna começando em 1.
4. Escolha **Estrutura condicional**. Repare que `if` é palavra reservada; `(` e `)` são delimitadores; `>` é operador. O scanner não determina se o `if` foi escrito com sintaxe válida.
5. Altere o texto para `int @numero = 10;` e analise novamente. O sistema indicará a posição do `@` e ainda exibirá os tokens que conseguiu reconhecer.
6. Experimente `int numero = ;`: o scanner pode retornar sucesso, pois **um erro de sintaxe não é necessariamente um erro léxico**. O parser será introduzido em trabalho posterior.
7. Experimente `/* exemplo` para ver um erro de comentário não fechado. Em seguida, use **Limpar editor** para restaurar a tela.

Para conferir testes sem Docker, use `npm --prefix backend test` e `npm --prefix frontend test` com Node.js 22 instalado.
