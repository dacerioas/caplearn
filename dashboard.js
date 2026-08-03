function dibujarAnillo(circulo) {
  const radio = Number(circulo.getAttribute("r"));
  const circunferencia = 2 * Math.PI * radio;
  const porcentaje = Number(circulo.dataset.porcentaje || 0);

  circulo.style.strokeDasharray = `${circunferencia}`;
  circulo.style.strokeDashoffset = `${circunferencia * (1 - porcentaje / 100)}`;
}

async function obtenerImagenDeTema(tema) {
  try {
    const res = await fetch(`/api/images/tema?q=${encodeURIComponent(tema)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  } catch {
    return null;
  }
}

const ICONO_TEMA_RESPALDO = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>`;

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

const ETIQUETA_DIFICULTAD = { facil: "Fácil", medio: "Medio", dificil: "Difícil" };

const CATEGORIAS_VALIDAS = new Set(["Ciencias", "Historia", "Geografía", "Matemáticas", "Literatura", "Otro"]);

const CATEGORIA_INFO = {
  Ciencias: {
    color: "#9f7aea",
    icono: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v5.5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 8.5V3"/></svg>`,
  },
  Historia: {
    color: "#ed8936",
    icono: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
  },
  Geografía: {
    color: "#1A62F4",
    icono: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  },
  Matemáticas: {
    color: "#38b2ac",
    icono: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 9-18 9 18"/><path d="M8 13h8"/></svg>`,
  },
  Literatura: {
    color: "#48bb78",
    icono: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  },
  Otro: {
    color: "#a0aec0",
    icono: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
  },
};

function renderFlashcardReciente(tarjeta, material) {
  const dificultad = tarjeta.difficulty || "facil";
  const href = material ? `flashcards.html?tema=${encodeURIComponent(material.id)}` : "flashcards.html";
  const categoria = CATEGORIAS_VALIDAS.has(material && material.categoria) ? material.categoria : "Otro";
  const info = CATEGORIA_INFO[categoria];
  return `
    <div class="flashcard">
      <p class="fc-pregunta">${escaparHtml(tarjeta.question)}</p>
      <div class="fc-icono" style="color:${info.color}">${info.icono}</div>
      <p class="fc-respuesta">${escaparHtml(tarjeta.answer)}</p>
      <div class="fc-footer">
        <span class="fc-materia">${escaparHtml(tarjeta.subject || "")}</span>
        <span class="fc-dificultad ${dificultad}">${ETIQUETA_DIFICULTAD[dificultad] || dificultad}</span>
      </div>
      <a href="${href}" class="fc-estudiar">Estudiar <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
    </div>`;
}

function claveTarjeta(temaId, indice, pregunta) {
  return `${temaId}:${indice}:${(pregunta || "").slice(0, 30)}`;
}

function contarCompletadas(tema, srs) {
  return (tema.flashcards || []).filter((t, i) => {
    const registro = srs[claveTarjeta(tema.id, i, t.question)];
    return registro && registro.correcta === true;
  }).length;
}

(async () => {
  const [materiales, srs, stats] = await Promise.all([
    obtenerMateriales(),
    obtenerDato("caplearn_srs", {}),
    obtenerDato("caplearn_stats", {
      respuestasCorrectas: 0,
      respuestasIncorrectas: 0,
      rachaDias: 0,
      ultimoDiaEstudio: null,
    }),
  ]);

  const progresoPorTema = materiales.map((tema) => ({
    tema,
    completadas: contarCompletadas(tema, srs),
  }));

  const totalTarjetas = materiales.reduce((suma, t) => suma + (t.flashcards || []).length, 0);
  const totalCompletadas = progresoPorTema.reduce((suma, p) => suma + p.completadas, 0);
  const temasCompletados = progresoPorTema.filter(
    (p) => (p.tema.flashcards || []).length > 0 && p.completadas === p.tema.flashcards.length
  ).length;

  // ---------- Tu progreso ----------
  const totalRespuestas = stats.respuestasCorrectas + stats.respuestasIncorrectas;
  const dominio = totalRespuestas > 0 ? Math.round((stats.respuestasCorrectas / totalRespuestas) * 100) : 0;
  const progresoGeneral = totalTarjetas > 0 ? Math.round((totalCompletadas / totalTarjetas) * 100) : 0;

  document.getElementById("statTarjetas").textContent = totalCompletadas;
  document.getElementById("statRacha").textContent = stats.rachaDias || 0;
  document.getElementById("statTemas").textContent = temasCompletados;
  document.getElementById("statCorrectas").textContent = stats.respuestasCorrectas;
  document.getElementById("statIncorrectas").textContent = stats.respuestasIncorrectas;
  document.getElementById("statDominio").textContent = `${dominio}%`;
  document.getElementById("porcentajeTexto").textContent = `${progresoGeneral}%`;

  const anillo = document.getElementById("anilloRelleno");
  anillo.dataset.porcentaje = progresoGeneral;
  dibujarAnillo(anillo);

  // ---------- Tus temas / Continúa aprendiendo (comparten la misma tarjeta) ----------
  const temasDashboardGrid = document.getElementById("temasDashboardGrid");
  const temasDashboardVacio = document.getElementById("temasDashboardVacio");
  const imagenesCache = {};

  function tarjetaTemaHtml({ tema, completadas }) {
    const totalFlashcards = (tema.flashcards || []).length;
    const porcentaje = totalFlashcards ? Math.round((completadas / totalFlashcards) * 100) : 0;
    const imagenCacheada = imagenesCache[tema.id];
    const imgHtml = imagenCacheada
      ? `<img src="${imagenCacheada}" alt="${escaparHtml(tema.nombre)}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`
      : ICONO_TEMA_RESPALDO;
    return `
    <div class="tema-dashboard-card">
      <div class="tema-img ${imagenCacheada ? "" : "tema-img-emoji"}" id="temaImg-${tema.id}">${imgHtml}</div>
      <div class="tema-info">
        <h4>${escaparHtml(tema.nombre)}</h4>
        <div class="barra-progreso">
          <div class="barra-relleno" style="width:${porcentaje}%"></div>
        </div>
        <p class="tarjetas-count">${completadas} / ${totalFlashcards} tarjetas</p>
        <a href="flashcards.html?tema=${encodeURIComponent(tema.id)}" class="btn-continuar">Continuar</a>
      </div>
    </div>`;
  }

  function cargarImagenesPara(lista) {
    lista.forEach(({ tema }) => {
      if (imagenesCache[tema.id]) return;
      obtenerImagenDeTema(tema.nombre).then((urlImagen) => {
        if (!urlImagen) return;
        imagenesCache[tema.id] = urlImagen;
        document.querySelectorAll(`[id="temaImg-${tema.id}"]`).forEach((contenedor) => {
          contenedor.classList.remove("tema-img-emoji");
          contenedor.innerHTML = `<img src="${urlImagen}" alt="${escaparHtml(tema.nombre)}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
        });
      });
    });
  }

  function renderizarTemasGrid(lista, mensajeVacio) {
    if (!lista.length) {
      temasDashboardGrid.innerHTML = "";
      temasDashboardVacio.textContent = mensajeVacio;
      temasDashboardVacio.classList.remove("oculto");
      return;
    }

    temasDashboardVacio.classList.add("oculto");
    temasDashboardGrid.innerHTML = lista.map(tarjetaTemaHtml).join("");
    cargarImagenesPara(lista);
  }

  renderizarTemasGrid(
    progresoPorTema,
    materiales.length ? "Ningún tema coincide con tu búsqueda." : "Todavía no tienes temas. Sube material para empezar."
  );

  // ---------- Continúa aprendiendo ----------
  const continuaSeccion = document.getElementById("continuaSeccion");
  const continuaGrid = document.getElementById("continuaGrid");

  const enProgreso = progresoPorTema
    .filter((p) => (p.tema.flashcards || []).length > 0 && p.completadas > 0 && p.completadas < p.tema.flashcards.length)
    .sort((a, b) => new Date(b.tema.creadoEn || 0) - new Date(a.tema.creadoEn || 0))[0];

  const sinEmpezar = progresoPorTema
    .filter((p) => (p.tema.flashcards || []).length > 0 && p.completadas === 0)
    .sort((a, b) => new Date(b.tema.creadoEn || 0) - new Date(a.tema.creadoEn || 0))[0];

  const destacado = enProgreso || sinEmpezar;

  if (destacado) {
    continuaGrid.innerHTML = tarjetaTemaHtml(destacado);
    cargarImagenesPara([destacado]);
    continuaSeccion.classList.remove("oculto");
  }

  // ---------- Flashcards recientes ----------
  // Toma 1 tarjeta de cada uno de los temas más recientes (no 4 del mismo tema),
  // así los íconos de categoría realmente varían de una tarjeta a otra.
  const flashcardsGrid = document.getElementById("flashcardsGrid");
  const flashcardsVacio = document.getElementById("flashcardsVacio");

  const temasConFlashcards = [...materiales]
    .filter((m) => (m.flashcards || []).length > 0)
    .sort((a, b) => new Date(b.creadoEn || 0) - new Date(a.creadoEn || 0))
    .slice(0, 4);

  const recientes = temasConFlashcards.map((material) => ({ tarjeta: material.flashcards[0], material }));

  if (recientes.length) {
    flashcardsGrid.innerHTML = recientes
      .map(({ tarjeta, material }) => renderFlashcardReciente(tarjeta, material))
      .join("");
    flashcardsVacio.classList.add("oculto");
  } else {
    flashcardsGrid.innerHTML = "";
    flashcardsVacio.classList.remove("oculto");
  }

  // ---------- Búsqueda ----------
  function normalizar(texto) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  const buscadorInput = document.getElementById("buscadorInput");
  if (buscadorInput) {
    buscadorInput.addEventListener("input", () => {
      const termino = normalizar(buscadorInput.value.trim());
      const filtrados = termino
        ? progresoPorTema.filter(({ tema }) => normalizar(tema.nombre).includes(termino))
        : progresoPorTema;
      renderizarTemasGrid(
        filtrados,
        materiales.length ? "Ningún tema coincide con tu búsqueda." : "Todavía no tienes temas. Sube material para empezar."
      );
    });
  }
})();
