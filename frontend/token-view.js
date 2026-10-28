/** Componentes de apresentação do scanner. Nunca usa HTML vindo do código-fonte. */
export const TOKEN_LABELS = Object.freeze({
  PALAVRA_RESERVADA: 'Palavra reservada',
  IDENTIFICADOR: 'Identificador',
  LITERAL_INTEIRO: 'Inteiro',
  LITERAL_REAL: 'Real',
  LITERAL_STRING: 'String',
  LITERAL_CARACTERE: 'Caractere',
  OPERADOR: 'Operador',
  DELIMITADOR: 'Delimitador',
});

export function countCategories(tokens) {
  return tokens.reduce((counts, token) => {
    counts[token.tipo] = (counts[token.tipo] || 0) + 1;
    return counts;
  }, {});
}

const clearChildren = (element) => element.replaceChildren();

export function showLexicalResults(doc, data) {
  const section = doc.querySelector('#lexical-section');
  const chips = doc.querySelector('#token-chips');
  const body = doc.querySelector('#tokens-body');
  const errors = doc.querySelector('#lexical-errors');
  const stats = doc.querySelector('#token-summary');
  const counts = doc.querySelector('#category-counts');
  const focus = doc.querySelector('#token-inspector');
  const previous = doc.querySelector('#previous-token');
  const next = doc.querySelector('#next-token');

  clearChildren(chips);
  clearChildren(body);
  clearChildren(errors);
  clearChildren(counts);
  section.hidden = false;
  stats.textContent = `${data.tokens.length} token(s) · ${data.erros.length} erro(s) léxico(s)`;
  const tokenElements = [];
  let selected = 0;

  const renderSelection = () => {
    tokenElements.forEach((group, i) => {
      group.chip.classList.toggle('selected', i === selected);
      group.row.classList.toggle('selected', i === selected);
      group.chip.setAttribute('aria-pressed', String(i === selected));
    });
    const token = data.tokens[selected];
    focus.textContent = token
      ? `Token ${selected + 1}/${data.tokens.length}: ${TOKEN_LABELS[token.tipo]} — ${JSON.stringify(token.lexema)} · linha ${token.linha}, coluna ${token.coluna}.`
      : 'Nenhum token reconhecido nesta entrada.';
    previous.disabled = selected === 0 || data.tokens.length === 0;
    next.disabled = selected >= data.tokens.length - 1;
  };

  for (const [i, token] of data.tokens.entries()) {
    const chip = doc.createElement('button');
    chip.type = 'button';
    chip.className = `token-chip category-${token.tipo}`;
    chip.textContent = token.lexema;
    chip.title = `${TOKEN_LABELS[token.tipo]} na linha ${token.linha}, coluna ${token.coluna}`;
    chip.addEventListener('click', () => { selected = i; renderSelection(); });
    chips.appendChild(chip);

    const row = doc.createElement('tr');
    row.className = 'token-row';
    for (const item of [TOKEN_LABELS[token.tipo], token.lexema, token.linha, token.coluna]) {
      const td = doc.createElement('td');
      td.textContent = String(item);
      row.appendChild(td);
    }
    body.appendChild(row);
    tokenElements.push({ chip, row });
  }

  const quantities = countCategories(data.tokens);
  for (const [tipo, quantity] of Object.entries(quantities)) {
    const count = doc.createElement('li');
    count.textContent = `${TOKEN_LABELS[tipo]}: ${quantity}`;
    counts.appendChild(count);
  }
  if (data.tokens.length === 0) {
    const count = doc.createElement('li');
    count.textContent = 'Nenhum token: há apenas comentários, erros ou espaços.';
    counts.appendChild(count);
  }

  for (const issue of data.erros) {
    const item = doc.createElement('li');
    item.textContent = `Linha ${issue.linha}, coluna ${issue.coluna}: ${issue.mensagem} (trecho: ${JSON.stringify(issue.lexema)})`;
    errors.appendChild(item);
  }
  if (data.erros.length === 0) {
    const item = doc.createElement('li');
    item.textContent = 'Nenhum erro léxico encontrado. Isso não garante que a sintaxe esteja correta.';
    errors.appendChild(item);
  }

  previous.onclick = () => { if (selected > 0) { selected--; renderSelection(); } };
  next.onclick = () => { if (selected < data.tokens.length - 1) { selected++; renderSelection(); } };
  renderSelection();
}
