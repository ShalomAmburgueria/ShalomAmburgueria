/*
 * app.js — lógica do site da Shalon Lanches e Porções
 * -----------------------------------------------------------------------
 * Este arquivo lê os dados de CONFIG e CARDAPIO (definidos em cardapio.js)
 * e cuida de: montar o cardápio na tela, abrir o painel de personalização
 * de cada item, controlar o carrinho (com localStorage) e montar a
 * mensagem final que é enviada para o WhatsApp da loja.
 *
 * Não usa nenhuma biblioteca externa. Todo texto digitado pelo cliente é
 * inserido no HTML usando textContent (nunca innerHTML), para evitar que
 * alguém injete código HTML/JS no site.
 * -----------------------------------------------------------------------
 */

(function () {
  "use strict";

  // =========================================================================
  // ESTADO GERAL
  // =========================================================================
  const CHAVE_CARRINHO = "shalon_carrinho_v1";

  let linhaAtual = CONFIG.linhasAtivas[0]; // "tradicional" ou "artesanal"
  let carrinho = carregarCarrinho(); // array de itens no carrinho
  let painelState = null; // guarda o item sendo personalizado no momento
  let tipoEntregaAtual = "entrega"; // "entrega" ou "retirada"

  // =========================================================================
  // UTILITÁRIOS
  // =========================================================================

  const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function formatarPreco(valor) {
    return formatador.format(valor || 0);
  }

  // Cria um elemento com classe e texto, sem nunca usar innerHTML.
  function criarEl(tag, className, texto) {
    const elemento = document.createElement(tag);
    if (className) elemento.className = className;
    if (texto !== undefined && texto !== null) elemento.textContent = texto;
    return elemento;
  }

  function gerarUid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function gerarCodigoPedido() {
    return "SH" + Date.now().toString(36).toUpperCase().slice(-5);
  }

  function anunciar(mensagem) {
    const area = document.getElementById("anuncio");
    if (area) area.textContent = mensagem;
  }

  // =========================================================================
  // LOCALSTORAGE — persistência do carrinho
  // =========================================================================
  function salvarCarrinho() {
    try {
      localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
    } catch (erro) {
      // localStorage pode falhar em navegação privada ou se estiver cheio.
      // O site continua funcionando, só não vai lembrar o carrinho depois.
      console.warn("Não foi possível salvar o carrinho no localStorage.", erro);
    }
  }

  function carregarCarrinho() {
    try {
      const bruto = localStorage.getItem(CHAVE_CARRINHO);
      if (!bruto) return [];
      const dados = JSON.parse(bruto);
      return Array.isArray(dados) ? dados : [];
    } catch (erro) {
      console.warn("Não foi possível ler o carrinho salvo.", erro);
      return [];
    }
  }

  // =========================================================================
  // HORÁRIO DE FUNCIONAMENTO
  // =========================================================================
  const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

  function horarioDeHoje() {
    const diaChave = DIAS[new Date().getDay()];
    return CONFIG.horarios[diaChave] || null;
  }

  function estaAberto() {
    const horario = horarioDeHoje();
    if (!horario) return false;
    const agora = new Date();
    const horaAtual = String(agora.getHours()).padStart(2, "0") + ":" + String(agora.getMinutes()).padStart(2, "0");
    return horaAtual >= horario.abre && horaAtual <= horario.fecha;
  }

  function atualizarStatusLoja() {
    const status = document.getElementById("status-loja");
    const texto = status.querySelector(".status-loja__texto");
    const horario = horarioDeHoje();
    const aberto = estaAberto();

    status.classList.toggle("status-loja--aberto", aberto);
    status.classList.toggle("status-loja--fechado", !aberto);

    if (aberto) {
      texto.textContent = horario ? `Aberto agora · fecha às ${horario.fecha}` : "Aberto agora";
    } else if (horario) {
      texto.textContent = `Fechado agora · abre às ${horario.abre}`;
    } else {
      texto.textContent = "Fechado hoje";
    }

    atualizarAvisoFechado(aberto, horario);
  }

  function atualizarAvisoFechado(aberto, horario) {
    const aviso = document.getElementById("aviso-fechado");
    const btnEnviar = document.getElementById("btn-enviar-whatsapp");
    if (!aviso || !btnEnviar) return;

    if (aberto) {
      aviso.hidden = true;
      btnEnviar.disabled = false;
    } else {
      aviso.hidden = false;
      aviso.textContent = horario
        ? `A loja está fechada no momento. Horário de hoje: ${horario.abre} às ${horario.fecha}. Você poderá enviar o pedido quando abrirmos.`
        : "A loja está fechada hoje. Volte em outro dia para fazer seu pedido.";
      btnEnviar.disabled = true;
    }
  }

  // =========================================================================
  // ADICIONAIS — funções auxiliares para resolver nome/preço por linha
  // =========================================================================
  function nomeAdicional(adicional) {
    return adicional.nomePorLinha ? adicional.nomePorLinha[linhaAtual] : adicional.nome;
  }

  function precoAdicional(adicional) {
    return adicional.precoUnico !== undefined ? adicional.precoUnico : adicional.precos[linhaAtual];
  }

  // =========================================================================
  // NORMALIZAÇÃO DE ITENS — traduz qualquer item do CARDAPIO para um
  // formato único que o painel de personalização sabe desenhar.
  // =========================================================================
  function obterDadosItem(categoria, refId) {
    if (categoria === "lanches") {
      const item = CARDAPIO.lanches.itens.find((i) => i.id === refId);
      return {
        categoria, refId,
        nome: item.nome, emoji: item.emoji, foto: item.foto,
        precoBase: item.precos[linhaAtual],
        temLinha: true,
        ingredientes: item.ingredientes.slice(),
        permiteAdicionais: true,
        temSabor: false,
        listaFixa: null,
      };
    }
    if (categoria === "combo") {
      const item = CARDAPIO.combo.itens.find((i) => i.id === refId);
      return {
        categoria, refId,
        nome: item.nome, emoji: item.emoji, foto: item.foto,
        precoBase: item.precos[linhaAtual],
        temLinha: true,
        ingredientes: [],
        permiteAdicionais: false,
        temSabor: false,
        listaFixa: item.descricaoPorLinha[linhaAtual],
      };
    }
    if (categoria === "porcoes-batata") {
      const bloco = CARDAPIO.porcoes.batataFrita;
      const tamanho = bloco.tamanhos.find((t) => t.id === refId);
      return {
        categoria, refId,
        nome: `${bloco.nome} — ${tamanho.nome}`, emoji: bloco.emoji, foto: bloco.foto,
        precoBase: tamanho.preco,
        temLinha: false,
        ingredientes: [],
        permiteAdicionais: false,
        temSabor: false,
        listaFixa: null,
      };
    }
    if (categoria === "porcoes-item") {
      const item = CARDAPIO.porcoes.itens.find((i) => i.id === refId);
      return {
        categoria, refId,
        nome: item.nome, emoji: item.emoji, foto: item.foto,
        precoBase: item.preco,
        temLinha: false,
        ingredientes: [],
        permiteAdicionais: false,
        temSabor: false,
        listaFixa: null,
      };
    }
    if (categoria === "bebidas") {
      const item = CARDAPIO.bebidas.itens.find((i) => i.id === refId);
      return {
        categoria, refId,
        nome: item.nome, emoji: item.emoji, foto: item.foto,
        precoBase: item.preco,
        temLinha: false,
        ingredientes: [],
        permiteAdicionais: false,
        temSabor: !!item.pedirSabor,
        listaFixa: null,
      };
    }
    return null;
  }

  // =========================================================================
  // MONTAGEM DO CARDÁPIO NA TELA
  // =========================================================================
  function criarIconeItem(dados, tamanhoClasse) {
    const icone = criarEl("div", tamanhoClasse);
    if (dados.foto) {
      const img = document.createElement("img");
      img.src = dados.foto;
      img.alt = "";
      icone.appendChild(img);
    } else {
      icone.textContent = dados.emoji || "🍽️";
      icone.setAttribute("aria-hidden", "true");
    }
    return icone;
  }

  function criarCartaoItem(dados, opcoes) {
    opcoes = opcoes || {};
    const cartao = criarEl("button", "cartao-item" + (opcoes.destaque ? " cartao-combo" : ""));
    cartao.type = "button";
    cartao.setAttribute("aria-label", `${dados.nome}, ${formatarPreco(dados.precoBase)}. Toque para personalizar e adicionar.`);

    cartao.appendChild(criarIconeItem(dados, "cartao-item__icone"));

    const corpo = criarEl("div", "cartao-item__corpo");
    corpo.appendChild(criarEl("p", "cartao-item__nome", dados.nome));

    if (dados.ingredientes.length) {
      corpo.appendChild(criarEl("p", "cartao-item__ingredientes", dados.ingredientes.join(", ")));
    } else if (dados.listaFixa) {
      const lista = criarEl("ul", "cartao-item__lista");
      dados.listaFixa.forEach((linha) => lista.appendChild(criarEl("li", null, linha)));
      corpo.appendChild(lista);
    }
    cartao.appendChild(corpo);

    const direita = criarEl("div", "cartao-item__direita");
    direita.appendChild(criarEl("span", "etiqueta-preco", formatarPreco(dados.precoBase)));
    const botaoAdd = criarEl("span", "botao-add", "+");
    botaoAdd.setAttribute("aria-hidden", "true");
    direita.appendChild(botaoAdd);
    cartao.appendChild(direita);

    cartao.addEventListener("click", () => abrirPainelItem(dados.categoria, dados.refId, null));
    return cartao;
  }

  function renderizarCardapio() {
    // Lanches
    document.getElementById("obs-lanches").textContent = CARDAPIO.lanches.observacao || "";
    const gradeLanches = document.getElementById("grade-lanches");
    gradeLanches.replaceChildren();
    CARDAPIO.lanches.itens.forEach((item) => {
      gradeLanches.appendChild(criarCartaoItem(obterDadosItem("lanches", item.id)));
    });

    // Combo
    const gradeCombo = document.getElementById("grade-combo");
    gradeCombo.replaceChildren();
    CARDAPIO.combo.itens.forEach((item) => {
      gradeCombo.appendChild(criarCartaoItem(obterDadosItem("combo", item.id), { destaque: true }));
    });

    // Porções
    document.getElementById("obs-porcoes").textContent = CARDAPIO.porcoes.observacao || "";
    const gradePorcoes = document.getElementById("grade-porcoes");
    gradePorcoes.replaceChildren();

    const blocoBatata = CARDAPIO.porcoes.batataFrita;
    const bloco = criarEl("div", "bloco-batata");
    const cabecalho = criarEl("div", "bloco-batata__cabecalho");
    cabecalho.appendChild(criarIconeItem({ emoji: blocoBatata.emoji, foto: blocoBatata.foto }, "cartao-item__icone"));
    cabecalho.appendChild(criarEl("span", "bloco-batata__nome", blocoBatata.nome));
    bloco.appendChild(cabecalho);

    const opcoesTamanho = criarEl("div", "bloco-batata__opcoes");
    blocoBatata.tamanhos.forEach((tamanho) => {
      const linha = criarEl("button", "opcao-tamanho");
      linha.type = "button";
      linha.setAttribute("aria-label", `${blocoBatata.nome} ${tamanho.nome}, ${formatarPreco(tamanho.preco)}. Toque para adicionar.`);
      linha.appendChild(criarEl("span", "opcao-tamanho__nome", tamanho.nome));
      linha.appendChild(criarEl("span", "etiqueta-preco", formatarPreco(tamanho.preco)));
      linha.addEventListener("click", () => abrirPainelItem("porcoes-batata", tamanho.id, null));
      opcoesTamanho.appendChild(linha);
    });
    bloco.appendChild(opcoesTamanho);
    gradePorcoes.appendChild(bloco);

    CARDAPIO.porcoes.itens.forEach((item) => {
      gradePorcoes.appendChild(criarCartaoItem(obterDadosItem("porcoes-item", item.id)));
    });

    // Bebidas
    const gradeBebidas = document.getElementById("grade-bebidas");
    gradeBebidas.replaceChildren();
    CARDAPIO.bebidas.itens.forEach((item) => {
      gradeBebidas.appendChild(criarCartaoItem(obterDadosItem("bebidas", item.id)));
    });
  }

  // =========================================================================
  // SELETOR DE LINHA (Tradicional / Artesanal)
  // =========================================================================
  function configurarSeletorLinha() {
    const seletor = document.getElementById("seletor-linha");
    if (CONFIG.linhasAtivas.length < 2) {
      seletor.hidden = true;
      return;
    }
    // Mostra só os botões das linhas ativas
    Array.from(seletor.querySelectorAll(".seletor-linha__btn")).forEach((botao) => {
      const linha = botao.dataset.linha;
      if (!CONFIG.linhasAtivas.includes(linha)) {
        botao.remove();
        return;
      }
      botao.textContent = CONFIG.rotulosLinha[linha] || linha;
      botao.addEventListener("click", () => {
        linhaAtual = linha;
        Array.from(seletor.querySelectorAll(".seletor-linha__btn")).forEach((b) => {
          b.setAttribute("aria-checked", String(b.dataset.linha === linhaAtual));
        });
        renderizarCardapio();
      });
    });
  }

  // =========================================================================
  // MENU DE CATEGORIAS + DESTAQUE DA SEÇÃO VISÍVEL
  // =========================================================================
  function configurarMenuCategorias() {
    const botoes = Array.from(document.querySelectorAll(".menu-categorias__btn"));
    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    botoes.forEach((botao) => {
      botao.addEventListener("click", () => {
        const secao = document.getElementById(botao.dataset.categoria);
        if (secao) secao.scrollIntoView({ behavior: reduzMovimento ? "auto" : "smooth", block: "start" });
      });
    });

    const secoes = botoes
      .map((b) => document.getElementById(b.dataset.categoria))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          botoes.forEach((botao) => {
            botao.setAttribute("aria-current", String(botao.dataset.categoria === entrada.target.id));
          });
        });
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );
    secoes.forEach((secao) => observer.observe(secao));
  }

  // =========================================================================
  // PAINEL DE PERSONALIZAÇÃO DE ITEM (bottom sheet)
  // =========================================================================
  function mostrarPainel(idPainel, idOverlay) {
    document.getElementById(idOverlay).hidden = false;
    document.getElementById(idPainel).hidden = false;
    document.body.style.overflow = "hidden";
  }

  function esconderPainel(idPainel, idOverlay) {
    document.getElementById(idOverlay).hidden = true;
    document.getElementById(idPainel).hidden = true;
    if (
      document.getElementById("painel-item").hidden &&
      document.getElementById("painel-carrinho").hidden &&
      document.getElementById("painel-checkout").hidden &&
      document.getElementById("painel-info").hidden
    ) {
      document.body.style.overflow = "";
    }
  }

  function abrirPainelItem(categoria, refId, itemExistente) {
    const dados = obterDadosItem(categoria, refId);
    if (!dados) return;

    painelState = {
      dados,
      removidos: new Set(itemExistente ? itemExistente.removidos : []),
      adicionaisSelecionados: new Map((itemExistente ? itemExistente.adicionais : []).map((a) => [a.id, a])),
      observacao: itemExistente ? itemExistente.observacao : "",
      sabor: itemExistente ? itemExistente.sabor || "" : "",
      quantidade: itemExistente ? itemExistente.quantidade : 1,
      edicaoUid: itemExistente ? itemExistente.uid : null,
    };

    renderizarPainelItem();
    mostrarPainel("painel-item", "overlay-item");
  }

  function renderizarPainelItem() {
    const { dados } = painelState;

    const iconeContainer = document.getElementById("painel-item-icone");
    iconeContainer.replaceChildren();
    if (dados.foto) {
      const img = document.createElement("img");
      img.src = dados.foto;
      img.alt = "";
      iconeContainer.appendChild(img);
    } else {
      iconeContainer.textContent = dados.emoji || "🍽️";
    }
    document.getElementById("painel-item-nome").textContent = dados.nome;
    document.getElementById("painel-item-preco-base").textContent = `A partir de ${formatarPreco(dados.precoBase)}`;

    const corpo = document.getElementById("painel-item-corpo");
    corpo.replaceChildren();

    // Lista fixa (combo)
    if (dados.listaFixa) {
      const grupo = criarEl("div", "grupo-painel");
      grupo.appendChild(criarEl("p", "grupo-painel__titulo", "O que vem no combo"));
      const lista = criarEl("ul", "cartao-item__lista");
      dados.listaFixa.forEach((linha) => lista.appendChild(criarEl("li", null, linha)));
      grupo.appendChild(lista);
      corpo.appendChild(grupo);
    }

    // Sabor (ex: Dolly 2 litros)
    if (dados.temSabor) {
      const grupo = criarEl("div", "grupo-painel");
      grupo.appendChild(criarEl("p", "grupo-painel__titulo", "Qual sabor você quer?"));
      const input = document.createElement("input");
      input.type = "text";
      input.className = "campo-texto";
      input.placeholder = "Ex: Guaraná, Laranja, Uva…";
      input.maxLength = 40;
      input.value = painelState.sabor;
      input.setAttribute("aria-label", "Sabor do refrigerante");
      input.addEventListener("input", () => {
        painelState.sabor = input.value;
      });
      grupo.appendChild(input);
      corpo.appendChild(grupo);
    }

    // Ingredientes removíveis
    if (dados.ingredientes.length) {
      const grupo = criarEl("div", "grupo-painel");
      grupo.appendChild(criarEl("p", "grupo-painel__titulo", "Retirar algum ingrediente? (opcional)"));
      dados.ingredientes.forEach((ingrediente) => {
        const label = criarEl("label", "opcao-check");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = painelState.removidos.has(ingrediente);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) painelState.removidos.add(ingrediente);
          else painelState.removidos.delete(ingrediente);
        });
        label.appendChild(checkbox);
        label.appendChild(criarEl("span", "opcao-check__nome", `Sem ${ingrediente}`));
        grupo.appendChild(label);
      });
      corpo.appendChild(grupo);
    }

    // Adicionais
    if (dados.permiteAdicionais) {
      const grupo = criarEl("div", "grupo-painel");
      grupo.appendChild(criarEl("p", "grupo-painel__titulo", "Adicionais"));
      CARDAPIO.adicionais.forEach((adicional) => {
        const nome = nomeAdicional(adicional);
        const preco = precoAdicional(adicional);
        const label = criarEl("label", "opcao-check");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = painelState.adicionaisSelecionados.has(adicional.id);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            painelState.adicionaisSelecionados.set(adicional.id, { id: adicional.id, nome, preco });
          } else {
            painelState.adicionaisSelecionados.delete(adicional.id);
          }
          atualizarTotalPainel();
        });
        label.appendChild(checkbox);
        label.appendChild(criarEl("span", "opcao-check__nome", nome));
        label.appendChild(criarEl("span", "opcao-check__preco", `+ ${formatarPreco(preco)}`));
        grupo.appendChild(label);
      });
      corpo.appendChild(grupo);
    }

    // Observação do item
    const grupoObs = criarEl("div", "grupo-painel");
    grupoObs.appendChild(criarEl("p", "grupo-painel__titulo", "Observação do item (opcional)"));
    const textarea = document.createElement("textarea");
    textarea.className = "campo-texto";
    textarea.rows = 2;
    textarea.maxLength = 200;
    textarea.placeholder = "Ex: bem passado, cortar ao meio…";
    textarea.value = painelState.observacao;
    textarea.setAttribute("aria-label", "Observação do item");
    textarea.addEventListener("input", () => {
      painelState.observacao = textarea.value;
    });
    grupoObs.appendChild(textarea);
    corpo.appendChild(grupoObs);

    document.getElementById("painel-item-qtd").textContent = painelState.quantidade;
    atualizarTotalPainel();
  }

  function calcularPrecoUnitarioPainel() {
    let total = painelState.dados.precoBase;
    painelState.adicionaisSelecionados.forEach((a) => (total += a.preco));
    return total;
  }

  function atualizarTotalPainel() {
    const unitario = calcularPrecoUnitarioPainel();
    const total = unitario * painelState.quantidade;
    const spanTotal = document.getElementById("painel-item-total");
    spanTotal.textContent = formatarPreco(total);
    const botaoConfirmar = document.getElementById("painel-item-confirmar");
    botaoConfirmar.childNodes[0].textContent = painelState.edicaoUid ? "Salvar · " : "Adicionar · ";
  }

  function fecharPainelItem() {
    painelState = null;
    esconderPainel("painel-item", "overlay-item");
  }

  function confirmarPainelItem() {
    const unitario = calcularPrecoUnitarioPainel();
    const itemCarrinho = {
      uid: painelState.edicaoUid || gerarUid(),
      categoria: painelState.dados.categoria,
      refId: painelState.dados.refId,
      nome: painelState.dados.nome,
      linha: painelState.dados.temLinha ? linhaAtual : null,
      precoUnitario: unitario,
      quantidade: painelState.quantidade,
      removidos: Array.from(painelState.removidos),
      adicionais: Array.from(painelState.adicionaisSelecionados.values()),
      observacao: painelState.observacao.trim(),
      sabor: painelState.dados.temSabor ? painelState.sabor.trim() : null,
      emoji: painelState.dados.emoji,
      foto: painelState.dados.foto,
      listaFixa: painelState.dados.listaFixa,
    };

    if (painelState.edicaoUid) {
      const indice = carrinho.findIndex((i) => i.uid === painelState.edicaoUid);
      if (indice !== -1) carrinho[indice] = itemCarrinho;
    } else {
      carrinho.push(itemCarrinho);
    }

    salvarCarrinho();
    renderizarBarraCarrinho();
    anunciar(`${itemCarrinho.nome} adicionado ao carrinho.`);
    fecharPainelItem();

    if (!document.getElementById("painel-carrinho").hidden) {
      renderizarCarrinho();
    }
  }

  // =========================================================================
  // CARRINHO
  // =========================================================================
  function calcularSubtotal() {
    return carrinho.reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0);
  }

  function calcularTotalItens() {
    return carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  }

  function renderizarBarraCarrinho() {
    const barra = document.getElementById("barra-carrinho");
    const qtd = calcularTotalItens();
    if (qtd === 0) {
      barra.hidden = true;
      return;
    }
    barra.hidden = false;
    document.getElementById("barra-carrinho-qtd").textContent = qtd;
    document.getElementById("barra-carrinho-total").textContent = formatarPreco(calcularSubtotal());
  }

  function detalhesItemCarrinho(item) {
    const partes = [];
    if (item.sabor) partes.push(`Sabor: ${item.sabor}`);
    if (item.adicionais.length) partes.push(`+ ${item.adicionais.map((a) => a.nome).join(", ")}`);
    if (item.removidos.length) partes.push(`Sem ${item.removidos.join(", ")}`);
    return partes;
  }

  function renderizarCarrinho() {
    const lista = document.getElementById("lista-carrinho");
    lista.replaceChildren();

    if (carrinho.length === 0) {
      lista.appendChild(criarEl("p", "carrinho-vazio", "Seu carrinho está vazio. Toque em um item do cardápio para começar 🍔"));
    } else {
      carrinho.forEach((item) => {
        const linha = criarEl("div", "item-carrinho");
        linha.appendChild(criarIconeItem(item, "item-carrinho__icone"));

        const corpo = criarEl("div", "item-carrinho__corpo");
        const nomeLinha = item.linha ? ` (${CONFIG.rotulosLinha[item.linha]})` : "";
        corpo.appendChild(criarEl("p", "item-carrinho__nome", `${item.nome}${nomeLinha}`));

        detalhesItemCarrinho(item).forEach((texto) => corpo.appendChild(criarEl("p", "item-carrinho__detalhe", texto)));
        if (item.observacao) corpo.appendChild(criarEl("p", "item-carrinho__detalhe", `Obs: ${item.observacao}`));

        const acoes = criarEl("div", "item-carrinho__acoes");
        const stepper = criarEl("div", "stepper");
        const btnMenos = criarEl("button", "stepper__btn", "−");
        btnMenos.type = "button";
        btnMenos.setAttribute("aria-label", `Diminuir quantidade de ${item.nome}`);
        const valorQtd = criarEl("span", "stepper__valor", item.quantidade);
        const btnMais = criarEl("button", "stepper__btn", "+");
        btnMais.type = "button";
        btnMais.setAttribute("aria-label", `Aumentar quantidade de ${item.nome}`);

        btnMenos.addEventListener("click", () => alterarQuantidadeCarrinho(item.uid, -1));
        btnMais.addEventListener("click", () => alterarQuantidadeCarrinho(item.uid, 1));
        stepper.append(btnMenos, valorQtd, btnMais);
        acoes.appendChild(stepper);

        const btnEditar = criarEl("button", "link-acao", "Editar");
        btnEditar.type = "button";
        btnEditar.addEventListener("click", () => abrirPainelItem(item.categoria, item.refId, item));
        acoes.appendChild(btnEditar);

        const btnRemover = criarEl("button", "link-acao link-acao--remover", "Remover");
        btnRemover.type = "button";
        btnRemover.addEventListener("click", () => removerItemCarrinho(item.uid));
        acoes.appendChild(btnRemover);

        corpo.appendChild(acoes);
        linha.appendChild(corpo);
        linha.appendChild(criarEl("span", "item-carrinho__preco", formatarPreco(item.precoUnitario * item.quantidade)));
        lista.appendChild(linha);
      });
    }

    atualizarResumoValores();
  }

  function alterarQuantidadeCarrinho(uid, delta) {
    const item = carrinho.find((i) => i.uid === uid);
    if (!item) return;
    item.quantidade = Math.max(1, item.quantidade + delta);
    salvarCarrinho();
    renderizarCarrinho();
    renderizarBarraCarrinho();
  }

  function removerItemCarrinho(uid) {
    carrinho = carrinho.filter((i) => i.uid !== uid);
    salvarCarrinho();
    renderizarCarrinho();
    renderizarBarraCarrinho();
  }

  function atualizarResumoValores() {
    const subtotal = calcularSubtotal();
    document.getElementById("carrinho-subtotal").textContent = formatarPreco(subtotal);
    document.getElementById("carrinho-taxa").textContent =
      CONFIG.taxaEntrega === null ? "a combinar" : formatarPreco(CONFIG.taxaEntrega);
    const taxaSomavel = CONFIG.taxaEntrega === null ? 0 : CONFIG.taxaEntrega;
    document.getElementById("carrinho-total").textContent = formatarPreco(subtotal + taxaSomavel);

    const avisoMinimo = document.getElementById("carrinho-aviso-minimo");
    const btnCheckout = document.getElementById("btn-ir-checkout");
    if (CONFIG.pedidoMinimo > 0 && subtotal < CONFIG.pedidoMinimo && carrinho.length > 0) {
      avisoMinimo.hidden = false;
      avisoMinimo.textContent = `Pedido mínimo de ${formatarPreco(CONFIG.pedidoMinimo)}. Faltam ${formatarPreco(CONFIG.pedidoMinimo - subtotal)}.`;
      btnCheckout.disabled = true;
    } else {
      avisoMinimo.hidden = true;
      btnCheckout.disabled = carrinho.length === 0;
    }
  }

  function abrirCarrinho() {
    renderizarCarrinho();
    mostrarPainel("painel-carrinho", "overlay-carrinho");
  }

  function fecharCarrinho() {
    esconderPainel("painel-carrinho", "overlay-carrinho");
  }

  // =========================================================================
  // FINALIZAÇÃO DO PEDIDO (checkout)
  // =========================================================================
  function abrirCheckout() {
    fecharCarrinho();
    document.getElementById("checkout-total").textContent = document.getElementById("carrinho-total").textContent;
    document.getElementById("checkout-formulario").hidden = false;
    document.getElementById("checkout-sucesso").hidden = true;
    mostrarPainel("painel-checkout", "overlay-checkout");
    atualizarStatusLoja();
  }

  function fecharCheckout() {
    esconderPainel("painel-checkout", "overlay-checkout");
  }

  // =========================================================================
  // PAINEL INFORMATIVO — "Quem Somos" e "Endereço e Contato"
  // =========================================================================
  function abrirPainelInfo(titulo, paragrafos) {
    document.getElementById("info-titulo").textContent = titulo;
    const corpo = document.getElementById("info-corpo");
    corpo.replaceChildren();
    paragrafos.forEach((texto) => {
      if (texto) corpo.appendChild(criarEl("p", "info-paragrafo", texto));
    });
    mostrarPainel("painel-info", "overlay-info");
  }

  function fecharPainelInfo() {
    esconderPainel("painel-info", "overlay-info");
  }

  function abrirQuemSomos() {
    abrirPainelInfo("Quem Somos", CONFIG.sobreLoja);
  }

  function abrirEndereco() {
    const endereco = CONFIG.endereco;
    const linhaEndereco = [endereco.rua, endereco.bairro].filter(Boolean).join(" — ");
    const paragrafos = [linhaEndereco, endereco.referencia, `📞 WhatsApp: ${CONFIG.whatsapp}`];
    abrirPainelInfo("Endereço e Contato", paragrafos);
  }

  function configurarTipoEntrega() {
    const btnEntrega = document.getElementById("opcao-entrega");
    const btnRetirada = document.getElementById("opcao-retirada");
    const camposEndereco = document.getElementById("campos-endereco");

    function selecionar(tipo) {
      tipoEntregaAtual = tipo;
      btnEntrega.setAttribute("aria-pressed", String(tipo === "entrega"));
      btnRetirada.setAttribute("aria-pressed", String(tipo === "retirada"));
      camposEndereco.hidden = tipo !== "entrega";
      camposEndereco.style.display = tipo === "entrega" ? "" : "none";
    }

    btnEntrega.addEventListener("click", () => selecionar("entrega"));
    btnRetirada.addEventListener("click", () => selecionar("retirada"));
    selecionar("entrega");
  }

  function configurarPagamento() {
    const radios = Array.from(document.querySelectorAll('input[name="pagamento"]'));
    const campoTroco = document.getElementById("campo-troco");
    radios.forEach((radio) => {
      radio.addEventListener("change", () => {
        campoTroco.hidden = radio.value !== "Dinheiro";
      });
    });
  }

  function mostrarErro(idSpan, mensagem) {
    const span = document.getElementById(idSpan);
    if (span) span.textContent = mensagem || "";
  }

  function validarCheckout() {
    let valido = true;
    let primeiroInvalido = null;

    function marcarErro(idCampo, idErro, mensagem) {
      mostrarErro(idErro, mensagem);
      if (mensagem && !primeiroInvalido) primeiroInvalido = document.getElementById(idCampo);
      if (mensagem) valido = false;
    }

    const nome = document.getElementById("cliente-nome").value.trim();
    marcarErro("cliente-nome", "erro-nome", nome ? "" : "Informe seu nome.");

    const telefone = document.getElementById("cliente-telefone").value.trim();
    const digitos = telefone.replace(/\D/g, "");
    marcarErro("cliente-telefone", "erro-telefone", digitos.length >= 10 ? "" : "Informe um telefone válido com DDD.");

    if (tipoEntregaAtual === "entrega") {
      const rua = document.getElementById("endereco-rua").value.trim();
      marcarErro("endereco-rua", "erro-rua", rua ? "" : "Informe a rua.");
      const numero = document.getElementById("endereco-numero").value.trim();
      marcarErro("endereco-numero", "erro-numero", numero ? "" : "Informe o número.");
      const bairro = document.getElementById("endereco-bairro").value.trim();
      marcarErro("endereco-bairro", "erro-bairro", bairro ? "" : "Informe o bairro.");
    } else {
      mostrarErro("erro-rua", "");
      mostrarErro("erro-numero", "");
      mostrarErro("erro-bairro", "");
    }

    const pagamento = document.querySelector('input[name="pagamento"]:checked');
    mostrarErro("erro-pagamento", pagamento ? "" : "Escolha a forma de pagamento.");
    if (!pagamento) {
      valido = false;
      if (!primeiroInvalido) primeiroInvalido = document.querySelector('input[name="pagamento"]');
    }

    if (primeiroInvalido) primeiroInvalido.focus();
    return valido;
  }

  function coletarDadosCheckout() {
    const pagamento = document.querySelector('input[name="pagamento"]:checked');
    return {
      nome: document.getElementById("cliente-nome").value.trim(),
      telefone: document.getElementById("cliente-telefone").value.trim(),
      tipo: tipoEntregaAtual,
      rua: document.getElementById("endereco-rua").value.trim(),
      numero: document.getElementById("endereco-numero").value.trim(),
      bairro: document.getElementById("endereco-bairro").value.trim(),
      complemento: document.getElementById("endereco-complemento").value.trim(),
      pagamento: pagamento ? pagamento.value : "",
      troco: document.getElementById("cliente-troco").value.trim(),
      observacoes: document.getElementById("observacoes-gerais").value.trim(),
    };
  }

  // =========================================================================
  // MONTAGEM DA MENSAGEM E ENVIO PARA O WHATSAPP
  // =========================================================================
  function montarMensagemWhatsApp(dadosCliente) {
    const subtotal = calcularSubtotal();
    const taxa = CONFIG.taxaEntrega === null ? null : CONFIG.taxaEntrega;
    const taxaAplicada = dadosCliente.tipo === "entrega" ? taxa : 0;
    const total = subtotal + (taxaAplicada || 0);
    const codigo = gerarCodigoPedido();

    const linhas = [];
    linhas.push(`🍔 *NOVO PEDIDO – ${CONFIG.nomeLoja}* (#${codigo})`);
    linhas.push("");
    linhas.push(`👤 ${dadosCliente.nome}`);
    linhas.push(`📞 ${dadosCliente.telefone}`);

    if (dadosCliente.tipo === "entrega") {
      linhas.push("🛵 Entrega");
      let endereco = `${dadosCliente.rua}, ${dadosCliente.numero} — ${dadosCliente.bairro}`;
      if (dadosCliente.complemento) endereco += ` (${dadosCliente.complemento})`;
      linhas.push(`📍 ${endereco}`);
    } else {
      linhas.push("🏪 Retirada no balcão");
    }

    linhas.push("");
    linhas.push("*Itens:*");
    carrinho.forEach((item) => {
      const sufixoLinha = item.linha ? ` (${CONFIG.rotulosLinha[item.linha]})` : "";
      linhas.push(`${item.quantidade}x ${item.nome}${sufixoLinha} — ${formatarPreco(item.precoUnitario * item.quantidade)}`);
      if (item.sabor) linhas.push(`   🥤 Sabor: ${item.sabor}`);
      if (item.adicionais.length) linhas.push(`   ➕ ${item.adicionais.map((a) => a.nome).join(", ")}`);
      if (item.removidos.length) linhas.push(`   ➖ Sem ${item.removidos.join(", ")}`);
      if (item.observacao) linhas.push(`   📝 ${item.observacao}`);
    });

    linhas.push("");
    linhas.push(`Subtotal: ${formatarPreco(subtotal)}`);
    linhas.push(`Taxa de entrega: ${dadosCliente.tipo === "entrega" ? (taxa === null ? "a combinar" : formatarPreco(taxa)) : "—"}`);
    linhas.push(`*Total: ${formatarPreco(total)}*`);

    linhas.push("");
    let linhaPagamento = `💳 ${dadosCliente.pagamento}`;
    if (dadosCliente.pagamento === "Dinheiro" && dadosCliente.troco) {
      linhaPagamento += ` (troco para R$ ${dadosCliente.troco})`;
    }
    linhas.push(linhaPagamento);

    if (dadosCliente.observacoes) {
      linhas.push(`📝 Observações: ${dadosCliente.observacoes}`);
    }

    return linhas.join("\n");
  }

  function enviarPedidoWhatsApp(event) {
    event.preventDefault();
    if (!estaAberto()) return;
    if (!validarCheckout()) return;

    const dadosCliente = coletarDadosCheckout();
    const mensagem = montarMensagemWhatsApp(dadosCliente);
    const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;

    const novaAba = window.open(url, "_blank");
    if (!novaAba) window.location.href = url;

    // O pedido foi montado e o WhatsApp foi aberto com o texto pronto — essa
    // parte é automática. A partir daqui falta só o cliente tocar em
    // "enviar" dentro do WhatsApp, e quem confirma que a loja RECEBEU é um
    // atendente humano respondendo por lá (isso não dá para automatizar
    // sem backend/API paga do WhatsApp Business).
    carrinho = [];
    salvarCarrinho();
    renderizarBarraCarrinho();
    document.getElementById("form-checkout").reset();
    configurarTipoEntrega();
    document.getElementById("campo-troco").hidden = true;
    anunciar("Pedido enviado para o WhatsApp!");

    document.getElementById("checkout-formulario").hidden = true;
    document.getElementById("checkout-sucesso").hidden = false;
  }

  // =========================================================================
  // INICIALIZAÇÃO
  // =========================================================================
  function configurarEventosPaineis() {
    document.getElementById("fechar-painel-item").addEventListener("click", fecharPainelItem);
    document.getElementById("overlay-item").addEventListener("click", fecharPainelItem);

    document.getElementById("painel-item-menos").addEventListener("click", () => {
      painelState.quantidade = Math.max(1, painelState.quantidade - 1);
      document.getElementById("painel-item-qtd").textContent = painelState.quantidade;
      atualizarTotalPainel();
    });
    document.getElementById("painel-item-mais").addEventListener("click", () => {
      painelState.quantidade += 1;
      document.getElementById("painel-item-qtd").textContent = painelState.quantidade;
      atualizarTotalPainel();
    });
    document.getElementById("painel-item-confirmar").addEventListener("click", confirmarPainelItem);

    document.getElementById("barra-carrinho").addEventListener("click", abrirCarrinho);
    document.getElementById("fechar-painel-carrinho").addEventListener("click", fecharCarrinho);
    document.getElementById("overlay-carrinho").addEventListener("click", fecharCarrinho);
    document.getElementById("btn-ir-checkout").addEventListener("click", abrirCheckout);

    document.getElementById("fechar-painel-checkout").addEventListener("click", fecharCheckout);
    document.getElementById("overlay-checkout").addEventListener("click", fecharCheckout);
    document.getElementById("form-checkout").addEventListener("submit", enviarPedidoWhatsApp);
    document.getElementById("btn-novo-pedido").addEventListener("click", fecharCheckout);

    document.getElementById("fechar-painel-info").addEventListener("click", fecharPainelInfo);
    document.getElementById("overlay-info").addEventListener("click", fecharPainelInfo);
    document.getElementById("btn-quem-somos").addEventListener("click", abrirQuemSomos);
    document.getElementById("btn-endereco").addEventListener("click", abrirEndereco);
  }

  function iniciar() {
    document.getElementById("tagline").textContent = CONFIG.tagline || "";
    configurarSeletorLinha();
    renderizarCardapio();
    configurarMenuCategorias();
    configurarTipoEntrega();
    configurarPagamento();
    configurarEventosPaineis();
    renderizarBarraCarrinho();
    atualizarStatusLoja();
    setInterval(atualizarStatusLoja, 60000); // reavalia aberto/fechado a cada minuto
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
