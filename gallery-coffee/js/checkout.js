/* Checkout escolar: produtos, cupons e totais sao validados novamente no backend. */
let etapaAtual=1,finalizando=false;
const errorCheckout=document.getElementById('erro-checkout');
const botaoFinalizar=document.getElementById('botao-finalizar-pedido');
let descontoPercent=0;
function metodoEntrega() {
  return document.querySelector('input[name="entrega"]:checked')?.value === 'expressa' ? 'expressa':'normal';
}
function mostrarEtapa(n) {
  etapaAtual=n;
  for(let i=1;i<=5;i++)document.getElementById('passo-'+i).classList.toggle('ativo',i===n);
  document.querySelectorAll('.etapa-item').forEach(el=>el.classList.toggle('etapa-atual',Number(el.dataset.etapa)===n));
  document.getElementById('botao-voltar-etapa').style.visibility=n===1?'hidden':'visible';
  document.getElementById('botao-avancar-etapa').style.display=n===5?'none':'inline-block';
  botaoFinalizar.style.display=n===5?'inline-block':'none';
  errorCheckout.textContent='';
  if(n===5) montarRevisao();
}
function validar() {
  if(etapaAtual===1 && (!document.getElementById('ck-nome').value.trim() || !document.getElementById('ck-email').value.trim())) {
    gcAviso(errorCheckout,'Preencha nome e e-mail.',true);return false;
  }
  if(etapaAtual===2 && ['ck-cep','ck-rua','ck-cidade'].some(id=>!document.getElementById(id).value.trim())) {
    gcAviso(errorCheckout,'Preencha CEP, rua e cidade.',true);return false;
  }
  return true;
}
function montarRevisao(){
  const cart=pegarCarrinho(),subtotal=calcularTotalCarrinho();
  const desconto=Math.round(subtotal*descontoPercent)/100;
  const frete=metodoEntrega()==='expressa'?24.90:(subtotal>=200?0:14.90);
  const resumo=document.getElementById('resumo-revisao');
  resumo.innerHTML='<ul class="lista-simples">'+cart.map(i=>`<li>${Number(i.quantidade)}x ${gcEsc(i.nome)} — ${gcMoeda(i.preco*i.quantidade)}</li>`).join('')+
    `<li>Entrega: ${gcMoeda(frete)}</li>`+
    (desconto?`<li>Desconto previsto: − ${gcMoeda(desconto)}</li>`:'')+'</ul>';
  document.getElementById('revisao-total').textContent=gcMoeda(subtotal-desconto+frete);
}
document.getElementById('botao-avancar-etapa').addEventListener('click',()=>{if(validar()&&etapaAtual<5)mostrarEtapa(etapaAtual+1)});
document.getElementById('botao-voltar-etapa').addEventListener('click',()=>{if(etapaAtual>1)mostrarEtapa(etapaAtual-1)});
document.querySelectorAll('input[name="entrega"]').forEach(b=>b.addEventListener('change',montarRevisao));
const me=pegarUsuarioLogado();
if(me){document.getElementById('ck-nome').value=me.nome||'';document.getElementById('ck-email').value=me.email||'';}
(async()=>{
  // Verificacao de cupom sempre vem da API. Nao confiar em desconto salvo localmente.
  const antigo=sessionStorage.getItem('cupomAplicado');
  if(antigo){try{const c=JSON.parse(antigo);if(c.code){const dado=await apiRequest('/coupons/'+encodeURIComponent(c.code));descontoPercent=dado.discountPercent;}}catch{sessionStorage.removeItem('cupomAplicado');}}
  try {
    const produtos=await apiRequest('/products');
    const index=new Map(produtos.map(p=>[p.id,p]));
    let invalidos=[];
    const cart=pegarCarrinho().filter(i=>{if(!index.has(i.id)||index.get(i.id).stock<i.quantidade){invalidos.push(i.nome);return false;}return true;});
    cart.forEach(i=>{i.preco=Number(index.get(i.id).price);i.nome=index.get(i.id).name;});
    if(invalidos.length){gcAviso(errorCheckout,'Alguns produtos foram removidos por indisponibilidade: '+invalidos.join(', '),true);}
    salvarCarrinho(cart);
    if(!cart.length && !invalidos.length)location.replace('carrinho.html');
    if(!cart.length) botaoFinalizar.disabled=true;
    if(etapaAtual===5)montarRevisao();
  } catch(e){gcAviso(errorCheckout,'Não foi possível conferir preços e estoque: '+e.message,true);botaoFinalizar.disabled=true;}
})();
botaoFinalizar.addEventListener('click',async function(){
  if(finalizando)return;
  if(!sessionStorage.getItem('gc_token')){gcAviso(errorCheckout,'Entre na sua conta para finalizar.',true);return;}
  if(!pegarCarrinho().length){gcAviso(errorCheckout,'Carrinho vazio.',true);return;}
  finalizando=true;this.disabled=true;this.textContent='Registrando pedido...';
  try {
    const endereco={};for(const key of ['cep','rua','numero','bairro','cidade','estado'])
      endereco[key]=document.getElementById('ck-'+key).value.trim();
    const antigo=sessionStorage.getItem('cupomAplicado');
    let couponCode='';
    if(antigo){try{couponCode=JSON.parse(antigo).code||'';}catch{}}
    const body={ items:pegarCarrinho().map(i=>({id:i.id,quantity:Number(i.quantidade)})),
      address:endereco,delivery:metodoEntrega(),couponCode };
    const order=await apiRequest('/orders',{method:'POST',body:JSON.stringify(body)});
    // NUNCA chamar API de pagamento real: a entrega e uma demonstracao escolar.
    let sim='ok';
    try{
      const method=document.querySelector('input[name="pagamento"]:checked')?.value||'pix';
      await apiRequest('/orders/'+encodeURIComponent(order.orderId)+'/simulate-payment',{
        method:'POST',body:JSON.stringify({method})});
    }catch(e){console.warn('Pedido criado; simulacao ainda pendente:',e.message);sim='pendente';}
    esvaziarCarrinho();sessionStorage.removeItem('cupomAplicado');
    location.href='pedido-sucesso.html?id='+encodeURIComponent(order.orderId)+(sim==='pendente'?'&simulacao=pendente':'');
  }catch(e){gcAviso(errorCheckout,e.message||'Não foi possível concluir o pedido.',true);finalizando=false;this.disabled=false;this.textContent='Finalizar pedido';}
});
if(!pegarCarrinho().length)location.replace('carrinho.html');
mostrarEtapa(1);
