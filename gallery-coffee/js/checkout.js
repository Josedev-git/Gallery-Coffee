/* ============================================================
   GALLERY COFFEE — js/checkout.js
   ------------------------------------------------------------
   Controla as 5 etapas do checkout, valida os campos,
   calcula o resumo e envia o pedido para o backend.
   ============================================================ */

var etapaAtual = 1;
var totalEtapas = 5;

// ============================================================
// CONTROLE DAS ETAPAS
// ============================================================

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

  document.getElementById("botao-voltar-etapa").style.visibility =
    numero === 1 ? "hidden" : "visible";

  document.getElementById("botao-avancar-etapa").style.display =
    numero === totalEtapas ? "none" : "inline-block";

  document.getElementById("botao-finalizar-pedido").style.display =
    numero === totalEtapas ? "inline-block" : "none";

  document.getElementById("erro-checkout").textContent = "";

  if (numero === totalEtapas) {
    montarRevisao();
  }
}

// ============================================================
// VALIDACAO DAS ETAPAS
// ============================================================

function validarEtapaAtual() {
  if (etapaAtual === 1) {
    var nome = document.getElementById("ck-nome").value;
    var email = document.getElementById("ck-email").value;

    if (!nome || !email) {
      document.getElementById("erro-checkout").textContent =
        "Preencha nome e e-mail.";

      return false;
    }
  }

  if (etapaAtual === 2) {
    var cep = document.getElementById("ck-cep").value;
    var rua = document.getElementById("ck-rua").value;
    var cidade = document.getElementById("ck-cidade").value;

    if (!cep || !rua || !cidade) {
      document.getElementById("erro-checkout").textContent =
        "Preencha CEP, rua e cidade.";

      return false;
    }
  }

  return true;
}

// ============================================================
// RESUMO DO PEDIDO
// ============================================================

function montarRevisao() {
  var carrinho = pegarCarrinho();
  var resumo = document.getElementById("resumo-revisao");
  var subtotal = calcularTotalCarrinho();

  var cupomTexto = localStorage.getItem("cupomAplicado");
  var desconto = 0;

  if (cupomTexto) {
    try {
      var cupom = JSON.parse(cupomTexto);

      if (cupom && Number.isFinite(Number(cupom.desconto))) {
        desconto = (subtotal * Number(cupom.desconto)) / 100;
      }
    } catch (erro) {
      console.warn("Cupom invalido:", erro);
    }
  }

  var entregaSelecionada = document.querySelector(
    "input[name='entrega']:checked"
  ).value;

  var frete = entregaSelecionada === "expressa"
    ? 24.90
    : (subtotal >= 200 ? 0 : 14.90);

  var total = subtotal - desconto + frete;

  var html = "<ul class='lista-simples'>";

  for (var i = 0; i < carrinho.length; i++) {
    html += "<li>" +
      carrinho[i].quantidade + "x " +
      carrinho[i].nome + " — " +
      formatarPreco(carrinho[i].preco * carrinho[i].quantidade) +
      "</li>";
  }

  html += "<li>Frete: " +
    (frete === 0 ? "Grátis" : formatarPreco(frete)) +
    "</li>";

  if (desconto > 0) {
    html += "<li>Desconto: -" +
      formatarPreco(desconto) +
      "</li>";
  }

  html += "</ul>";

  resumo.innerHTML = html;

  document.getElementById("revisao-total").textContent =
    formatarPreco(total);

  resumo.setAttribute("data-total-final", total);
}

// ============================================================
// AVANCAR ETAPA
// ============================================================

document.getElementById("botao-avancar-etapa")
  .addEventListener("click", function () {

    if (!validarEtapaAtual()) {
      return;
    }

    etapaAtual++;

    mostrarEtapa(etapaAtual);
  });

// ============================================================
// VOLTAR ETAPA
// ============================================================

document.getElementById("botao-voltar-etapa")
  .addEventListener("click", function () {

    if (etapaAtual === 1) {
      return;
    }

    etapaAtual--;

    mostrarEtapa(etapaAtual);
  });

// ============================================================
// CAMPOS DE PAGAMENTO
// ============================================================

var radiosPagamento = document.querySelectorAll(
  "input[name='pagamento']"
);

radiosPagamento.forEach(function (radio) {
  radio.addEventListener("change", function () {

    document.getElementById("campos-cartao").style.display =
      radio.value === "cartao" && radio.checked
        ? "block"
        : "none";
  });
});

// ============================================================
// FINALIZAR PEDIDO
// ============================================================

document.getElementById("botao-finalizar-pedido")
  .addEventListener("click", async function () {

    const carrinho = pegarCarrinho();

    const erro = document.getElementById("erro-checkout");

    erro.textContent = "";

    // Verifica se o usuario esta logado
    if (!sessionStorage.getItem("gc_token")) {
      erro.textContent =
        "Entre na sua conta para fazer o pedido.";

      return;
    }

    // Verifica se existem produtos
    if (!carrinho.length) {
      erro.textContent = "Carrinho vazio.";

      return;
    }

    // Dados do endereco
    const endereco = {
      cep: document.getElementById("ck-cep").value.trim(),
      rua: document.getElementById("ck-rua").value.trim(),
      numero: document.getElementById("ck-numero").value.trim(),
      bairro: document.getElementById("ck-bairro").value.trim(),
      cidade: document.getElementById("ck-cidade").value.trim(),
      estado: document.getElementById("ck-estado").value.trim()
    };

    // ========================================================
    // CORRECAO DO ERRO "PEDIDO INVALIDO"
    // ========================================================

    const entregaSelecionada = document.querySelector(
      'input[name="entrega"]:checked'
    ).value;

    // Backend aceita somente "normal" ou "expressa"
    const entrega = entregaSelecionada === "expressa"
      ? "expressa"
      : "normal";

    // ========================================================
    // PREPARAR DADOS DO PEDIDO
    // ========================================================

    const dadosPedido = {
      items: carrinho.map(function (item) {
        return {
          id: item.id,
          quantity: Number(item.quantidade)
        };
      }),

      address: endereco,

      delivery: entrega
    };

    console.log("Enviando pedido:", dadosPedido);

    this.disabled = true;

    try {

      // Cria o pedido no Supabase atraves do backend
      const order = await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify(dadosPedido)
      });

      console.log("Pedido criado:", order);

      // ======================================================
      // PAGAMENTO NAO CONFIGURADO
      // ======================================================

      if (!order.paymentEnabled) {

        alert(
          "Pedido criado com sucesso!\n\n" +
          "Numero do pedido: " + order.orderId + "\n" +
          "Total: " + formatarPreco(order.total) + "\n\n" +
          "Pagamento ainda nao habilitado.\n" +
          "Nenhuma cobranca foi realizada."
        );

        return;
      }

      // ======================================================
      // PAGAMENTO CONFIGURADO
      // ======================================================

      const payment = await apiRequest(
        "/orders/" + encodeURIComponent(order.orderId) + "/payment",
        {
          method: "POST"
        }
      );

      if (!payment.checkoutUrl) {
        throw new Error(
          "Nao foi possivel obter o link de pagamento."
        );
      }

      window.location.href = payment.checkoutUrl;

    } catch (e) {

      console.error("Erro ao finalizar pedido:", e);

      erro.textContent =
        e.message || "Erro ao finalizar pedido.";

    } finally {

      this.disabled = false;

    }
  });

// ============================================================
// VERIFICAR CARRINHO
// ============================================================

if (pegarCarrinho().length === 0) {
  window.location.href = "carrinho.html";
}

// ============================================================
// INICIAR CHECKOUT
// ============================================================

mostrarEtapa(etapaAtual);
