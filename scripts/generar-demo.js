// Genera data/titulares.json y public/index.html a partir de los datos de
// MUESTRA (test/fixtures), sin salir a internet. Solo para tener un ejemplo
// funcionando nada más clonar el repo, antes del primer build real.
//
// Uso: node scripts/generar-demo.js

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { agregarTitulares } from "../src/agregador.js";
import { generarPaginaHtml } from "../src/generador.js";
import {
  muestraArchisevilla,
  muestraOdisur,
  muestraCatedral,
  muestraAgenda,
} from "../test/fixtures/titulares-muestra.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");

function fuenteFalsa(nombre, titulares) {
  return {
    name: nombre,
    async obtenerTitulares() {
      return titulares;
    },
  };
}

async function main() {
  const resultado = await agregarTitulares({
    fuentesNoticias: [
      fuenteFalsa("archisevilla", muestraArchisevilla),
      fuenteFalsa("odisur", muestraOdisur),
      fuenteFalsa("catedral", muestraCatedral),
    ],
    fuenteAgenda: {
      async obtenerProximosActos() {
        return muestraAgenda;
      },
    },
  });

  await mkdir(path.join(RAIZ, "data"), { recursive: true });
  await mkdir(path.join(RAIZ, "public"), { recursive: true });

  await writeFile(
    path.join(RAIZ, "data", "titulares.json"),
    JSON.stringify(resultado, null, 2) + "\n",
    "utf8"
  );
  await writeFile(
    path.join(RAIZ, "public", "index.html"),
    generarPaginaHtml(resultado),
    "utf8"
  );

  console.log("Demo generada con datos de muestra en data/ y public/.");
}

main();
