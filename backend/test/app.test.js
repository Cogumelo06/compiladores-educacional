import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from '../src/app.js';

const server = createServer();
let baseUrl;

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('GET /api/hello retorna Hello, World! e a linguagem escolhida', async () => {
  const response = await fetch(`${baseUrl}/api/hello`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await response.json(), {
    message: 'Hello, World!',
    language: 'C',
    stage: 1,
  });
});

test('GET /api/health confirma disponibilidade do backend', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('rota desconhecida responde 404', async () => {
  const response = await fetch(`${baseUrl}/api/desconhecida`);
  assert.equal(response.status, 404);
});

async function submit(body, headers = { 'Content-Type': 'application/json' }) {
  return fetch(`${baseUrl}/api/analyze`, { method: 'POST', headers, body });
}

test('POST /api/analyze recebe e tokeniza o código C sem executá-lo', async () => {
  const codigo = 'int numero = 10;\nint resultado = numero + 5;';
  const response = await submit(JSON.stringify({ codigo }));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.recebido, true);
  assert.equal(data.linguagem, 'C');
  assert.equal(data.etapa, 3);
  assert.equal(data.sucesso, true);
  assert.ok(data.tokens.length > 0);
  assert.deepEqual(data.erros, []);
  assert.equal(data.codigo, codigo);
  assert.equal(data.linhas, 2);
  assert.equal(data.caracteres, codigo.length);
  assert.match(data.mensagem, /Análise léxica concluída/i);
});

test('aceita caracteres especiais, acentos e código propositalmente incorreto', async () => {
  const codigo = 'int @numero = 1; // çã < > & "';
  const response = await submit(JSON.stringify({ codigo }));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.codigo, codigo);
  assert.equal(data.sucesso, false);
  assert.ok(data.erros.length > 0);
});

test('rejeita texto vazio ou somente espaços', async () => {
  for (const codigo of ['', ' \t \n ']) {
    const response = await submit(JSON.stringify({ codigo }));
    assert.equal(response.status, 422);
    assert.match((await response.json()).mensagem, /informe um código-fonte/i);
  }
});

test('rejeita campo obrigatório ausente e tipos incorretos', async () => {
  for (const payload of [{}, { codigo: 10 }, { codigo: null }, { codigo: [] }, []]) {
    const response = await submit(JSON.stringify(payload));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).recebido, false);
  }
});

test('rejeita JSON malformado', async () => {
  const response = await submit('{ codigo: "sem aspas" }');
  assert.equal(response.status, 400);
  assert.match((await response.json()).mensagem, /json válido/i);
});

test('rejeita Content-Type incompatível', async () => {
  const response = await submit('codigo=oi', { 'Content-Type': 'text/plain' });
  assert.equal(response.status, 415);
});

test('não permite entrada além de 32 KB', async () => {
  const response = await submit(JSON.stringify({ codigo: 'a'.repeat(33000) }));
  assert.equal(response.status, 413);
});

test('mantém o backend funcional após uma requisição inválida', async () => {
  await submit(JSON.stringify({ codigo: '' }));
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});


test('API responde com posições, categorias e lexemas na ordem correta', async () => {
  const response = await submit(JSON.stringify({ codigo: 'int numero = 10;' }));
  assert.equal(response.status, 200);
  const { sucesso, tokens, erros } = await response.json();
  assert.equal(sucesso, true);
  assert.deepEqual(erros, []);
  assert.deepEqual(tokens.map((t) => [t.tipo, t.lexema, t.linha, t.coluna]), [
    ['PALAVRA_RESERVADA', 'int', 1, 1],
    ['IDENTIFICADOR', 'numero', 1, 5],
    ['OPERADOR', '=', 1, 12],
    ['LITERAL_INTEIRO', '10', 1, 14],
    ['DELIMITADOR', ';', 1, 16],
  ]);
});

test('API retorna sucesso false e erros acumulados sem tratar falha léxica como HTTP 500', async () => {
  const response = await submit(JSON.stringify({ codigo: 'int @a;\n$ b;' }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.sucesso, false);
  assert.equal(result.erros.length, 2);
  assert.ok(result.tokens.length > 0);
});

test('API aceita sintaxe incorreta se os tokens forem válidos', async () => {
  const response = await submit(JSON.stringify({ codigo: 'int x = ;' }));
  assert.equal((await response.json()).sucesso, true);
});
