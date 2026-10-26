/* ============================================================
   GALLERY COFFEE — js/login.js
   ------------------------------------------------------------
   Uma única página concentra Login, Cadastro e Recuperação.
   O modo é escolhido pela URL: login.html, ?modo=cadastro ou
   ?modo=recuperar.
   ============================================================ */

(function () {
  var params = new URLSearchParams(window.location.search);
  var modo = params.get("modo") || "login";

  // Apenas um destino interno permitido: evita redirecionamentos externos.
  var voltarCheckout = params.get('retorno') === 'checkout.html' ||
    sessionStorage.getItem('gc_redirect_after_login') === 'checkout.html';
  var destinoCliente = voltarCheckout ? 'checkout.html' : 'index.html';

  // Mantém o retorno também ao alternar entre login, cadastro e recuperação.
  if (voltarCheckout) {
    document.querySelectorAll('#painel-login a[href^="login.html"], #painel-cadastro a[href^="login.html"], #painel-recuperar a[href^="login.html"]').forEach(function (link) {
      var url = new URL(link.getAttribute('href'), window.location.href);
      url.searchParams.set('retorno', 'checkout.html');
      link.setAttribute('href', url.pathname.split('/').pop() + url.search);
    });
  }

  var painelLogin = document.getElementById("painel-login");
  var painelCadastro = document.getElementById("painel-cadastro");
  var painelRecuperar = document.getElementById("painel-recuperar");

  painelLogin.style.display = modo === "login" ? "block" : "none";
  painelCadastro.style.display = modo === "cadastro" ? "block" : "none";
  painelRecuperar.style.display = modo === "recuperar" ? "block" : "none";

  if (modo === "cadastro") document.title = "Criar conta — Gallery Coffee";
  if (modo === "recuperar") document.title = "Recuperar senha — Gallery Coffee";

  var formLogin = document.getElementById('form-login');
  formLogin.addEventListener('submit',async function(e){e.preventDefault();try{
    const data=await apiRequest('/auth/login',{method:'POST',body:JSON.stringify({email:document.getElementById('login-email').value,password:document.getElementById('login-senha').value})});
    // Uma conta diferente não pode herdar carrinho/cupom da anterior.
    const antiga=pegarUsuarioLogado();
    if (antiga && antiga.id !== data.user.id) {
      esvaziarCarrinho();
      sessionStorage.removeItem('cupomAplicado');
    }
    sessionStorage.setItem('gc_token',data.session.access_token);
    const me=await apiRequest('/me');
    sessionStorage.setItem('usuarioLogado',JSON.stringify({id:me.id,nome:me.name,email:me.email,tipo:me.role==='admin'?'administrador':'cliente'}));
    sessionStorage.removeItem('gc_redirect_after_login');
    location.href = me.role === 'admin' ? 'admin.html' : destinoCliente;
  }catch(err){document.getElementById('erro-login').textContent=err.message}});
  document.getElementById('form-cadastro').addEventListener('submit',async function(e){e.preventDefault();const erro=document.getElementById('erro-cadastro');
    const senha=document.getElementById('cadastro-senha').value;if(senha!==document.getElementById('cadastro-confirmar').value){erro.textContent='Senhas diferentes';return}
    try{const data=await apiRequest('/auth/register',{method:'POST',body:JSON.stringify({name:document.getElementById('cadastro-nome').value,email:document.getElementById('cadastro-email').value,password:senha})});
      if (data.session) {
        // Conserva o carrinho montado antes do cadastro (caso o usuário estivesse deslogado).
        const contaAnterior = pegarUsuarioLogado();
        if (contaAnterior && contaAnterior.id !== data.user.id) {
          esvaziarCarrinho();
          sessionStorage.removeItem('cupomAplicado');
        }
        sessionStorage.setItem('gc_token', data.session.access_token);
        sessionStorage.setItem('usuarioLogado', JSON.stringify({
          id: data.user.id,
          nome: document.getElementById('cadastro-nome').value.trim(),
          email: data.user.email,
          tipo: 'cliente'
        }));
        sessionStorage.removeItem('gc_redirect_after_login');
        location.href = destinoCliente;
      } else {
        alert('Cadastro realizado. Confirme seu email antes de entrar.');
        location.href = voltarCheckout ? 'login.html?retorno=checkout.html' : 'login.html';
      }
    }catch(err){erro.textContent=err.message}
  });
  document.getElementById('form-recuperar').addEventListener('submit',async function(e){e.preventDefault();try{await apiRequest('/auth/recover',{method:'POST',body:JSON.stringify({email:document.querySelector('#painel-recuperar input[type=email]').value})});this.style.display='none';document.getElementById('mensagem-recuperar').style.display='block'}catch(err){alert(err.message)}});
})();
