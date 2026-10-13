import { createServer as createHttpServer } from 'node:http';

function respondJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

export function createServer() {
  return createHttpServer((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;

    if (request.method === 'GET' && path === '/api/hello') {
      respondJson(response, 200, {
        message: 'Hello, World!',
        language: 'C',
        stage: 1,
      });
      return;
    }

    if (request.method === 'GET' && path === '/api/health') {
      respondJson(response, 200, { status: 'ok' });
      return;
    }

    respondJson(response, 404, { error: 'Rota não encontrada' });
  });
}
