/* ============================================================
   GALLERY COFFEE — js/produto.js
   ------------------------------------------------------------
   Essa página (produto.html) é sempre a mesma estrutura HTML.
   Aqui a gente descobre QUAL produto deve aparecer (pelo "?id="
   que vem na URL, escrito nos links de produtos.html) e troca
   só os textos e atributos — a estrutura da página continua a
   mesma, escrita no HTML.
   ============================================================ */

// pega o "?id=pr1" da URL do navegador
var parametros = new URLSearchParams(window.location.search);
var idProduto = parametros.get("id") || "pr1"; // se não vier nada, mostra o pr1

var produto = pegarProdutoPorId(idProduto);
var colecaoDoProduto = null;

if (produto) {
  for (var i = 0; i < COLECOES.length; i++) {
    if (COLECOES[i].id === produto.colecaoId) {
      colecaoDoProduto = COLECOES[i];
    }
  }

  document.getElementById("produto-nome").textContent = produto.nome;
  document.getElementById("produto-preco").textContent = formatarPreco(produto.preco);
  document.getElementById("produto-descricao").textContent = produto.descricao;
  document.getElementById("produto-imagem").setAttribute("src", colecaoDoProduto.imagem);
  document.getElementById("produto-imagem").setAttribute("alt", produto.nome);

  document.getElementById("produto-colecao").textContent = colecaoDoProduto.nome;
  document.getElementById("produto-capacidade").textContent = produto.capacidade;
  document.getElementById("produto-material").textContent = produto.material;
  document.getElementById("produto-dimensoes").textContent = produto.dimensoes;
  document.getElementById("produto-cuidados").textContent = produto.cuidados;
  document.getElementById("produto-estoque").textContent =
    produto.estoque > 0 ? (produto.estoque + " unidades disponíveis") : "Esgotado";

  // atualiza os atributos data-* dos botões, para eles adicionarem
  // o produto CERTO ao carrinho/favoritos (e não sempre o pr1)
  var botaoAdicionar = document.getElementById("botao-adicionar-produto");
  var botaoFavoritar = document.getElementById("botao-favoritar-produto");

  [botaoAdicionar, botaoFavoritar].forEach(function (botao) {
    botao.setAttribute("data-id", produto.id);
    botao.setAttribute("data-nome", produto.nome);
    botao.setAttribute("data-preco", produto.preco);
    botao.setAttribute("data-imagem", colecaoDoProduto.imagem);
  });

  if (produto.estoque === 0) {
    botaoAdicionar.disabled = true;
    botaoAdicionar.textContent = "Esgotado";
  }

  if (produtoEstaFavoritado(produto.id)) {
    botaoFavoritar.textContent = "♥ Favoritado";
  }
}

// botão "Comprar agora": adiciona ao carrinho e já vai direto pro carrinho
var botaoComprarAgora = document.getElementById("botao-comprar-agora");
botaoComprarAgora.addEventListener("click", function () {
  if (produto) {
    adicionarAoCarrinho(produto.id, produto.nome, produto.preco, colecaoDoProduto.imagem);
  }
  window.location.href = "carrinho.html";
});
