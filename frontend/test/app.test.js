import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { EXAMPLES, findExample, sourceStats, validateSource, submitSource, friendlyError } from '../examples.js';
import { initApplication } from '../app.js';
import { countCategories } from '../token-view.js';

class FakeElement {
  constructor() {
    this.value = '';
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.focused = false;
    this.children = [];
    this.listeners = {};
    this.dataset = {};
    this.classes = new Set();
    this.attributes = new Map();
    this.classList = {
      toggle: (name, active) => active ? this.classes.add(name) : this.classes.delete(name),
    };
  }
  appendChild(item) { this.children.push(item); }
  replaceChildren(...items) { this.children = [...items]; }
  setAttribute(key, value) { this.attributes.set(key, value); }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  focus() { this.focused = true; }
  async fire(name) { return this.listeners[name]({ preventDefault() {} }); }
}

function makePage(fetcher) {
  const ids = ['source-form', 'source-code', 'example-select', 'clear-code',
    'analyze-button', 'source-stats', 'result-title', 'result-message',
    'form-feedback', 'result-detail', 'result-code', 'result-panel',
    'lexical-section', 'token-chips', 'tokens-body', 'lexical-errors', 'token-summary',
    'category-counts', 'token-inspector', 'previous-token', 'next-token'];
  const elements = Object.fromEntries(ids.map((id) => [id, new FakeElement()]));
  const doc = {
    querySelector: (selector) => elements[selector.substring(1)],
    createElement: () => new FakeElement(),
  };
  initApplication(doc, fetcher);
  return elements;
}

test('interface inclui todos os campos e regiões solicitados', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of ['source-form', 'source-code', 'example-select', 'analyze-button',
    'result-panel', 'result-title', 'result-message', 'form-feedback',
    'lexical-section', 'token-chips', 'tokens-body', 'lexical-errors', 'token-summary']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /Linguagem C/i);
  assert.match(html, /type="module"/);
});

test('três exemplos são exclusivos do subconjunto C e identificáveis', () => {
  assert.equal(EXAMPLES.length, 3);
  for (const item of EXAMPLES) {
    assert.equal(findExample(item.id), item);
    assert.equal(validateSource(item.code), null);
  }
  assert.equal(findExample('inexistente'), null);
});

test('contagem de linhas e caracteres preserva conteúdo informado', () => {
  assert.deepEqual(sourceStats('int x = 1;\nint y = 2;'), { linhas: 2, caracteres: 21 });
  assert.deepEqual(sourceStats(''), { linhas: 1, caracteres: 0 });
});

test('validação distingue entrada vazia, espaços e código arbitrário', () => {
  assert.match(validateSource('   \n '), /Informe um código-fonte/);
  assert.match(validateSource(''), /Informe um código-fonte/);
  assert.equal(validateSource('int @ = 1;'), null);
  assert.equal(validateSource('int x = 1;'), null);
});

test('seleção dos três exemplos preenche o editor, permitindo substituição', async () => {
  const page = makePage(async () => { throw new Error('não deveria enviar'); });
  assert.equal(page['example-select'].children.length, 3);
  for (const example of EXAMPLES) {
    page['example-select'].value = example.id;
    await page['example-select'].fire('change');
    assert.equal(page['source-code'].value, example.code);
    assert.match(page['form-feedback'].textContent, /Exemplo carregado/);
  }
});

test('edição manual mantém texto e desmarca a seleção; botão Limpar restaura estado', async () => {
  const page = makePage(async () => { throw new Error('não deveria enviar'); });
  page['example-select'].value = EXAMPLES[0].id;
  await page['example-select'].fire('change');
  page['source-code'].value += '\nint y = 2;';
  await page['source-code'].fire('input');
  assert.equal(page['example-select'].value, '');
  assert.match(page['source-stats'].textContent, /2 linhas/);
  await page['clear-code'].fire('click');
  assert.equal(page['source-code'].value, '');
  assert.equal(page['result-panel'].dataset.state, 'idle');
});

test('formulário vazio impede envio e apresenta erro compreensível', async () => {
  let requests = 0;
  const page = makePage(async () => { requests++; });
  await page['source-form'].fire('submit');
  assert.equal(requests, 0);
  assert.equal(page['result-panel'].dataset.state, 'error');
  assert.match(page['form-feedback'].textContent, /Informe um código-fonte/);
});

test('envio usa POST JSON, apresenta resposta real, preserva código e reabilita botão', async () => {
  const codigo = 'int valor = 7;';
  let sent;
  const page = makePage(async (url, options) => {
    sent = { url, options };
    return {
      ok: true, status: 200,
      json: async () => ({ recebido: true, mensagem: 'Análise léxica concluída!', codigo,
        sucesso: true, erros: [], tokens: [
          { tipo: 'PALAVRA_RESERVADA', lexema: 'int', linha: 1, coluna: 1 },
          { tipo: 'IDENTIFICADOR', lexema: 'valor', linha: 1, coluna: 5 },
        ] }),
    };
  });
  page['source-code'].value = codigo;
  await page['source-form'].fire('submit');
  assert.equal(sent.url, '/api/analyze');
  assert.equal(sent.options.method, 'POST');
  assert.deepEqual(JSON.parse(sent.options.body), { codigo });
  assert.equal(page['source-code'].value, codigo);
  assert.equal(page['result-code'].textContent, codigo);
  assert.equal(page['result-panel'].dataset.state, 'success');
  assert.equal(page['lexical-section'].hidden, false);
  assert.equal(page['tokens-body'].children.length, 2);
  assert.equal(page['token-chips'].children.length, 2);
  assert.match(page['token-inspector'].textContent, /Token 1\/2/);
  assert.equal(page['analyze-button'].disabled, false);
});

test('erro de comunicação altera resultado sem limpar o editor', async () => {
  const page = makePage(async () => { throw new Error('offline'); });
  page['source-code'].value = 'int x = 0;';
  await page['source-form'].fire('submit');
  assert.equal(page['source-code'].value, 'int x = 0;');
  assert.equal(page['result-panel'].dataset.state, 'error');
  assert.match(page['result-message'].textContent, /Não foi possível comunicar/);
  assert.equal(page['analyze-button'].disabled, false);
});

test('submitSource protege contra respostas malformadas e falhas HTTP', async () => {
  await assert.rejects(() => submitSource('ok', async () => ({ ok: true, json: async () => ({ recebido: true, mensagem: 'ok', codigo: 'não é o mesmo' }) })), /RESPONSE_ERROR/);
  await assert.rejects(() => submitSource('ok', async () => ({ ok: false, status: 500, json: async () => ({ mensagem: 'stack do servidor' }) })), /SERVER_ERROR/);
  assert.match(friendlyError(new Error('NETWORK_ERROR')), /comunicar/);
});


test('categorias de tokens são contadas corretamente', () => {
  assert.deepEqual(countCategories([
    { tipo: 'OPERADOR' }, { tipo: 'OPERADOR' }, { tipo: 'IDENTIFICADOR' },
  ]), { OPERADOR: 2, IDENTIFICADOR: 1 });
});

test('resultado com erro léxico ainda exibe tokens e mensagens com posição', async () => {
  const codigo = 'int @ = 1;';
  const page = makePage(async () => ({
    ok: true, status: 200, json: async () => ({
      recebido: true, codigo, mensagem: '1 erro léxico', sucesso: false,
      tokens: [{ tipo: 'PALAVRA_RESERVADA', lexema: 'int', linha: 1, coluna: 1 }],
      erros: [{ tipo: 'ERRO_LEXICO', lexema: '@', linha: 1, coluna: 5,
        mensagem: 'Caractere não reconhecido' }],
    }),
  }));
  page['source-code'].value = codigo;
  await page['source-form'].fire('submit');
  assert.equal(page['result-panel'].dataset.state, 'error');
  assert.equal(page['lexical-section'].hidden, false);
  assert.match(page['lexical-errors'].children[0].textContent, /Linha 1, coluna 5/);
  assert.equal(page['token-chips'].children.length, 1);
});

test('navegação didática muda foco sem alterar o código original', async () => {
  const codigo = 'int x;';
  const page = makePage(async () => ({
    ok: true, status: 200, json: async () => ({
      recebido: true, codigo, mensagem: 'ok', sucesso: true, erros: [],
      tokens: [{ tipo: 'PALAVRA_RESERVADA', lexema: 'int', linha: 1, coluna: 1 },
        { tipo: 'IDENTIFICADOR', lexema: 'x', linha: 1, coluna: 5 }],
    }),
  }));
  page['source-code'].value = codigo;
  await page['source-form'].fire('submit');
  assert.equal(page['previous-token'].disabled, true);
  page['next-token'].onclick();
  assert.match(page['token-inspector'].textContent, /Token 2\/2/);
  assert.equal(page['next-token'].disabled, true);
  page['token-chips'].children[0].listeners.click();
  assert.match(page['token-inspector'].textContent, /Token 1\/2/);
  assert.equal(page['source-code'].value, codigo);
});

test('entrada só com comentários gera aviso de nenhum token sem falha', async () => {
  const codigo = '/* comentário */';
  const page = makePage(async () => ({
    ok: true, status: 200, json: async () => ({
      recebido: true, codigo, mensagem: '0 tokens', sucesso: true, tokens: [], erros: [],
    }),
  }));
  page['source-code'].value = codigo;
  await page['source-form'].fire('submit');
  assert.match(page['category-counts'].children[0].textContent, /Nenhum token/);
  assert.equal(page['next-token'].disabled, true);
});

test('após edição ou limpeza painel de scanner anterior é ocultado', async () => {
  const codigo = 'x';
  const page = makePage(async () => ({
    ok: true, status: 200, json: async () => ({
      recebido: true, codigo, mensagem: 'ok', sucesso: true, erros: [],
      tokens: [{ tipo: 'IDENTIFICADOR', lexema: 'x', linha: 1, coluna: 1 }],
    }),
  }));
  page['source-code'].value = codigo;
  await page['source-form'].fire('submit');
  assert.equal(page['lexical-section'].hidden, false);
  await page['clear-code'].fire('click');
  assert.equal(page['lexical-section'].hidden, true);
});

test('interface usa textContent para conteúdo enviado, nunca HTML de origem', async () => {
  const codigo = '<script>alert(1)</script>';
  const page = makePage(async () => ({
    ok: true, status: 200, json: async () => ({
      recebido: true, codigo, mensagem: 'Erro', sucesso: false, tokens: [],
      erros: [{ lexema: '<', linha: 1, coluna: 1, mensagem: '<img src=x onerror=alert(1)>' }],
    }),
  }));
  page['source-code'].value = codigo;
  await page['source-form'].fire('submit');
  assert.equal(page['result-code'].textContent, codigo);
  assert.match(page['lexical-errors'].children[0].textContent, /<img/);
});
