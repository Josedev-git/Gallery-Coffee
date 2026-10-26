/* Painel Gallery Coffee: todas as operacoes persistem no Supabase via API. */
(async function () {
  const area = document.getElementById('area-admin');
  const bloqueado = document.getElementById('area-restrita');
  const aviso = document.getElementById('admin-aviso');
  const modal = document.getElementById('modal-produto');
  const form = document.getElementById('form-produto-admin');
  let produtos=[],pedidos=[],clientes=[],cupons=[],editandoCupom=null;
  const alertar = (m,erro=false)=>gcAviso(aviso,m,erro);
  if (!sessionStorage.getItem('gc_token')) {bloqueado.style.display='block';return;}
  try {
    const me = await apiRequest('/me');
    if (me.role !== 'admin') {bloqueado.style.display='block';return;}
  } catch(e) {bloqueado.style.display='block';bloqueado.textContent='Não foi possível autenticar: '+e.message;return;}
  area.style.display='block';
  document.querySelectorAll('.botao-aba').forEach(botao=>botao.addEventListener('click',()=>{
    document.querySelectorAll('.botao-aba').forEach(b=>b.classList.remove('ativa'));
    document.querySelectorAll('.conteudo-aba').forEach(b=>b.classList.remove('ativa'));
    botao.classList.add('ativa');document.getElementById('aba-'+botao.dataset.aba).classList.add('ativa');
  }));
  function estoqueBaixo(){return produtos.filter(p=>p.active&&p.stock<=6);}
  function dashboard(){
    // Total demonstrativo, nao receita real.
    document.getElementById('dash-vendas').textContent=gcMoeda(pedidos.filter(p=>p.simulated&&p.status!=='cancelled').reduce((v,p)=>v+Number(p.total),0));
    document.getElementById('dash-pedidos').textContent=pedidos.length;
    document.getElementById('dash-vendidos').textContent=pedidos.filter(p=>p.simulated&&p.status!=='cancelled').reduce((v,p)=>v+(p.order_items||[]).reduce((x,i)=>x+i.quantity,0),0);
    const baixos=estoqueBaixo();
    document.getElementById('dash-estoque-baixo').textContent=baixos.length;
    document.getElementById('lista-estoque-baixo').innerHTML=baixos.length
      ? '<ul class="lista-simples">'+baixos.map(p=>`<li>${gcEsc(p.name)} — ${Number(p.stock)} unidade(s)</li>`).join('')+'</ul>'
      : '<p class="gc-muted">Nenhum produto com estoque baixo.</p>';
  }
  function renderProdutos(){
    document.getElementById('corpo-produtos-admin').innerHTML=produtos.length?produtos.map(p=>`<tr>
      <td>${gcEsc(p.name)}<br><small>${gcEsc(COLECOES.find(c=>c.id===p.collection_id)?.nome||p.collection_id||'')}</small>
      ${p.active?'':'<span class="gc-selo">Arquivado</span>'}</td>
      <td>${gcMoeda(p.price)}</td><td>${Number(p.stock)}</td>
      <td><div class="gc-acoes-tabela"><button type="button" class="botao" data-editar="${gcEsc(p.id)}">Editar</button>
      <button type="button" class="botao botao-secundario" data-arquivar="${gcEsc(p.id)}">${p.active?'Arquivar':'Reativar'}</button></div></td></tr>`).join('')
    :'<tr><td colspan="4">Nenhum produto cadastrado.</td></tr>';
  }
  function renderPedidos(){
    document.getElementById('lista-pedidos-admin').innerHTML=pedidos.length?pedidos.map(p=>{
      const cliente=clientes.find(c=>c.id===p.user_id);
      const opcoes=['pending','paid','shipped','cancelled'].map(s=>`<option value="${s}" ${p.status===s?'selected':''}>${gcEsc(gcStatus(s,p.simulated))}</option>`).join('');
      return `<article class="caixa gc-pedido"><div class="gc-pedido-topo">
        <div><strong>Pedido #${gcEsc(p.id.slice(0,8).toUpperCase())}</strong>
        <p class="gc-muted">${gcData(p.created_at)} · ${gcEsc(cliente?.email||p.user_id.slice(0,8))}</p></div>
        <span class="gc-selo">${gcEsc(gcStatus(p.status,p.simulated))}</span></div>
        <div class="gc-itens">${(p.order_items||[]).map(i=>`<div><span>${Number(i.quantity)}× ${gcEsc(i.name)}</span><strong>${gcMoeda(i.quantity*Number(i.unit_price))}</strong></div>`).join('')}</div>
        <div class="gc-pedido-total"><span>Total ${p.simulated?'(simulado)':''}</span><strong>${gcMoeda(p.total)}</strong></div>
        <label class="gc-status-control">Alterar status <select data-status="${gcEsc(p.id)}">${opcoes}</select></label>
      </article>`;
    }).join(''):'<p class="gc-muted">Nenhum pedido registrado.</p>';
  }
  function renderClientes(){
    document.getElementById('corpo-clientes-admin').innerHTML=clientes.length?clientes.map(c=>`<tr>
      <td>${gcEsc(c.name||'—')}${c.role==='admin'?' (admin)':''}</td>
      <td>${gcEsc(c.email||'—')}</td><td>${Number(c.orders||0)}</td></tr>`).join('')
    :'<tr><td colspan="3">Nenhum cliente cadastrado.</td></tr>';
  }
  function renderCupons(){
    document.getElementById('lista-cupons-admin').innerHTML=cupons.length?cupons.map(c=>`<div class="caixa gc-cupom">
      <div><strong>${gcEsc(c.code)}</strong><p class="gc-muted">${Number(c.discount_percent)}% de desconto · ${c.active?'Ativo':'Inativo'}
      ${c.expires_at?' · Até '+gcData(c.expires_at):''}</p></div>
      <div class="gc-acoes-tabela"><button type="button" class="botao" data-editar-cupom="${gcEsc(c.code)}">Editar</button><button type="button" class="botao botao-secundario" data-cupom="${gcEsc(c.code)}">${c.active?'Desativar':'Ativar'}</button></div>
    </div>`).join(''):'<p class="gc-muted">Nenhum cupom cadastrado.</p>';
  }
  async function carregar(){
    const results=await Promise.allSettled([
      apiRequest('/admin/products'),apiRequest('/admin/orders'),
      apiRequest('/admin/customers'),apiRequest('/admin/coupons')
    ]);
    const nomes=['Produtos','Pedidos','Clientes','Cupons'];
    results.forEach((r,i)=>{
      if(r.status==='rejected'){alertar(nomes[i]+': '+r.reason.message,true);return;}
      if(i===0)produtos=r.value;
      if(i===1)pedidos=r.value;
      if(i===2)clientes=r.value;
      if(i===3)cupons=r.value;
    });
    dashboard();renderProdutos();renderPedidos();renderClientes();renderCupons();
  }
  async function atualizar(){try{await carregar();}catch(e){alertar(e.message,true);}}
  document.getElementById('botao-atualizar-admin').addEventListener('click',atualizar);
  function editarProduto(p){
    form.reset();
    const campos={id:p?.id||'',nome:p?.name||'',colecao:p?.collection_id||'monafe',
      preco:p?.price??'', 'preco-antigo':p?.old_price??'',capacidade:p?.capacity||'',
      estoque:p?.stock??0,material:p?.material||'',dimensoes:p?.dimensions||'',
      cuidados:p?.care||'',descricao:p?.description||''};
    Object.entries(campos).forEach(([nome,valor])=>document.getElementById('produto-admin-'+nome).value=valor);
    document.getElementById('modal-produto-titulo').textContent=p?'Editar produto':'Novo produto';
    modal.classList.add('aberta');
  }
  document.getElementById('botao-novo-produto').addEventListener('click',()=>editarProduto(null));
  document.getElementById('botao-cancelar-produto').addEventListener('click',()=>modal.classList.remove('aberta'));
  document.getElementById('corpo-produtos-admin').addEventListener('click',async e=>{
    const ed=e.target.closest('[data-editar]');
    if(ed){const p=produtos.find(x=>x.id===ed.dataset.editar);if(p)editarProduto(p);return;}
    const arquivar=e.target.closest('[data-arquivar]');
    if(!arquivar)return;
    const p=produtos.find(x=>x.id===arquivar.dataset.arquivar);if(!p)return;
    if(!confirm(p.active?'Arquivar este produto? Ele deixará de aparecer na loja.':'Reativar este produto?'))return;
    try{await apiRequest('/admin/products/'+encodeURIComponent(p.id),{method:'PATCH',body:JSON.stringify({active:!p.active})});
      alertar('Produto atualizado.');await carregar();}catch(err){alertar(err.message,true);}
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const valor=nome=>document.getElementById('produto-admin-'+nome).value.trim();
    const id=valor('id');const colecao=valor('colecao');
    const body={name:valor('nome'),collection_id:colecao,price:Number(valor('preco')),
      old_price:valor('preco-antigo')?Number(valor('preco-antigo')):null,
      stock:Number(valor('estoque')),capacity:valor('capacidade'),material:valor('material'),
      dimensions:valor('dimensoes'),care:valor('cuidados'),description:valor('descricao')};
    if(!body.name||!Number.isFinite(body.price)||body.price<0||!Number.isInteger(body.stock)||body.stock<0){alertar('Confira nome, preço e estoque.',true);return;}
    if(!id){body.id='pr-'+Date.now();body.active=true;body.image=COLECOES.find(c=>c.id===colecao)?.imagem||'assets/logo.png';}
    try{await apiRequest(id?'/admin/products/'+encodeURIComponent(id):'/admin/products',{
      method:id?'PATCH':'POST',body:JSON.stringify(body)});
      modal.classList.remove('aberta');alertar(id?'Produto atualizado.':'Produto cadastrado.');await carregar();
    }catch(err){alertar(err.message,true);}
  });
  document.getElementById('lista-pedidos-admin').addEventListener('change',async e=>{
    const sel=e.target.closest('[data-status]');if(!sel)return;
    try{await apiRequest('/admin/orders/'+encodeURIComponent(sel.dataset.status),{
      method:'PATCH',body:JSON.stringify({status:sel.value})});alertar('Status do pedido atualizado.');await carregar();
    }catch(err){alertar(err.message,true);await carregar();}
  });
  function cancelarEdicaoCupom(){
    editandoCupom=null;
    document.getElementById('form-novo-cupom').reset();
    document.getElementById('cupom-codigo').disabled=false;
    document.getElementById('botao-salvar-cupom').textContent='Criar cupom';
    document.getElementById('cancelar-edicao-cupom').style.display='none';
  }
  document.getElementById('cancelar-edicao-cupom').addEventListener('click',cancelarEdicaoCupom);
  document.getElementById('form-novo-cupom').addEventListener('submit',async e=>{
    e.preventDefault();const code=document.getElementById('cupom-codigo').value.trim().toUpperCase();
    const pct=Number(document.getElementById('cupom-desconto').value);
    const exp=document.getElementById('cupom-validade').value;
    if(!/^[A-Z0-9_-]{3,24}$/.test(code)||!Number.isInteger(pct)||pct<1||pct>70){alertar('Código (3 a 24 caracteres) ou desconto inválido (1 a 70%).',true);return;}
    try{
      await apiRequest(editandoCupom?'/admin/coupons/'+encodeURIComponent(editandoCupom):'/admin/coupons',{
        method:editandoCupom?'PATCH':'POST',
        body:JSON.stringify(editandoCupom
          ?{discount_percent:pct,expires_at:exp?new Date(exp+'T23:59:59').toISOString():null}
          :{code,discount_percent:pct,expires_at:exp?new Date(exp+'T23:59:59').toISOString():null})
      });
      alertar(editandoCupom?'Cupom editado.':'Cupom criado.');cancelarEdicaoCupom();await carregar();
    }catch(err){alertar(err.message,true);}
  });
  document.getElementById('lista-cupons-admin').addEventListener('click',async e=>{
    const editar=e.target.closest('[data-editar-cupom]');
    if(editar){
      const c=cupons.find(c=>c.code===editar.dataset.editarCupom);if(!c)return;
      editandoCupom=c.code;
      document.getElementById('cupom-codigo').value=c.code;
      document.getElementById('cupom-codigo').disabled=true;
      document.getElementById('cupom-desconto').value=c.discount_percent;
      document.getElementById('cupom-validade').value=c.expires_at?c.expires_at.slice(0,10):'';
      document.getElementById('botao-salvar-cupom').textContent='Salvar alterações';
      document.getElementById('cancelar-edicao-cupom').style.display='inline-block';
      document.getElementById('form-novo-cupom').scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    const btn=e.target.closest('[data-cupom]');if(!btn)return;
    const c=cupons.find(c=>c.code===btn.dataset.cupom);if(!c)return;
    try{await apiRequest('/admin/coupons/'+encodeURIComponent(c.code),{method:'PATCH',body:JSON.stringify({active:!c.active})});
      alertar('Cupom atualizado.');await carregar();}catch(err){alertar(err.message,true);}
  });
  alertar('Dados carregados do Supabase.');await carregar();
})();
