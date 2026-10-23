/* ============================================================
   GALLERY COFFEE — js/admin.js
   ------------------------------------------------------------
   Só quem está logado como "administrador" pode ver esta
   página. As tabelas (produtos, pedidos, clientes, cupons) são
   preenchidas por aqui porque são dados que mudam com o tempo —
   é o mesmo princípio já usado no carrinho.html.
   ============================================================ */

var usuarioAdmin = pegarUsuarioLogado();

if (!usuarioAdmin || usuarioAdmin.tipo !== "administrador") {
  document.getElementById("area-restrita").style.display = "block";
} else {
  document.getElementById("area-admin").style.display = "block";
  iniciarPainelAdmin();
}

function iniciarPainelAdmin() {

  /* ---------------- abas ---------------- */
  var botoesAba = document.querySelectorAll(".botao-aba");
  botoesAba.forEach(function (botao) {
    botao.addEventListener("click", function () {
      document.querySelectorAll(".botao-aba").forEach(function (b) { b.classList.remove("ativa"); });
      document.querySelectorAll(".conteudo-aba").forEach(function (c) { c.classList.remove("ativa"); });
      botao.classList.add("ativa");
      document.getElementById("aba-" + botao.getAttribute("data-aba")).classList.add("ativa");
    });
  });

  /* ---------------- dashboard ---------------- */
  function montarDashboard() {
    var produtos = pegarProdutos();
    var pedidos = pegarPedidos();

    var totalVendas = 0;
    var produtosVendidos = 0;
    for (var i = 0; i < pedidos.length; i++) {
      totalVendas = totalVendas + pedidos[i].total;
      for (var j = 0; j < pedidos[i].itens.length; j++) {
        produtosVendidos = produtosVendidos + pedidos[i].itens[j].quantidade;
      }
    }

    var estoqueBaixo = [];
    for (var k = 0; k < produtos.length; k++) {
      if (produtos[k].estoque > 0 && produtos[k].estoque <= 6) {
        estoqueBaixo.push(produtos[k]);
      }
    }

    document.getElementById("dash-vendas").textContent = formatarPreco(totalVendas);
    document.getElementById("dash-pedidos").textContent = pedidos.length;
    document.getElementById("dash-vendidos").textContent = produtosVendidos;
    document.getElementById("dash-estoque-baixo").textContent = estoqueBaixo.length;

    var listaEstoque = document.getElementById("lista-estoque-baixo");
    if (estoqueBaixo.length === 0) {
      listaEstoque.innerHTML = "<p style='color:#6E6152;'>Nenhum produto com estoque baixo.</p>";
    } else {
      var html = "<ul class='lista-simples'>";
      for (var m = 0; m < estoqueBaixo.length; m++) {
        html += "<li>" + estoqueBaixo[m].nome + " — " + estoqueBaixo[m].estoque + " restantes</li>";
      }
      html += "</ul>";
      listaEstoque.innerHTML = html;
    }
  }

  /* ---------------- produtos (CRUD) ---------------- */
  function nomeDaColecao(id) {
    for (var i = 0; i < COLECOES.length; i++) {
      if (COLECOES[i].id === id) return COLECOES[i].nome;
    }
    return id;
  }

  function montarTabelaProdutos() {
    var produtos = pegarProdutos();
    var corpo = document.getElementById("corpo-produtos-admin");
    corpo.innerHTML = "";

    for (var i = 0; i < produtos.length; i++) {
      var p = produtos[i];
      var linha = document.createElement("tr");
      linha.innerHTML =
        "<td>" + p.nome + " <br><small style='color:#6E6152;'>" + nomeDaColecao(p.colecaoId) + "</small></td>" +
        "<td>" + formatarPreco(p.preco) + "</td>" +
        "<td>" + p.estoque + "</td>" +
        "<td>" +
        "  <button class='botao' onclick=\"abrirEdicaoProduto('" + p.id + "')\">Editar</button> " +
        "  <button class='botao' onclick=\"excluirProduto('" + p.id + "')\">Excluir</button>" +
        "</td>";
      corpo.appendChild(linha);
    }
  }

  var modalProduto = document.getElementById("modal-produto");
  var formProduto = document.getElementById("form-produto-admin");

  document.getElementById("botao-novo-produto").addEventListener("click", function () {
    formProduto.reset();
    document.getElementById("produto-admin-id").value = "";
    document.getElementById("modal-produto-titulo").textContent = "Novo produto";
    modalProduto.classList.add("aberta");
  });

  document.getElementById("botao-cancelar-produto").addEventListener("click", function () {
    modalProduto.classList.remove("aberta");
  });

  window.abrirEdicaoProduto = function (id) {
    var produto = pegarProdutoPorId(id);
    if (!produto) return;

    document.getElementById("modal-produto-titulo").textContent = "Editar produto";
    document.getElementById("produto-admin-id").value = produto.id;
    document.getElementById("produto-admin-nome").value = produto.nome;
    document.getElementById("produto-admin-colecao").value = produto.colecaoId;
    document.getElementById("produto-admin-preco").value = produto.preco;
    document.getElementById("produto-admin-preco-antigo").value = produto.precoAntigo || "";
    document.getElementById("produto-admin-capacidade").value = produto.capacidade;
    document.getElementById("produto-admin-estoque").value = produto.estoque;
    document.getElementById("produto-admin-material").value = produto.material;
    document.getElementById("produto-admin-dimensoes").value = produto.dimensoes;
    document.getElementById("produto-admin-cuidados").value = produto.cuidados;
    document.getElementById("produto-admin-descricao").value = produto.descricao;

    modalProduto.classList.add("aberta");
  };

  window.excluirProduto = function (id) {
    if (!confirm("Tem certeza que quer excluir este produto?")) return;
    var produtos = pegarProdutos();
    var novaLista = [];
    for (var i = 0; i < produtos.length; i++) {
      if (produtos[i].id !== id) novaLista.push(produtos[i]);
    }
    salvarProdutos(novaLista);
    montarTabelaProdutos();
    montarDashboard();
  };

  formProduto.addEventListener("submit", function (evento) {
    evento.preventDefault();

    var id = document.getElementById("produto-admin-id").value;
    var produtos = pegarProdutos();

    var dadosProduto = {
      nome: document.getElementById("produto-admin-nome").value,
      colecaoId: document.getElementById("produto-admin-colecao").value,
      preco: parseFloat(document.getElementById("produto-admin-preco").value) || 0,
      precoAntigo: document.getElementById("produto-admin-preco-antigo").value ? parseFloat(document.getElementById("produto-admin-preco-antigo").value) : null,
      capacidade: document.getElementById("produto-admin-capacidade").value,
      estoque: parseInt(document.getElementById("produto-admin-estoque").value) || 0,
      material: document.getElementById("produto-admin-material").value,
      dimensoes: document.getElementById("produto-admin-dimensoes").value,
      cuidados: document.getElementById("produto-admin-cuidados").value,
      descricao: document.getElementById("produto-admin-descricao").value
    };

    if (id) {
      // editar produto existente
      for (var i = 0; i < produtos.length; i++) {
        if (produtos[i].id === id) {
          produtos[i] = Object.assign({}, produtos[i], dadosProduto);
        }
      }
    } else {
      // criar produto novo
      dadosProduto.id = "pr-" + Date.now();
      dadosProduto.vendidos = 0;
      produtos.push(dadosProduto);
    }

    salvarProdutos(produtos);
    modalProduto.classList.remove("aberta");
    montarTabelaProdutos();
    montarDashboard();
  });

  /* ---------------- pedidos ---------------- */
  function montarPedidosAdmin() {
    var pedidos = pegarPedidos();
    var lista = document.getElementById("lista-pedidos-admin");

    if (pedidos.length === 0) {
      lista.innerHTML = "<p style='color:#6E6152;'>Nenhum pedido ainda.</p>";
      return;
    }

    var html = "";
    for (var i = pedidos.length - 1; i >= 0; i--) {
      var pedido = pedidos[i];
      var dataFormatada = new Date(pedido.data).toLocaleDateString("pt-BR");

      html += "<div class='caixa pedido-admin'>";
      html += "<p style='font-size:12px; color:#6E6152;'>#" + pedido.id.slice(-6) + " — " + pedido.clienteEmail + " — " + dataFormatada + "</p>";
      for (var j = 0; j < pedido.itens.length; j++) {
        html += "<p>" + pedido.itens[j].quantidade + "x " + pedido.itens[j].nome + "</p>";
      }
      html += "<p style='font-weight:bold; color:#9C7A1B;'>Total: " + formatarPreco(pedido.total) + "</p>";
      html += "<label style='font-size:13px;'>Status: ";
      html += "<select onchange=\"alterarStatusPedido('" + pedido.id + "', this.value)\">";
      var statusList = ["pendente", "pago", "enviado", "entregue"];
      for (var s = 0; s < statusList.length; s++) {
        var selecionado = (statusList[s] === pedido.status) ? "selected" : "";
        html += "<option value='" + statusList[s] + "' " + selecionado + ">" + statusList[s] + "</option>";
      }
      html += "</select></label>";
      html += "</div>";
    }

    lista.innerHTML = html;
  }

  window.alterarStatusPedido = function (id, novoStatus) {
    var pedidos = pegarPedidos();
    for (var i = 0; i < pedidos.length; i++) {
      if (pedidos[i].id === id) pedidos[i].status = novoStatus;
    }
    salvarPedidos(pedidos);
  };

  /* ---------------- clientes ---------------- */
  function montarClientes() {
    var usuarios = pegarUsuarios();
    var pedidos = pegarPedidos();
    var corpo = document.getElementById("corpo-clientes-admin");
    corpo.innerHTML = "";

    for (var i = 0; i < usuarios.length; i++) {
      if (usuarios[i].tipo !== "cliente") continue;

      var totalPedidos = 0;
      for (var j = 0; j < pedidos.length; j++) {
        if (pedidos[j].clienteEmail === usuarios[i].email) totalPedidos++;
      }

      var linha = document.createElement("tr");
      linha.innerHTML =
        "<td>" + usuarios[i].nome + "</td>" +
        "<td>" + usuarios[i].email + "</td>" +
        "<td>" + totalPedidos + "</td>";
      corpo.appendChild(linha);
    }

    if (corpo.innerHTML === "") {
      corpo.innerHTML = "<tr><td colspan='3'>Nenhum cliente cadastrado ainda.</td></tr>";
    }
  }

  /* ---------------- cupons ---------------- */
  function montarCupons() {
    var cupons = pegarCupons();
    var lista = document.getElementById("lista-cupons-admin");

    var html = "";
    for (var i = 0; i < cupons.length; i++) {
      var c = cupons[i];
      html += "<div class='caixa item-cupom'>";
      html += "<span>" + c.codigo + " — " + c.desconto + "% — " + (c.ativo ? "ativo" : "inativo") + "</span>";
      html += "<span>";
      html += "<button class='botao' onclick=\"alternarCupom('" + c.codigo + "')\">" + (c.ativo ? "Desativar" : "Ativar") + "</button> ";
      html += "<button class='botao' onclick=\"excluirCupom('" + c.codigo + "')\">Excluir</button>";
      html += "</span></div>";
    }
    lista.innerHTML = html;
  }

  window.alternarCupom = function (codigo) {
    var cupons = pegarCupons();
    for (var i = 0; i < cupons.length; i++) {
      if (cupons[i].codigo === codigo) cupons[i].ativo = !cupons[i].ativo;
    }
    salvarCupons(cupons);
    montarCupons();
  };

  window.excluirCupom = function (codigo) {
    var cupons = pegarCupons();
    var novaLista = [];
    for (var i = 0; i < cupons.length; i++) {
      if (cupons[i].codigo !== codigo) novaLista.push(cupons[i]);
    }
    salvarCupons(novaLista);
    montarCupons();
  };

  document.getElementById("form-novo-cupom").addEventListener("submit", function (evento) {
    evento.preventDefault();
    var codigo = document.getElementById("cupom-codigo").value.toUpperCase();
    var desconto = parseInt(document.getElementById("cupom-desconto").value);
    if (!codigo || !desconto) return;

    var cupons = pegarCupons();
    cupons.push({ codigo: codigo, desconto: desconto, ativo: true });
    salvarCupons(cupons);

    document.getElementById("form-novo-cupom").reset();
    montarCupons();
  });

  /* ---------------- monta tudo na primeira vez que a página abre ---------------- */
  montarDashboard();
  montarTabelaProdutos();
  montarPedidosAdmin();
  montarClientes();
  montarCupons();
}
