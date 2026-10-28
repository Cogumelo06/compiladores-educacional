import { EXAMPLES, findExample, sourceStats, validateSource, submitSource, friendlyError } from './examples.js';
import { showLexicalResults } from './token-view.js';

export function initApplication(doc = document, fetcher = fetch) {
  const form = doc.querySelector('#source-form');
  const editor = doc.querySelector('#source-code');
  const select = doc.querySelector('#example-select');
  const clear = doc.querySelector('#clear-code');
  const send = doc.querySelector('#analyze-button');
  const count = doc.querySelector('#source-stats');
  const heading = doc.querySelector('#result-title');
  const message = doc.querySelector('#result-message');
  const feedback = doc.querySelector('#form-feedback');
  const detail = doc.querySelector('#result-detail');
  const code = doc.querySelector('#result-code');
  const result = doc.querySelector('#result-panel');
  const lexical = doc.querySelector('#lexical-section');

  for (const example of EXAMPLES) {
    const option = doc.createElement('option');
    option.value = example.id;
    option.textContent = `${example.title} — ${example.description}`;
    select.appendChild(option);
  }

  const updateStats = () => {
    const { caracteres, linhas } = sourceStats(editor.value);
    count.textContent = `${linhas} ${linhas === 1 ? 'linha' : 'linhas'} · ${caracteres} ${caracteres === 1 ? 'caractere' : 'caracteres'}`;
  };

  const setFeedback = (text, isError = false) => {
    feedback.textContent = text;
    feedback.classList.toggle('error', isError);
  };

  const resetResult = () => {
    heading.textContent = 'Aguardando envio';
    message.textContent = 'Escolha um exemplo ou digite código C para identificar os tokens. A análise sintática e a semântica ainda não estão disponíveis.';
    result.dataset.state = 'idle';
    detail.hidden = true;
    code.textContent = '';
    lexical.hidden = true;
  };

  select.addEventListener('change', () => {
    const example = findExample(select.value);
    if (!example) return;
    editor.value = example.code;
    setFeedback('Exemplo carregado. Você pode editá-lo antes de enviar.');
    updateStats();
    resetResult();
    editor.focus();
  });

  editor.addEventListener('input', () => {
    updateStats();
    setFeedback('');
    // A seleção deixa de indicar um exemplo exato quando há edição manual.
    select.value = '';
  });

  clear.addEventListener('click', () => {
    editor.value = '';
    select.value = '';
    updateStats();
    setFeedback('Editor limpo. Insira um novo código para continuar.');
    resetResult();
    editor.focus();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitted = editor.value;
    const invalid = validateSource(submitted);
    if (invalid) {
      setFeedback(invalid, true);
      result.dataset.state = 'error';
      heading.textContent = 'Entrada inválida';
      message.textContent = invalid;
      detail.hidden = true;
      lexical.hidden = true;
      editor.focus();
      return;
    }

    send.disabled = true;
    send.textContent = 'Enviando...';
    setFeedback('Enviando o código ao backend...');
    heading.textContent = 'Processando solicitação';
    message.textContent = 'Aguardando confirmação do servidor.';
    result.dataset.state = 'pending';
    detail.hidden = true;
    lexical.hidden = true;

    try {
      const response = await submitSource(submitted, fetcher);
      heading.textContent = response.sucesso ? 'Tokens identificados!' : 'Erros léxicos encontrados';
      message.textContent = response.mensagem;
      code.textContent = response.codigo;
      detail.hidden = false;
      result.dataset.state = response.sucesso ? 'success' : 'error';
      showLexicalResults(doc, response);
      setFeedback(response.sucesso
        ? 'Scanner executado. Explore a sequência de tokens abaixo.'
        : 'O scanner encontrou erros. Confira a localização abaixo.', !response.sucesso);
    } catch (error) {
      const readable = friendlyError(error);
      heading.textContent = 'Não foi possível concluir o envio';
      message.textContent = readable;
      result.dataset.state = 'error';
      detail.hidden = true;
      lexical.hidden = true;
      setFeedback(readable, true);
    } finally {
      send.disabled = false;
      send.textContent = 'Analisar código';
    }
  });

  updateStats();
  resetResult();
}

if (typeof document !== 'undefined') {
  initApplication(document, fetch);
}
