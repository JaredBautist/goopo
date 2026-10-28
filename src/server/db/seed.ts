import type { Client } from "@libsql/client";
import { computePayouts } from "@/server/domain/payouts";

type SeededUser = {
  username: string;
  email: string;
  displayName: string;
  password: string;
  role: "participant" | "admin";
  birthDate: string; // YYYY-MM-DD
  initialBonus: number;
};

const DEMO_USERS: SeededUser[] = [
  { username: "admin_goopo", email: "admin@goopo.demo", displayName: "Administración Goopo", password: "Admin1234", role: "admin", birthDate: "1988-04-12", initialBonus: 0 },
  { username: "ana", email: "ana@goopo.demo", displayName: "Ana Restrepo", password: "Goopo1234", role: "participant", birthDate: "1998-02-20", initialBonus: 1000 },
  { username: "carlos", email: "carlos@goopo.demo", displayName: "Carlos Martínez", password: "Goopo1234", role: "participant", birthDate: "1995-07-08", initialBonus: 1000 },
  { username: "paula", email: "paula@goopo.demo", displayName: "Paula Gómez", password: "Goopo1234", role: "participant", birthDate: "2001-11-03", initialBonus: 1000 },
  { username: "julian", email: "julian@goopo.demo", displayName: "Julián Ospina", password: "Goopo1234", role: "participant", birthDate: "1993-05-17", initialBonus: 1000 },
  { username: "valentina", email: "valentina@goopo.demo", displayName: "Valentina Ríos", password: "Goopo1234", role: "participant", birthDate: "2000-09-30", initialBonus: 1000 },
  { username: "sebas", email: "sebas@goopo.demo", displayName: "Sebastián Pardo", password: "Goopo1234", role: "participant", birthDate: "1996-03-22", initialBonus: 1000 },
  { username: "laura", email: "laura@goopo.demo", displayName: "Laura Cárdenas", password: "Goopo1234", role: "participant", birthDate: "1999-12-11", initialBonus: 1000 },
  { username: "mateo", email: "mateo@goopo.demo", displayName: "Mateo Vargas", password: "Goopo1234", role: "participant", birthDate: "2002-06-25", initialBonus: 1000 },
  { username: "daniela", email: "daniela@goopo.demo", displayName: "Daniela Soto", password: "Goopo1234", role: "participant", birthDate: "1997-08-14", initialBonus: 1000 },
  { username: "andres", email: "andres@goopo.demo", displayName: "Andrés Quintero", password: "Goopo1234", role: "participant", birthDate: "1994-10-05", initialBonus: 1000 },
  { username: "camila", email: "camila@goopo.demo", displayName: "Camila Duarte", password: "Goopo1234", role: "participant", birthDate: "2003-01-19", initialBonus: 1000 },
];

type SeededOption = { label: string; description?: string };

type SeededCompetition = {
  slug: string;
  title: string;
  description: string;
  category: string;
  coverEmoji: string;
  entryCost: number;
  maxParticipants: number | null;
  closesInMinutes: number; // relative to now
  resultInMinutes: number | null;
  status: "draft" | "open" | "closed" | "resolved" | "cancelled";
  tieRule: "split_equal" | "earliest_wins" | "refund_all";
  options: SeededOption[];
  winningOptionIndex: number | null;
  resolutionNote: string | null;
  cancelledReason: string | null;
  predictions: { username: string; optionIndex: number; minutesBeforeClose: number }[];
};

const COMPETITIONS: SeededCompetition[] = [
  // ---------- 6 OPEN ----------
  {
    slug: "clasico-local-domingo",
    title: "¿Quién ganará el clásico ficticio del domingo?",
    description: "Partido amistoso entre dos selecciones ficticias universitarias. Pronostica el ganador.",
    category: "deportes",
    coverEmoji: "⚽",
    entryCost: 100,
    maxParticipants: null,
    closesInMinutes: 60 * 2,
    resultInMinutes: 60 * 4,
    status: "open",
    tieRule: "split_equal",
    options: [
      { label: "Gana el Equipo Tigres" },
      { label: "Empate" },
      { label: "Gana el Equipo Cóndores" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "daniela", optionIndex: 0, minutesBeforeClose: 340 },
      { username: "carlos", optionIndex: 1, minutesBeforeClose: 300 },
      { username: "paula", optionIndex: 0, minutesBeforeClose: 200 },
      { username: "julian", optionIndex: 2, minutesBeforeClose: 120 },
    ],
  },
  {
    slug: "lluvia-cucuta-sabado",
    title: "¿Lloverá en Cúcuta el sábado por la tarde?",
    description: "Consulta ficticia sobre el pronóstico del clima del fin de semana.",
    category: "clima",
    coverEmoji: "🌧️",
    entryCost: 50,
    maxParticipants: 30,
    closesInMinutes: 60 * 26,
    resultInMinutes: 60 * 40,
    status: "open",
    tieRule: "split_equal",
    options: [
      { label: "Lloverá" },
      { label: "No lloverá" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "valentina", optionIndex: 0, minutesBeforeClose: 1500 },
      { username: "sebas", optionIndex: 1, minutesBeforeClose: 1400 },
      { username: "mateo", optionIndex: 0, minutesBeforeClose: 900 },
    ],
  },
  {
    slug: "final-universitaria-goles",
    title: "¿Cuántos goles se marcarán en la final universitaria?",
    description: "Pronostica el total de goles del partido ficticio entre Turbo Leones y Río Sagrado.",
    category: "deportes",
    coverEmoji: "🥅",
    entryCost: 75,
    maxParticipants: null,
    closesInMinutes: 60 * 52,
    resultInMinutes: 60 * 56,
    status: "open",
    tieRule: "split_equal",
    options: [
      { label: "0 – 1 goles" },
      { label: "2 – 3 goles" },
      { label: "4 – 5 goles" },
      { label: "6 o más goles" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "laura", optionIndex: 1, minutesBeforeClose: 3000 },
      { username: "daniela", optionIndex: 2, minutesBeforeClose: 2500 },
      { username: "andres", optionIndex: 1, minutesBeforeClose: 1000 },
      { username: "camila", optionIndex: 0, minutesBeforeClose: 800 },
      { username: "julian", optionIndex: 3, minutesBeforeClose: 400 },
    ],
  },
  {
    slug: "fifa-facultad-ganador",
    title: "¿Quién ganará el torneo de FIFA de la facultad?",
    description: "Torneo de videojuegos entre 8 estudiantes ficticios. Elige al campeón.",
    category: "esports",
    coverEmoji: "🎮",
    entryCost: 100,
    maxParticipants: 40,
    closesInMinutes: 60 * 96,
    resultInMinutes: 60 * 100,
    status: "open",
    tieRule: "earliest_wins",
    options: [
      { label: "Campeón: Rockero_RK" },
      { label: "Campeón: NanoFast" },
      { label: "Campeón: ElProfesor22" },
      { label: "Campeón: LaComadre" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "carlos", optionIndex: 0, minutesBeforeClose: 5000 },
      { username: "paula", optionIndex: 1, minutesBeforeClose: 4500 },
    ],
  },
  {
    slug: "taquilla-fin-de-semana",
    title: "¿Qué película estrenada liderará la taquilla del fin de semana?",
    description: "Cuatro estrenos ficticios compiten por el primer lugar del box office demo.",
    category: "entretenimiento",
    coverEmoji: "🎬",
    entryCost: 50,
    maxParticipants: null,
    closesInMinutes: 60 * 70,
    resultInMinutes: 60 * 76,
    status: "open",
    tieRule: "split_equal",
    options: [
      { label: "Órbita Infinita" },
      { label: "La Sombra del Bosque" },
      { label: "Risa Infinita 3" },
      { label: "Tierra de Dragones" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "valentina", optionIndex: 0, minutesBeforeClose: 3400 },
      { username: "sebas", optionIndex: 2, minutesBeforeClose: 2800 },
      { username: "laura", optionIndex: 3, minutesBeforeClose: 600 },
    ],
  },
  {
    slug: "feria-innovacion-proyecto",
    title: "¿Qué proyecto ganará la feria de innovación?",
    description: "Jurado ficticio evaluará 4 proyectos estudiantiles el viernes. Pronostica el ganador.",
    category: "academico",
    coverEmoji: "🏆",
    entryCost: 120,
    maxParticipants: 25,
    closesInMinutes: 60 * 24 * 8,
    resultInMinutes: 60 * 24 * 9,
    status: "open",
    tieRule: "refund_all",
    options: [
      { label: "App de transporte sostenible" },
      { label: "Sensor de calidad del agua" },
      { label: "Plataforma de tutorías" },
      { label: "Robot clasificador de residuos" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "mateo", optionIndex: 2, minutesBeforeClose: 10000 },
    ],
  },

  // ---------- 3 CLOSED (esperando resultado) ----------
  {
    slug: "torneo-ajedrez-final",
    title: "¿Quién ganará la final del torneo de ajedrez?",
    description: "Final del torneo interno. Dos finalistas fictícios, cierre antes del resultado real.",
    category: "esports",
    coverEmoji: "♟️",
    entryCost: 100,
    maxParticipants: null,
    closesInMinutes: -45,
    resultInMinutes: 60 * 5,
    status: "closed",
    tieRule: "split_equal",
    options: [
      { label: "Gana Nadia Z." },
      { label: "Gana Iván M." },
      { label: "Empate en tablas" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "ana", optionIndex: 0, minutesBeforeClose: 3000 },
      { username: "carlos", optionIndex: 1, minutesBeforeClose: 2500 },
      { username: "julian", optionIndex: 0, minutesBeforeClose: 2000 },
      { username: "valentina", optionIndex: 2, minutesBeforeClose: 1500 },
      { username: "paula", optionIndex: 0, minutesBeforeClose: 900 },
    ],
  },
  {
    slug: "sorteo-vocales-semestre",
    title: "¿Cuál vocal será elegida representante del semestre?",
    description: "Elección interna de programación académica entre 3 candidatas ficticias.",
    category: "academico",
    coverEmoji: "🗳️",
    entryCost: 80,
    maxParticipants: null,
    closesInMinutes: -240,
    resultInMinutes: 60 * 24,
    status: "closed",
    tieRule: "earliest_wins",
    options: [
      { label: "Camila R." },
      { label: "Estefanía B." },
      { label: "Jorge A." },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "sebas", optionIndex: 0, minutesBeforeClose: 6000 },
      { username: "laura", optionIndex: 0, minutesBeforeClose: 5500 },
      { username: "daniela", optionIndex: 1, minutesBeforeClose: 4000 },
      { username: "mateo", optionIndex: 2, minutesBeforeClose: 1200 },
      { username: "ana", optionIndex: 0, minutesBeforeClose: 1000 },
    ],
  },
  {
    slug: "quimica-lab-experiencia",
    title: "¿Qué color tendrá la reacción final del laboratorio de química?",
    description: "Experimento demostrativo de docencia. Resultado revelado en clase el lunes.",
    category: "academico",
    coverEmoji: "🧪",
    entryCost: 60,
    maxParticipants: null,
    closesInMinutes: -60 * 20,
    resultInMinutes: 60 * 30,
    status: "closed",
    tieRule: "split_equal",
    options: [
      { label: "Azul intenso" },
      { label: "Verde pálido" },
      { label: "Morado intenso" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "andres", optionIndex: 0, minutesBeforeClose: 9999 },
      { username: "camila", optionIndex: 1, minutesBeforeClose: 8000 },
      { username: "carlos", optionIndex: 0, minutesBeforeClose: 5500 },
      { username: "paula", optionIndex: 2, minutesBeforeClose: 5400 },
    ],
  },

  // ---------- 6 RESUELTAS (todos los casos de reparto) ----------
  // Caso 1: un solo ganador
  {
    slug: "asa-de-la-u-clausura",
    title: "¿Cuántos asistentes tendrá el festival de la U?",
    description: "Evento cultural interno. Solo un participante acertó y se llevó todo el pozo.",
    category: "comunidad",
    coverEmoji: "🎪",
    entryCost: 100,
    maxParticipants: null,
    closesInMinutes: -60 * 24 * 6, // resolved 5 days ago
    resultInMinutes: null,
    status: "resolved",
    tieRule: "split_equal",
    options: [
      { label: "Menos de 500" },
      { label: "Entre 500 y 900" },
      { label: "Más de 900" },
    ],
    winningOptionIndex: 2,
    resolutionNote: "Asistieron 1.024 personas según el conteo del equipo organizador.",
    cancelledReason: null,
    predictions: [
      { username: "mateo", optionIndex: 2, minutesBeforeClose: 4300 },
      { username: "daniela", optionIndex: 0, minutesBeforeClose: 4000 },
      { username: "ana", optionIndex: 0, minutesBeforeClose: 3200 },
    ],
  },
  // Caso 2: split_equal con residuo (100 en pool, 3 ganadores => 33/33/33 y residuo 1 al primero)
  {
    slug: "lorica-clasica-cafe",
    title: "¿Quién será el ganador del debate argumentativo de la cafetería?",
    description: "Empate de 3 participantes con la misma opción correcta y regla repartida.",
    category: "comunidad",
    coverEmoji: "☕",
    entryCost: 100,
    maxParticipants: null,
    closesInMinutes: -60 * 24 * 5,
    resultInMinutes: null,
    status: "resolved",
    tieRule: "split_equal",
    options: [
      { label: "Gana el panel A" },
      { label: "Gana el panel B" },
      { label: "Gana el panel C" },
    ],
    winningOptionIndex: 0,
    resolutionNote: "Ganó el panel A. Empate de 3 pronósticos: reparto igual + residuo al primero.",
    cancelledReason: null,
    predictions: [
      { username: "ana", optionIndex: 0, minutesBeforeClose: 5000 },        // first with residual +1
      { username: "carlos", optionIndex: 0, minutesBeforeClose: 4600 },
      { username: "julian", optionIndex: 0, minutesBeforeClose: 3200 },
      { username: "valentina", optionIndex: 1, minutesBeforeClose: 2200 },
      { username: "paula", optionIndex: 1, minutesBeforeClose: 1400 },
    ],
  },
  // Caso 3: earliest_wins — tres ganadores con id distinto; el primero se lleva todo
  {
    slug: "quien-abre-el-concierto",
    title: "¿Qué banda abrirá el concierto de la fiesta de primavera?",
    description: "Regla earliest_wins: el primer pronóstico correcto cronológicamente se lleva todo el pozo.",
    category: "entretenimiento",
    coverEmoji: "🎸",
    entryCost: 100,
    maxParticipants: null,
    closesInMinutes: -60 * 24 * 4,
    resultInMinutes: null,
    status: "resolved",
    tieRule: "earliest_wins",
    options: [
      { label: "Los Atardeceres" },
      { label: "Sonido Gualí" },
      { label: "ElectroCumbia" },
    ],
    winningOptionIndex: 1,
    resolutionNote: "Abrió Sonido Gualí. Con earliest_wins el primer pronóstico correcto se lleva el pozo completo.",
    cancelledReason: null,
    predictions: [
      { username: "sebas", optionIndex: 1, minutesBeforeClose: 7000 },   // primera correcta
      { username: "laura", optionIndex: 1, minutesBeforeClose: 6400 },
      { username: "mateo", optionIndex: 1, minutesBeforeClose: 4900 },
      { username: "daniela", optionIndex: 2, minutesBeforeClose: 3500 },
    ],
  },
  // Caso 4: refund_all con empate
  {
    slug: "goles-capital-derby",
    title: "¿Cuántos puntos tendrá la partida final del derbi de videojuegos?",
    description: "Empate entre 2 participantes: con refund_all el empate anula y todos se reembolsan.",
    category: "esports",
    coverEmoji: "🕹️",
    entryCost: 100,
    maxParticipants: null,
    closesInMinutes: -60 * 24 * 3,
    resultInMinutes: null,
    status: "resolved",
    tieRule: "refund_all",
    options: [
      { label: "Menos de 30" },
      { label: "Entre 30 y 40" },
      { label: "Más de 40" },
    ],
    winningOptionIndex: 1,
    resolutionNote: "Empate de 2 con refund_all: empate anulado, todos reembolsados.",
    cancelledReason: null,
    predictions: [
      { username: "andres", optionIndex: 1, minutesBeforeClose: 6200 },
      { username: "camila", optionIndex: 1, minutesBeforeClose: 5500 },
      { username: "valentina", optionIndex: 0, minutesBeforeClose: 4000 },
    ],
  },
  // Caso 5: sin ganadores → reembolso total
  {
    slug: "decathlon-secret-que-termino",
    title: "¿En qué posición quedará el equipo en el mini-decathlon?",
    description: "Nadie acertó: todas las participaciones fueron reembolsadas.",
    category: "deportes",
    coverEmoji: "🥇",
    entryCost: 80,
    maxParticipants: null,
    closesInMinutes: -60 * 24 * 2,
    resultInMinutes: null,
    status: "resolved",
    tieRule: "split_equal",
    options: [
      { label: "Primero" },
      { label: "Segundo" },
      { label: "Tercero o más" },
    ],
    winningOptionIndex: 0,
    resolutionNote: "Nadie eligió la opción correcta; se reembolsó el 100% a los 3 participantes.",
    cancelledReason: null,
    predictions: [
      { username: "mateo", optionIndex: 1, minutesBeforeClose: 2800 },
      { username: "ana", optionIndex: 2, minutesBeforeClose: 2400 },
      { username: "sebas", optionIndex: 2, minutesBeforeClose: 1800 },
    ],
  },
  // Caso 6: split_equal sin residuo, muchos ganadores
  {
    slug: "quiz-banderas-continental",
    title: "¿Cuántas banderas se pintaron en el mural continental?",
    description: "Reparto exacto sin residuo entre 4 acertantes.",
    category: "comunidad",
    coverEmoji: "🖼️",
    entryCost: 100,
    maxParticipants: null,
    closesInMinutes: -60 * 24,
    resultInMinutes: null,
    status: "resolved",
    tieRule: "split_equal",
    options: [
      { label: "10 – 15 banderas" },
      { label: "16 – 20 banderas" },
      { label: "21 – 25 banderas" },
    ],
    winningOptionIndex: 1,
    resolutionNote: "Se pintaron 18. Cuatro participantes acertaron: reparto exacto de 200 entre 4.",
    cancelledReason: null,
    predictions: [
      { username: "carlos", optionIndex: 1, minutesBeforeClose: 5000 },
      { username: "paula", optionIndex: 1, minutesBeforeClose: 4200 },
      { username: "laura", optionIndex: 1, minutesBeforeClose: 3600 },
      { username: "julian", optionIndex: 1, minutesBeforeClose: 2900 },
      { username: "daniela", optionIndex: 0, minutesBeforeClose: 2200 },
    ],
  },

  // ---------- 1 CANCELADA ----------
  {
    slug: "torneo-bao-copa-cancelado",
    title: "¿Qué equipo ganará la copa de mini-básquet?",
    description: "Cancelada por el organizador por baja insuficiencia de suficientes inscripciones.",
    category: "deportes",
    coverEmoji: "🏀",
    entryCost: 100,
    maxParticipants: 20,
    closesInMinutes: -60 * 24 * 8,
    resultInMinutes: null,
    status: "cancelled",
    tieRule: "split_equal",
    options: [
      { label: "Tigres Sur" },
      { label: "Aguilas Norte" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: "No se alcanzó el cupo mínimo de competidores y el evento fue cancelado.",
    predictions: [
      { username: "mateo", optionIndex: 0, minutesBeforeClose: 9000 },
      { username: "laura", optionIndex: 1, minutesBeforeClose: 7000 },
      { username: "valentina", optionIndex: 0, minutesBeforeClose: 5500 },
    ],
  },

  // ---------- 2 BORRADORES ----------
  {
    slug: "torneo-ajedrez-semifinal",
    title: "¿Quién ganará la semifinal de ajedrez?",
    description: "Borrador: la semifinal aún no tiene fecha confirmada.",
    category: "esports",
    coverEmoji: "⏳",
    entryCost: 90,
    maxParticipants: null,
    closesInMinutes: 60 * 24 * 20,
    resultInMinutes: null,
    status: "draft",
    tieRule: "split_equal",
    options: [
      { label: "Gana Nadia Z." },
      { label: "Gana Iván M." },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [],
  },
  {
    slug: "eco-challenge-quiz-energia",
    title: "¿Cuántos kWh consumirá la facultad en la próxima semana?",
    description: "Borrador: falta definir el medidor oficial de referencia.",
    category: "otro",
    coverEmoji: "⚡",
    entryCost: 70,
    maxParticipants: null,
    closesInMinutes: 60 * 24 * 14,
    resultInMinutes: null,
    status: "draft",
    tieRule: "split_equal",
    options: [
      { label: "Menos de 3.000 kWh" },
      { label: "Entre 3.000 y 4.500 kWh" },
      { label: "Más de 4.500 kWh" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [],
  },

  // ---------- EXPANDED CATALOG (10 NUEVAS COMPETENCIAS CON CORRELACIÓN ÚNICA) ----------
  {
    slug: "maraton-ciclismo-subida",
    title: "¿Quién coronará el premio de montaña en el ascenso universitario?",
    description: "Circuito de ruta ciclística de 45 km entre las dos sedes del campus universitario.",
    category: "deportes",
    coverEmoji: "🚴",
    entryCost: 100,
    maxParticipants: 50,
    closesInMinutes: 60 * 18,
    resultInMinutes: 60 * 22,
    status: "open",
    tieRule: "split_equal",
    options: [
      { label: "Santiago Gómez (Sede Central)" },
      { label: "Esteban Morales (Facultad Salud)" },
      { label: "Felipe Caicedo (Ingeniería)" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "carlos", optionIndex: 0, minutesBeforeClose: 800 },
      { username: "mateo", optionIndex: 1, minutesBeforeClose: 600 },
      { username: "andres", optionIndex: 2, minutesBeforeClose: 350 },
    ],
  },
  {
    slug: "hackathon-ia-ganador",
    title: "¿Qué equipo obtendrá el primer puesto en el Hackathon de Inteligencia Artificial?",
    description: "Competencia de desarrollo de software con modelos de lenguaje y visión artificial.",
    category: "academico",
    coverEmoji: "💻",
    entryCost: 150,
    maxParticipants: 40,
    closesInMinutes: 60 * 36,
    resultInMinutes: 60 * 48,
    status: "open",
    tieRule: "split_equal",
    options: [
      { label: "Equipo NeuralTech" },
      { label: "Equipo PromptDevs" },
      { label: "Equipo ByteVision" },
      { label: "Equipo QuantumCode" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "camila", optionIndex: 0, minutesBeforeClose: 1400 },
      { username: "sebas", optionIndex: 1, minutesBeforeClose: 1200 },
      { username: "paula", optionIndex: 2, minutesBeforeClose: 800 },
      { username: "laura", optionIndex: 0, minutesBeforeClose: 400 },
    ],
  },
  {
    slug: "torneo-tenis-campus",
    title: "¿Quién se llevará la final del torneo de tenis de campo?",
    description: "Gran final en cancha rápida entre los dos mejores clasificados del ranking semestral.",
    category: "deportes",
    coverEmoji: "🎾",
    entryCost: 80,
    maxParticipants: null,
    closesInMinutes: 60 * 12,
    resultInMinutes: 60 * 15,
    status: "open",
    tieRule: "split_equal",
    options: [
      { label: "Nicolás Mejía" },
      { label: "Alejandro Falla" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "julian", optionIndex: 0, minutesBeforeClose: 500 },
      { username: "valentina", optionIndex: 1, minutesBeforeClose: 300 },
    ],
  },
  {
    slug: "campeonato-counter-strike",
    title: "¿Quién ganará el mapa decisivo en la final de Counter-Strike?",
    description: "Final universitaria en el mapa Mirage al mejor de 24 rondas.",
    category: "esports",
    coverEmoji: "🎯",
    entryCost: 120,
    maxParticipants: 25,
    closesInMinutes: 60 * 8,
    resultInMinutes: 60 * 10,
    status: "open",
    tieRule: "split_equal",
    options: [
      { label: "Alpha Squad" },
      { label: "Nemesis Clan" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "sebas", optionIndex: 0, minutesBeforeClose: 400 },
      { username: "mateo", optionIndex: 1, minutesBeforeClose: 200 },
      { username: "daniela", optionIndex: 0, minutesBeforeClose: 100 },
    ],
  },
  {
    slug: "batalla-freestyle-u",
    title: "¿Quién ganará la batalla de rap y lírica del campus?",
    description: "Encuentro cultural en la plazoleta con jurado de 3 jueces invitados.",
    category: "entretenimiento",
    coverEmoji: "🎤",
    entryCost: 60,
    maxParticipants: null,
    closesInMinutes: 60 * 44,
    resultInMinutes: 60 * 50,
    status: "open",
    tieRule: "split_equal",
    options: [
      { label: "MC Trueno Local" },
      { label: "Kódigo Ficticio" },
      { label: "Lírica Pura" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "carlos", optionIndex: 1, minutesBeforeClose: 1200 },
      { username: "camila", optionIndex: 0, minutesBeforeClose: 900 },
    ],
  },
  {
    slug: "temperatura-bogota-domingo",
    title: "¿Superará los 21°C la temperatura máxima en Bogotá este domingo?",
    description: "Medición tomada de la estación meteorológica oficial del aeropuerto El Dorado a las 2:00 PM.",
    category: "clima",
    coverEmoji: "☀️",
    entryCost: 50,
    maxParticipants: 100,
    closesInMinutes: 60 * 60,
    resultInMinutes: 60 * 72,
    status: "open",
    tieRule: "split_equal",
    options: [
      { label: "Sí, superará los 21°C" },
      { label: "No, quedará en 21°C o menos" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "andres", optionIndex: 0, minutesBeforeClose: 2500 },
      { username: "paula", optionIndex: 1, minutesBeforeClose: 2100 },
      { username: "laura", optionIndex: 1, minutesBeforeClose: 1800 },
    ],
  },
  {
    slug: "concurso-fotografia-campus",
    title: "¿Qué temática ganará el primer premio en el concurso fotográfico?",
    description: "Evaluación de la galería de 40 fotos expuestas en la biblioteca central.",
    category: "comunidad",
    coverEmoji: "📷",
    entryCost: 80,
    maxParticipants: null,
    closesInMinutes: -60 * 24 * 3,
    resultInMinutes: -60 * 24 * 2,
    status: "resolved",
    tieRule: "split_equal",
    options: [
      { label: "Retratos del Campus" },
      { label: "Arquitectura y Luces" },
      { label: "Naturaleza Urbana" },
    ],
    winningOptionIndex: 0,
    resolutionNote: "El jurado otorgó el premio mayor a la serie de retratos en blanco y negro.",
    cancelledReason: null,
    predictions: [
      { username: "valentina", optionIndex: 0, minutesBeforeClose: 3000 },
      { username: "mateo", optionIndex: 0, minutesBeforeClose: 2400 },
      { username: "sebas", optionIndex: 1, minutesBeforeClose: 1800 },
      { username: "ana", optionIndex: 2, minutesBeforeClose: 1200 },
    ],
  },
  {
    slug: "torneo-rocket-league",
    title: "¿Quién ganará el partido final en Rocket League?",
    description: "Enfrentamiento 3v3 de autos a propulsión en estadio virtual Neo Tokyo.",
    category: "esports",
    coverEmoji: "🚀",
    entryCost: 110,
    maxParticipants: 16,
    closesInMinutes: -60 * 5,
    resultInMinutes: 60 * 2,
    status: "closed",
    tieRule: "split_equal",
    options: [
      { label: "Team Nitro" },
      { label: "Cyber Boost" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: null,
    predictions: [
      { username: "julian", optionIndex: 0, minutesBeforeClose: 200 },
      { username: "carlos", optionIndex: 1, minutesBeforeClose: 150 },
      { username: "andres", optionIndex: 0, minutesBeforeClose: 80 },
    ],
  },
  {
    slug: "olimpiadas-matematicas",
    title: "¿Cuántos problemas resolverá el ganador de la olimpiada de matemáticas?",
    description: "Prueba de 6 preguntas de teoría de números, combinatoria y geometría.",
    category: "academico",
    coverEmoji: "📐",
    entryCost: 75,
    maxParticipants: 30,
    closesInMinutes: -60 * 24 * 5,
    resultInMinutes: -60 * 24 * 4,
    status: "resolved",
    tieRule: "split_equal",
    options: [
      { label: "Menos de 4 problemas" },
      { label: "Entre 4 y 5 problemas" },
      { label: "Los 6 problemas completos" },
    ],
    winningOptionIndex: 1,
    resolutionNote: "El primer puesto resolvió 5 de los 6 problemas con demostración impecable.",
    cancelledReason: null,
    predictions: [
      { username: "paula", optionIndex: 1, minutesBeforeClose: 4000 },
      { username: "laura", optionIndex: 1, minutesBeforeClose: 3200 },
      { username: "daniela", optionIndex: 0, minutesBeforeClose: 2600 },
    ],
  },
  {
    slug: "torneo-padel-universitario",
    title: "¿Qué dupla levantará la copa del torneo relámpago de pádel?",
    description: "Cancelada por tormenta eléctrica que inhabilitó las canchas de cristal descubiertas.",
    category: "deportes",
    coverEmoji: "🎾",
    entryCost: 100,
    maxParticipants: 16,
    closesInMinutes: -60 * 24 * 6,
    resultInMinutes: null,
    status: "cancelled",
    tieRule: "split_equal",
    options: [
      { label: "Pareja Gómez / Silva" },
      { label: "Pareja Ospina / Castro" },
    ],
    winningOptionIndex: null,
    resolutionNote: null,
    cancelledReason: "Tormenta eléctrica inhabilitó las instalaciones deportivas. Inscripción reembolsada al 100%.",
    predictions: [
      { username: "carlos", optionIndex: 0, minutesBeforeClose: 6000 },
      { username: "sebas", optionIndex: 1, minutesBeforeClose: 4500 },
    ],
  },
];

async function doSeed(client: Client) {
  const now = new Date();
  const userIds = new Map<string, string>();
  const balances = new Map<string, number>();

  for (const u of DEMO_USERS) {
    const id = crypto.randomUUID();
    userIds.set(u.username, id);

    await client.execute({
      sql: `INSERT INTO users (id, email, username, display_name, password_hash, role, birth_date, age_confirmed_at, status, balance, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        u.email.toLowerCase(),
        u.username,
        u.displayName,
        await hashPassword(u.password),
        u.role,
        u.birthDate,
        u.birthDate ? new Date().toISOString() : null,
        "active",
        u.initialBonus,
        new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
      ],
    });

    if (u.initialBonus > 0) {
      await client.execute({
        sql: `INSERT INTO wallet_transactions (id, user_id, type, amount, balance_after, note, created_at)
              VALUES (?, ?, 'signup_bonus', ?, ?, 'Bonificación de bienvenida (demo)', ?)`,
        args: [
          crypto.randomUUID(),
          id,
          u.initialBonus,
          u.initialBonus,
          new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        ],
      });
      balances.set(u.username, u.initialBonus);
    }
  }

  // Competencias
  const resolvedPerUser = new Map<string, { wins: number; played: number; net: number }>();
  for (const username of userIds.keys()) {
    resolvedPerUser.set(username, { wins: 0, played: 0, net: 0 });
  }

  for (const c of COMPETITIONS) {
    const compId = crypto.randomUUID();
    const adminId = userIds.get("admin_goopo")!;
    const closesAt = new Date(now.getTime() + c.closesInMinutes * 60 * 1000);
    const opensAt = new Date(closesAt.getTime() - 60 * 24 * 60 * 1000 * 7); // 7 days before close
    const resultAt = c.resultInMinutes != null
      ? new Date(now.getTime() + c.resultInMinutes * 60 * 1000).toISOString()
      : null;
    const resolvedAt =
      c.status === "resolved"
        ? new Date(closesAt.getTime() + 60 * 60 * 1000).toISOString()
        : null;

    await client.execute({
      sql: `INSERT INTO competitions (id, slug, title, description, category, cover_emoji, rules_text, entry_cost, max_participants, opens_at, closes_at, expected_result_at, status, tie_rule, winning_option_id, resolution_note, resolved_at, cancelled_reason, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        compId,
        c.slug,
        c.title,
        c.description,
        c.category,
        c.coverEmoji,
        buildRulesText(c),
        c.entryCost,
        c.maxParticipants,
        opensAt.toISOString(),
        closesAt.toISOString(),
        resultAt,
        c.status,
        c.tieRule,
        null,
        c.resolutionNote,
        resolvedAt,
        c.cancelledReason,
        adminId,
        new Date(closesAt.getTime() - 60 * 24 * 60 * 1000 * 8).toISOString(),
        new Date().toISOString(),
      ],
    });

    const optionIds: string[] = [];
    for (let i = 0; i < c.options.length; i++) {
      const oid = crypto.randomUUID();
      optionIds.push(oid);
      await client.execute({
        sql: `INSERT INTO options (id, competition_id, label, description, position) VALUES (?, ?, ?, ?, ?)`,
        args: [oid, compId, c.options[i]!.label, c.options[i]!.description ?? null, i],
      });
    }

    const winningOptionId =
      c.status === "resolved" && c.winningOptionIndex != null
        ? optionIds[c.winningOptionIndex] ?? null
        : null;
    if (winningOptionId) {
      await client.execute({
        sql: `UPDATE competitions SET winning_option_id = ? WHERE id = ?`,
        args: [winningOptionId, compId],
      });
    }

    // Predicciones coherentes con estado
    let pool = 0;
    const predRows: { userId: string; username: string; optionId: string; stake: number; createdAt: Date; correct: boolean; predictionRowId?: string }[] = [];
    for (const p of c.predictions) {
      const userId = userIds.get(p.username)!;
      const optionId = optionIds[p.optionIndex];
      if (!userId || !optionId) continue;
      const stake = c.entryCost;
      const createdAt = new Date(closesAt.getTime() - p.minutesBeforeClose * 60 * 1000);
      const correct = c.winningOptionIndex === p.optionIndex;
      const predictionRowId = crypto.randomUUID();
      predRows.push({ userId, username: p.username, optionId, stake, createdAt, correct, predictionRowId });
      pool += stake;

      const stats = resolvedPerUser.get(p.username)!;
      stats.played += 1;

      await client.execute({
        sql: `INSERT INTO predictions (id, competition_id, user_id, option_id, stake, status, payout, created_at)
              VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
        args: [
          predictionRowId,
          compId,
          userId,
          optionId,
          stake,
          "active",
          createdAt.toISOString(),
        ],
      });
    }

    if (c.status === "open" || c.status === "closed" || c.status === "cancelled" || c.status === "resolved") {
      for (const p of predRows) {
        const b = balances.get(p.username) ?? 0;
        const newBalance = b - p.stake;
        if (newBalance < 0) {
          throw new Error(`Seed invariant violated: negative balance for ${p.username}`);
        }
        balances.set(p.username, newBalance);
        await client.execute({
          sql: `INSERT INTO wallet_transactions (id, user_id, type, amount, balance_after, competition_id, note, created_at)
                VALUES (?, ?, 'stake', ?, ?, ?, ?, ?)`,
          args: [
            crypto.randomUUID(),
            p.userId,
            -p.stake,
            newBalance,
            compId,
            `Participación en: ${c.title}`,
            p.createdAt.toISOString(),
          ],
        });
      }
    }

    // Resolución — se usa el MISMO motor puro que producción (computePayouts)
    if (c.status === "resolved") {
      const outcome = computePayouts({
        pool,
        winningOptionId: c.winningOptionIndex != null ? optionIds[c.winningOptionIndex] ?? null : null,
        tieRule: c.tieRule,
        predictions: predRows.map((p, i) => ({
          id: p.predictionRowId!,
          userId: p.userId,
          optionId: p.optionId,
          stake: p.stake,
          createdAt: p.createdAt.toISOString(),
          seq: i,
        })),
      });

      let checkSum = 0;
      for (const o of outcome.outcomes) {
        checkSum += o.amount;
        await client.execute({
          sql: `UPDATE predictions SET status = ?, payout = ? WHERE id = ?`,
          args: [o.status, o.amount, o.predictionId],
        });

        if (o.amount > 0) {
          const u = predRows.find((p) => p.predictionRowId === o.predictionId)!;
          const b = balances.get(u.username) ?? 0;
          const newBalance = b + o.amount;
          balances.set(u.username, newBalance);
          await client.execute({
            sql: `INSERT INTO wallet_transactions (id, user_id, type, amount, balance_after, competition_id, note, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              crypto.randomUUID(),
              u.userId,
              o.status === "refunded" ? "refund" : "payout",
              o.amount,
              newBalance,
              compId,
              o.status === "refunded" ? `Reembolso: ${c.title}` : `Premio: ${c.title}`,
              resolvedAt!,
            ],
          });
        }

        const stats = resolvedPerUser.get(predRows.find((p) => p.predictionRowId === o.predictionId)!.username)!;
        if (o.status === "won") {
          stats.wins += 1;
          stats.net += o.amount - pool / Math.max(1, predRows.length);
        }
      }
      if (checkSum !== pool) {
        throw new Error(`Seed invariant violated: pool sum mismatch in ${c.slug}`);
      }
    }
  }

  // Escribir los saldos finales calculados en la tabla users
  for (const [username, finalBalance] of balances) {
    const id = userIds.get(username);
    if (!id) continue;
    await client.execute({
      sql: `UPDATE users SET balance = ?, updated_at = ? WHERE id = ?`,
      args: [finalBalance, new Date().toISOString(), id],
    });
  }

  // Verificar consistencia: balance == suma del ledger (solo para usuarios participantes del seed)
  await assertSeedConsistency(client);

  // Auditoría de muestra
  const adminId = userIds.get("admin_goopo")!;
  const sampleAudit: [string, string, string, string][] = [
    ["auth.register", "user", "seed-ana", "Ana registrada (demo)"],
    ["competition.create", "competition", "seed-comp", "Competencia de ejemplo creada"],
    ["competition.close", "competition", "seed-comp", "Competencia cerrada"],
    ["competition.resolve", "competition", "seed-comp", "Competencia resuelta"],
  ];
  for (const [action, entityType, entityId, note] of sampleAudit) {
    await client.execute({
      sql: `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        adminId,
        action,
        entityType,
        entityId,
        JSON.stringify({ note }),
        new Date().toISOString(),
      ],
    });
  }

  // Notificaciones de muestra
  const notifFor = (username: string) => userIds.get(username)!;
  const sampleNotifs: { username: string; title: string; body: string; href?: string }[] = [
    { username: "ana", title: "¡Bienvenida a Goopo!", body: "Recibiste 1.000 Goopos de bienvenida (demo).", href: "/billetera" },
    { username: "carlos", title: "¡Bienvenido a Goopo!", body: "Recibiste 1.000 Goopos de bienvenida (demo).", href: "/billetera" },
    { username: "carlos", title: "Tu pronóstico quedó registrado", body: "Participaste en el clásico del domingo.", href: "/mis-pronosticos" },
  ];
  for (let i = 0; i < sampleNotifs.length; i++) {
    const n = sampleNotifs[i]!;
    await client.execute({
      sql: `INSERT INTO notifications (id, user_id, title, body, href, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        notifFor(n.username),
        n.title,
        n.body,
        n.href ?? null,
        new Date(now.getTime() - (sampleNotifs.length - i) * 3600_000).toISOString(),
      ],
    });
  }
}

function buildRulesText(c: SeededCompetition): string {
  const opts = c.options.map((o, i) => `${i + 1}. ${o.label}`).join("\n");
  const tieExplained =
    c.tieRule === "split_equal"
      ? "Si varias personas aciertan, el pozo se reparte en partes iguales; el residuo se asigna a quien participó primero."
      : c.tieRule === "earliest_wins"
        ? "Si varias personas acertan, el primer pronóstico correcto (por fecha) se lleva todo el pozo."
        : "Si más de una persona acierta, el empate se anula y todos son reembolsados; si hay un único acertante, se lleva el pozo.";
  return [
    `## Reglas de la competencia`,
    ``,
    `**Evento:** ${c.title}`,
    ``,
    `### Opciones disponibles`,
    opts,
    ``,
    `### Costo de entrada`,
    `${c.entryCost} Goopos (G)`,
    ``,
    `### Cómo se determina el ganador`,
    `Gana quien haya pronosticado la opción correcta del resultado oficial del evento.`,
    ``,
    `### Regla de empate`,
    tieExplained,
    ``,
    `### Notas`,
    `- Una vez confirmada tu participación, **no puedes cambiarla ni retirarla**.`,
    `- La competencia cierra automáticamente en la fecha límite.`,
    `- Los Goopos son moneda virtual de demostración **sin valor real**.`,
  ].join("\n");
}

// bcryptjs se usa de forma perezosa para no bloquear la carga del módulo en serverless
let bcryptFn: ((pw: string, saltRounds: number) => Promise<string>) | null = null;
async function hashPassword(pw: string): Promise<string> {
  const mod = await import("bcryptjs");
  const bcrypt = (mod as unknown as { default?: typeof mod }).default ?? mod;
  if (!bcryptFn) {
    bcryptFn = (pw2: string, saltRounds: number) =>
      (bcrypt as unknown as {
        hash: (pw: string, saltRounds: number) => Promise<string>;
      }).hash(pw2, saltRounds);
  }
  return (bcrypt as unknown as {
    hash: (pw: string, saltRounds: number) => Promise<string>;
  }).hash(pw, 10);
}

async function assertSeedConsistency(client: Client) {
  const users = await client.execute(`SELECT id, balance FROM users`);
  for (const row of users.rows) {
    const res = await client.execute({
      sql: `SELECT COALESCE(SUM(amount), 0) AS t FROM wallet_transactions WHERE user_id = ?`,
      args: [row.id as string],
    });
    const ledgerSum = Number(res.rows[0]?.t ?? 0);
    const balance = Number(row.balance ?? 0);
    if (ledgerSum !== balance) {
      throw new Error(
        `Seed consistency failed for user ${row.id}: balance=${balance}, ledger=${ledgerSum}`,
      );
    }
  }
}

/**
 * Seeds demo data (idempotent: skips if any user already exists).
 */
export async function seedDatabase(client: Client) {
  const r = await client.execute("SELECT COUNT(*) AS c FROM users");
  const count = Number(r.rows[0]?.c ?? 0);
  if (count > 0) {
    return; // already seeded
  }
  await doSeed(client);
}

export { DEMO_USERS, COMPETITIONS };

const DEMO_SLUGS = new Set(COMPETITIONS.map((c) => c.slug));
const DEMO_OPEN_COMPETITIONS = COMPETITIONS.filter((c) => c.status === "open");

/**
 * Los plazos del catálogo demo son relativos al momento del sembrado, así que
 * con el tiempo todas las competencias acaban cerradas y el catálogo queda
 * vacío. En modo demo, cuando no queda ninguna `open` y el catálogo es
 * exactamente el sembrado, reprogramamos las que se cerraron por vencimiento
 * (nunca las resueltas, canceladas ni cerradas manualmente).
 */
export async function refreshExpiredDemoCatalog(
  client: Client,
  now = new Date(),
): Promise<number> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return 0;
  if (DEMO_OPEN_COMPETITIONS.length === 0) return 0;

  const openCount = await client.execute(
    "SELECT COUNT(*) AS c FROM competitions WHERE status = 'open'",
  );
  if (Number(openCount.rows[0]?.c ?? 0) > 0) return 0;

  const catalog = await client.execute("SELECT slug FROM competitions");
  if (catalog.rows.length === 0) return 0;
  const isDemoCatalog = catalog.rows.every((row) => DEMO_SLUGS.has(String(row.slug)));
  if (!isDemoCatalog) return 0;

  let refreshed = 0;
  for (const c of DEMO_OPEN_COMPETITIONS) {
    const closesAt = new Date(now.getTime() + c.closesInMinutes * 60 * 1000);
    const opensAt = new Date(closesAt.getTime() - 7 * 24 * 60 * 60 * 1000);
    const resultAt =
      c.resultInMinutes != null
        ? new Date(now.getTime() + c.resultInMinutes * 60 * 1000).toISOString()
        : null;

    const res = await client.execute({
      sql: `UPDATE competitions
            SET status = 'open', opens_at = ?, closes_at = ?, expected_result_at = ?, updated_at = ?
            WHERE slug = ? AND status = 'closed' AND resolved_at IS NULL`,
      args: [
        opensAt.toISOString(),
        closesAt.toISOString(),
        resultAt,
        now.toISOString(),
        c.slug,
      ],
    });
    refreshed += res.rowsAffected;
  }

  if (refreshed > 0) {
    console.info(`[db] catálogo demo reprogramado: ${refreshed} competencias abiertas de nuevo`);
  }
  return refreshed;
}

