// Fuente: catedraldesevilla.es
// Su /feed/ está bloqueado por robots.txt, así que se hace scraping de la
// página de noticias.
//
// Versión 2 (23 sept 2026): la versión anterior buscaba <article> y
// <time>, y no encontraba nada (0 noticias sin error). Esta versión no
// depende de la maquetación concreta: recorre todos los enlaces a entradas
// del propio sitio y, para cada uno, busca una fecha escrita en su bloque
// cercano. Solo se quedan los enlaces que tienen fecha, lo que descarta
// menús, cabecera y pie.

import * as cheerio from "cheerio";

const PAGINA_URL =
  "https://www.catedraldesevilla.es/noticias-catedral-de-sevilla/";
const DOMINIO = "www.catedraldesevilla.es";
const FUENTE = "Catedral de Sevilla";

// Cuántos niveles se sube desde el enlace buscando la fecha de la noticia.
const NIVELES_MAX = 6;

const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11,
  diciembre: 12,
};

function sinTildes(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Devuelve la fecha en ISO (mediodía, hora peninsular aprox.) o null.
// Formatos admitidos: "23/09/2026", "23-09-2026", "2026-09-23",
// "23 de septiembre de 2026", "23 septiembre, 2026", "septiembre 23, 2026".
export function extraerFechaDeTexto(texto) {
  const t = sinTildes(texto);
  const nombres = Object.keys(MESES).join("|");
  let d, m, a, r;

  if ((r = t.match(/(?<!\d)(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/))) {
    [a, m, d] = [r[1], r[2], r[3]];
  } else if ((r = t.match(/(?<!\d)(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?!\d)/))) {
    [d, m, a] = [r[1], r[2], r[3]];
  } else if (
    (r = t.match(new RegExp(`(?<!\\d)(\\d{1,2})\\s*(?:de\\s+)?(${nombres})\\s*(?:de\\s+|,\\s*)?(\\d{4})(?!\\d)`)))
  ) {
    [d, m, a] = [r[1], MESES[r[2]], r[3]];
  } else if (
    (r = t.match(new RegExp(`(?<![a-z])(${nombres})\\s+(\\d{1,2}),?\\s*(\\d{4})(?!\\d)`)))
  ) {
    [m, d, a] = [MESES[r[1]], r[2], r[3]];
  } else {
    return null;
  }

  const dia = Number(d), mes = Number(m), anio = Number(a);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return new Date(Date.UTC(anio, mes - 1, dia, 10, 0, 0)).toISOString();
}

// ¿Es un enlace a una entrada del sitio? (una sola "carpeta" en la ruta,
// que no sea la propia página de noticias ni categorías/etiquetas).
function esEnlaceDeEntrada(href) {
  let u;
  try {
    u = new URL(href, PAGINA_URL);
  } catch {
    return null;
  }
  if (u.hostname !== DOMINIO && u.hostname !== "catedraldesevilla.es") return null;
  const partes = u.pathname.split("/").filter(Boolean);
  if (partes.length !== 1) return null;
  if (partes[0] === "noticias-catedral-de-sevilla") return null;
  u.hash = "";
  u.search = "";
  return u.toString();
}

export function extraerTitularesDeHtml(html) {
  const $ = cheerio.load(html);
  // <noscript> guarda la imagen como texto HTML literal; se quita para que
  // no acabe dentro del titular.
  $("header, nav, footer, script, style, noscript").remove();

  const porUrl = new Map();

  $("a[href]").each((_, el) => {
    const $a = $(el);
    const url = esEnlaceDeEntrada($a.attr("href"));
    if (!url) return;

    let titulo = $a.text().replace(/\s+/g, " ").trim();
    // Por si acaso: un texto con restos de HTML no es un titular.
    if (/[<>]|src=|\.(jpe?g|png|webp)\b/i.test(titulo)) titulo = "";

    // Busca la fecha: primero en <time>, luego en el texto del bloque.
    let fecha = null;
    let $bloque = $a;
    for (let i = 0; i < NIVELES_MAX && !fecha; i++) {
      $bloque = $bloque.parent();
      if (!$bloque.length) break;
      // Si el bloque ya abarca enlaces a otras entradas, nos hemos salido
      // de la tarjeta de esta noticia: paramos para no tomar otra fecha.
      const otras = new Set();
      $bloque.find("a[href]").each((_, x) => {
        const u = esEnlaceDeEntrada($(x).attr("href"));
        if (u && u !== url) otras.add(u);
      });
      if (otras.size) break;
      const $time = $bloque.find("time").first();
      if ($time.length) {
        fecha =
          extraerFechaDeTexto($time.attr("datetime")) ||
          extraerFechaDeTexto($time.text());
      }
      if (!fecha) fecha = extraerFechaDeTexto($bloque.text());
    }

    const previo = porUrl.get(url) || { url, titulo: "", fecha: null };
    // Nos quedamos con el texto de enlace más largo como titular
    // (el enlace de la imagen o "Leer más" suelen ser cortos o vacíos).
    if (titulo.length > previo.titulo.length) previo.titulo = titulo;
    if (!previo.fecha && fecha) previo.fecha = fecha;
    porUrl.set(url, previo);
  });

  return [...porUrl.values()]
    .filter((t) => t.fecha && t.titulo.length >= 15)
    .map((t) => ({ ...t, fuente: FUENTE }));
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

  const titulares = extraerTitularesDeHtml(await respuesta.text());

  // Si no se encuentra nada, se avisa como error para que se vea en el
  // registro del build en vez de fallar en silencio.
  if (!titulares.length) {
    throw new Error("catedraldesevilla.es: no se encontró ninguna noticia en la página (¿ha cambiado la maquetación?)");
  }

  return titulares;
}
