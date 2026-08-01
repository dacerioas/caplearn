async function obtenerDato(clave, porDefecto) {
  try {
    const res = await fetch(`/api/data/${encodeURIComponent(clave)}`);
    if (!res.ok) return porDefecto;
    const data = await res.json();
    return data.valor ?? porDefecto;
  } catch {
    return porDefecto;
  }
}

async function guardarDato(clave, valor) {
  try {
    await fetch(`/api/data/${encodeURIComponent(clave)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor }),
    });
  } catch {
    // Si falla el guardado, el usuario simplemente no conserva ese dato entre sesiones.
  }
}

// Migra el formato más viejo (un solo material + lista plana de tarjetas
// manuales) a una lista de "temas". No persiste nada todavía: eso lo hace
// obtenerMateriales() al final, ya combinado con los quizzes.
async function migrarTemasLegacy() {
  const temas = await obtenerDato("caplearn_temas", null);
  if (temas) return temas;

  const legacy = [];

  const materialViejo = await obtenerDato("caplearn_material_flashcards", null);
  if (materialViejo && materialViejo.flashcards && materialViejo.flashcards.length) {
    legacy.push({
      id: "material",
      nombre: materialViejo.fuente || "Material importado",
      origen: "archivo",
      flashcards: materialViejo.flashcards,
      creadoEn: materialViejo.guardadoEn || new Date().toISOString(),
    });
  }

  const manualViejo = await obtenerDato("caplearn_manual_flashcards", []);
  if (manualViejo && manualViejo.length) {
    legacy.push({
      id: "manual",
      nombre: "Tarjetas manuales",
      origen: "manual",
      flashcards: manualViejo,
      creadoEn: new Date().toISOString(),
    });
  }

  return legacy;
}

// Devuelve la biblioteca unificada de materiales (texto + flashcards + quiz
// en un solo registro por tema). Si el usuario todavía tiene datos de
// formatos anteriores (temas y quizzes guardados por separado), los combina
// una sola vez, conservando los ids para no perder el progreso de repaso ya
// guardado en el SRS.
async function obtenerMateriales() {
  const materiales = await obtenerDato("caplearn_materiales", null);
  if (materiales) return materiales;

  const migrados = [];

  const temasViejos = await migrarTemasLegacy();
  for (const tema of temasViejos) {
    migrados.push({
      id: tema.id,
      nombre: tema.nombre,
      texto: null,
      origen: tema.origen === "manual" ? "manual" : "archivo",
      creadoEn: tema.creadoEn || new Date().toISOString(),
      flashcards: tema.flashcards || null,
      quiz: null,
      mejorPuntaje: null,
      intentos: 0,
    });
  }

  const quizzesViejos = await obtenerDato("caplearn_quizzes", []);
  for (const quiz of quizzesViejos) {
    migrados.push({
      id: quiz.id,
      nombre: quiz.nombre,
      texto: null,
      origen: "archivo",
      creadoEn: quiz.creadoEn || new Date().toISOString(),
      flashcards: null,
      quiz: quiz.preguntas || null,
      mejorPuntaje: quiz.mejorPuntaje ?? null,
      intentos: quiz.intentos || 0,
    });
  }

  await guardarDato("caplearn_materiales", migrados);
  return migrados;
}

async function guardarMateriales(materiales) {
  await guardarDato("caplearn_materiales", materiales);
}

async function agregarMaterial(material) {
  const materiales = await obtenerMateriales();
  materiales.push(material);
  await guardarDato("caplearn_materiales", materiales);
  return materiales;
}

function generarIdTema() {
  return `tema_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
