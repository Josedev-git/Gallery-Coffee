/* ============================================================
   GALLERY COFFEE — js/perfil.js
   ------------------------------------------------------------
   Se ninguém estiver logado, manda pra página de login.
   As 3 abas (Perfil, Pedidos, Endereços) já existem no HTML —
   este arquivo só troca qual delas fica visível, e preenche
   os dados de quem está logado.
   ============================================================ */

var usuario = pegarUsuarioLogado();

if (!usuario) {
  alert("Faça login para acessar sua conta.");
  window.location.href = "login.html";
}

// --------- preenche a aba "Perfil" ---------
if (usuario) {
  document.getElementById("perfil-nome").textContent = usuario.nome;
  document.getElementById("perfil-email").textContent = usuario.email;
  document.getElementById("perfil-tipo").textContent = usuario.tipo === "administrador" ? "Administrador" : "Cliente";
}

// --------- troca de abas ---------
var botoesAba = document.querySelectorAll(".botao-aba");
botoesAba.forEach(function (botao) {
  botao.addEventListener("click", function () {
    var abaEscolhida = botao.getAttribute("data-aba");

    document.querySelectorAll(".botao-aba").forEach(function (b) { b.classList.remove("ativa"); });
    document.querySelectorAll(".conteudo-aba").forEach(function (c) { c.classList.remove("ativa"); });

    botao.classList.add("ativa");
    document.getElementById("aba-" + abaEscolhida).classList.add("ativa");
  });
});

// --------- aba "Meus pedidos" ---------
function mostrarPedidos() {
  if (!usuario) return;

  var todosPedidos = pegarPedidos();
  var meusPedidos = [];

  for (var i = 0; i < todosPedidos.length; i++) {
    if (todosPedidos[i].clienteEmail === usuario.email) {
      meusPedidos.push(todosPedidos[i]);
    }
  }

  var lista = document.getElementById("lista-pedidos");

  if (meusPedidos.length === 0) {
    document.getElementById("pedidos-vazio").style.display = "block";
    return;
  }

  var html = "";
  for (var j = meusPedidos.length - 1; j >= 0; j--) {
    var pedido = meusPedidos[j];
    var dataFormatada = new Date(pedido.data).toLocaleDateString("pt-BR");

    html += "<div class='caixa pedido-admin'>";
    html += "<p style='font-size:12px; color:#6E6152;'>Pedido #" + pedido.id.slice(-6) + " — " + dataFormatada + " — status: " + pedido.status + "</p>";
    for (var k = 0; k < pedido.itens.length; k++) {
      html += "<p>" + pedido.itens[k].quantidade + "x " + pedido.itens[k].nome + "</p>";
    }
    html += "<p style='font-weight:bold; color:#9C7A1B;'>Total: " + formatarPreco(pedido.total) + "</p>";
    html += "</div>";
  }

  lista.innerHTML = html;
}

mostrarPedidos();

// --------- aba "Endereços" ---------
function carregarEnderecoSalvo() {
  var dados = localStorage.getItem("enderecoPrincipal");
  if (!dados) return;

  var endereco = JSON.parse(dados);
  document.getElementById("end-cep").value = endereco.cep || "";
  document.getElementById("end-rua").value = endereco.rua || "";
  document.getElementById("end-numero").value = endereco.numero || "";
  document.getElementById("end-bairro").value = endereco.bairro || "";
  document.getElementById("end-cidade").value = endereco.cidade || "";
  document.getElementById("end-estado").value = endereco.estado || "";
}

carregarEnderecoSalvo();

document.getElementById("form-endereco-perfil").addEventListener("submit", function (evento) {
  evento.preventDefault();

  var endereco = {
    cep: document.getElementById("end-cep").value,
    rua: document.getElementById("end-rua").value,
    numero: document.getElementById("end-numero").value,
    bairro: document.getElementById("end-bairro").value,
    cidade: document.getElementById("end-cidade").value,
    estado: document.getElementById("end-estado").value
  };

  localStorage.setItem("enderecoPrincipal", JSON.stringify(endereco));
  document.getElementById("endereco-salvo").style.display = "block";
});
