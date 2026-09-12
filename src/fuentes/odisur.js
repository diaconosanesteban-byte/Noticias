// Fuente: odisur.es
// RSS válido en /feed/. Ojo: agrega noticias de varias diócesis del sur y a
// veces reenlaza el mismo suceso que archisevilla.org bajo otra URL.
// No se fusionan en v1 (limitación conocida y aceptada, ver README/estado técnico).

import Parser from "rss-parser";

const FEED_URL = "https://www.odisur.es/feed/";
const FUENTE = "ODISUR";

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
