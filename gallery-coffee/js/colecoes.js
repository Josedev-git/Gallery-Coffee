(function () {
      var params = new URLSearchParams(window.location.search);
      var idColecao = params.get("colecao");
      var gradeColecoes = document.getElementById("grade-colecoes");
      var listaColecoes = document.getElementById("lista-colecoes");
      var detalhe = document.getElementById("detalhe-colecao");
      var produtosSecao = document.getElementById("produtos-colecao");
      var gradeProdutos = document.getElementById("grade-produtos-colecao");

      function escapeHtml(texto) {
        return String(texto).replace(/[&<>\"']/g, function (char) {
          return {"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;", "'":"&#39;"}[char];
        });
      }

      function cardProduto(produto) {
        var preco = formatarPreco(produto.preco);
        var antigo = produto.precoAntigo ? "<span style='text-decoration:line-through; color:#8a7d6d; margin-right:6px;'>" + formatarPreco(produto.precoAntigo) + "</span>" : "";
        return "<div class='cartao'>" +
          "<a href='produto.html?id=" + encodeURIComponent(produto.id) + "'>" +
          "<img src='" + escapeHtml(produto.imagem || "assets/logo.png") + "' alt='" + escapeHtml(produto.nome) + "'>" +
          "<div class='info'><h3>" + escapeHtml(produto.nome) + "</h3><p class='preco'>" + antigo + preco + "</p></div></a>" +
          "<button class='botao btn-adicionar' data-id='" + escapeHtml(produto.id) + "' data-nome='" + escapeHtml(produto.nome) + "' data-preco='" + produto.preco + "' data-imagem='" + escapeHtml(produto.imagem || "assets/logo.png") + "'>Adicionar ao carrinho</button>" +
          "<button class='botao btn-favoritar' data-id='" + escapeHtml(produto.id) + "' data-nome='" + escapeHtml(produto.nome) + "' data-preco='" + produto.preco + "' data-imagem='" + escapeHtml(produto.imagem || "assets/logo.png") + "'>♡ Favoritar</button>" +
          "</div>";
      }

      if (!idColecao) {
        for (var i = 0; i < COLECOES.length; i++) {
          var colecao = COLECOES[i];
          gradeColecoes.innerHTML +=
            "<div class='cartao'><a href='colecoes.html?colecao=" + encodeURIComponent(colecao.id) + "'>" +
            "<img src='" + escapeHtml(colecao.imagem) + "' alt='Coleção " + escapeHtml(colecao.nome) + "'>" +
            "<div class='info'><h3>" + escapeHtml(colecao.nome) + "</h3><p>" + escapeHtml(colecao.artista) + " — " + escapeHtml(colecao.epoca) + "</p></div></a></div>";
        }
        return;
      }

      var selecionada = null;
      for (var j = 0; j < COLECOES.length; j++) {
        if (COLECOES[j].id === idColecao) selecionada = COLECOES[j];
      }

      if (!selecionada) {
        gradeColecoes.innerHTML = "<p>Coleção não encontrada. <a href='colecoes.html'>Voltar para coleções</a>.</p>";
        return;
      }

      listaColecoes.style.display = "none";
      detalhe.style.display = "block";
      produtosSecao.style.display = "block";

      document.getElementById("colecao-imagem").src = selecionada.imagem;
      document.getElementById("colecao-imagem").alt = "Coleção " + selecionada.nome;
      document.getElementById("colecao-nome").textContent = selecionada.nome;
      document.getElementById("colecao-artista").textContent = selecionada.artista;
      document.getElementById("colecao-epoca").textContent = selecionada.epoca;
      document.getElementById("colecao-contexto").textContent = selecionada.contexto;
      document.getElementById("colecao-bio").textContent = selecionada.bio;

      gradeProdutos.innerHTML = '<p>Carregando produtos da coleção...</p>';
      apiRequest('/products').then(function (produtos) {
        var filtrados = produtos.filter(p => p.collection_id === selecionada.id);
        gcLigarCatalogo(gradeProdutos, filtrados);
        gradeProdutos.innerHTML = filtrados.length
          ? filtrados.map(gcCartaoProduto).join('')
          : '<p>Não há produtos disponíveis nesta coleção.</p>';
      }).catch(function (err) {
        gradeProdutos.innerHTML = '<p class="mensagem-erro">Não foi possível carregar: ' + escapeHtml(err.message) + '</p>';
      });
    })();
