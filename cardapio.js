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
  // Nome da loja (aparece no título da página e na mensagem do WhatsApp)
  nomeLoja: "Shalon Lanches e Porções",

  // Frase de efeito que aparece embaixo do logo, no topo do site.
  tagline: "Chegou o novo sabor da sua fome",

  // Texto do botão/painel "Quem Somos", no rodapé. Pode usar várias frases
  // (cada item da lista vira um parágrafo).
  // A DEFINIR — pedir o texto para o dono da loja.
  sobreLoja: [
    "A Shalon Lanches e Porções nasceu da vontade de servir um lanche de verdade, feito na hora, com ingredientes de qualidade.",
    "// A DEFINIR — complete a história da loja aqui (quando começou, o que torna a Shalon especial, etc.)",
  ],

  // Endereço e contato, mostrados no botão/painel "Endereço e Contato".
  // O telefone/WhatsApp já vem do campo CONFIG.whatsapp acima.
  // A DEFINIR
  endereco: {
    rua: "// A DEFINIR — rua e número",
    bairro: "// A DEFINIR — bairro e cidade",
    referencia: "", // opcional, ex: "Perto da praça central"
  },

  // Número de WhatsApp que vai receber os pedidos, no formato DDI+DDD+número,
  // só dígitos (sem espaços, parênteses ou traços).
  // ⚠️ TESTE — troque pelo número real da lanchonete antes de publicar o site!
  whatsapp: "5511972317186",

  // Taxa de entrega em reais. Deixe "null" se ainda não foi definida
  // (o site vai mostrar "a combinar" nesse caso).
  // A DEFINIR
  taxaEntrega: null,

  // Valor mínimo do pedido em reais para liberar a entrega. 0 = sem mínimo.
  // A DEFINIR
  pedidoMinimo: 0,

  // Horário de funcionamento por dia da semana, formato 24h "HH:MM".
  // O site usa isso para mostrar "Aberto agora" / "Fechado" e bloquear o
  // envio do pedido fora do horário.
  // A DEFINIR — horário abaixo é um exemplo, confirme com o dono da loja.
  //
  // ⚠️ MODO TESTE: horário alargado para 00:00–23:59 todos os dias, só para
  // conseguir testar o envio do pedido a qualquer hora. Troque pelo horário
  // real da loja (como o exemplo comentado abaixo) antes de publicar!
  horarios: {
    dom: { abre: "00:00", fecha: "23:59" },
    seg: { abre: "00:00", fecha: "23:59" },
    ter: { abre: "00:00", fecha: "23:59" },
    qua: { abre: "00:00", fecha: "23:59" },
    qui: { abre: "00:00", fecha: "23:59" },
    sex: { abre: "00:00", fecha: "23:59" },
    sab: { abre: "00:00", fecha: "23:59" },
  },
  // Exemplo de horário real (descomente e ajuste, apagando o bloco acima):
  // horarios: {
  //   dom: { abre: "18:00", fecha: "23:00" },
  //   seg: { abre: "18:00", fecha: "23:00" },
  //   ter: { abre: "18:00", fecha: "23:00" },
  //   qua: { abre: "18:00", fecha: "23:00" },
  //   qui: { abre: "18:00", fecha: "23:00" },
  //   sex: { abre: "18:00", fecha: "23:30" },
  //   sab: { abre: "18:00", fecha: "23:30" },
  // },

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
        precos: { tradicional: 20, artesanal: 25 },
      },
      {
        id: "x-frango",
        nome: "X-Frango",
        emoji: "🍗",
        foto: null,
        ingredientes: ["Filé de frango", "Hambúrguer", "Queijo", "Alface", "Tomate", "Maionese"],
        precos: { tradicional: 25, artesanal: 28 },
      },
      {
        id: "x-calabresa",
        nome: "X-Calabresa",
        emoji: "🌭",
        foto: null,
        ingredientes: ["Calabresa fatiada", "Hambúrguer", "Queijo", "Alface", "Tomate", "Maionese"],
        precos: { tradicional: 20, artesanal: 23 },
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
        precos: { tradicional: 35, artesanal: 50 },
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
  // COMBO — combo especial, preço muda conforme a linha
  // --------------------------------------------------------------------
  combo: {
    itens: [
      {
        id: "combo-especial",
        nome: "Combo Especial",
        emoji: "🎉",
        foto: null,
        descricaoPorLinha: {
          tradicional: ["2 X-Bacon", "Batata frita", "Cebola onion", "10 coxinhas", "1 refrigerante 2 litros"],
          artesanal: ["2 X-Bacon Artesanal", "Batata frita", "Cebola onion", "10 coxinhas", "1 refrigerante 2 litros"],
        },
        precos: { tradicional: 80, artesanal: 100 },
      },
    ],
  },

  // --------------------------------------------------------------------
  // PORÇÕES — mesmo preço nas duas linhas
  // --------------------------------------------------------------------
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
      { id: "porcao-calabresa", nome: "Calabresa", emoji: "🌭", foto: null, preco: 25 },
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
