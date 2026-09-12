// Fuente: archisevilla.org
// RSS válido en /feed/. Sin problemas conocidos.

import Parser from "rss-parser";

const FEED_URL = "https://www.archisevilla.org/feed/";
const FUENTE = "Archidiócesis de Sevilla";

export async function obtenerTitulares() {
  const parser = new Parser();
  const feed = await parser.parseURL(FEED_URL);

  return (feed.items || []).map((item) => ({
    titulo: (item.title || "").trim(),
    url: item.link,
    fecha: item.isoDate || item.pubDate || null,
    fuente: FUENTE,
  }));
}
