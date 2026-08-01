(() => {
  const ICONO_QUIZ = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`;
  const ICONO_LAPIZ = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`;

  const origenSeccion = document.getElementById("origenSeccion");
  const origenVacio = document.getElementById("origenVacio");
  const quizzesLista = document.getElementById("quizzesLista");

  const generandoCard = document.getElementById("generandoCard");
  const generandoError = document.getElementById("generandoError");

  const tomarSeccion = document.getElementById("tomarSeccion");
  const volverListaBtn = document.getElementById("volverListaBtn");
  const quizNombreActual = document.getElementById("quizNombreActual");
  const quizContador = document.getElementById("quizContador");

  const preguntaCard = document.getElementById("preguntaCard");
  const preguntaTexto = document.getElementById("preguntaTexto");
  const opcionesContenedor = document.getElementById("opcionesContenedor");
  const explicacionTexto = document.getElementById("explicacionTexto");
  const siguienteBtn = document.getElementById("siguienteBtn");

  const resultadoFinal = document.getElementById("resultadoFinal");
  const resultadoPuntaje = document.getElementById("resultadoPuntaje");
  const resultadoTexto = document.getElementById("resultadoTexto");
  const reintentarBtn = document.getElementById("reintentarBtn");
  const terminarBtn = document.getElementById("terminarBtn");

  let materialesCache = [];
  let materialActual = null;
  let indiceActual = 0;
  let correctas = 0;

  function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
  }

  function mostrar(el) {
    el.classList.remove("oculto");
  }

  function ocultar(el) {
    el.classList.add("oculto");
  }

  // ---------- Lista de temas ----------
  async function cargarMateriales() {
    const todos = await obtenerMateriales();
    materialesCache = todos.filter((m) => m.texto || m.quiz);
    renderizarLista();
  }

  function renderizarLista() {
    if (!materialesCache.length) {
      quizzesLista.innerHTML = "";
      origenVacio.classList.remove("oculto");
      return;
    }

    origenVacio.classList.add("oculto");
    quizzesLista.innerHTML = materialesCache
      .map((material, i) => {
        const meta = material.quiz
          ? material.mejorPuntaje != null
            ? `${material.quiz.length} preguntas · Mejor puntaje: ${material.mejorPuntaje}%`
            : `${material.quiz.length} preguntas · Sin intentar`
          : "Clic para generar quiz";
        return `
        <div class="tema-item">
          <button type="button" class="tema-item-click" data-indice="${i}">
            <div class="tema-item-icono">${ICONO_QUIZ}</div>
            <div class="tema-item-info">
              <p class="tema-item-nombre">${escaparHtml(material.nombre)}</p>
              <p class="tema-item-meta">${meta}</p>
            </div>
          </button>
          <button type="button" class="tema-item-editar" data-indice="${i}" title="Renombrar tema" aria-label="Renombrar tema">${ICONO_LAPIZ}</button>
        </div>`;
      })
      .join("");

    quizzesLista.querySelectorAll(".tema-item-click").forEach((btn) => {
      btn.addEventListener("click", () => seleccionarMaterial(materialesCache[Number(btn.dataset.indice)]));
    });

    quizzesLista.querySelectorAll(".tema-item-editar").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const material = materialesCache[Number(btn.dataset.indice)];
        const nuevoNombre = prompt("Nuevo nombre para el tema:", material.nombre);
        if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === material.nombre) return;

        material.nombre = nuevoNombre.trim();
        await persistirMaterial(material);
        renderizarLista();
      });
    });
  }

  async function persistirMaterial(material) {
    const todos = await obtenerMateriales();
    const indice = todos.findIndex((m) => m.id === material.id);
    if (indice !== -1) todos[indice] = material;
    await guardarMateriales(todos);
  }

  volverListaBtn.addEventListener("click", volverALista);

  function volverALista() {
    tomarSeccion.classList.add("oculto");
    origenSeccion.classList.remove("oculto");
    cargarMateriales();
  }

  // ---------- Generar quiz al vuelo si el tema no lo tiene ----------
  async function seleccionarMaterial(material) {
    if (material.quiz && material.quiz.length) {
      iniciarQuiz(material);
      return;
    }

    if (!material.texto) {
      generandoError.textContent = "Este tema no tiene material de origen para generar un quiz.";
      generandoError.classList.remove("oculto");
      return;
    }

    generandoError.classList.add("oculto");
    mostrar(generandoCard);

    try {
      const res = await fetch("/api/material/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: material.texto, type: "quiz" }),
      });
      const data = await res.json();

      if (!res.ok || !data.result || !data.result.questions) {
        throw new Error(data.error || "No se pudo generar el quiz.");
      }

      material.quiz = data.result.questions;
      await persistirMaterial(material);

      iniciarQuiz(material);
    } catch (err) {
      generandoError.textContent = err.message;
      generandoError.classList.remove("oculto");
    } finally {
      ocultar(generandoCard);
    }
  }

  // ---------- Tomar el quiz ----------
  function iniciarQuiz(material) {
    materialActual = material;
    indiceActual = 0;
    correctas = 0;

    quizNombreActual.textContent = material.nombre;
    origenSeccion.classList.add("oculto");
    tomarSeccion.classList.remove("oculto");
    preguntaCard.classList.remove("oculto");
    resultadoFinal.classList.add("oculto");

    mostrarPregunta();
  }

  function mostrarPregunta() {
    const pregunta = materialActual.quiz[indiceActual];
    quizContador.textContent = `${indiceActual + 1} / ${materialActual.quiz.length}`;
    preguntaTexto.textContent = pregunta.question;
    explicacionTexto.classList.add("oculto");
    siguienteBtn.classList.add("oculto");

    opcionesContenedor.innerHTML = (pregunta.options || [])
      .map((op, j) => `<button type="button" class="quiz-opcion" data-opcion="${j}">${escaparHtml(op)}</button>`)
      .join("");

    opcionesContenedor.querySelectorAll(".quiz-opcion").forEach((btn) => {
      btn.addEventListener("click", () => {
        const elegida = Number(btn.dataset.opcion);
        const correcta = pregunta.correctIndex;

        opcionesContenedor.querySelectorAll(".quiz-opcion").forEach((b) => {
          b.disabled = true;
          const suOpcion = Number(b.dataset.opcion);
          if (suOpcion === correcta) b.classList.add("correcta");
          else if (suOpcion === elegida) b.classList.add("incorrecta");
        });

        if (elegida === correcta) correctas++;

        if (pregunta.explanation) {
          explicacionTexto.textContent = pregunta.explanation;
          explicacionTexto.classList.remove("oculto");
        }

        siguienteBtn.textContent =
          indiceActual < materialActual.quiz.length - 1 ? "Siguiente pregunta" : "Ver resultado";
        siguienteBtn.classList.remove("oculto");
      });
    });
  }

  siguienteBtn.addEventListener("click", () => {
    indiceActual++;
    if (indiceActual >= materialActual.quiz.length) {
      mostrarResultadoFinal();
    } else {
      mostrarPregunta();
    }
  });

  async function mostrarResultadoFinal() {
    preguntaCard.classList.add("oculto");
    resultadoFinal.classList.remove("oculto");

    const total = materialActual.quiz.length;
    const porcentaje = total ? Math.round((correctas / total) * 100) : 0;
    resultadoPuntaje.textContent = `${porcentaje}%`;
    resultadoTexto.textContent = `Obtuviste ${correctas} de ${total} correctas.`;

    materialActual.intentos = (materialActual.intentos || 0) + 1;
    materialActual.mejorPuntaje =
      materialActual.mejorPuntaje == null ? porcentaje : Math.max(materialActual.mejorPuntaje, porcentaje);
    await persistirMaterial(materialActual);
  }

  reintentarBtn.addEventListener("click", () => iniciarQuiz(materialActual));
  terminarBtn.addEventListener("click", volverALista);

  // ---------- Arranque ----------
  cargarMateriales();
})();
