/* Componentes seguros compartilhados pelo frontend. */
function gcEsc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[c]);
}
function gcMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(Number(valor) || 0);
}
function gcData(valor) {
  return valor ? new Date(valor).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' }) : '—';
}
function gcStatus(status, simulated) {
  const mapa = { pending:'Pendente', paid: simulated ? 'Pagamento simulado' : 'Pago',
    shipped:'Enviado (demonstração)', cancelled:'Cancelado' };
  return mapa[status] || status || '—';
}
function gcAviso(el, mensagem, erro=false) {
  if (!el) return;
  el.textContent = mensagem;
  el.className = erro ? 'mensagem-erro' : 'mensagem-sucesso';
}
function gcImagemProduto(produto) {
  if (produto.image) return produto.image;
  const colecao = COLECOES.find(c => c.id === produto.collection_id);
  return colecao ? colecao.imagem : 'assets/logo.png';
}
function gcCartaoProduto(p) {
  const image = gcEsc(gcImagemProduto(p)), nome = gcEsc(p.name), id = gcEsc(p.id);
  const quantidade = Number(p.stock || 0);
  return `<article class="cartao produto-item" data-colecao="${gcEsc(p.collection_id)}" data-nome="${nome.toLowerCase()}">
    <a href="produto.html?id=${encodeURIComponent(p.id)}"><img loading="lazy" src="${image}" alt="${nome}">
    <div class="info"><h3>${nome}</h3><p class="preco">${gcMoeda(p.price)}</p></div></a>
    <button type="button" class="botao gc-adicionar" data-id="${id}" ${quantidade === 0?'disabled':''}>${quantidade === 0?'Esgotado':'Adicionar ao carrinho'}</button>
    <button type="button" class="botao gc-favoritar" data-id="${id}">${produtoEstaFavoritado(p.id)?'♥ Favoritado':'♡ Favoritar'}</button>
  </article>`;
}
function gcLigarCatalogo(container, produtos) {
  if (!container || container.dataset.gcBound) return;
  container.dataset.gcBound = '1';
  container.addEventListener('click', e => {
    const botao = e.target.closest('.gc-adicionar,.gc-favoritar');
    if (!botao || !container.contains(botao)) return;
    const p = produtos.find(prod => prod.id === botao.dataset.id);
    if (!p) return;
    if (botao.classList.contains('gc-adicionar')) {
      if (Number(p.stock) <= 0) return;
      adicionarAoCarrinho(p.id, p.name, Number(p.price), gcImagemProduto(p));
      botao.textContent = 'Adicionado ✓';
      setTimeout(() => { if (botao.isConnected) botao.textContent = 'Adicionar ao carrinho'; }, 1200);
    } else {
      const liked = alternarFavorito(p.id, p.name, Number(p.price), gcImagemProduto(p));
      botao.textContent = liked ? '♥ Favoritado' : '♡ Favoritar';
    }
  });
}
