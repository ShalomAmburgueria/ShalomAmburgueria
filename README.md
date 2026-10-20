# Shalom Amburgueria — Site de Cardápio e Pedidos

Site estático (HTML, CSS e JavaScript puros, sem framework e sem build) para
o cliente montar o pedido e enviar pronto para o WhatsApp da lanchonete. Não
há backend, banco de dados nem pagamento online — o WhatsApp é o canal final
de confirmação do pedido.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | Estrutura da página (cabeçalho, cardápio, carrinho, formulário) |
| `style.css` | Toda a aparência visual (cores, layout, responsividade) |
| `cardapio.js` | **Os dados que o dono da loja edita**: preços, itens, horários, número de WhatsApp |
| `app.js` | A lógica do site (carrinho, cálculo de preços, montagem da mensagem) — normalmente não precisa mexer aqui |
| `favicon.svg` | Ícone da aba do navegador (coroa) |
| `doubene-logo.png` | Logo da doubene.ai, mostrado de forma discreta no rodapé ("Site desenvolvido por") |
| `Cardapio_1.jpeg` / `Cardapio_2.jpeg` | Cardápios impressos originais, usados só como referência visual — não são exibidos no site |

## Como editar preços e itens

Abra o arquivo **`cardapio.js`** direto no GitHub (branch `homolog`, botão
de lápis ✏️ no canto do arquivo) — não precisa baixar nem instalar nada. Veja
o passo a passo em "Como fazer uma alteração". Ele tem duas partes:

### 1. `CONFIG` — configurações gerais

```js
const CONFIG = {
  whatsapp: "5511972317186",   // número que recebe os pedidos
  taxaEntrega: null,           // valor em reais, ex: 8  (ou null = "a combinar")
  pedidoMinimo: 0,             // valor mínimo do pedido, ex: 30 (0 = sem mínimo)
  horarios: { ... },           // horário de funcionamento por dia da semana
  linhasAtivas: ["tradicional", "artesanal"], // quais linhas de lanche estão à venda
  ...
};
```

- **Número de WhatsApp**: troque `whatsapp: "5511972317186"` pelo número real
  da lanchonete, sempre no formato **DDI + DDD + número, só dígitos** (Brasil
  = 55). Exemplo: `"5511988887777"`.
- **Taxa de entrega**: troque `null` por um número (ex: `taxaEntrega: 8`) ou
  deixe `null` para continuar mostrando "a combinar" no site e na mensagem.
- **Pedido mínimo**: troque `0` por um valor em reais para exigir um mínimo
  na entrega.
- **Horários**: cada dia (`dom`, `seg`, `ter`, `qua`, `qui`, `sex`, `sab`) tem
  um `abre` e um `fecha` no formato 24h `"HH:MM"`. O site usa isso para
  mostrar "Aberto agora" / "Fechado" e bloquear o envio do pedido fora do
  horário.
- **Linhas ativas**: se a loja vender só a linha Artesanal (por exemplo), use
  `linhasAtivas: ["artesanal"]` — o seletor Tradicional/Artesanal some
  automaticamente do site e todo o cardápio usa só essa linha.
- **Frase de efeito (`tagline`)**: aparece embaixo do logo. Troque o texto
  entre aspas para mudar a frase, ou apague o conteúdo (deixe `""`) para não
  mostrar nenhuma frase.
- **"Quem Somos" (`sobreLoja`)**: uma lista de parágrafos (cada linha entre
  aspas e separada por vírgula vira um parágrafo) mostrada quando o cliente
  toca no botão "Quem Somos" no rodapé do site.
- **"Endereço e Contato" (`endereco`)**: preencha `rua`, `bairro` e, se
  quiser, `referencia` (ex: "Perto da praça central"). O telefone mostrado
  nesse painel já vem automaticamente do `CONFIG.whatsapp`.
- **Instagram (`instagram`)**: cole o link completo do perfil (ex:
  `"https://instagram.com/shalomlancheseporcoes"`). O botão "Siga no
  Instagram" só aparece no rodapé depois que esse campo for preenchido —
  enquanto estiver vazio (`""`), ele fica escondido.
- **iFood (`ifood`)**: mesma lógica do Instagram — cole o link da loja no
  iFood e o botão "Peça pelo iFood" aparece sozinho no rodapé.

### 2. `CARDAPIO` — os itens à venda

Cada lanche é um objeto assim:

```js
{
  id: "x-burguer",
  nome: "X-Burguer",
  emoji: "🍔",
  foto: null, // ou "fotos/x-burguer.jpg" se você tiver uma foto
  ingredientes: ["Hambúrguer", "Queijo", "Maionese"],
  precos: { tradicional: 13, artesanal: 20 },
},
```

Para **mudar um preço**, edite o número depois de `tradicional:` ou
`artesanal:`. Para **adicionar uma foto**, coloque o arquivo de imagem numa
pasta do projeto (crie uma pasta `fotos/`, por exemplo) e troque `foto: null`
por `foto: "fotos/nome-do-arquivo.jpg"`. Sem foto, o site mostra o emoji
automaticamente.

Para **adicionar um item novo**, copie um bloco parecido (com vírgula no
final) e cole dentro da lista `itens: [ ... ]` da categoria certa
(`lanches`, `combo`, `porcoes` ou `bebidas`). Para **remover um item**, apague
o bloco inteiro dele (do `{` ao `}`, incluindo a vírgula).

⚠️ **Cuidado com a pontuação**: cada item precisa estar entre chaves `{ }`,
separado por vírgulas, e os textos entre aspas `"..."`. Se o site parar de
carregar depois de uma edição, o motivo mais comum é uma vírgula ou aspas
faltando — desfaça a última alteração e tente de novo com calma.

## Como o projeto está publicado (tudo online)

Nada precisa rodar em computador nenhum: o código fica no GitHub, a Vercel
publica o site e a Locaweb cuida do domínio.

| Peça | Papel | Onde |
|---|---|---|
| **GitHub** | Guarda o código e o histórico de alterações | repositório `ShalomAmburgueria/ShalomAmburgueria` |
| **Vercel** | Publica o site automaticamente a cada alteração enviada ao GitHub | projeto `shalom-amburgueria` |
| **Locaweb** | Registro e DNS do domínio `shalomamburgueria.com.br` | painel da Locaweb → DNS |

| Ambiente | Branch | Endereço |
|---|---|---|
| **HML** (homologação / testes) | `homolog` | https://hml.shalomamburgueria.com.br |
| **Produção** (clientes) | `main` | https://www.shalomamburgueria.com.br |

O HML mostra a faixa "Ambiente de teste" no topo; a produção não.

## Como fazer uma alteração (sempre HML primeiro)

1. Altere o arquivo na branch **`homolog`** (pode ser pelo próprio GitHub, no
   botão de lápis ✏️ do arquivo, sem instalar nada) e salve com "Commit".
2. Aguarde a Vercel publicar (cerca de 1 minuto) e confira em
   https://hml.shalomamburgueria.com.br — inclusive no celular. Teste um
   pedido completo.
3. Só depois de aprovado, leve a alteração para a **`main`** (Pull Request de
   `homolog` → `main` no GitHub e "Merge"). A Vercel publica a produção sozinha.
4. Confira https://www.shalomamburgueria.com.br.

Nunca altere a `main` diretamente. Se algo der errado na produção, volte a
alteração pelo botão "Revert" do Pull Request no GitHub.

## Domínio e DNS (Locaweb)

Os registros ficam no painel DNS da Locaweb (nameservers `ns1/ns2/ns3.locaweb.com.br`)
e apontam para a Vercel:

| Nome | Tipo | Aponta para |
|---|---|---|
| `@` (raiz) | A | `216.198.79.1` (a Vercel redireciona para o `www`) |
| `www` | CNAME | valor fornecido pela Vercel (`...vercel-dns-017.com`) |
| `hml` | CNAME | o mesmo valor do `www` |

Se algum dia precisar mudar de projeto/conta na Vercel, ela mostra em
*Settings → Domains* exatamente quais valores colocar na Locaweb.

## Antes de ir para produção

Confira este checklist antes de divulgar o link para os clientes:

- [ ] **Trocar o número de WhatsApp de teste** (`5511972317186`) pelo número
      real da lanchonete em `cardapio.js` → `CONFIG.whatsapp`. O número real
      já é conhecido (`5511966321857`, visto no banner de divulgação) — só
      falta trocar quando for para produção; propositalmente mantido como
      teste por enquanto.
- [ ] **Preencher os horários de funcionamento reais** em `CONFIG.horarios`
      (ainda em modo teste: 00:00–23:59 todos os dias, marcado `// A DEFINIR`
      no arquivo).
- [ ] **Definir a taxa de entrega** em `CONFIG.taxaEntrega` (hoje está `null`,
      mostrando "a combinar").
- [ ] **Definir o pedido mínimo**, se houver, em `CONFIG.pedidoMinimo`.
- [ ] **Conferir todos os preços com o dono da lanchonete** — os valores
      atuais em `cardapio.js` foram tirados dos cardápios impressos
      fornecidos, mas vale uma checagem final antes de publicar.
- [x] **Preencher "Endereço" e "Quem Somos"** em `cardapio.js` →
      `CONFIG.endereco` e `CONFIG.sobreLoja` (já feito).
- [x] **Preencher o link do Instagram** em `CONFIG.instagram` (já feito).
- [x] **Preencher o link do iFood** em `CONFIG.ifood` (já feito).
- [ ] **Trocar os emojis pelas fotos reais dos lanches**, se o dono da loja
      for fornecer — basta preencher o campo `foto` de cada item em
      `cardapio.js` (veja "Como editar preços e itens" acima). Sem fotos, o
      site continua funcionando normalmente com os emojis.
- [ ] Testar um pedido completo no celular **no HML** (adicionar item, editar
      quantidade, finalizar, conferir a mensagem que chega no WhatsApp) antes
      de levar para a `main`.

## Como funciona por baixo dos panos (resumo técnico)

- O carrinho fica salvo no `localStorage` do navegador do cliente, então se
  ele fechar a aba sem finalizar, o pedido continua lá na próxima visita
  (nesse mesmo aparelho).
- Não existe pagamento online: a forma de pagamento escolhida (Pix, cartão na
  entrega ou dinheiro) só vai escrita na mensagem do WhatsApp, e o
  pagamento em si é combinado diretamente com a loja.
- O botão de enviar fica desativado fora do horário de funcionamento
  configurado em `CONFIG.horarios`.
