/**
 * Scanner didático para um subconjunto explícito da linguagem C.
 * Não executa código, não aplica gramática e não realiza análise semântica.
 * Posições de linha/coluna começam em 1; offsets são índices UTF-16 do texto original.
 */
const KEYWORDS = new Set(['int', 'if', 'else', 'while', 'return']);
const TWO_CHAR_OPERATORS = new Set(['==', '!=', '<=', '>=', '&&', '||']);
const ONE_CHAR_OPERATORS = new Set(['+', '-', '*', '/', '=', '<', '>', '!']);
const DELIMITERS = new Set(['(', ')', '{', '}', '[', ']', ';', ',']);
const ESCAPES = new Set(['n', 'r', 't', '0', '\\', '\'', '"']);

const isLetter = (char) => /^[A-Za-z_]$/.test(char ?? '');
const isDigit = (char) => /^[0-9]$/.test(char ?? '');
const isIdentifierPart = (char) => /^[A-Za-z0-9_]$/.test(char ?? '');

export function scan(source) {
  if (typeof source !== 'string') throw new TypeError('O código deve ser uma string.');
  const tokens = [];
  const erros = [];
  let index = 0;
  let linha = 1;
  let coluna = 1;

  const here = () => ({ linha, coluna, inicio: index });
  const peek = (offset = 0) => source[index + offset];
  const current = () => peek() ?? '';
  const advance = () => {
    if (peek() === '\r') {
      index += peek(1) === '\n' ? 2 : 1;
      linha++;
      coluna = 1;
      return '\n';
    }
    if (peek() === '\n') {
      index++;
      linha++;
      coluna = 1;
      return '\n';
    }
    const next = source[index++];
    coluna++;
    return next;
  };
  const consume = (predicate) => {
    while (index < source.length && predicate(current())) advance();
  };
  const emit = (tipo, start) => tokens.push({
    tipo, lexema: source.slice(start.inicio, index), linha: start.linha,
    coluna: start.coluna, inicio: start.inicio, fim: index,
  });
  const error = (start, mensagem) => erros.push({
    tipo: 'ERRO_LEXICO', lexema: source.slice(start.inicio, index),
    linha: start.linha, coluna: start.coluna, inicio: start.inicio,
    fim: index, mensagem,
  });

  while (index < source.length) {
    const ch = current();
    if (ch === ' ' || ch === '\t' || ch === '\v' || ch === '\f' || ch === '\n' || ch === '\r') {
      advance();
      continue;
    }

    const start = here();

    if (ch === '/' && peek(1) === '/') {
      advance(); advance();
      consume((c) => c !== '\r' && c !== '\n');
      continue;
    }
    if (ch === '/' && peek(1) === '*') {
      advance(); advance();
      let closed = false;
      while (index < source.length) {
        if (current() === '*' && peek(1) === '/') {
          advance(); advance();
          closed = true;
          break;
        }
        advance();
      }
      if (!closed) error(start, 'Comentário de bloco não fechado: era esperado */.');
      continue;
    }

    if (isLetter(ch)) {
      advance();
      consume(isIdentifierPart);
      const lexema = source.slice(start.inicio, index);
      emit(KEYWORDS.has(lexema) ? 'PALAVRA_RESERVADA' : 'IDENTIFICADOR', start);
      continue;
    }

    if (isDigit(ch)) {
      consume(isDigit);
      let real = false;
      if (current() === '.') {
        real = true;
        advance();
        if (isDigit(current())) consume(isDigit);
        else {
          consume(isIdentifierPart);
          error(start, 'Literal numérico malformado: são esperados dígitos após o ponto decimal.');
          continue;
        }
      }
      if (isIdentifierPart(current())) {
        consume(isIdentifierPart);
        error(start, 'Literal numérico malformado: não combine dígitos com letras ou sublinhado.');
      } else {
        emit(real ? 'LITERAL_REAL' : 'LITERAL_INTEIRO', start);
      }
      continue;
    }

    if (ch === '"' || ch === '\'') {
      const quote = advance();
      let closed = false;
      let badEscape = false;
      let charCount = 0;
      while (index < source.length && current() !== '\n' && current() !== '\r') {
        if (current() === quote) {
          advance();
          closed = true;
          break;
        }
        if (current() === '\\') {
          advance();
          if (index >= source.length || current() === '\n' || current() === '\r') break;
          if (!ESCAPES.has(current())) badEscape = true;
          advance();
        } else {
          advance();
        }
        charCount++;
      }
      if (!closed) error(start, `Literal ${quote === '"' ? 'de string' : 'de caractere'} não fechado.`);
      else if (badEscape) error(start, 'Sequência de escape não suportada neste subconjunto de C.');
      else if (quote === '\'' && charCount !== 1) error(start, 'Literal de caractere deve conter exatamente um caractere.');
      else emit(quote === '"' ? 'LITERAL_STRING' : 'LITERAL_CARACTERE', start);
      continue;
    }

    const pair = source.slice(index, index + 2);
    if (TWO_CHAR_OPERATORS.has(pair)) {
      advance(); advance();
      emit('OPERADOR', start);
      continue;
    }
    if (ONE_CHAR_OPERATORS.has(ch)) {
      advance();
      emit('OPERADOR', start);
      continue;
    }
    if (DELIMITERS.has(ch)) {
      advance();
      emit('DELIMITADOR', start);
      continue;
    }

    advance();
    error(start, `Caractere não reconhecido: ${JSON.stringify(ch)}. Verifique o subconjunto de C suportado.`);
  }

  return { sucesso: erros.length === 0, tokens, erros };
}
