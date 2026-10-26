/* GALLERY COFFEE — Recuperacao de senha.
   O Supabase redireciona para esta pagina com a sessao temporaria
   no fragmento #access_token=...&type=recovery. Nunca salvar esse token.
*/
(function () {
  'use strict';

  const status = document.getElementById('reset-status');
  const form = document.getElementById('form-redefinir');
  const erro = document.getElementById('erro-redefinir');
  const sucesso = document.getElementById('sucesso-redefinir');
  const botao = document.getElementById('botao-redefinir');

  // Fragmento nao e enviado ao servidor no HTTP; apaga-lo da barra
  // assim que for lido para evitar copiar/compartilhar o token sem querer.
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  const accessToken = hash.get('access_token');
  const tipo = hash.get('type');
  const erroNoLink = hash.get('error_description') || query.get('error_description');
  window.history.replaceState(null, '', window.location.pathname);

  if (erroNoLink) {
    status.textContent = 'O link de recuperacao expirou ou nao e valido. Solicite um novo.';
    return;
  }

  if (!accessToken || tipo !== 'recovery') {
    status.textContent = 'Abra esta pagina pelo link mais recente recebido no seu email. Se ele expirou, solicite outro.';
    return;
  }

  status.textContent = 'Link recebido. Digite sua nova senha abaixo.';
  form.style.display = 'block';

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    erro.textContent = '';

    const senha = document.getElementById('nova-senha').value;
    const confirmar = document.getElementById('confirmar-nova-senha').value;

    if (senha.length < 8 || senha.length > 72) {
      erro.textContent = 'A senha deve ter entre 8 e 72 caracteres.';
      return;
    }
    if (senha !== confirmar) {
      erro.textContent = 'As senhas digitadas nao coincidem.';
      return;
    }

    botao.disabled = true;
    botao.textContent = 'Salvando...';

    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + accessToken },
        body: JSON.stringify({ password: senha })
      });

      // A recuperacao de senha nao deve autenticar uma sessao antiga.
      sessionStorage.removeItem('gc_token');
      sessionStorage.removeItem('usuarioLogado');
      document.getElementById('nova-senha').value = '';
      document.getElementById('confirmar-nova-senha').value = '';
      form.style.display = 'none';
      status.textContent = '';
      sucesso.style.display = 'block';
    } catch (e) {
      erro.textContent = e.message || 'Nao foi possivel salvar. Solicite outro link.';
    } finally {
      botao.disabled = false;
      botao.textContent = 'Salvar nova senha';
    }
  });
})();
