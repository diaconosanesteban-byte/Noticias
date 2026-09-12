// Agenda / adelanto de noticia: archisevilla.org usa el plugin "The Events
// Calendar" de WordPress, que expone una API REST pública. Esto permite
// mostrar "Próximos actos" antes de que se conviertan en noticia.
//
// El Archivo BOAS (archisevilla.org/archidiocesis/archivo-boas/) resultó
// ser solo boletines PDF mensuales retrospectivos, no una agenda, así que
// NO se usa como fuente de agenda.

const EVENTOS_URL =
  "https://www.archisevilla.org/wp-json/tribe/events/v1/events";
const FUENTE = "Agenda — Archidiócesis de Sevilla";

export async function obtenerProximosActos() {
  const respuesta = await fetch(`${EVENTOS_URL}?per_page=25`);

  if (!respuesta.ok) {
    throw new Error(
      `API de eventos de archisevilla.org respondió ${respuesta.status}`
    );
  }

  const datos = await respuesta.json();
  const eventos = datos.events || [];

  return eventos.map((evento) => ({
    titulo: (evento.title || "").trim(),
    url: evento.url,
    fecha: evento.start_date || null,
    fuente: FUENTE,
    esAgenda: true,
  }));
}
