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

test('POST /api/analyze recebe e devolve o código C integralmente sem executar analisador', async () => {
  const codigo = 'int numero = 10;\nint resultado = numero + 5;';
  const response = await submit(JSON.stringify({ codigo }));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.recebido, true);
  assert.equal(data.linguagem, 'C');
  assert.equal(data.etapa, 2);
  assert.equal(data.codigo, codigo);
  assert.equal(data.linhas, 2);
  assert.equal(data.caracteres, codigo.length);
  assert.match(data.mensagem, /recebido com sucesso/i);
});

test('aceita caracteres especiais, acentos e código propositalmente incorreto', async () => {
  const codigo = 'int @numero = 1; // çã < > & "';
  const response = await submit(JSON.stringify({ codigo }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).codigo, codigo);
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
