(async function () {
  const grade = document.getElementById('grade-produtos-api');
  const busca = document.getElementById('campo-busca');
  const filtros = [...document.querySelectorAll('.botao-filtro')];
  const vazio = document.getElementById('mensagem-vazio');
  let filtro = 'todas';
  grade.innerHTML = '<p class="gc-loading">Carregando produtos do catálogo...</p>';
  try {
    const produtos = await apiRequest('/products');
    gcLigarCatalogo(grade, produtos);
    function renderizar() {
      const termo = busca.value.trim().toLocaleLowerCase('pt-BR');
      const encontrados = produtos.filter(p =>
        (filtro === 'todas' || p.collection_id === filtro) &&
        p.name.toLocaleLowerCase('pt-BR').includes(termo));
      grade.innerHTML = encontrados.map(gcCartaoProduto).join('');
      vazio.style.display = encontrados.length ? 'none' : 'block';
    }
    busca.addEventListener('input', renderizar);
    filtros.forEach(botao => botao.addEventListener('click', () => {
      filtros.forEach(b => b.classList.remove('ativo'));
      botao.classList.add('ativo'); filtro = botao.dataset.colecao; renderizar();
    }));
    renderizar();
  } catch (e) {
    grade.innerHTML = `<p class="mensagem-erro">Não foi possível carregar os produtos: ${gcEsc(e.message)}.</p>`;
  }
})();
