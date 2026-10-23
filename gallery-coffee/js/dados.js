/* ============================================================
   GALLERY COFFEE — js/dados.js
   ------------------------------------------------------------
   Aqui ficam os dados "de fábrica" do site: as coleções e os
   produtos que existem quando alguém abre o site pela primeira
   vez. Esse arquivo é carregado ANTES do script.js em toda
   página, então essas variáveis (COLECOES, PRODUTOS_INICIAIS...)
   ficam disponíveis pro script.js e pros outros arquivos usarem.

   Isso não é um banco de dados — é só a lista inicial. Depois
   que o site abre, os produtos "de verdade" (que podem ser
   editados pelo administrador) ficam guardados no localStorage,
   copiados a partir dessa lista aqui.
   ============================================================ */

var COLECOES = [
  {
    id: "monafe",
    nome: "Monafé",
    artista: "Leonardo da Vinci",
    epoca: "Renascimento italiano, séc. XV–XVI",
    imagem: "assets/monafe.jpg",
    descricaoCurta: "O sorriso mais famoso da arte, agora no seu copo do dia a dia.",
    contexto: "Inspirada no retrato mais estudado da história da arte, a coleção Monafé traduz o mistério e a elegância do Renascimento para um objeto cotidiano — o seu café.",
    bio: "Leonardo da Vinci foi pintor, inventor e cientista florentino, símbolo maior do Renascimento. A Mona Lisa, seu retrato mais célebre, é reconhecida em todo o mundo por seu enigmático sorriso."
  },
  {
    id: "van",
    nome: "Van Coffee",
    artista: "Vincent van Gogh",
    epoca: "Pós-impressionismo, séc. XIX",
    imagem: "assets/van-coffee.jpg",
    descricaoCurta: "Céus em movimento e cores vibrantes em cada gole.",
    contexto: "A energia das pinceladas de Van Gogh ganha nova forma: uma coleção que carrega a intensidade emocional do pós-impressionismo para a sua rotina.",
    bio: "Vincent van Gogh foi um pintor holandês conhecido por pinceladas vigorosas e cores intensas. Suas obras, como Noite Estrelada, transformaram a pintura moderna."
  },
  {
    id: "frida",
    nome: "Fridachinoo",
    artista: "Frida Kahlo",
    epoca: "Modernismo mexicano, séc. XX",
    imagem: "assets/fridachinoo.jpg",
    descricaoCurta: "Forte como Frida, marcante como arte.",
    contexto: "Entre folhagens, animais e flores, a coleção Fridachinoo celebra a força simbólica de Frida Kahlo — cada copo é um pequeno autorretrato que você leva com você.",
    bio: "Frida Kahlo foi uma pintora mexicana cujos autorretratos exploram identidade, dor e resistência. Sua estética vibrante é um dos ícones visuais mais fortes da arte latino-americana."
  },
  {
    id: "adam",
    nome: "Adam Coffee",
    artista: "Michelangelo",
    epoca: "Alto Renascimento, séc. XVI",
    imagem: "assets/adam-coffee.jpg",
    descricaoCurta: "A força e a beleza do Renascimento em cada café.",
    contexto: "Inspirada em 'A Criação de Adam', afresco pintado por Michelangelo no teto da Capela Sistina, a coleção Adam Coffee leva para o seu café um dos gestos mais reconhecidos da história da arte.",
    bio: "Michelangelo foi um dos grandes mestres do Renascimento italiano, reconhecido por sua pintura, escultura e arquitetura. 'A Criação de Adam', com as mãos de Deus e do homem quase se tocando, é um dos painéis mais famosos da Capela Sistina, no Vaticano."
  },
  {
    id: "munche",
    nome: "Munché",
    artista: "Edvard Munch",
    epoca: "Expressionismo, séc. XIX–XX",
    imagem: "assets/munche.jpg",
    descricaoCurta: "Cores intensas e emoção que não passam despercebidas.",
    contexto: "Inspirada em 'O Grito', pintura mais célebre de Edvard Munch, a coleção Munché transforma a intensidade emocional do expressionismo em uma peça marcante para acompanhar sua rotina.",
    bio: "Edvard Munch foi um pintor norueguês ligado ao expressionismo. 'O Grito', de 1893, retrata uma figura em desespero sob um céu em tons de laranja, e é uma das imagens mais reconhecidas da arte moderna."
  },
  {
    id: "monete",
    nome: "Moneté",
    artista: "Claude Monet",
    epoca: "Impressionismo, séc. XIX–XX",
    imagem: "assets/monete.jpg",
    descricaoCurta: "Leveza, luz e pinceladas que parecem se mover.",
    contexto: "Inspirada na série 'Nenúfares', pintada por Claude Monet em seu jardim em Giverny, a coleção Moneté traz a luminosidade e a atmosfera do impressionismo para o seu café.",
    bio: "Claude Monet foi um dos fundadores do impressionismo francês. Ao longo de quase 30 anos, pintou mais de 250 telas de nenúfares, estudando como a luz e a cor mudavam sobre a água em diferentes horas do dia."
  },
  {
    id: "athena",
    nome: "Athenachino",
    artista: "Rafael",
    epoca: "Alto Renascimento, séc. XVI",
    imagem: "assets/athenachino.jpg",
    descricaoCurta: "Sabedoria, força e inspiração clássica em um só copo.",
    contexto: "Inspirada em 'A Escola de Atenas', afresco de Rafael que reúne os grandes filósofos da Antiguidade em um só salão, a coleção Athenachino traduz o equilíbrio e a harmonia do Renascimento para o seu café.",
    bio: "Rafael foi um dos grandes mestres do Alto Renascimento italiano. 'A Escola de Atenas', pintada nos Museus Vaticanos, reúne figuras como Platão e Aristóteles e é considerada uma das obras-primas da pintura ocidental."
  }
];

var PRODUTOS_INICIAIS = [
  { id: "pr1", colecaoId: "monafe", nome: "Monafé", preco: 99.90, precoAntigo: null, estoque: 24, capacidade: "400ml", material: "Cerâmica com acabamento fosco", dimensoes: "8,5 × 8,5 × 11 cm", cuidados: "Lavar à mão. Não usar em micro-ondas ou lava-louças.", descricao: "Um retrato do enigmático sorriso da Mona Lisa emoldurado em cerâmica fosca, para transformar cada café em um pequeno momento de contemplação.", vendidos: 214 },
  { id: "pr3", colecaoId: "van", nome: "Van Coffee", preco: 99.90, precoAntigo: null, estoque: 31, capacidade: "400ml", material: "Aço inox com pintura térmica", dimensoes: "8 × 8 × 15 cm", cuidados: "Lavar à mão com pano macio.", descricao: "O autorretrato de Van Gogh envolto em pinceladas azuis e douradas, sobre um copo térmico que mantém o café quente por até 4 horas.", vendidos: 189 },
  { id: "pr5", colecaoId: "frida", nome: "Fridachinoo", preco: 99.90, precoAntigo: null, estoque: 28, capacidade: "400ml", material: "Papel biodegradável reforçado", dimensoes: "8 × 8 × 14 cm", cuidados: "Uso individual recomendado. Não lavável.", descricao: "Frida cercada por folhagens, borboletas e seus companheiros animais — uma pequena obra de arte reforçada para o seu dia a dia.", vendidos: 156 },
  { id: "pr7", colecaoId: "adam", nome: "Adam Coffee", preco: 99.90, precoAntigo: null, estoque: 20, capacidade: "500ml", material: "Papel biodegradável reforçado", dimensoes: "9 × 9 × 15 cm", cuidados: "Uso individual recomendado. Não lavável.", descricao: "O gesto mais famoso da Capela Sistina, de Michelangelo, estampado em um copo que carrega toda a grandiosidade do Renascimento.", vendidos: 58 },
  { id: "pr8", colecaoId: "munche", nome: "Munché", preco: 99.90, precoAntigo: null, estoque: 22, capacidade: "400ml", material: "Papel biodegradável reforçado", dimensoes: "8 × 8 × 14 cm", cuidados: "Uso individual recomendado. Não lavável.", descricao: "As cores intensas de 'O Grito', de Edvard Munch, transformadas em uma peça marcante para o seu dia a dia.", vendidos: 47 },
  { id: "pr9", colecaoId: "monete", nome: "Moneté", preco: 99.90, precoAntigo: null, estoque: 19, capacidade: "500ml", material: "Aço inox com pintura térmica", dimensoes: "8,5 × 8,5 × 16 cm", cuidados: "Lavar à mão com pano macio.", descricao: "Os nenúfares de Claude Monet em tons de azul e verde, trazendo a leveza do impressionismo para o seu café.", vendidos: 39 },
  { id: "pr10", colecaoId: "athena", nome: "Athenachino", preco: 99.90, precoAntigo: null, estoque: 15, capacidade: "500ml", material: "Cerâmica com acabamento fosco", dimensoes: "9 × 9 × 13 cm", cuidados: "Lavar à mão. Não usar em micro-ondas ou lava-louças.", descricao: "Inspirado n'A Escola de Atenas, de Rafael, um copo que celebra a sabedoria e a harmonia da arte clássica.", vendidos: 31 }
];

var USUARIOS_INICIAIS = [];

var CUPONS_INICIAIS = [
  { codigo: "ARTE10", desconto: 10, ativo: true },
  { codigo: "BEMVINDO15", desconto: 15, ativo: true }
];
