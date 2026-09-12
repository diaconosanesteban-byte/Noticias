// Fuente: catedraldesevilla.es
// Su /feed/ está bloqueado por robots.txt, así que se hace scraping de la
// página de noticias (maquetación Elementor de WordPress).
//
// IMPORTANT: estos selectores están escritos de forma defensiva porque no
// se pudo inspeccionar el HTML crudo real desde el entorno de desarrollo.
// Revisar y ajustar tras el primer build real (ver claude/estado-tecnico.md
// del Proyecto "Noticias" — pendiente #2).

import * as cheerio from "cheerio";

const PAGINA_URL =
  "https://www.catedraldesevilla.es/noticias-catedral-de-sevilla/";
const FUENTE = "Catedral de Sevilla";

// Varios candidatos de selector, de más a menos específico. Elementor suele
// envolver cada entrada de blog en algo con clase "elementor-post" o
// similar; probamos varias formas habituales hasta encontrar coincidencias.
const SELECTORES_ENTRADA = [
  "article.elementor-post",
  "article.post",
  ".elementor-posts-container article",
  "article",
];

function extraerFecha($, $entrada) {
  const timeEl = $entrada.find("time").first();
  if (timeEl.length) {
    const datetime = timeEl.attr("datetime");
    if (datetime) return datetime;
    const texto = timeEl.text().trim();
    if (texto) return texto;
  }
  return null;
}

export async function obtenerTitulares() {
  const respuesta = await fetch(PAGINA_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; TablonNoticiasIglesiaSevilla/1.0; +https://github.com/)",
    },
  });

  if (!respuesta.ok) {
    throw new Error(
      `catedraldesevilla.es respondió ${respuesta.status} al pedir ${PAGINA_URL}`
    );
  }

  const html = await respuesta.text();
  const $ = cheerio.load(html);

  let $entradas = $();
  for (const selector of SELECTORES_ENTRADA) {
    $entradas = $(selector);
    if ($entradas.length > 0) break;
  }

  const titulares = [];
  $entradas.each((_, el) => {
    const $entrada = $(el);
    const $enlaceTitulo = $entrada
      .find("h2 a, h3 a, .elementor-post__title a")
      .first();

    const titulo = $enlaceTitulo.text().trim();
    const url = $enlaceTitulo.attr("href");

    if (!titulo || !url) return;

    titulares.push({
      titulo,
      url,
      fecha: extraerFecha($, $entrada),
      fuente: FUENTE,
    });
  });

  return titulares;
}
