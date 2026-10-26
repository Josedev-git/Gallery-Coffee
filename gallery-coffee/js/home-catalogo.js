(async function () {
  const grade = document.getElementById('grade-destaques-api');
  if (!grade) return;
  try {
    const produtos = await apiRequest('/products');
    const destaques = [...produtos].sort((a,b) => Number(b.sold||0)-Number(a.sold||0)).slice(0,6);
    gcLigarCatalogo(grade, destaques);
    grade.innerHTML = destaques.map(gcCartaoProduto).join('');
  } catch (e) {
    grade.innerHTML = `<p class="mensagem-erro">Os destaques estão temporariamente indisponíveis. <a href="produtos.html">Ver catálogo</a>.</p>`;
  }
})();
