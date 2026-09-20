# Shalon Lanches e Porções — Site de Cardápio e Pedidos

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
| `Cardapio_1.jpeg` / `Cardapio_2.jpeg` | Cardápios impressos originais, usados só como referência visual — não são exibidos no site |

## Como editar preços e itens

Abra o arquivo **`cardapio.js`** em qualquer editor de texto (Bloco de Notas
já serve, mas um editor de código como o VS Code é mais seguro). Ele tem duas
partes:

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

## Como testar no celular (mesma rede Wi-Fi)

O site precisa ser aberto por um servidor local (não funciona 100% se você
abrir o `index.html` direto por HTTPS de produção, mas para teste local pode
usar qualquer servidor simples). Com **Python** instalado:

```bash
# Dentro da pasta do projeto
python -m http.server 8080
```

Ou com **Node.js**:

```bash
npx serve -l 8080
```

Depois:

1. Descubra o IP local do computador na rede Wi-Fi (Windows:
   `ipconfig`, procure "Endereço IPv4" da conexão Wi-Fi; Mac/Linux:
   `ifconfig` ou `ip a`).
2. No celular, **conectado na mesma rede Wi-Fi**, abra o navegador e acesse
   `http://SEU-IP-LOCAL:8080` (por exemplo `http://192.168.15.2:8080`).
3. Se não conectar, confira se o firewall do computador está permitindo
   conexões de entrada na porta 8080 (no Windows: Firewall do Windows Defender
   → Permitir um aplicativo → marque a rede "Privada" para o servidor usado).

## Como publicar (GitHub Pages ou Netlify)

O site é 100% estático, então basta hospedar os arquivos como estão.

**GitHub Pages:**
1. Crie um repositório no GitHub e suba todos os arquivos deste projeto.
2. Vá em Settings → Pages → Source, escolha a branch principal (ex: `main`)
   e a pasta raiz (`/`).
3. Aguarde alguns minutos e acesse o link gerado pelo GitHub.

**Netlify:**
1. Crie uma conta em netlify.com.
2. Arraste a pasta do projeto para a área de deploy manual (ou conecte o
   repositório do GitHub para deploy automático a cada alteração).
3. O Netlify gera um link público na hora.

Em ambos os casos não há nenhuma configuração de build — é só publicar os
arquivos.

## Antes de ir para produção

Confira este checklist antes de divulgar o link para os clientes:

- [ ] **Trocar o número de WhatsApp de teste** (`5511972317186`) pelo número
      real da lanchonete em `cardapio.js` → `CONFIG.whatsapp`.
- [ ] **Preencher os horários de funcionamento reais** em `CONFIG.horarios`
      (os horários atuais são um exemplo e estão marcados `// A DEFINIR`).
- [ ] **Definir a taxa de entrega** em `CONFIG.taxaEntrega` (hoje está `null`,
      mostrando "a combinar").
- [ ] **Definir o pedido mínimo**, se houver, em `CONFIG.pedidoMinimo`.
- [ ] **Conferir todos os preços com o dono da lanchonete** — os valores
      atuais em `cardapio.js` foram tirados dos cardápios impressos
      fornecidos, mas vale uma checagem final antes de publicar.
- [ ] Testar um pedido completo no celular (adicionar item, editar
      quantidade, finalizar, conferir a mensagem que chega no WhatsApp).

## Como funciona por baixo dos panos (resumo técnico)

- O carrinho fica salvo no `localStorage` do navegador do cliente, então se
  ele fechar a aba sem finalizar, o pedido continua lá na próxima visita
  (nesse mesmo aparelho).
- Não existe pagamento online: a forma de pagamento escolhida (Pix, cartão na
  entrega ou dinheiro) só vai escrita na mensagem do WhatsApp, e o
  pagamento em si é combinado diretamente com a loja.
- O botão de enviar fica desativado fora do horário de funcionamento
  configurado em `CONFIG.horarios`.
