async function carregarMensagem() {
  const hello = document.querySelector('#hello');
  const status = document.querySelector('#status');

  try {
    const response = await fetch('/api/hello', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (typeof data.message !== 'string') throw new Error('Resposta inválida');

    hello.textContent = data.message;
    status.textContent = '● Frontend e backend conectados com sucesso';
    status.classList.add('success');
  } catch (error) {
    hello.textContent = 'Não foi possível carregar a mensagem.';
    status.textContent = 'Falha de comunicação com o backend. Verifique os contêineres.';
    status.classList.add('error');
    console.error('Falha ao consultar API:', error);
  }
}

carregarMensagem();
