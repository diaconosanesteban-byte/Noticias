// Script principal: agrega titulares de todas las fuentes, guarda el JSON
// de datos (para poder comparar en el workflow si hay titulares nuevos) y
// genera la página estática en public/index.html.
//
// Necesita salida a internet normal (local, GitHub Actions o el build de
// Netlify/Vercel). No funciona en un sandbox sin acceso a internet — para
// eso está `npm test`, que usa datos de muestra.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { agregarTitulares } from "./agregador.js";
import { generarPaginaHtml } from "./generador.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");
const DATA_DIR = path.join(RAIZ, "data");
const PUBLIC_DIR = path.join(RAIZ, "public");

async function main() {
  const resultado = await agregarTitulares();

  if (resultado.errores.length) {
    for (const e of resultado.errores) {
      console.error(`[aviso] Fuente "${e.fuente}" falló: ${e.error}`);
    }
  }

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });

  await writeFile(
    path.join(DATA_DIR, "titulares.json"),
    JSON.stringify(resultado, null, 2) + "\n",
    "utf8"
  );

  const html = generarPaginaHtml(resultado);
  await writeFile(path.join(PUBLIC_DIR, "index.html"), html, "utf8");

  console.log(
    `Listo: ${resultado.titulares.length} titulares, ${resultado.proximosActos.length} próximos actos.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("El build falló:", error);
    process.exit(1);
  });
