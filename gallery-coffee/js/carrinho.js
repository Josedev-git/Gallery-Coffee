(function () {
  const tabela = document.getElementById('corpo-carrinho');
  const feedback = document.getElementById('mensagem-cupom');
  const codigoCampo = document.getElementById('campo-cupom');
  let cupom = null;
  const aviso = (msg, erro=false) => gcAviso(feedback,msg,erro);
  function calcular() {
    const subtotal = calcularTotalCarrinho();
    const desconto = cupom ? Math.round(subtotal * cupom.discountPercent)/100 : 0;
    document.getElementById('valor-subtotal').textContent = gcMoeda(subtotal);
    document.getElementById('valor-total').textContent = gcMoeda(subtotal-desconto);
    document.getElementById('valor-desconto').textContent = '- '+gcMoeda(desconto);
    document.getElementById('linha-desconto').style.display = desconto ? 'flex' : 'none';
    if (cupom) sessionStorage.setItem('cupomAplicado',JSON.stringify(cupom));
    else sessionStorage.removeItem('cupomAplicado');
  }
  function montar() {
    const carrinho = pegarCarrinho();
    tabela.innerHTML = '';
    if (!carrinho.length) tabela.innerHTML = '<tr><td colspan="4">Seu carrinho está vazio. <a href="produtos.html">Ver produtos</a>.</td></tr>';
    carrinho.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td data-label="Produto">${gcEsc(item.nome)}</td>
        <td data-label="Quantidade"><div class="qtd-controle">
        <button type="button" class="botao" data-acao="menos" data-id="${gcEsc(item.id)}">−</button>
        <span>${Number(item.quantidade)}</span>
        <button type="button" class="botao" data-acao="mais" data-id="${gcEsc(item.id)}">+</button></div></td>
        <td data-label="Subtotal">${gcMoeda(item.preco * item.quantidade)}</td>
        <td data-label="Remover"><button type="button" class="botao" data-acao="remover" data-id="${gcEsc(item.id)}">Remover</button></td>`;
      tabela.appendChild(tr);
    });
    calcular();
  }
  tabela.addEventListener('click', e => {
    const btn = e.target.closest('[data-acao]'); if (!btn) return;
    const action=btn.dataset.acao,id=btn.dataset.id;
    const item=pegarCarrinho().find(i=>i.id===id);
    if (!item) return;
    if (action==='remover' || (action==='menos' && item.quantidade===1)) removerDoCarrinho(id);
    else alterarQuantidade(id,item.quantidade+(action==='mais'?1:-1));
    montar();
  });
  async function aplicar(code) {
    const dado = await apiRequest('/coupons/'+encodeURIComponent(code.trim().toUpperCase()));
    cupom = dado;
    codigoCampo.value = dado.code;
    aviso(`Cupom ${dado.code} aplicado! (${dado.discountPercent}% de desconto)`);
    calcular();
  }
  document.getElementById('botao-aplicar-cupom').addEventListener('click', async () => {
    const codigo=codigoCampo.value.trim();if(!codigo)return;
    try { await aplicar(codigo); }
    catch (e) {cupom=null;calcular();aviso('Cupom inválido ou expirado.',true);}
  });
  document.getElementById('botao-checkout').addEventListener('click',e => {
    if (!pegarCarrinho().length) {e.preventDefault();aviso('Seu carrinho está vazio.',true);}
  });
  montar();
  const antigo = sessionStorage.getItem('cupomAplicado');
  if (antigo) {try { const c=JSON.parse(antigo);if(c.code)aplicar(c.code).catch(()=>{cupom=null;calcular();});}catch{} }
  // Catálogo do Supabase e a fonte de preços/estoques; atualiza carrinho se houve mudança.
  apiRequest('/products').then(produtos => {
    const mapa = new Map(produtos.map(p=>[p.id,p]));
    const carrinho = pegarCarrinho().filter(item => mapa.has(item.id));
    carrinho.forEach(item=> {const p=mapa.get(item.id);item.nome=p.name;item.preco=Number(p.price);item.quantidade=Math.min(item.quantidade,Number(p.stock));});
    salvarCarrinho(carrinho.filter(i=>i.quantidade>0)); montar();
  }).catch(()=>aviso('Não foi possível atualizar os preços. Confira a conexão antes de comprar.',true));
})();
