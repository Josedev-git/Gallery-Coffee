(async function () {
  const id = new URLSearchParams(location.search).get('id') || 'pr1';
  const msg = document.getElementById('produto-erro');
  const botaoAdicionar = document.getElementById('botao-adicionar-produto');
  const botaoFav = document.getElementById('botao-favoritar-produto');
  const botaoComprar = document.getElementById('botao-comprar-agora');
  [botaoAdicionar, botaoFav, botaoComprar].forEach(b => { if(b) b.disabled = true; });
  try {
    const p = await apiRequest('/products/' + encodeURIComponent(id));
    const colecao = COLECOES.find(c => c.id === p.collection_id);
    const imagem = gcImagemProduto(p);
    document.getElementById('produto-nome').textContent = p.name;
    document.getElementById('produto-preco').textContent = gcMoeda(p.price);
    document.getElementById('produto-descricao').textContent = p.description || 'Arte em cada detalhe.';
    document.getElementById('produto-imagem').src = imagem;
    document.getElementById('produto-imagem').alt = p.name;
    document.getElementById('produto-colecao').textContent = colecao?.nome || p.collection_id || 'Gallery Coffee';
    document.getElementById('produto-capacidade').textContent = p.capacity || '—';
    document.getElementById('produto-material').textContent = p.material || '—';
    document.getElementById('produto-dimensoes').textContent = p.dimensions || '—';
    document.getElementById('produto-cuidados').textContent = p.care || '—';
    document.getElementById('produto-estoque').textContent = p.stock > 0 ? `${p.stock} unidades disponíveis` : 'Esgotado';
    [botaoAdicionar, botaoFav].forEach(botao => {
      if (!botao) return;
      Object.assign(botao.dataset, { id:p.id, nome:p.name, preco:p.price, imagem });
    });
    if (botaoAdicionar) { botaoAdicionar.disabled = p.stock <= 0; if(p.stock<=0) botaoAdicionar.textContent='Esgotado'; }
    if (botaoFav) { botaoFav.disabled = false; botaoFav.textContent = produtoEstaFavoritado(p.id) ? '♥ Favoritado' : '♡ Favoritar'; }
    if (botaoComprar) {
      botaoComprar.disabled = p.stock <= 0;
      botaoComprar.addEventListener('click', () => {
        adicionarAoCarrinho(p.id,p.name,Number(p.price),imagem);
        location.href = 'carrinho.html';
      });
    }
  } catch (e) { if(msg) gcAviso(msg, e.message, true); }
})();
