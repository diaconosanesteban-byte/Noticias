// Detección de duplicados compartida por el agregador y el histórico.
//
// Un titular se considera repetido si ya se ha visto:
// - su misma URL, o
// - otro titular de la MISMA fuente con el mismo texto (comparado en
//   minúsculas, sin tildes ni signos). Esto cubre el caso de ODISUR, que a
//   veces publica la misma noticia dos veces y WordPress le da a la segunda
//   la URL terminada en "-2".

function normalizarTexto(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, " ")
    .trim();
}

function clavesDe(t) {
  const claves = [];
  const url = (t.url || "").trim();
  if (url) claves.push(`url:${url}`);
  const titulo = normalizarTexto(t.titulo);
  if (titulo) claves.push(`titulo:${normalizarTexto(t.fuente)}|${titulo}`);
  return claves;
}

export function crearFiltroDuplicados() {
  const vistos = new Set();
  return {
    // Devuelve true si el titular es nuevo (y lo marca como visto).
    aceptar(t) {
      if (!(t.url || "").trim()) return false;
      const claves = clavesDe(t);
      if (claves.some((c) => vistos.has(c))) return false;
      claves.forEach((c) => vistos.add(c));
      return true;
    },
  };
}

export function quitarDuplicados(titulares) {
  const filtro = crearFiltroDuplicados();
  return titulares.filter((t) => filtro.aceptar(t));
}
