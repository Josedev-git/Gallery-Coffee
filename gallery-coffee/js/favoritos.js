/* ============================================================
   GALLERY COFFEE — js/favoritos.js
   ------------------------------------------------------------
   Os favoritos mudam de pessoa pra pessoa e de visita pra
   visita, então essa lista PRECISA ser montada pelo JavaScript
   (diferente do catálogo principal, que é sempre igual pra
   todo mundo e por isso fica escrito direto no HTML).
   ============================================================ */

var favoritos = pegarFavoritos();
var lista = document.getElementById("lista-favoritos");
var mensagemVazio = document.getElementById("favoritos-vazio");

if (favoritos.length === 0) {
  mensagemVazio.style.display = "block";
} else {
  for (var i = 0; i < favoritos.length; i++) {
    var item = favoritos[i];

    var cartao = document.createElement("div");
    cartao.className = "cartao";
    cartao.innerHTML =
      "<img src='" + item.imagem + "' alt='" + item.nome + "'>" +
      "<div class='info'>" +
      "  <h3>" + item.nome + "</h3>" +
      "  <p class='preco'>" + formatarPreco(item.preco) + "</p>" +
      "</div>" +
      "<button class='botao btn-adicionar' data-id='" + item.id + "' data-nome='" + item.nome + "' data-preco='" + item.preco + "' data-imagem='" + item.imagem + "'>Adicionar ao carrinho</button>" +
      "<button class='botao' onclick=\"alternarFavorito('" + item.id + "','" + item.nome + "'," + item.preco + ",'" + item.imagem + "'); location.reload();\">Remover dos favoritos</button>";

    lista.appendChild(cartao);
  }

  // religa os botões "Adicionar ao carrinho" que acabaram de ser criados
  // (o script.js já rodou antes desses cartões existirem, então repetimos aqui)
  var botoesNovos = lista.querySelectorAll(".btn-adicionar");
  botoesNovos.forEach(function (botao) {
    botao.addEventListener("click", function () {
      adicionarAoCarrinho(
        botao.getAttribute("data-id"),
        botao.getAttribute("data-nome"),
        parseFloat(botao.getAttribute("data-preco")),
        botao.getAttribute("data-imagem")
      );
      botao.textContent = "Adicionado ✓";
      setTimeout(function () { botao.textContent = "Adicionar ao carrinho"; }, 1200);
    });
  });
}
