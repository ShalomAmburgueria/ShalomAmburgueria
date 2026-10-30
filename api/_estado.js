// Funções compartilhadas pelas rotas /api/status e /api/admin.
// O estado da loja (modo, mensagem e prazo) fica guardado num Redis (Upstash,
// conectado pela Vercel). Fora da Vercel, ou sem o Redis configurado, o site
// simplesmente segue o horário normal do CONFIG.

const MODOS = ["auto", "fechado", "aberto"];
const ESTADO_PADRAO = { modo: "auto", mensagem: "", ate: null };

function configRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

// Executa um comando Redis pela API REST. Ex: redis(["GET", "chave"]).
async function redis(comando) {
  const cfg = configRedis();
  if (!cfg) throw new Error("Redis não configurado");
  const resposta = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(comando),
  });
  const dados = await resposta.json();
  if (!resposta.ok || dados.error) throw new Error(dados.error || `Redis HTTP ${resposta.status}`);
  return dados.result;
}

// Produção e homologação (preview da Vercel) guardam estados separados,
// para um teste na homologação nunca fechar a loja de verdade.
function chaveEstado() {
  return process.env.VERCEL_ENV === "production" ? "shalom:estado:prod" : "shalom:estado:hml";
}

function normalizar(bruto) {
  if (!bruto || typeof bruto !== "object") return { ...ESTADO_PADRAO };
  return {
    modo: MODOS.includes(bruto.modo) ? bruto.modo : "auto",
    mensagem: typeof bruto.mensagem === "string" ? bruto.mensagem : "",
    ate: typeof bruto.ate === "string" && !Number.isNaN(Date.parse(bruto.ate)) ? bruto.ate : null,
  };
}

async function lerEstado() {
  const texto = await redis(["GET", chaveEstado()]);
  if (!texto) return { ...ESTADO_PADRAO };
  try {
    return normalizar(JSON.parse(texto));
  } catch (erro) {
    return { ...ESTADO_PADRAO };
  }
}

// Estado que vale agora: se o prazo já passou, volta ao automático.
function estadoEfetivo(estado) {
  if (estado.ate && Date.now() > Date.parse(estado.ate)) return { ...ESTADO_PADRAO };
  return estado;
}

function responderJson(res, status, corpo) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(corpo));
}

module.exports = { MODOS, ESTADO_PADRAO, configRedis, redis, chaveEstado, normalizar, lerEstado, estadoEfetivo, responderJson };
