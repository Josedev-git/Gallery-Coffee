/* ============================================================
   GALLERY COFFEE — js/carrinho.js
   ------------------------------------------------------------
   A tabela do carrinho (linhas de produto) muda de tamanho
   dependendo do que a pessoa colocou no carrinho — por isso
   ela precisa ser preenchida pelo JavaScript. O restante da
   página (título, caixa de cupom, rótulos) é fixo no HTML.
   ============================================================ */

var cupomAplicado = null;

function mostrarCarrinho() {
  var corpoTabela = document.getElementById("corpo-carrinho");
  var carrinho = pegarCarrinho();

  corpoTabela.innerHTML = "";

  if (carrinho.length === 0) {
    corpoTabela.innerHTML = "<tr><td colspan='4'>Seu carrinho está vazio. <a href='produtos.html'>Ver produtos</a></td></tr>";
  } else {
    for (var i = 0; i < carrinho.length; i++) {
      var item = carrinho[i];
      var subtotalItem = item.preco * item.quantidade;

      var linha = document.createElement("tr");
      linha.innerHTML =
        "<td data-label='Produto'>" + item.nome + "</td>" +
        "<td data-label='Quantidade'><div class='qtd-controle'>" +
        "  <button class='botao' aria-label='Diminuir quantidade' onclick=\"alterarQuantidade('" + item.id + "', " + (item.quantidade - 1) + "); mostrarCarrinho();\">-</button> " +
        "  <span>" + item.quantidade + "</span>" +
        "  <button class='botao' aria-label='Aumentar quantidade' onclick=\"alterarQuantidade('" + item.id + "', " + (item.quantidade + 1) + "); mostrarCarrinho();\">+</button>" +
        "</div></td>" +
        "<td data-label='Subtotal'>" + formatarPreco(subtotalItem) + "</td>" +
        "<td data-label='Remover'><button class='botao' onclick=\"removerDoCarrinho('" + item.id + "'); mostrarCarrinho();\">Remover</button></td>";

      corpoTabela.appendChild(linha);
    }
  }

  atualizarTotais();
}

function atualizarTotais() {
  var subtotal = calcularTotalCarrinho();
  var desconto = 0;

  if (cupomAplicado) {
    desconto = (subtotal * cupomAplicado.desconto) / 100;
  }

  var total = subtotal - desconto;

  document.getElementById("valor-subtotal").textContent = formatarPreco(subtotal);
  document.getElementById("valor-total").textContent = formatarPreco(total);

  var linhaDesconto = document.getElementById("linha-desconto");
  if (desconto > 0) {
    linhaDesconto.style.display = "flex";
    document.getElementById("valor-desconto").textContent = "- " + formatarPreco(desconto);
  } else {
    linhaDesconto.style.display = "none";
  }

  // guarda o valor do cupom pra o checkout.html poder usar depois
  if (cupomAplicado) {
    localStorage.setItem("cupomAplicado", JSON.stringify(cupomAplicado));
  } else {
    localStorage.removeItem("cupomAplicado");
  }
}

document.getElementById("botao-aplicar-cupom").addEventListener("click", function () {
  var codigo = document.getElementById("campo-cupom").value.trim();
  var mensagem = document.getElementById("mensagem-cupom");

  if (!codigo) return;

  var cupom = verificarCupom(codigo);

  if (cupom) {
    cupomAplicado = cupom;
    mensagem.textContent = "Cupom " + cupom.codigo + " aplicado! (-" + cupom.desconto + "%)";
    mensagem.className = "mensagem-sucesso";
  } else {
    cupomAplicado = null;
    mensagem.textContent = "Cupom inválido ou expirado.";
    mensagem.className = "mensagem-erro";
  }

  atualizarTotais();
});

// impede de ir pro checkout com o carrinho vazio
document.getElementById("botao-checkout").addEventListener("click", function (evento) {
  if (pegarCarrinho().length === 0) {
    evento.preventDefault();
    alert("Seu carrinho está vazio!");
  }
});

mostrarCarrinho();
