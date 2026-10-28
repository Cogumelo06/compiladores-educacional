import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scan } from '../src/scanner.js';

const kinds = (source) => scan(source).tokens.map(({ tipo, lexema, linha, coluna }) => ({ tipo, lexema, linha, coluna }));

test('reconhece todas as palavras reservadas do subconjunto', () => {
  const result = kinds('int if else while return');
  assert.equal(result.length, 5);
  assert.ok(result.every((t) => t.tipo === 'PALAVRA_RESERVADA'));
});
test('identificadores com _ inicial e dígitos subsequentes; maiúsculas são distintas', () => {
  assert.deepEqual(kinds('_x1 x_2 Numero numero').map((t) => t.lexema), ['_x1','x_2','Numero','numero']);
});
test('inteiros e reais decimais produzem categorias corretas', () => {
  assert.deepEqual(kinds('0 123 4.5').map((t) => t.tipo), ['LITERAL_INTEIRO','LITERAL_INTEIRO','LITERAL_REAL']);
});
test('literais string e caractere com escape suportado', () => {
  const result = scan('"ola\\n" \'x\' \'\\n\'');
  assert.equal(result.sucesso, true);
  assert.deepEqual(result.tokens.map((t) => t.tipo), ['LITERAL_STRING','LITERAL_CARACTERE','LITERAL_CARACTERE']);
});
test('operadores simples e compostos usam regra do lexema mais longo', () => {
  const result = kinds('= == != < <= > >= && || ! + - * /');
  assert.equal(result.length, 14);
  assert.ok(result.every((t) => t.tipo === 'OPERADOR'));
  assert.deepEqual(result.slice(0,4).map((t) => t.lexema), ['=', '==', '!=', '<']);
});
test('todos os delimitadores suportados', () => {
  assert.deepEqual(kinds('(){}[];,').map((t) => t.lexema), ['(',')','{','}','[',']',';',',']);
});
test('comentários simples e de bloco são ignorados', () => {
  const result = scan('int a;// ignora 123\n/*bloco\nabc*/a=1;');
  assert.equal(result.sucesso, true);
  assert.deepEqual(result.tokens.map((t) => t.lexema), ['int','a',';','a','=','1',';']);
  assert.equal(result.tokens[3].linha, 3);
});
test('espaços não geram token e linhas CRLF, CR e LF contam corretamente', () => {
  const result = kinds('  int x;\r\n\tint y;\rint z;\n');
  assert.equal(result[0].linha, 1); assert.equal(result[0].coluna, 3);
  assert.equal(result[3].linha, 2); assert.equal(result[3].coluna, 2);
  assert.equal(result[6].linha, 3); assert.equal(result[6].coluna, 1);
});
test('índices de token preservam posição no texto original', () => {
  const source = 'int\r\nx=7;';
  for (const token of scan(source).tokens) assert.equal(source.slice(token.inicio, token.fim), token.lexema);
});
test('caracteres desconhecidos acumulam erros sem interromper varredura', () => {
  const result = scan('int @x = 1;\n$ y = 2;');
  assert.equal(result.sucesso, false);
  assert.deepEqual(result.erros.map((e) => [e.lexema, e.linha, e.coluna]), [['@',1,5],['$',2,1]]);
  assert.ok(result.tokens.some((t) => t.lexema === 'y'));
});
test('comentário de bloco não fechado gera erro com localização', () => {
  const result = scan('int n;\n/* comentario\nainda aberto');
  assert.equal(result.sucesso, false);
  assert.equal(result.erros.length, 1);
  assert.equal(result.erros[0].linha, 2);
  assert.equal(result.erros[0].coluna, 1);
  assert.match(result.erros[0].mensagem, /não fechado/);
});
test('literal numérico malformado não vira identificador válido', () => {
  const result = scan('12abc; 3.; 7_2');
  assert.equal(result.erros.length, 3);
  assert.deepEqual(result.erros.map((e) => e.lexema), ['12abc', '3.', '7_2']);
  assert.ok(result.tokens.some((t) => t.lexema === ';'));
});
test('string não fechada e escape inválido produzem erros', () => {
  const result = scan('"abc\n"oi\\q"');
  assert.equal(result.erros.length, 2);
  assert.match(result.erros[0].mensagem, /não fechado/);
  assert.match(result.erros[1].mensagem, /escape/);
});
test('caractere vazio ou com mais de um caractere gera erro', () => {
  assert.equal(scan("'' 'ab'").erros.length, 2);
});
test('scanner não atua como parser: sintaxe incompleta continua tokenizada', () => {
  const result = scan('int x = ; if ( ) {');
  assert.equal(result.sucesso, true);
  assert.ok(result.tokens.length > 0);
});
test('código vazio, espaços e apenas comentários retornam listas vazias', () => {
  for (const code of ['', ' \r\n \t', '// oi', '/* nada */']) {
    assert.deepEqual(scan(code), { sucesso: true, tokens: [], erros: [] });
  }
});
test('token final do arquivo não exige delimitador nem nova linha', () => {
  assert.deepEqual(kinds('abc').map((t) => t.lexema), ['abc']);
});
test('scanner não executa o código recebido', () => {
  const source = 'while (1) { return 0; }';
  assert.equal(scan(source).sucesso, true);
});
test('scanner exige entrada textual para uso direto', () => {
  assert.throws(() => scan(null), TypeError);
});
