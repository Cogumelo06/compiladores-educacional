// Exemplos adequados ao subconjunto de C definido no Trabalho 1.
export const EXAMPLES = Object.freeze([
  {
    id: 'variavel',
    title: 'Variável e inicialização',
    description: 'Declaração de int com valor inicial.',
    code: 'int numero = 10;',
  },
  {
    id: 'aritmetica',
    title: 'Expressão aritmética',
    description: 'Operações com inteiros e precedência.',
    code: 'int resultado = 10 + 5 * 2;',
  },
  {
    id: 'condicional',
    title: 'Estrutura condicional',
    description: 'Comparação, if e bloco de comandos.',
    code: 'int numero = 10;\n\nif (numero > 0) {\n    numero = numero + 1;\n}',
  },
]);

export function findExample(id) {
  return EXAMPLES.find((item) => item.id === id) ?? null;
}

export function sourceStats(code) {
  return {
    caracteres: code.length,
    linhas: code.split(/\r\n|\r|\n/).length,
  };
}

export function validateSource(code) {
  return typeof code === 'string' && code.trim().length > 0
    ? null
    : 'Informe um código-fonte antes de solicitar a análise.';
}

export async function submitSource(code, fetcher = fetch) {
  let response;
  try {
    response = await fetcher('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: code }),
    });
  } catch {
    throw new Error('NETWORK_ERROR');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('RESPONSE_ERROR');
  }

  if (!response.ok) {
    if (response.status >= 500) throw new Error('SERVER_ERROR');
    if (typeof data.mensagem === 'string') throw new Error(data.mensagem);
    throw new Error('RESPONSE_ERROR');
  }

  if (data.recebido !== true || typeof data.mensagem !== 'string'
      || typeof data.codigo !== 'string' || data.codigo !== code) {
    throw new Error('RESPONSE_ERROR');
  }
  return data;
}

export function friendlyError(error) {
  switch (error?.message) {
    case 'NETWORK_ERROR':
      return 'Não foi possível comunicar com o servidor. Verifique a conexão e tente novamente.';
    case 'SERVER_ERROR':
    case 'RESPONSE_ERROR':
      return 'Ocorreu um problema ao processar a solicitação. Tente novamente.';
    default:
      return typeof error?.message === 'string'
        ? error.message
        : 'Ocorreu um problema inesperado. Tente novamente.';
  }
}
