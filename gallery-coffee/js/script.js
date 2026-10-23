/* ============================================================
   GALLERY COFFEE — js/script.js
   ------------------------------------------------------------
   Este arquivo é carregado em TODAS as páginas, sempre ANTES do
   arquivo JS específico de cada página (produtos.js, carrinho.js
   etc). Ele guarda as funções que várias páginas precisam usar:

     - carrinho (guardar/ler produtos escolhidos)
     - favoritos (guardar/ler produtos curtidos)
     - login (guardar/ler o usuário que está logado)
     - pedidos (guardar/ler as compras já finalizadas)
     - formatarPreco (transformar 89.9 em "R$ 89,90")

   Tudo isso fica guardado no localStorage, que é uma "gaveta"
   de dados dentro do próprio navegador. Não é um banco de dados
   de verdade — é o suficiente para este projeto funcionar sem
   precisar de um servidor.
   ============================================================ */


/* ------------------------------------------------------------
   FORMATAÇÃO
   ------------------------------------------------------------ */
function formatarPreco(numero) {
  return "R$ " + numero.toFixed(2).replace(".", ",");
}


/* ------------------------------------------------------------
   CARRINHO
   ------------------------------------------------------------ */
function pegarCarrinho() {
  var dados = localStorage.getItem("carrinho");
  if (dados) {
    return JSON.parse(dados);
  }
  return [];
}

function salvarCarrinho(carrinho) {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  atualizarContadorCarrinho();
}

function adicionarAoCarrinho(id, nome, preco, imagem) {
  var carrinho = pegarCarrinho();
  var jaExiste = false;

  for (var i = 0; i < carrinho.length; i++) {
    if (carrinho[i].id === id) {
      carrinho[i].quantidade = carrinho[i].quantidade + 1;
      jaExiste = true;
    }
  }

  if (!jaExiste) {
    carrinho.push({ id: id, nome: nome, preco: preco, imagem: imagem, quantidade: 1 });
  }

  salvarCarrinho(carrinho);
}

function removerDoCarrinho(id) {
  var carrinho = pegarCarrinho();
  var novoCarrinho = [];
  for (var i = 0; i < carrinho.length; i++) {
    if (carrinho[i].id !== id) {
      novoCarrinho.push(carrinho[i]);
    }
  }
  salvarCarrinho(novoCarrinho);
}

function alterarQuantidade(id, novaQuantidade) {
  if (novaQuantidade < 1) return;
  var carrinho = pegarCarrinho();
  for (var i = 0; i < carrinho.length; i++) {
    if (carrinho[i].id === id) {
      carrinho[i].quantidade = novaQuantidade;
    }
  }
  salvarCarrinho(carrinho);
}

function calcularTotalCarrinho() {
  var carrinho = pegarCarrinho();
  var total = 0;
  for (var i = 0; i < carrinho.length; i++) {
    total = total + (carrinho[i].preco * carrinho[i].quantidade);
  }
  return total;
}

function esvaziarCarrinho() {
  localStorage.removeItem("carrinho");
  atualizarContadorCarrinho();
}

// atualiza o numerinho "(2)" ao lado do link "Carrinho", em todas as páginas
function atualizarContadorCarrinho() {
  var contador = document.getElementById("contador-carrinho");
  if (!contador) return;

  var carrinho = pegarCarrinho();
  var totalItens = 0;
  for (var i = 0; i < carrinho.length; i++) {
    totalItens = totalItens + carrinho[i].quantidade;
  }

  contador.textContent = totalItens > 0 ? "(" + totalItens + ")" : "";
}


/* ------------------------------------------------------------
   FAVORITOS
   ------------------------------------------------------------ */
function pegarFavoritos() {
  var dados = localStorage.getItem("favoritos");
  if (dados) {
    return JSON.parse(dados);
  }
  return [];
}

function salvarFavoritos(favoritos) {
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  atualizarContadorFavoritos();
}

function produtoEstaFavoritado(id) {
  var favoritos = pegarFavoritos();
  for (var i = 0; i < favoritos.length; i++) {
    if (favoritos[i].id === id) return true;
  }
  return false;
}

// adiciona ou remove dos favoritos (alterna) e devolve true/false (favoritado ou não)
function alternarFavorito(id, nome, preco, imagem) {
  var favoritos = pegarFavoritos();

  if (produtoEstaFavoritado(id)) {
    var novaLista = [];
    for (var i = 0; i < favoritos.length; i++) {
      if (favoritos[i].id !== id) novaLista.push(favoritos[i]);
    }
    salvarFavoritos(novaLista);
    return false;
  }

  favoritos.push({ id: id, nome: nome, preco: preco, imagem: imagem });
  salvarFavoritos(favoritos);
  return true;
}

function atualizarContadorFavoritos() {
  var contador = document.getElementById("contador-favoritos");
  if (!contador) return;
  var favoritos = pegarFavoritos();
  contador.textContent = favoritos.length > 0 ? "(" + favoritos.length + ")" : "";
}


/* ------------------------------------------------------------
   USUÁRIOS / LOGIN
   ------------------------------------------------------------ */
function pegarUsuarios() {
  var dados = localStorage.getItem("usuarios");
  if (dados) {
    return JSON.parse(dados);
  }
  // primeira vez que o site abre: copia a lista inicial de dados.js
  localStorage.setItem("usuarios", JSON.stringify(USUARIOS_INICIAIS));
  return USUARIOS_INICIAIS;
}

function salvarUsuarios(usuarios) {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function pegarUsuarioLogado() {
  var dados = localStorage.getItem("usuarioLogado");
  if (dados) {
    return JSON.parse(dados);
  }
  return null;
}

function fazerLogout() {
  localStorage.removeItem("usuarioLogado");
  sessionStorage.removeItem("gc_token");
  window.location.href = "index.html";
}

// O cabeçalho tem DOIS links de conta:
//   #link-conta      -> ícone de pessoa, sempre visível, só navega
//                       (para perfil.html se logado, ou login.html se não)
//   #link-conta-menu -> o texto "Entrar"/"Sair" dentro do menu escondido
// e o link "Admin" só aparece pra quem é administrador.
function atualizarLinkDeConta() {
  var linkConta = document.getElementById("link-conta");
  var linkContaMenu = document.getElementById("link-conta-menu");
  var linkAdmin = document.getElementById("link-admin");
  var usuario = pegarUsuarioLogado();

  if (linkConta) {
    linkConta.setAttribute("href", usuario ? "perfil.html" : "login.html");
    linkConta.setAttribute("title", usuario ? "Minha conta (" + usuario.nome.split(" ")[0] + ")" : "Entrar");
  }

  if (linkContaMenu && usuario) {
    linkContaMenu.textContent = "Sair (" + usuario.nome.split(" ")[0] + ")";
    linkContaMenu.setAttribute("href", "#");
    linkContaMenu.addEventListener("click", function (evento) {
      evento.preventDefault();
      fazerLogout();
    });
  }

  if (linkAdmin) {
    if (usuario && usuario.tipo === "administrador") {
      linkAdmin.style.display = "block";
    } else {
      linkAdmin.style.display = "none";
    }
  }
}

// Abre/fecha o menu escondido quando clica no ícone de hambúrguer
function iniciarMenuHamburguer() {
  var botaoMenu = document.getElementById("botao-menu");
  var menuLateral = document.getElementById("menu-lateral");

  if (!botaoMenu || !menuLateral) return;

  botaoMenu.addEventListener("click", function () {
    menuLateral.classList.toggle("aberto");
  });

  // fecha o menu se a pessoa clicar em algum link dele (melhora a navegação)
  menuLateral.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      menuLateral.classList.remove("aberto");
    });
  });
}


/* ------------------------------------------------------------
   PRODUTOS (usado pelo admin para saber estoque/preço atualizados)
   ------------------------------------------------------------ */
function pegarProdutos() {
  var dados = localStorage.getItem("produtos");

  if (!dados) {
    localStorage.setItem("produtos", JSON.stringify(PRODUTOS_INICIAIS));
    return PRODUTOS_INICIAIS;
  }

  var produtosSalvos = JSON.parse(dados);
  var idsExistentes = {};

  produtosSalvos.forEach(function (produto) {
    idsExistentes[produto.id] = true;
  });

  // Adiciona somente produtos novos que ainda não existem no navegador.
  // Assim, alterações feitas pelo administrador continuam preservadas.
  var houveNovidade = false;
  PRODUTOS_INICIAIS.forEach(function (produtoInicial) {
    if (!idsExistentes[produtoInicial.id]) {
      produtosSalvos.push(produtoInicial);
      houveNovidade = true;
    }
  });

  if (houveNovidade) {
    localStorage.setItem("produtos", JSON.stringify(produtosSalvos));
  }

  return produtosSalvos;
}

function salvarProdutos(produtos) {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

function pegarProdutoPorId(id) {
  var produtos = pegarProdutos();
  for (var i = 0; i < produtos.length; i++) {
    if (produtos[i].id === id) return produtos[i];
  }
  return null;
}


/* ------------------------------------------------------------
   PEDIDOS (histórico de compras)
   ------------------------------------------------------------ */
function pegarPedidos() {
  var dados = localStorage.getItem("pedidos");
  if (dados) {
    return JSON.parse(dados);
  }
  return [];
}

function salvarPedidos(pedidos) {
  localStorage.setItem("pedidos", JSON.stringify(pedidos));
}

function criarPedido(itens, total, endereco) {
  var pedidos = pegarPedidos();
  var usuario = pegarUsuarioLogado();

  var novoPedido = {
    id: "ped-" + Date.now(),
    clienteEmail: usuario ? usuario.email : "visitante",
    itens: itens,
    total: total,
    endereco: endereco,
    status: "pago",
    data: new Date().toISOString()
  };

  pedidos.push(novoPedido);
  salvarPedidos(pedidos);
  return novoPedido;
}


/* ------------------------------------------------------------
   CUPONS
   ------------------------------------------------------------ */
function pegarCupons() {
  var dados = localStorage.getItem("cupons");
  if (dados) {
    return JSON.parse(dados);
  }
  localStorage.setItem("cupons", JSON.stringify(CUPONS_INICIAIS));
  return CUPONS_INICIAIS;
}

function salvarCupons(cupons) {
  localStorage.setItem("cupons", JSON.stringify(cupons));
}

function verificarCupom(codigo) {
  var cupons = pegarCupons();
  for (var i = 0; i < cupons.length; i++) {
    if (cupons[i].codigo === codigo.toUpperCase() && cupons[i].ativo) {
      return cupons[i];
    }
  }
  return null;
}


/* ------------------------------------------------------------
   ISSO RODA SEMPRE, EM TODA PÁGINA, ASSIM QUE O SCRIPT CARREGA
   ------------------------------------------------------------ */
atualizarContadorCarrinho();
atualizarContadorFavoritos();
atualizarLinkDeConta();
iniciarMenuHamburguer();

// Liga o funcionamento de QUALQUER botão "Adicionar ao carrinho" ou
// "Favoritar" que existir na página (Home, Produtos, Produto, Coleções...).
// Cada botão traz os dados do produto escritos direto no HTML,
// através dos atributos data-id, data-nome, data-preco e data-imagem.
var botoesAdicionar = document.querySelectorAll(".btn-adicionar");
botoesAdicionar.forEach(function (botao) {
  botao.addEventListener("click", function () {
    var id = botao.getAttribute("data-id");
    var nome = botao.getAttribute("data-nome");
    var preco = parseFloat(botao.getAttribute("data-preco"));
    var imagem = botao.getAttribute("data-imagem");

    adicionarAoCarrinho(id, nome, preco, imagem);

    var textoOriginal = botao.textContent;
    botao.textContent = "Adicionado ✓";
    setTimeout(function () {
      botao.textContent = textoOriginal;
    }, 1200);
  });
});

var botoesFavoritar = document.querySelectorAll(".btn-favoritar");
botoesFavoritar.forEach(function (botao) {
  // se o produto já estiver favoritado, o botão já nasce marcado
  var id = botao.getAttribute("data-id");
  if (produtoEstaFavoritado(id)) {
    botao.textContent = "♥ Favoritado";
  }

  botao.addEventListener("click", function () {
    var nome = botao.getAttribute("data-nome");
    var preco = parseFloat(botao.getAttribute("data-preco"));
    var imagem = botao.getAttribute("data-imagem");

    var favoritado = alternarFavorito(id, nome, preco, imagem);
    botao.textContent = favoritado ? "♥ Favoritado" : "♡ Favoritar";
  });
});
