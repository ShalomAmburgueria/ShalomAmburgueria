/*
 * api/_lib.js — utilidades compartilhadas pelas funções da pasta api/.
 * (O "_" no começo do nome impede a Vercel de expor este arquivo como rota.)
 *
 * Armazenamento: Upstash Redis via REST. Aceita tanto as variáveis criadas
 * pela integração da Vercel (KV_REST_API_URL / KV_REST_API_TOKEN) quanto as
 * do próprio Upstash (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
 */
const crypto = require("crypto");

const CHAVE_CONFIG = "shalom:config";
const COOKIE = "shalom_admin";
const DURACAO_SESSAO_S = 12 * 60 * 60;

const CONFIG_VAZIA = { lojaFechada: false, aviso: "", indisponiveis: [], precos: {} };

function credenciaisRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

function redisConfigurado() {
  return !!credenciaisRedis();
}

async function redis(...comando) {
  const cred = credenciaisRedis();
  if (!cred) throw new Error("Redis não configurado");
  const resp = await fetch(cred.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cred.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(comando),
  });
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok || dados.error) throw new Error(dados.error || `Redis HTTP ${resp.status}`);
  return dados.result;
}

// --- Configuração da loja ----------------------------------------------

function sanearConfig(entrada) {
  const e = entrada && typeof entrada === "object" ? entrada : {};
  const id = (v) => typeof v === "string" && /^[a-z0-9-]{1,60}$/.test(v);
  const preco = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 10000;

  const saida = { lojaFechada: e.lojaFechada === true, aviso: "", indisponiveis: [], precos: {} };
  if (typeof e.aviso === "string") saida.aviso = e.aviso.trim().slice(0, 200);
  if (Array.isArray(e.indisponiveis)) {
    saida.indisponiveis = [...new Set(e.indisponiveis.filter(id))].slice(0, 200);
  }
  if (e.precos && typeof e.precos === "object") {
    for (const [chave, valor] of Object.entries(e.precos).slice(0, 200)) {
      if (!id(chave)) continue;
      if (preco(valor)) {
        saida.precos[chave] = Math.round(valor * 100) / 100;
      } else if (valor && typeof valor === "object") {
        const linhas = {};
        for (const linha of ["tradicional", "artesanal"]) {
          if (preco(valor[linha])) linhas[linha] = Math.round(valor[linha] * 100) / 100;
        }
        if (Object.keys(linhas).length) saida.precos[chave] = linhas;
      }
    }
  }
  return saida;
}

async function lerConfig() {
  if (!redisConfigurado()) return { ...CONFIG_VAZIA };
  const bruto = await redis("GET", CHAVE_CONFIG);
  if (!bruto) return { ...CONFIG_VAZIA };
  try {
    return sanearConfig(JSON.parse(bruto));
  } catch {
    return { ...CONFIG_VAZIA };
  }
}

async function gravarConfig(config) {
  await redis("SET", CHAVE_CONFIG, JSON.stringify(config));
}

// --- Sessão do administrador -------------------------------------------

function segredo() {
  const senha = process.env.ADMIN_PASSWORD;
  return senha ? crypto.createHash("sha256").update("shalom-admin-session:" + senha).digest() : null;
}

function assinar(exp) {
  return crypto.createHmac("sha256", segredo()).update(String(exp)).digest("base64url");
}

function criarToken() {
  const exp = Math.floor(Date.now() / 1000) + DURACAO_SESSAO_S;
  return `${exp}.${assinar(exp)}`;
}

function tokenValido(token) {
  if (!segredo() || typeof token !== "string") return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now() / 1000)) return false;
  const esperado = Buffer.from(assinar(exp));
  const recebido = Buffer.from(sig);
  return esperado.length === recebido.length && crypto.timingSafeEqual(esperado, recebido);
}

function lerCookie(req, nome) {
  for (const parte of (req.headers.cookie || "").split(";")) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i).trim() === nome) return parte.slice(i + 1).trim();
  }
  return "";
}

function autenticado(req) {
  return tokenValido(lerCookie(req, COOKIE));
}

function cookieSessao(token, maxAge) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function senhaConfere(informada) {
  const correta = process.env.ADMIN_PASSWORD;
  if (!correta || typeof informada !== "string") return false;
  const a = crypto.createHash("sha256").update(informada).digest();
  const b = crypto.createHash("sha256").update(correta).digest();
  return crypto.timingSafeEqual(a, b);
}

function enviarJson(res, status, corpo) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(corpo));
}

async function lerCorpoJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const partes = [];
  let tamanho = 0;
  for await (const parte of req) {
    tamanho += parte.length;
    if (tamanho > 100000) throw new Error("Corpo grande demais");
    partes.push(parte);
  }
  return partes.length ? JSON.parse(Buffer.concat(partes).toString("utf8")) : {};
}

module.exports = {
  redis, redisConfigurado, lerConfig, gravarConfig, sanearConfig,
  criarToken, autenticado, cookieSessao, senhaConfere, enviarJson, lerCorpoJson,
  DURACAO_SESSAO_S,
};
