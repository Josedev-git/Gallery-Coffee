/* ============================================================
   GALLERY COFFEE — js/produtos.js
   ------------------------------------------------------------
   Cuida só da página produtos.html: busca por nome e filtro por
   coleção. Repare que o JavaScript NUNCA cria um cartão novo —
   ele só decide quais dos cartões que já existem no HTML ficam
   visíveis (display none) ou não.
   ============================================================ */

var campoBusca = document.getElementById("campo-busca");
var botoesFiltro = document.querySelectorAll(".botao-filtro");
var cartoesProduto = document.querySelectorAll(".produto-item");
var mensagemVazio = document.getElementById("mensagem-vazio");

var filtroAtual = "todas";

function aplicarFiltros() {
  var termoBusca = campoBusca.value.toLowerCase();
  var algumVisivel = false;

  cartoesProduto.forEach(function (cartao) {
    var nomeProduto = cartao.getAttribute("data-nome");
    var colecaoProduto = cartao.getAttribute("data-colecao");

    var passaNoFiltro = (filtroAtual === "todas" || colecaoProduto === filtroAtual);
    var passaNaBusca = nomeProduto.indexOf(termoBusca) !== -1;

    if (passaNoFiltro && passaNaBusca) {
      cartao.style.display = "block";
      algumVisivel = true;
    } else {
      cartao.style.display = "none";
    }
  });

  mensagemVazio.style.display = algumVisivel ? "none" : "block";
}

// busca: roda toda vez que a pessoa digita
campoBusca.addEventListener("input", aplicarFiltros);

// filtro de coleção: roda quando clica em um dos botões
botoesFiltro.forEach(function (botao) {
  botao.addEventListener("click", function () {
    // tira o estilo "ativo" de todos os botões e coloca só no que foi clicado
    botoesFiltro.forEach(function (b) {
      b.classList.remove("ativo");
    });
    botao.classList.add("ativo");

    filtroAtual = botao.getAttribute("data-colecao");
    aplicarFiltros();
  });
});
