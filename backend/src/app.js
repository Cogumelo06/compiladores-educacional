import { createServer as createHttpServer } from 'node:http';

const MAX_BODY_BYTES = 32 * 1024;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function respondJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers['content-type'] || '')) {
    throw new RequestError(415, 'Envie os dados no formato JSON (application/json).');
  }

  let length = 0;
  const parts = [];
  for await (const chunk of request) {
    length += chunk.length;
    if (length > MAX_BODY_BYTES) {
      throw new RequestError(413, 'O código enviado excede o limite de 32 KB.');
    }
    parts.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(parts).toString('utf8'));
  } catch {
    throw new RequestError(400, 'O corpo da requisição não contém um JSON válido.');
  }
}

export function validateSubmission(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data) || !Object.hasOwn(data, 'codigo')) {
    throw new RequestError(400, 'Informe o campo obrigatório "codigo".');
  }
  if (typeof data.codigo !== 'string') {
    throw new RequestError(400, 'O campo "codigo" deve conter texto.');
  }
  if (data.codigo.trim().length === 0) {
    throw new RequestError(422, 'Informe um código-fonte antes de solicitar a análise.');
  }
  return data.codigo;
}

async function handleRequest(request, response) {
  const path = new URL(request.url, 'http://localhost').pathname;

  // Preserva as duas rotas da entrega anterior, inclusive os seus contratos.
  if (request.method === 'GET' && path === '/api/hello') {
    respondJson(response, 200, { message: 'Hello, World!', language: 'C', stage: 1 });
    return;
  }
  if (request.method === 'GET' && path === '/api/health') {
    respondJson(response, 200, { status: 'ok' });
    return;
  }

  if (request.method === 'POST' && path === '/api/analyze') {
    const data = await readJson(request);
    const codigo = validateSubmission(data);

    // Etapa 2: somente recebimento/validação de entrada, sem análise do código C.
    respondJson(response, 200, {
      recebido: true,
      linguagem: 'C',
      etapa: 2,
      mensagem: 'Código-fonte recebido com sucesso. A análise de compilação será implementada nas próximas etapas.',
      caracteres: codigo.length,
      linhas: codigo.split(/\r\n|\r|\n/).length,
      codigo,
    });
    return;
  }

  respondJson(response, 404, { erro: 'Rota não encontrada.' });
}

export function createServer() {
  return createHttpServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      if (response.headersSent || response.destroyed) return;
      const status = error instanceof RequestError ? error.status : 500;
      const message = error instanceof RequestError
        ? error.message
        : 'Ocorreu um erro inesperado. Tente novamente.';
      respondJson(response, status, { recebido: false, mensagem: message });
    });
  });
}
