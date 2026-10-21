import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { EXAMPLES, findExample, sourceStats, validateSource, submitSource, friendlyError } from '../examples.js';
import { initApplication } from '../app.js';

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
    this.classList = {
      toggle: (name, active) => active ? this.classes.add(name) : this.classes.delete(name),
    };
  }
  appendChild(item) { this.children.push(item); }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  focus() { this.focused = true; }
  async fire(name) { return this.listeners[name]({ preventDefault() {} }); }
}

function makePage(fetcher) {
  const ids = ['source-form', 'source-code', 'example-select', 'clear-code',
    'analyze-button', 'source-stats', 'result-title', 'result-message',
    'form-feedback', 'result-detail', 'result-code', 'result-panel'];
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
    'result-panel', 'result-title', 'result-message', 'form-feedback']) {
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
      json: async () => ({ recebido: true, mensagem: 'Recebido!', codigo }),
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
