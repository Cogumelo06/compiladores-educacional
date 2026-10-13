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
