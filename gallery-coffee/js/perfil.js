(async function () {
  const token = sessionStorage.getItem('gc_token');
  if (!token) { location.replace('login.html');return; }
  const lista = document.getElementById('lista-pedidos');
  const vazio = document.getElementById('pedidos-vazio');
  const params = new URLSearchParams(location.search);
  document.querySelectorAll('.botao-aba').forEach(botao => botao.addEventListener('click', () => {
    document.querySelectorAll('.botao-aba').forEach(b => b.classList.remove('ativa'));
    document.querySelectorAll('.conteudo-aba').forEach(b => b.classList.remove('ativa'));
    botao.classList.add('ativa');
    document.getElementById('aba-'+botao.dataset.aba).classList.add('ativa');
  }));
  if (params.get('aba') === 'pedidos') document.querySelector('[data-aba="pedidos"]').click();
  try {
    const me = await apiRequest('/me');
    document.getElementById('perfil-nome').textContent = me.name || '—';
    document.getElementById('perfil-email').textContent = me.email || '—';
    document.getElementById('perfil-tipo').textContent = me.role === 'admin' ? 'Administrador' : 'Cliente';
    sessionStorage.setItem('usuarioLogado',JSON.stringify({id:me.id,nome:me.name,email:me.email,tipo:me.role==='admin'?'administrador':'cliente'}));
    const enderecoChave='enderecoPrincipal:'+me.id;
    try {
      const endereco = JSON.parse(localStorage.getItem(enderecoChave)||'{}');
      for(const campo of ['cep','rua','numero','bairro','cidade','estado'])
        document.getElementById('end-'+campo).value = endereco[campo] || '';
    } catch{}
    document.getElementById('form-endereco-perfil').addEventListener('submit',e=>{
      e.preventDefault();const endereco={};
      for(const campo of ['cep','rua','numero','bairro','cidade','estado'])
        endereco[campo]=document.getElementById('end-'+campo).value.trim();
      localStorage.setItem(enderecoChave,JSON.stringify(endereco));
      document.getElementById('endereco-salvo').style.display='block';
    });
    lista.innerHTML='<p class="gc-loading">Carregando seus pedidos...</p>';
    const pedidos=await apiRequest('/orders');
    vazio.style.display = pedidos.length ? 'none' : 'block';
    lista.innerHTML = pedidos.map(p => `<article class="caixa gc-pedido">
      <div class="gc-pedido-topo"><div><span class="gc-eyebrow">Pedido #${gcEsc(p.id.slice(0,8).toUpperCase())}</span>
      <p class="gc-muted">${gcData(p.created_at)}</p></div>
      <span class="gc-selo">${gcEsc(gcStatus(p.status,p.simulated))}</span></div>
      <div class="gc-itens">${(p.order_items||[]).map(i=>`<div><span>${Number(i.quantity)}× ${gcEsc(i.name)}</span><strong>${gcMoeda(Number(i.unit_price)*i.quantity)}</strong></div>`).join('')}</div>
      ${Number(p.discount)>0?`<p class="gc-muted">Cupom ${gcEsc(p.coupon_code)}: − ${gcMoeda(p.discount)}</p>`:''}
      <div class="gc-pedido-total"><span>Total</span><strong>${gcMoeda(p.total)}</strong></div>
      <a class="gc-link" href="pedido-sucesso.html?id=${encodeURIComponent(p.id)}">Ver detalhes do pedido</a>
      </article>`).join('');
  } catch(e) {
    if(/Token invalido|Autenticacao necessaria/i.test(e.message)) {
      limparSessaoGallery();location.replace('login.html');return;
    }
    gcAviso(lista,'Não foi possível carregar seu histórico: '+e.message,true);
  }
})();
