(async function () {
  const campo = document.getElementById('detalhes-sucesso');
  const id = new URLSearchParams(location.search).get('id');
  if (!sessionStorage.getItem('gc_token')) {location.replace('login.html');return;}
  if (!id) {gcAviso(campo,'Identificador de pedido não informado.',true);return;}
  try {
    const pedidos = await apiRequest('/orders');
    const p = pedidos.find(p => p.id === id);
    if (!p) throw Error('Pedido não encontrado na sua conta.');
    document.getElementById('sucesso-numero').textContent='#'+p.id.slice(0,8).toUpperCase();
    document.getElementById('sucesso-data').textContent=gcData(p.created_at);
    document.getElementById('sucesso-status').textContent=gcStatus(p.status,p.simulated);
    const pendente = p.status==='pending';
    document.getElementById('sucesso-titulo').textContent=pendente?'Pedido registrado com sucesso!':'Seu pedido foi confirmado!';
    document.getElementById('sucesso-subtitulo').textContent=pendente
      ? 'Registramos seu pedido. A confirmação da simulação de pagamento ainda está pendente.'
      : 'Pagamento aprovado em ambiente demonstrativo. Nenhuma cobrança real foi efetuada.';
    const endereco=p.address||{};
    campo.innerHTML=`<div class="gc-itens">${(p.order_items||[]).map(i=>`<div><span>${Number(i.quantity)}× ${gcEsc(i.name)}</span><strong>${gcMoeda(i.quantity*Number(i.unit_price))}</strong></div>`).join('')}</div>
      <div class="gc-resumo-fatura"><div><span>Subtotal</span><strong>${gcMoeda(p.subtotal)}</strong></div>
      ${Number(p.discount)?`<div><span>Desconto ${gcEsc(p.coupon_code||'')}</span><strong>− ${gcMoeda(p.discount)}</strong></div>`:''}
      <div><span>Entrega</span><strong>${gcMoeda(p.shipping)}</strong></div>
      <div class="gc-fatura-total"><span>Total</span><strong>${gcMoeda(p.total)}</strong></div></div>
      <p class="gc-muted">Endereço informado: ${gcEsc([endereco.rua,endereco.numero,endereco.bairro,endereco.cidade,endereco.estado].filter(Boolean).join(', '))}</p>`;
  }catch(e){gcAviso(campo,'Erro ao consultar pedido: '+e.message,true);}
})();
