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

function renderFlashcardReciente(tarjeta) {
  const dificultad = tarjeta.difficulty || "facil";
  return `
    <div class="flashcard">
      <p class="fc-pregunta">${escaparHtml(tarjeta.question)}</p>
      <div class="fc-icono fc-icono-generico">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </div>
      <p class="fc-respuesta">${escaparHtml(tarjeta.answer)}</p>
      <div class="fc-footer">
        <span class="fc-materia">${escaparHtml(tarjeta.subject || "")}</span>
        <span class="fc-dificultad ${dificultad}">${ETIQUETA_DIFICULTAD[dificultad] || dificultad}</span>
      </div>
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

  // ---------- Tus temas ----------
  const temasDashboardGrid = document.getElementById("temasDashboardGrid");
  const temasDashboardVacio = document.getElementById("temasDashboardVacio");

  if (!materiales.length) {
    temasDashboardGrid.innerHTML = "";
    temasDashboardVacio.classList.remove("oculto");
  } else {
    temasDashboardVacio.classList.add("oculto");
    temasDashboardGrid.innerHTML = progresoPorTema
      .map(({ tema, completadas }, i) => {
        const totalFlashcards = (tema.flashcards || []).length;
        const porcentaje = totalFlashcards ? Math.round((completadas / totalFlashcards) * 100) : 0;
        return `
        <div class="tema-dashboard-card">
          <div class="tema-img tema-img-emoji" id="temaImg-${i}">${ICONO_TEMA_RESPALDO}</div>
          <div class="tema-info">
            <h4>${escaparHtml(tema.nombre)}</h4>
            <div class="barra-progreso">
              <div class="barra-relleno" style="width:${porcentaje}%"></div>
            </div>
            <p class="tarjetas-count">${completadas} / ${totalFlashcards} tarjetas</p>
            <a href="flashcards.html?tema=${encodeURIComponent(tema.id)}" class="btn-continuar">Continuar</a>
          </div>
        </div>`;
      })
      .join("");

    // Busca la imagen de cada tema en paralelo, sin bloquear el resto de la pantalla.
    progresoPorTema.forEach(({ tema }, i) => {
      obtenerImagenDeTema(tema.nombre).then((urlImagen) => {
        if (!urlImagen) return;
        const contenedor = document.getElementById(`temaImg-${i}`);
        if (contenedor) {
          contenedor.innerHTML = `<img src="${urlImagen}" alt="${escaparHtml(tema.nombre)}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
        }
      });
    });
  }

  // ---------- Flashcards recientes ----------
  const flashcardsGrid = document.getElementById("flashcardsGrid");
  const flashcardsVacio = document.getElementById("flashcardsVacio");

  const temaMasReciente = [...materiales]
    .filter((m) => (m.flashcards || []).length > 0)
    .sort((a, b) => new Date(b.creadoEn || 0) - new Date(a.creadoEn || 0))[0];
  const recientes = temaMasReciente ? temaMasReciente.flashcards.slice(0, 4) : [];

  if (recientes.length) {
    flashcardsGrid.innerHTML = recientes.map(renderFlashcardReciente).join("");
    flashcardsVacio.classList.add("oculto");
  } else {
    flashcardsGrid.innerHTML = "";
    flashcardsVacio.classList.remove("oculto");
  }
})();
