/*
 * cardapio.js
 * -----------------------------------------------------------------------
 * TODOS os dados da lanchonete ficam neste arquivo: preços, itens, horários,
 * número de WhatsApp etc. O dono da lanchonete pode editar só este arquivo
 * (com cuidado para não apagar vírgulas e aspas) sem precisar mexer em
 * app.js, style.css ou index.html.
 *
 * Dica: preços são sempre números (use ponto, não vírgula). Ex: 2.50
 * -----------------------------------------------------------------------
 */

// ============================================================================
// CONFIG — configurações gerais da loja
// ============================================================================
const CONFIG = {
  // Endereço do site em produção (sem "https://", sem barra no final).
  // O site compara isso com o endereço que está sendo acessado agora: se
  // for diferente (ambiente de homologação, preview do Vercel, celular
  // testando local, etc.), mostra um aviso "Ambiente de teste" no topo.
  // Este valor é o mesmo tanto na branch "main" quanto "homolog" (o código é
  // idêntico nos dois ambientes; o que muda é só o endereço de acesso).
  dominioProducao: "www.shalomamburgueria.com.br",

  // Nome da loja (aparece no título da página e na mensagem do WhatsApp)
  nomeLoja: "Shalom Amburgueria",

  // Frase de efeito que aparece embaixo do logo, no topo do site.
  tagline: "Chegou o novo sabor da sua fome",

  // Texto do botão/painel "Quem Somos", no rodapé. Pode usar várias frases
  // (cada item da lista vira um parágrafo).
  sobreLoja: [
    "A Shalom Amburgueria abriu as portas em 2023, no bairro Jundiapeba, em Mogi das Cruzes, com um objetivo simples: servir um lanche de verdade, feito na hora, para quem não abre mão de qualidade.",
    "Cada hambúrguer é preparado com capricho na chapa, no ponto tradicional ou artesanal — porque aqui sabor bom não tem pressa. Shalom é mais que sabor: é qualidade e amor em cada detalhe.",
    "Hoje, além do balcão, você também encontra a gente no iFood e no Instagram. Seja pelo site, pelo delivery ou pelos stories, a missão continua a mesma: matar a sua fome com o melhor lanche da região.",
  ],

  // Endereço e contato, mostrados no botão/painel "Endereço e Contato".
  // O telefone/WhatsApp já vem do campo CONFIG.whatsapp acima.
  endereco: {
    rua: "Rua Luiz Antonio de Oliveira, 601",
    bairro: "Jundiapeba, Mogi das Cruzes - SP",
    referencia: "", // opcional, ex: "Perto da praça central"
  },

  // Link do Instagram da loja (endereço completo, começando com https://).
  // Enquanto ficar vazio (""), o botão "Siga no Instagram" não aparece no
  // rodapé do site — assim que preencher, ele aparece sozinho.
  instagram: "https://www.instagram.com/shalom.lanches11966321857?stkn=a2lmM29tZXRlbHcx",

  // Link da loja no iFood (endereço completo, começando com https://).
  // Mesma lógica do Instagram: enquanto ficar vazio (""), o botão "Peça pelo
  // iFood" não aparece no rodapé.
  ifood: "https://www.ifood.com.br/delivery/mogi-das-cruzes-sp/shallom-lanches-jundiapeba/914d63a4-19b5-45c1-a230-b15542697a0e?UTM_Medium=share",

  // Número de WhatsApp que recebe os pedidos em PRODUÇÃO, no formato
  // DDI+DDD+número, só dígitos (sem espaços, parênteses ou traços).
  whatsapp: "5511966321857",

  // Número usado em qualquer ambiente que NÃO seja a produção (HML/homologação,
  // preview da Vercel, localhost...), para que testes de pedido nunca cheguem
  // na lanchonete por engano.
  whatsappTeste: "5511988430291",

  // Dados do Pix. Quando o cliente escolhe pagar por Pix, ao concluir o
  // pedido o site mostra o QR Code (com o valor do pedido já preenchido) e
  // o botão de copiar. "chave" é a chave Pix da loja (aqui, o CNPJ, só
  // dígitos); "nomeRecebedor" e "cidade" aparecem no app do banco ao pagar
  // (sem acentos; até 25 e 15 caracteres, respectivamente).
  pix: {
    chave: "17354761000144",
    nomeRecebedor: "Shalom Amburgueria",
    cidade: "Mogi das Cruzes",
  },

  // Taxa de entrega, calculada pelo bairro que o cliente digita no pedido:
  // - bairro igual a "bairroLoja" (Jundiapeba): taxa "noBairro";
  // - qualquer outro bairro (vizinhos): taxa "outrosBairros".
  // Retirada no balcão não paga taxa. Valores em reais.
  taxaEntrega: {
    bairroLoja: "Jundiapeba",
    noBairro: 5,
    outrosBairros: 10,
  },

  // Valor mínimo do pedido em reais para liberar a entrega. 0 = sem mínimo.
  // A DEFINIR
  pedidoMinimo: 0,

  // Horário de funcionamento por dia da semana, formato 24h "HH:MM".
  // O site usa isso para mostrar "Aberto agora" / "Fechado" e bloquear o
  // envio do pedido fora do horário. Se "fecha" for igual ou menor que "abre"
  // (ex: "00:00"), o fechamento é na madrugada do dia seguinte.
  // Horário real: todos os dias das 19:30 às 00:00 (meia-noite).
  horarios: {
    dom: { abre: "19:30", fecha: "00:00" },
    seg: { abre: "19:30", fecha: "00:00" },
    ter: { abre: "19:30", fecha: "00:00" },
    qua: { abre: "19:30", fecha: "00:00" },
    qui: { abre: "19:30", fecha: "00:00" },
    sex: { abre: "19:30", fecha: "00:00" },
    sab: { abre: "19:30", fecha: "00:00" },
  },

  // Abertura oficial: em PRODUÇÃO o site fica fechado (não aceita pedidos) até
  // este momento, mesmo dentro do horário acima. Formato ISO com fuso de
  // Brasília. Depois dessa data vale só o horário normal. Deixe "" para não
  // usar. Para ver essa tela de "ainda não abrimos" no HML, acrescente
  // ?lancamento=antes ao endereço.
  lancamento: "2026-10-23T19:30:00-03:00",

  // Fora da produção (HML, preview, localhost...) o site fica aberto 24h,
  // ignorando "horarios" acima, para permitir testar pedidos a qualquer hora.
  // Em produção (CONFIG.dominioProducao) o horário real sempre vale.
  abertoSempreForaDeProducao: true,

  // Quais "linhas" de lanche estão à venda: "tradicional" e/ou "artesanal".
  // Se só houver uma linha ativa aqui, o seletor de linha some do site e
  // todos os preços usam essa linha automaticamente.
  linhasAtivas: ["tradicional", "artesanal"],

  // Rótulos usados no seletor de linha e nas mensagens do WhatsApp.
  rotulosLinha: {
    tradicional: "Tradicional",
    artesanal: "Artesanal",
  },
};

// ============================================================================
// CARDAPIO — todos os itens à venda, organizados por categoria
// ============================================================================
const CARDAPIO = {
  // --------------------------------------------------------------------
  // LANCHES — preço muda conforme a linha (tradicional/artesanal)
  // --------------------------------------------------------------------
  lanches: {
    observacao: "Todos os lanches acompanham ketchup, mostarda e batata palha.",
    itens: [
      {
        id: "x-burguer",
        nome: "X-Burguer",
        emoji: "🍔",
        foto: null, // coloque aqui o caminho de uma foto, ex: "fotos/x-burguer.jpg"
        ingredientes: ["Hambúrguer", "Queijo", "Maionese"],
        precos: { tradicional: 13, artesanal: 20 },
      },
      {
        id: "x-salada",
        nome: "X-Salada",
        emoji: "🍔",
        foto: null,
        ingredientes: ["Hambúrguer", "Queijo", "Alface", "Tomate", "Maionese"],
        precos: { tradicional: 16, artesanal: 23 },
      },
      {
        id: "x-bacon",
        nome: "X-Bacon",
        emoji: "🥓",
        foto: null,
        ingredientes: ["Hambúrguer", "Queijo", "Bacon", "Alface", "Tomate", "Maionese"],
        precos: { tradicional: 20, artesanal: 30 },
      },
      {
        id: "x-egg",
        nome: "X-Egg",
        emoji: "🍳",
        foto: null,
        ingredientes: ["Hambúrguer", "Queijo", "Ovo", "Alface", "Tomate", "Maionese"],
        precos: { tradicional: 20, artesanal: 27 },
      },
      {
        id: "x-frango",
        nome: "X-Frango",
        emoji: "🍗",
        foto: null,
        ingredientes: ["Filé de frango", "Hambúrguer", "Queijo", "Alface", "Tomate", "Maionese"],
        precos: { tradicional: 25, artesanal: 35 },
      },
      {
        id: "x-calabresa",
        nome: "X-Calabresa",
        emoji: "🍖",
        foto: null,
        ingredientes: ["Calabresa fatiada", "Hambúrguer", "Queijo", "Alface", "Tomate", "Maionese"],
        precos: { tradicional: 20, artesanal: 30 },
      },
      {
        id: "x-churrasco",
        nome: "X-Churrasco",
        emoji: "🥩",
        foto: null,
        ingredientes: ["Contra-filé", "Hambúrguer", "Queijo", "Alface", "Tomate", "Maionese"],
        precos: { tradicional: 30, artesanal: 40 },
      },
      {
        id: "x-tudo",
        nome: "X-Tudo",
        emoji: "🍔",
        foto: null,
        ingredientes: [
          "Contra-filé", "Calabresa", "Filé de frango", "Queijo", "Hambúrguer",
          "Presunto", "Ovo", "Bacon", "Alface", "Tomate", "Batata palha",
          "Maionese", "Ketchup", "Mostarda",
        ],
        precos: { tradicional: 35, artesanal: 60 },
      },
      {
        id: "dogao",
        nome: "Dogão",
        emoji: "🌭",
        foto: null,
        ingredientes: [
          "2 salsichas Perdigão", "Bacon", "Maionese", "Ketchup", "Mostarda",
          "Tomate", "Alface", "Purê", "Batata palha", "Queijo parmesão",
        ],
        precos: { tradicional: 22, artesanal: 22 },
      },
    ],
  },

  // --------------------------------------------------------------------
  // COMBO — um combo por linha (Tradicional e Artesanal), sempre visíveis
  // --------------------------------------------------------------------
  combo: {
    // Os dois combos aparecem sempre na seção "Combo", independentes do
    // seletor Tradicional/Artesanal. "linha" decide se ele aparece conforme
    // CONFIG.linhasAtivas.
    itens: [
      {
        id: "combo-especial-tradicional",
        linha: "tradicional",
        nome: "Combo Especial Tradicional",
        emoji: "🎉",
        foto: null,
        descricao: ["2 X-Bacon", "Batata frita", "Cebola onion", "10 coxinhas", "1 refrigerante 2 litros"],
        preco: 80,
      },
      {
        id: "combo-especial-artesanal",
        linha: "artesanal",
        nome: "Combo Especial Artesanal",
        emoji: "🎉",
        foto: null,
        descricao: ["2 X-Bacon Artesanal", "Batata frita", "Cebola onion", "10 coxinhas", "1 refrigerante 2 litros"],
        preco: 100,
      },
    ],
  },

  porcoes: {
    observacao: "Todas as porções acompanham cheddar, catupiry, bacon e queijo parmesão.",
    batataFrita: {
      nome: "Batata Frita",
      emoji: "🍟",
      foto: null,
      tamanhos: [
        { id: "batata-pequena", nome: "Pequena", preco: 15 },
        { id: "batata-media", nome: "Média", preco: 20 },
        { id: "batata-grande", nome: "Grande", preco: 25 },
      ],
    },
    itens: [
      { id: "porcao-churrasco", nome: "Churrasco Contra-filé", emoji: "🥩", foto: null, preco: 60 },
      { id: "porcao-frango", nome: "Frango à Passarinho", emoji: "🍗", foto: null, preco: 35 },
      { id: "porcao-calabresa", nome: "Calabresa", emoji: "🍖", foto: null, preco: 25 },
    ],
  },

  // --------------------------------------------------------------------
  // BEBIDAS — mesmo preço nas duas linhas
  // --------------------------------------------------------------------
  bebidas: {
    itens: [
      {
        id: "dolly-2l",
        nome: "Dolly 2 Litros",
        emoji: "🥤",
        foto: null,
        preco: 10,
        pedirSabor: true, // mostra um campo para o cliente digitar o sabor
      },
      { id: "coca-2l", nome: "Coca-Cola 2 Litros", emoji: "🥤", foto: null, preco: 16 },
      { id: "dolly-350", nome: "Dolly 350ml", emoji: "🥤", foto: null, preco: 4 },
      { id: "coca-lata", nome: "Coca-Cola Lata 350ml", emoji: "🥤", foto: null, preco: 8 },
    ],
  },

  // --------------------------------------------------------------------
  // ADICIONAIS — usados dentro do painel de Lanches e Dogão.
  // Não aparecem como categoria própria no menu.
  // "precoUnico" para itens com mesmo preço nas duas linhas, ou
  // "precos" quando o valor muda por linha (ex: Hambúrguer).
  // --------------------------------------------------------------------
  adicionais: [
    { id: "add-ovo", nome: "Ovo", precoUnico: 2.5 },
    { id: "add-batata-palha", nome: "Batata palha", precoUnico: 3 },
    { id: "add-maionese", nome: "Maionese", precoUnico: 4 },
    { id: "add-queijo", nome: "Queijo", precoUnico: 5 },
    { id: "add-presunto", nome: "Presunto", precoUnico: 4 },
    { id: "add-frango", nome: "Frango", precoUnico: 8 },
    { id: "add-calabresa", nome: "Calabresa", precoUnico: 6 },
    { id: "add-bacon", nome: "Bacon", precoUnico: 6 },
    { id: "add-churrasco", nome: "Churrasco", precoUnico: 12 },
    {
      id: "add-hamburguer",
      // O nome muda um pouco entre linhas ("Hambúrguer" x "Hambúrguer 150g")
      nomePorLinha: { tradicional: "Hambúrguer", artesanal: "Hambúrguer 150g" },
      precos: { tradicional: 5, artesanal: 10 },
    },
  ],
};
