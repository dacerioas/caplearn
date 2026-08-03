const { GoogleGenAI } = require("@google/genai");

const MODELO_PRINCIPAL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const MODELO_RESPALDO = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";
const MODELOS_CANDIDATOS = [...new Set([MODELO_PRINCIPAL, MODELO_RESPALDO].filter(Boolean))];
const INTENTOS_POR_MODELO = 2;
const MAX_SOURCE_CHARS = 12000;

let client = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const TASK_PROMPTS = {
  flashcards: {
    instruction:
      "Genera entre 8 y 12 flashcards de estudio a partir del material. Cada flashcard debe tener una pregunta clara y una respuesta concisa.",
    schema: `{"flashcards": [{"question": string, "answer": string, "subject": string, "difficulty": "facil"|"medio"|"dificil"}]}`,
  },
  summary: {
    instruction:
      "Genera un resumen claro y estructurado del material, con un resumen general y una lista de puntos clave.",
    schema: `{"summary": string, "keyPoints": [string]}`,
  },
  quiz: {
    instruction:
      "Genera un quiz de 6 a 9 preguntas basadas en el material, combinando tres tipos: " +
      '"opcion_multiple" (con 4 opciones y una es correcta), "respuesta_corta" (se responde en una frase, incluye una respuesta modelo breve) y ' +
      '"desarrollo" (se responde con un párrafo, incluye una respuesta modelo más completa). ' +
      "Incluye al menos 3 preguntas de opcion_multiple, 1 o 2 de respuesta_corta y 1 o 2 de desarrollo. " +
      "Para las de opcion_multiple completa options y correctIndex y deja modelAnswer vacío. Para respuesta_corta y desarrollo deja options como lista vacía y correctIndex en -1, y completa modelAnswer.",
    schema: `{"questions": [{"type": "opcion_multiple"|"respuesta_corta"|"desarrollo", "question": string, "options": [string], "correctIndex": number, "modelAnswer": string, "explanation": string}]}`,
  },
  "key-concepts": {
    instruction: "Extrae los conceptos clave del material con una definición breve para cada uno.",
    schema: `{"concepts": [{"term": string, "definition": string}]}`,
  },
  "practice-questions": {
    instruction:
      "Genera entre 6 y 10 preguntas de práctica de desarrollo corto (no opción múltiple) con su respuesta modelo.",
    schema: `{"questions": [{"question": string, "answer": string}]}`,
  },
  "topic-title": {
    instruction:
      "Genera metadatos para este material de estudio: " +
      "1) un título corto y descriptivo (máximo 6 palabras, sin comillas ni punto final); " +
      "2) una categoría, eligiendo EXACTAMENTE una de estas opciones: Ciencias, Historia, Geografía, Matemáticas, Literatura, Otro; " +
      "3) una descripción de una sola frase (máximo 110 caracteres) que resuma de qué trata el material.",
    schema: `{"titulo": string, "categoria": "Ciencias"|"Historia"|"Geografía"|"Matemáticas"|"Literatura"|"Otro", "descripcion": string}`,
  },
};

function requireClient() {
  const ai = getClient();
  if (!ai) {
    const err = new Error("Falta configurar GEMINI_API_KEY en server/.env");
    err.code = "MISSING_API_KEY";
    throw err;
  }
  return ai;
}

function mapearErrorGemini(err) {
  if (err.status === 401 || err.status === 403) {
    const err2 = new Error(
      "La GEMINI_API_KEY configurada en server/.env no es válida. Revísala en aistudio.google.com/apikey."
    );
    err2.code = "INVALID_API_KEY";
    return err2;
  }
  if (err.status === 429) {
    const err3 = new Error("Se alcanzó el límite de uso de la API de Gemini. Intenta de nuevo en unos minutos.");
    err3.code = "RATE_LIMITED";
    return err3;
  }
  if (err.status === 503) {
    const err4 = new Error("El modelo de IA está saturado en este momento. Intenta de nuevo en unos segundos.");
    err4.code = "SERVICE_OVERLOADED";
    return err4;
  }
  return err;
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Intenta generar contenido probando cada modelo candidato (principal y de respaldo),
// con varios intentos por modelo si el motivo del fallo es saturación temporal.
async function generarConRespaldo(ai, { contents, config }) {
  let ultimoError;

  for (const modelo of MODELOS_CANDIDATOS) {
    for (let intento = 1; intento <= INTENTOS_POR_MODELO; intento++) {
      try {
        return await ai.models.generateContent({ model: modelo, contents, config });
      } catch (err) {
        const errorMapeado = mapearErrorGemini(err);

        if (errorMapeado.code === "INVALID_API_KEY" || errorMapeado.code === "MISSING_API_KEY") {
          throw errorMapeado;
        }

        ultimoError = errorMapeado;
        if (errorMapeado.code === "SERVICE_OVERLOADED" && intento < INTENTOS_POR_MODELO) {
          await esperar(1200);
        }
      }
    }
  }

  throw ultimoError;
}

async function generateFromText(text, type) {
  const task = TASK_PROMPTS[type];
  if (!task) throw new Error(`Tipo de generación desconocido: ${type}`);

  const ai = requireClient();

  const source = text.slice(0, MAX_SOURCE_CHARS);
  const prompt = `${task.instruction}\n\nEsquema JSON esperado:\n${task.schema}\n\nMaterial de estudio:\n"""\n${source}\n"""`;
  const config = {
    systemInstruction:
      "Eres un asistente de estudio. Respondes ÚNICAMENTE con JSON válido, sin texto adicional ni bloques de código markdown, que cumpla exactamente el esquema indicado.",
    responseMimeType: "application/json",
  };

  const MAX_INTENTOS_JSON = 2;
  let ultimoError;

  for (let intento = 1; intento <= MAX_INTENTOS_JSON; intento++) {
    const response = await generarConRespaldo(ai, { contents: prompt, config });

    const raw = (response.text || "").trim();
    try {
      return parseJsonResponse(raw);
    } catch (err) {
      ultimoError = err;
    }
  }

  throw ultimoError;
}

const CHAT_SYSTEM_INSTRUCTION =
  "Eres FlashBot, el asistente de estudio de la app CapLearn. Ayudas a estudiantes con dudas académicas, explicaciones de conceptos, técnicas de estudio y motivación. Respondes siempre en español, de forma clara, cercana y concisa (evita respuestas demasiado largas salvo que el usuario pida más detalle). Responde en texto plano: no uses formato Markdown (nada de asteriscos para negritas, guiones para listas, ni encabezados con #).";

const MAX_TURNOS_HISTORIAL = 20;

async function chatReply(historial) {
  const ai = requireClient();

  const contents = historial.slice(-MAX_TURNOS_HISTORIAL).map((turno) => ({
    role: turno.role === "model" ? "model" : "user",
    parts: [{ text: turno.text }],
  }));

  const response = await generarConRespaldo(ai, {
    contents,
    config: { systemInstruction: CHAT_SYSTEM_INSTRUCTION },
  });

  return (response.text || "").trim();
}

function parseJsonResponse(raw) {
  const cleaned = raw
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const err2 = new Error("La IA devolvió una respuesta que no se pudo interpretar como JSON.");
    err2.code = "BAD_AI_RESPONSE";
    err2.raw = cleaned;
    throw err2;
  }
}

module.exports = { generateFromText, chatReply, TASK_PROMPTS };
