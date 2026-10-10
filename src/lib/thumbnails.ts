/**
 * Asigna miniaturas fotográficas de alta resolución con 100% de correlación temática
 * con el título, tema y slug de cada competencia, eliminando repeticiones erróneas.
 */

const SLUG_IMAGE_MAP: Record<string, string> = {
  // Fútbol y deportes
  "clasico-local-domingo": "/images/events/clasico.jpg",
  "final-universitaria-goles": "/images/events/goles.jpg",
  "torneo-bao-copa-cancelado": "/images/events/basket.jpg",
  "basket-3x3-nocturno": "/images/events/basket.jpg",
  "decathlon-secret-que-termino": "/images/events/atletismo.jpg",
  "maraton-ciclismo-subida": "/images/events/ciclismo.jpg",
  "torneo-tenis-campus": "/images/events/tenis.jpg",
  "torneo-padel-universitario": "/images/events/padel.jpg",

  // eSports y Videojuegos
  "fifa-facultad-ganador": "/images/events/fifa.jpg",
  "goles-capital-derby": "/images/events/esports-derby.jpg",
  "campeonato-valorant": "/images/events/esports-derby.jpg",
  "campeonato-counter-strike": "/images/events/counter-strike.jpg",
  "torneo-rocket-league": "/images/events/rocket-league.jpg",
  "torneo-ajedrez-final": "/images/events/ajedrez-final.jpg",
  "torneo-ajedrez-semifinal": "/images/events/ajedrez.jpg",
  "torneo-ajedrez-campus": "/images/events/ajedrez.jpg",

  // Académico e investigación con correlación estricta
  "quimica-lab-experiencia": "/images/events/quimica.jpg",
  "sorteo-vocales-semestre": "/images/events/elecciones.jpg",
  "eleccion-representante": "/images/events/elecciones.jpg",
  "feria-innovacion-proyecto": "/images/events/innovacion.jpg",
  "feria-innovacion-ganador": "/images/events/innovacion.jpg",
  "hackathon-ia-ganador": "/images/events/hackathon.jpg",
  "olimpiadas-matematicas": "/images/events/matematicas.jpg",

  // Comunidad y Universidad
  "asa-de-la-u-clausura": "/images/events/festival.jpg",
  "lorica-clasica-cafe": "/images/events/cafe.jpg",
  "quiz-banderas-continental": "/images/events/banderas.jpg",
  "concurso-fotografia-campus": "/images/events/fotografia.jpg",

  // Entretenimiento y Cultura
  "taquilla-fin-de-semana": "/images/events/peliculas.jpg",
  "taquilla-fin-semana": "/images/events/peliculas.jpg",
  "quien-abre-el-concierto": "/images/events/concierto.jpg",
  "batalla-freestyle-u": "/images/events/freestyle.jpg",

  // Clima y Medio Ambiente
  "lluvia-cucuta-sabado": "/images/events/lluvia.jpg",
  "temperatura-bogota-domingo": "/images/events/temperatura.jpg",
  "eco-challenge-quiz-energia": "/images/events/energia.jpg",
};

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  deportes: "/images/categories/deportes.jpg",
  esports: "/images/categories/esports.jpg",
  clima: "/images/categories/clima.jpg",
  entretenimiento: "/images/categories/entretenimiento.jpg",
  academico: "/images/categories/academico.jpg", // Biblioteca y estudio universitario general
  comunidad: "/images/categories/comunidad.jpg",
  otro: "/images/categories/otro.jpg",
};

/**
 * Búsqueda semántica por palabras clave para correlacionar con precisión
 * competencias creadas dinámicamente por los administradores.
 */
function matchSemanticCorrelation(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("quimic") || t.includes("laboratorio") || t.includes("reaccion") || t.includes("tubo")) {
    return "/images/events/quimica.jpg";
  }
  if (t.includes("vocal") || t.includes("eleccion") || t.includes("representant") || t.includes("votacion") || t.includes("urna")) {
    return "/images/events/elecciones.jpg";
  }
  if (t.includes("hackathon") || t.includes("prompt") || t.includes("programacion") || t.includes("software")) {
    return "/images/events/hackathon.jpg";
  }
  if (t.includes("innovacion") || t.includes("feria") || t.includes("robot") || t.includes("proyecto") || t.includes("tecnolog")) {
    return "/images/events/innovacion.jpg";
  }
  if (t.includes("matematica") || t.includes("olimpiada") || t.includes("calculo") || t.includes("algebra")) {
    return "/images/events/matematicas.jpg";
  }
  if (t.includes("ajedrez") && (t.includes("final") || t.includes("campeon"))) {
    return "/images/events/ajedrez-final.jpg";
  }
  if (t.includes("ajedrez")) {
    return "/images/events/ajedrez.jpg";
  }
  if (t.includes("ciclismo") || t.includes("bicicleta") || t.includes("montaña") || t.includes("ruta")) {
    return "/images/events/ciclismo.jpg";
  }
  if (t.includes("tenis") || t.includes("raqueta") || t.includes("court")) {
    return "/images/events/tenis.jpg";
  }
  if (t.includes("padel") || t.includes("pádel")) {
    return "/images/events/padel.jpg";
  }
  if (t.includes("counter") || t.includes("strike") || t.includes("csgo") || t.includes("cs2")) {
    return "/images/events/counter-strike.jpg";
  }
  if (t.includes("rocket") || t.includes("league")) {
    return "/images/events/rocket-league.jpg";
  }
  if (t.includes("freestyle") || t.includes("rap") || t.includes("rimas") || t.includes("gallo")) {
    return "/images/events/freestyle.jpg";
  }
  if (t.includes("temperatura") || t.includes("calor") || t.includes("grados") || t.includes("termometro")) {
    return "/images/events/temperatura.jpg";
  }
  if (t.includes("fotografia") || t.includes("foto") || t.includes("camara") || t.includes("lente")) {
    return "/images/events/fotografia.jpg";
  }
  if (t.includes("lluvia") || t.includes("clima") || t.includes("meteorolog") || t.includes("precipitacion")) {
    return "/images/events/lluvia.jpg";
  }
  if (t.includes("taquilla") || t.includes("pelicula") || t.includes("cine") || t.includes("estreno")) {
    return "/images/events/peliculas.jpg";
  }
  if (t.includes("fifa") || t.includes("consola")) {
    return "/images/events/fifa.jpg";
  }
  if (t.includes("derbi") || t.includes("derby") || t.includes("valorant") || t.includes("videojuego") || t.includes("gamer")) {
    return "/images/events/esports-derby.jpg";
  }
  if (t.includes("basket") || t.includes("basquet") || t.includes("baloncesto")) {
    return "/images/events/basket.jpg";
  }
  if (t.includes("decathlon") || t.includes("atletismo") || t.includes("carrera") || t.includes("pista")) {
    return "/images/events/atletismo.jpg";
  }
  if (t.includes("bandera") || t.includes("mural")) {
    return "/images/events/banderas.jpg";
  }
  if (t.includes("energia") || t.includes("kwh") || t.includes("solar") || t.includes("eco")) {
    return "/images/events/energia.jpg";
  }
  if (t.includes("concierto") || t.includes("banda") || t.includes("musica") || t.includes("rock")) {
    return "/images/events/concierto.jpg";
  }
  if (t.includes("festival") || t.includes("asistente") || t.includes("clausura")) {
    return "/images/events/festival.jpg";
  }
  if (t.includes("cafe") || t.includes("cafeteria") || t.includes("debate")) {
    return "/images/events/cafe.jpg";
  }
  if (t.includes("gol") || t.includes("goles")) {
    return "/images/events/goles.jpg";
  }
  if (t.includes("clasico") || t.includes("partido") || t.includes("futbol")) {
    return "/images/events/clasico.jpg";
  }
  return null;
}

export function getCompetitionThumbnail(
  slug?: string,
  category?: string,
  customCover?: string,
  title?: string,
): string {
  // 1. Si ya tiene una URL de imagen válida proporcionada directamente
  if (customCover && (customCover.startsWith("/") || customCover.startsWith("http"))) {
    return customCover;
  }

  // 2. Mapeo estricto por slug
  if (slug && SLUG_IMAGE_MAP[slug]) {
    return SLUG_IMAGE_MAP[slug];
  }

  // 3. Correlación semántica por título si se suministra
  if (title) {
    const semanticMatch = matchSemanticCorrelation(title);
    if (semanticMatch) return semanticMatch;
  }

  // 4. Correlación semántica por slug
  if (slug) {
    const semanticMatch = matchSemanticCorrelation(slug);
    if (semanticMatch) return semanticMatch;
  }

  // 5. Fallback por categoría
  if (category && CATEGORY_IMAGE_MAP[category]) {
    return CATEGORY_IMAGE_MAP[category];
  }

  return "/images/categories/deportes.jpg";
}
