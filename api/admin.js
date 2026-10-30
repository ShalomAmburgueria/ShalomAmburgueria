// POST /api/admin — usado só pela página /admin do dono da loja.
// Ações: "login" (troca a senha por um token de 30 dias), "ler" e "salvar".
// A senha vem da variável de ambiente ADMIN_PASSWORD (configurada na Vercel);
// nunca fica no código.
const crypto = require("crypto");
const { MODOS, ESTADO_PADRAO, configRedis, redis, chaveEstado, lerEstado, responderJson } = require("./_estado");

const VALIDADE_TOKEN_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_TENTATIVAS = 5;
const JANELA_TENTATIVAS_S = 15 * 60;
const MAX_MENSAGEM = 200;
const MAX_PRAZO_MS = 60 * 24 * 60 * 60 * 1000;

function hmac(texto, senha) {
  return crypto.createHmac("sha256", senha).update(texto).digest("hex");
}

function iguais(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function gerarToken(senha) {
  const expira = String(Date.now() + VALIDADE_TOKEN_MS);
  return `${expira}.${hmac(expira, senha)}`;
}

function tokenValido(token, senha) {
  if (typeof token !== "string") return false;
  const [expira, assinatura] = token.split(".");
  if (!expira || !assinatura || !(Number(expira) > Date.now())) return false;
  return iguais(assinatura, hmac(expira, senha));
}

function ipDoCliente(req) {
  const encaminhado = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return encaminhado || (req.socket && req.socket.remoteAddress) || "desconhecido";
}

// Valida e limpa o que veio da página antes de gravar.
function validarEstado(entrada) {
  if (!entrada || !MODOS.includes(entrada.modo)) return { erro: "Modo inválido." };
  const mensagem = typeof entrada.mensagem === "string" ? entrada.mensagem.trim() : "";
  if (mensagem.length > MAX_MENSAGEM) return { erro: `A mensagem pode ter até ${MAX_MENSAGEM} caracteres.` };

  let ate = null;
  if (entrada.ate) {
    const quando = Date.parse(entrada.ate);
    if (Number.isNaN(quando)) return { erro: "Prazo inválido." };
    if (quando <= Date.now()) return { erro: "O prazo precisa ser no futuro." };
    if (quando - Date.now() > MAX_PRAZO_MS) return { erro: "O prazo máximo é de 60 dias." };
    ate = new Date(quando).toISOString();
  }
  return { estado: { modo: entrada.modo, mensagem, ate } };
}

module.exports = async function admin(req, res) {
  if (req.method !== "POST") return responderJson(res, 405, { erro: "Método não permitido" });

  const senha = process.env.ADMIN_PASSWORD;
  if (!senha || !configRedis()) {
    return responderJson(res, 503, { erro: "O painel ainda não foi configurado na Vercel (senha e banco de dados)." });
  }

  const corpo = req.body && typeof req.body === "object" ? req.body : {};

  try {
    if (corpo.acao === "login") {
      const chaveTentativas = `shalom:login:${ipDoCliente(req)}`;
      const tentativas = await redis(["INCR", chaveTentativas]);
      if (tentativas === 1) await redis(["EXPIRE", chaveTentativas, String(JANELA_TENTATIVAS_S)]);
      if (tentativas > MAX_TENTATIVAS) {
        return responderJson(res, 429, { erro: "Muitas tentativas. Aguarde 15 minutos e tente de novo." });
      }
      if (typeof corpo.senha !== "string" || !iguais(corpo.senha, senha)) {
        return responderJson(res, 401, { erro: "Senha incorreta." });
      }
      await redis(["DEL", chaveTentativas]);
      return responderJson(res, 200, { token: gerarToken(senha) });
    }

    const autorizacao = String(req.headers.authorization || "").replace(/^Bearer /, "");
    if (!tokenValido(autorizacao, senha)) return responderJson(res, 401, { erro: "Sessão expirada. Entre de novo." });

    if (corpo.acao === "ler") {
      return responderJson(res, 200, { estado: await lerEstado() });
    }

    if (corpo.acao === "salvar") {
      const { estado, erro } = validarEstado(corpo.estado);
      if (erro) return responderJson(res, 400, { erro });
      // "Automático" sem mensagem = nada para guardar: volta ao padrão.
      const final = estado.modo === "auto" && !estado.mensagem ? { ...ESTADO_PADRAO } : estado;
      await redis(["SET", chaveEstado(), JSON.stringify(final)]);
      return responderJson(res, 200, { estado: final });
    }

    return responderJson(res, 400, { erro: "Ação inválida." });
  } catch (erro) {
    return responderJson(res, 500, { erro: "Não foi possível falar com o banco de dados. Tente de novo." });
  }
};
