/*
 * GET /api/config — configuração pública da loja (preços, itens indisponíveis,
 * loja fechada, aviso). O site consulta isto ao abrir e aplica por cima do
 * cardapio.js. Se algo falhar, o site simplesmente usa os valores do cardapio.js.
 */
const { lerConfig, enviarJson } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "GET") return enviarJson(res, 405, { erro: "Método não permitido" });
  try {
    const config = await lerConfig();
    res.setHeader("Cache-Control", "public, s-maxage=5, stale-while-revalidate=30");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(config));
  } catch (erro) {
    console.error("config:", erro.message);
    enviarJson(res, 503, { erro: "Configuração indisponível" });
  }
};
