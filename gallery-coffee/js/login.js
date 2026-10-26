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
    location.href=me.role==='admin'?'admin.html':'index.html';
  }catch(err){document.getElementById('erro-login').textContent=err.message}});
  document.getElementById('form-cadastro').addEventListener('submit',async function(e){e.preventDefault();const erro=document.getElementById('erro-cadastro');
    const senha=document.getElementById('cadastro-senha').value;if(senha!==document.getElementById('cadastro-confirmar').value){erro.textContent='Senhas diferentes';return}
    try{const data=await apiRequest('/auth/register',{method:'POST',body:JSON.stringify({name:document.getElementById('cadastro-nome').value,email:document.getElementById('cadastro-email').value,password:senha})});
      if(data.session){limparSessaoGallery();sessionStorage.setItem('gc_token',data.session.access_token);sessionStorage.setItem('usuarioLogado',JSON.stringify({id:data.user.id,nome:document.getElementById('cadastro-nome').value.trim(),email:data.user.email,tipo:'cliente'}));location.href='index.html'}else{alert('Cadastro realizado. Confirme seu email antes de entrar.');location.href='login.html'}
    }catch(err){erro.textContent=err.message}
  });
  document.getElementById('form-recuperar').addEventListener('submit',async function(e){e.preventDefault();try{await apiRequest('/auth/recover',{method:'POST',body:JSON.stringify({email:document.querySelector('#painel-recuperar input[type=email]').value})});this.style.display='none';document.getElementById('mensagem-recuperar').style.display='block'}catch(err){alert(err.message)}});
})();
