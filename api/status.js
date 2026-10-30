// GET /api/status — público. O site consulta aqui se a loja está com o horário
// forçado (aberta/fechada) e se há uma mensagem para os clientes.
// Qualquer falha devolve o modo "auto": o site nunca fica travado por causa disso.
const { ESTADO_PADRAO, configRedis, lerEstado, estadoEfetivo, responderJson } = require("./_estado");

module.exports = async function status(req, res) {
  if (req.method !== "GET") return responderJson(res, 405, { erro: "Método não permitido" });
  if (!configRedis()) return responderJson(res, 200, ESTADO_PADRAO);
  try {
    responderJson(res, 200, estadoEfetivo(await lerEstado()));
  } catch (erro) {
    responderJson(res, 200, ESTADO_PADRAO);
  }
};
