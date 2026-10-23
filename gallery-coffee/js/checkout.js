/* ============================================================
   GALLERY COFFEE — js/checkout.js
   ------------------------------------------------------------
   As 5 etapas já existem no HTML (passo-1 até passo-5). Este
   arquivo só controla QUAL delas fica visível, valida os campos
   obrigatórios antes de avançar, e no final cria o pedido.
   ============================================================ */

var etapaAtual = 1;
var totalEtapas = 5;

function mostrarEtapa(numero) {
  for (var i = 1; i <= totalEtapas; i++) {
    document.getElementById("passo-" + i).classList.remove("ativo");
  }
  document.getElementById("passo-" + numero).classList.add("ativo");

  var itensEtapa = document.querySelectorAll(".etapa-item");
  itensEtapa.forEach(function (item) {
    if (parseInt(item.getAttribute("data-etapa")) === numero) {
      item.classList.add("etapa-atual");
    } else {
      item.classList.remove("etapa-atual");
    }
  });

  document.getElementById("botao-voltar-etapa").style.visibility = (numero === 1) ? "hidden" : "visible";
  document.getElementById("botao-avancar-etapa").style.display = (numero === totalEtapas) ? "none" : "inline-block";
  document.getElementById("botao-finalizar-pedido").style.display = (numero === totalEtapas) ? "inline-block" : "none";

  document.getElementById("erro-checkout").textContent = "";

  if (numero === totalEtapas) {
    montarRevisao();
  }
}

function validarEtapaAtual() {
  if (etapaAtual === 1) {
    var nome = document.getElementById("ck-nome").value;
    var email = document.getElementById("ck-email").value;
    if (!nome || !email) {
      document.getElementById("erro-checkout").textContent = "Preencha nome e e-mail.";
      return false;
    }
  }

  if (etapaAtual === 2) {
    var cep = document.getElementById("ck-cep").value;
    var rua = document.getElementById("ck-rua").value;
    var cidade = document.getElementById("ck-cidade").value;
    if (!cep || !rua || !cidade) {
      document.getElementById("erro-checkout").textContent = "Preencha CEP, rua e cidade.";
      return false;
    }
  }

  return true;
}

function montarRevisao() {
  var carrinho = pegarCarrinho();
  var resumo = document.getElementById("resumo-revisao");
  var subtotal = calcularTotalCarrinho();

  var cupomTexto = localStorage.getItem("cupomAplicado");
  var desconto = 0;
  if (cupomTexto) {
    var cupom = JSON.parse(cupomTexto);
    desconto = (subtotal * cupom.desconto) / 100;
  }

  var entregaEscolhida = document.querySelector("input[name='entrega']:checked").value;
  var frete = entregaEscolhida === "expressa" ? 24.90 : (subtotal >= 200 ? 0 : 14.90);
  var total = subtotal - desconto + frete;

  var html = "<ul class='lista-simples'>";
  for (var i = 0; i < carrinho.length; i++) {
    html += "<li>" + carrinho[i].quantidade + "x " + carrinho[i].nome + " — " + formatarPreco(carrinho[i].preco * carrinho[i].quantidade) + "</li>";
  }
  html += "<li>Frete: " + (frete === 0 ? "Grátis" : formatarPreco(frete)) + "</li>";
  if (desconto > 0) {
    html += "<li>Desconto: -" + formatarPreco(desconto) + "</li>";
  }
  html += "</ul>";

  resumo.innerHTML = html;
  document.getElementById("revisao-total").textContent = formatarPreco(total);

  // guarda o total final calculado, pra usar quando finalizar o pedido
  resumo.setAttribute("data-total-final", total);
}

document.getElementById("botao-avancar-etapa").addEventListener("click", function () {
  if (!validarEtapaAtual()) return;
  etapaAtual = etapaAtual + 1;
  mostrarEtapa(etapaAtual);
});

document.getElementById("botao-voltar-etapa").addEventListener("click", function () {
  if (etapaAtual === 1) return;
  etapaAtual = etapaAtual - 1;
  mostrarEtapa(etapaAtual);
});

// mostra/esconde os campos de cartão dependendo do método escolhido
var radiosPagamento = document.querySelectorAll("input[name='pagamento']");
radiosPagamento.forEach(function (radio) {
  radio.addEventListener("change", function () {
    document.getElementById("campos-cartao").style.display =
      (radio.value === "cartao" && radio.checked) ? "block" : "none";
  });
});

document.getElementById('botao-finalizar-pedido').addEventListener('click',async function(){
 const carrinho=pegarCarrinho();const erro=document.getElementById('erro-checkout');
 if(!sessionStorage.getItem('gc_token')){erro.textContent='Entre na sua conta para fazer o pedido.';return}
 if(!carrinho.length){erro.textContent='Carrinho vazio';return}
 const endereco={cep:document.getElementById('ck-cep').value,rua:document.getElementById('ck-rua').value,numero:document.getElementById('ck-numero').value,bairro:document.getElementById('ck-bairro').value,cidade:document.getElementById('ck-cidade').value,estado:document.getElementById('ck-estado').value};
 const entrega=document.querySelector('input[name="entrega"]:checked').value;
 this.disabled=true;
 try{const order=await apiRequest('/orders',{method:'POST',body:JSON.stringify({items:carrinho.map(i=>({id:i.id,quantity:i.quantidade})),address:endereco,delivery:entrega})});
   if(!order.paymentEnabled){alert('Pedido pendente criado: '+order.orderId+'. Pagamentos ainda nao habilitados. Nao realize transferencia.');return}
   const payment=await apiRequest('/orders/'+order.orderId+'/payment',{method:'POST'});location.href=payment.checkoutUrl;
 }catch(e){erro.textContent=e.message}finally{this.disabled=false}
});

// se a página for aberta com o carrinho vazio, manda pro carrinho
if (pegarCarrinho().length === 0) {
  window.location.href = "carrinho.html";
}

mostrarEtapa(etapaAtual);
