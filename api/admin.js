/*
 * /api/admin — área restrita do painel.
 *   POST   { senha }   → login (cria o cookie de sessão)
 *   DELETE             → logout
 *   GET                → estado da sessão e configuração atual
 *   PUT    { ...cfg }  → grava a configuração (precisa estar logado)
 */
const {
  redis, redisConfigurado, lerConfig, gravarConfig, sanearConfig,
  criarToken, autenticado, cookieSessao, senhaConfere, enviarJson, lerCorpoJson,
  DURACAO_SESSAO_S,
} = require("./_lib");

const MAX_TENTATIVAS = 8;
const JANELA_S = 15 * 60;

function ipDe(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "desconhecido";
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(req, res) {
  if (!process.env.ADMIN_PASSWORD) {
    return enviarJson(res, 503, { erro: "ADMIN_PASSWORD não está configurada na Vercel." });
  }
  const chave = `shalom:login:${ipDe(req)}`;
  if (redisConfigurado()) {
    try {
      const n = await redis("INCR", chave);
      if (n === 1) await redis("EXPIRE", chave, JANELA_S);
      if (n > MAX_TENTATIVAS) {
        return enviarJson(res, 429, { erro: "Muitas tentativas. Aguarde 15 minutos." });
      }
    } catch (erro) {
      console.error("limite de login:", erro.message);
    }
  }
  const corpo = await lerCorpoJson(req);
  if (!senhaConfere(corpo.senha)) {
    await esperar(600);
    return enviarJson(res, 401, { erro: "Senha incorreta." });
  }
  if (redisConfigurado()) redis("DEL", chave).catch(() => {});
  res.setHeader("Set-Cookie", cookieSessao(criarToken(), DURACAO_SESSAO_S));
  enviarJson(res, 200, { ok: true });
}

module.exports = async (req, res) => {
  try {
    if (req.method === "POST") return await login(req, res);

    if (req.method === "DELETE") {
      res.setHeader("Set-Cookie", cookieSessao("", 0));
      return enviarJson(res, 200, { ok: true });
    }

    if (!autenticado(req)) return enviarJson(res, 401, { erro: "Não autenticado." });

    if (req.method === "GET") {
      const config = redisConfigurado() ? await lerConfig() : null;
      return enviarJson(res, 200, { redis: redisConfigurado(), config });
    }

    if (req.method === "PUT") {
      if (!redisConfigurado()) {
        return enviarJson(res, 503, { erro: "Upstash Redis não está configurado na Vercel." });
      }
      if (!String(req.headers["content-type"] || "").includes("application/json")) {
        return enviarJson(res, 415, { erro: "Use application/json." });
      }
      const config = sanearConfig(await lerCorpoJson(req));
      await gravarConfig(config);
      return enviarJson(res, 200, { ok: true, config });
    }

    enviarJson(res, 405, { erro: "Método não permitido" });
  } catch (erro) {
    console.error("admin:", erro.message);
    enviarJson(res, 500, { erro: "Erro interno." });
  }
};
