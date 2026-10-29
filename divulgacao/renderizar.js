// Gera os PNGs do banner a partir de banner.html.
// Uso (precisa do Playwright instalado): node divulgacao/renderizar.js
const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const navegador = await chromium.launch();
  const formatos = [
    { nome: "banner-feed-1080x1350.png", query: "", altura: 1350 },
    { nome: "banner-story-1080x1920.png", query: "?formato=story", altura: 1920 },
  ];
  for (const f of formatos) {
    const pagina = await navegador.newPage({ viewport: { width: 1080, height: f.altura } });
    await pagina.goto("file://" + path.join(__dirname, "banner.html") + f.query);
    await pagina.evaluate(() => document.fonts.ready);
    await pagina.screenshot({ path: path.join(__dirname, f.nome) });
    await pagina.close();
  }
  await navegador.close();
})();
