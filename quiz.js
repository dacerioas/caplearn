(() => {
  const ICONO_QUIZ = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`;
  const ICONO_LAPIZ = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`;
  const LETRAS = ["A", "B", "C", "D", "E", "F"];

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

  const origenSeccion = document.getElementById("origenSeccion");
  const origenVacio = document.getElementById("origenVacio");
  const quizzesLista = document.getElementById("quizzesLista");
  const categoriaFiltros = document.getElementById("categoriaFiltros");
  const temasBuscador = document.getElementById("temasBuscador");

  const generandoCard = document.getElementById("generandoCard");
  const generandoError = document.getElementById("generandoError");

  const tomarSeccion = document.getElementById("tomarSeccion");
  const qzTitulo = document.getElementById("qzTitulo");
  const qzSubtitulo = document.getElementById("qzSubtitulo");
  const qzTimer = document.getElementById("qzTimer");
  const qzCerrarBtn = document.getElementById("qzCerrarBtn");

  const qzProgresoPct = document.getElementById("qzProgresoPct");
  const qzProgresoRelleno = document.getElementById("qzProgresoRelleno");

  const qzBadge = document.getElementById("qzBadge");
  const qzEnunciado = document.getElementById("qzEnunciado");

  const qzOpciones = document.getElementById("qzOpciones");

  const qzCortaWrap = document.getElementById("qzCortaWrap");
  const qzInputCorta = document.getElementById("qzInputCorta");
  const qzContadorCorta = document.getElementById("qzContadorCorta");

  const qzDesarrolloWrap = document.getElementById("qzDesarrolloWrap");
  const qzEditor = document.getElementById("qzEditor");
  const qzContadorDesarrollo = document.getElementById("qzContadorDesarrollo");

  const qzRevelado = document.getElementById("qzRevelado");
  const qzRespuestaModelo = document.getElementById("qzRespuestaModelo");

  const qzSiguienteBtn = document.getElementById("qzSiguienteBtn");
  const qzSiguienteTexto = document.getElementById("qzSiguienteTexto");

  const resultadoFinal = document.getElementById("resultadoFinal");
  const resultadoPuntaje = document.getElementById("resultadoPuntaje");
  const resultadoTexto = document.getElementById("resultadoTexto");
  const resultadoDesarrolloTexto = document.getElementById("resultadoDesarrolloTexto");
  const reintentarBtn = document.getElementById("reintentarBtn");
  const terminarBtn = document.getElementById("terminarBtn");

  let materialesCache = [];
  let materialActual = null;
  let indiceActual = 0;
  let correctasMC = 0;
  let totalMC = 0;
  let revisadasAbiertas = 0;
  let respuestaSeleccionada = null;
  let fase = "responder"; // "responder" | "revelado" (solo aplica a respuesta_corta / desarrollo)
  let segundos = 0;
  let timerId = null;

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

  function tipoDe(pregunta) {
    return pregunta.type || "opcion_multiple";
  }

  function normalizar(texto) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  let categoriaActiva = "Todos";

  // ---------- Lista de temas ----------
  async function cargarMateriales() {
    const todos = await obtenerMateriales();
    materialesCache = todos.filter((m) => m.texto || m.quiz);
    renderizarFiltros();
    renderizarLista();
  }

  function renderizarFiltros() {
    const categoriasPresentes = [...new Set(materialesCache.map((m) => m.categoria || "Otro"))];
    const categorias = ["Todos", ...categoriasPresentes];

    categoriaFiltros.innerHTML = categorias
      .map(
        (cat) =>
          `<button type="button" class="categoria-pill ${cat === categoriaActiva ? "activo" : ""}" data-cat="${escaparHtml(cat)}">${escaparHtml(cat)}</button>`
      )
      .join("");

    categoriaFiltros.querySelectorAll(".categoria-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        categoriaActiva = btn.dataset.cat;
        renderizarFiltros();
        renderizarLista();
      });
    });
  }

  function materialesFiltrados() {
    const termino = normalizar(temasBuscador.value.trim());
    return materialesCache.filter((m) => {
      const coincideCategoria = categoriaActiva === "Todos" || (m.categoria || "Otro") === categoriaActiva;
      const coincideBusqueda = !termino || normalizar(m.nombre).includes(termino);
      return coincideCategoria && coincideBusqueda;
    });
  }

  function tarjetaMaterialHtml(material) {
    const categoria = CATEGORIAS_VALIDAS.has(material.categoria) ? material.categoria : "Otro";
    const info = CATEGORIA_INFO[categoria];
    const totalPreguntas = material.quiz ? material.quiz.length : 0;
    const porcentaje = material.mejorPuntaje != null ? material.mejorPuntaje : 0;
    const meta = material.quiz
      ? material.mejorPuntaje != null
        ? `${totalPreguntas} preguntas · Mejor puntaje: ${material.mejorPuntaje}%`
        : `${totalPreguntas} preguntas · Sin intentar`
      : "Clic para generar quiz";

    return `
    <div class="tema-card" data-id="${escaparHtml(material.id)}" role="button" tabindex="0">
      <button type="button" class="tema-card-editar" data-id="${escaparHtml(material.id)}" title="Renombrar tema" aria-label="Renombrar tema">${ICONO_LAPIZ}</button>
      <div class="tema-card-top">
        <div class="tema-card-icono" style="background-color:${info.color}26; color:${info.color}">${info.icono}</div>
        <span class="tema-card-categoria" style="color:${info.color}">${escaparHtml(categoria)}</span>
      </div>
      <p class="tema-card-titulo">${escaparHtml(material.nombre)}</p>
      <p class="tema-card-desc">${escaparHtml(material.descripcion || "")}</p>
      <div class="tema-card-progreso-fila">
        <span>Mejor puntaje</span>
        <span>${material.mejorPuntaje != null ? porcentaje + "%" : "—"}</span>
      </div>
      <div class="tema-card-barra"><div class="tema-card-barra-relleno" style="width:${porcentaje}%"></div></div>
      <div class="tema-card-footer">${ICONO_QUIZ} ${meta}</div>
    </div>`;
  }

  function renderizarLista() {
    if (!materialesCache.length) {
      quizzesLista.innerHTML = "";
      origenVacio.textContent = "Todavía no tienes material subido. Sube uno en Mi Material.";
      origenVacio.classList.remove("oculto");
      return;
    }

    const filtrados = materialesFiltrados();

    if (!filtrados.length) {
      quizzesLista.innerHTML = "";
      origenVacio.textContent = "Ningún tema coincide con tu búsqueda.";
      origenVacio.classList.remove("oculto");
      return;
    }

    origenVacio.classList.add("oculto");
    quizzesLista.innerHTML = filtrados.map(tarjetaMaterialHtml).join("");

    quizzesLista.querySelectorAll(".tema-card").forEach((card) => {
      card.addEventListener("click", () => {
        const material = materialesCache.find((m) => m.id === card.dataset.id);
        if (material) seleccionarMaterial(material);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      });
    });

    quizzesLista.querySelectorAll(".tema-card-editar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const material = materialesCache.find((m) => m.id === btn.dataset.id);
        if (!material) return;
        const nuevoNombre = prompt("Nuevo nombre para el tema:", material.nombre);
        if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === material.nombre) return;

        material.nombre = nuevoNombre.trim();
        await persistirMaterial(material);
        renderizarLista();
      });
    });
  }

  temasBuscador.addEventListener("input", renderizarLista);

  async function persistirMaterial(material) {
    const todos = await obtenerMateriales();
    const indice = todos.findIndex((m) => m.id === material.id);
    if (indice !== -1) todos[indice] = material;
    await guardarMateriales(todos);
  }

  function detenerTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function volverALista() {
    detenerTimer();
    tomarSeccion.classList.add("oculto");
    origenSeccion.classList.remove("oculto");
    cargarMateriales();
  }

  qzCerrarBtn.addEventListener("click", () => {
    if (confirm("¿Seguro que querés salir? Vas a perder el progreso de este intento.")) {
      volverALista();
    }
  });

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
    correctasMC = 0;
    totalMC = material.quiz.filter((p) => tipoDe(p) === "opcion_multiple").length;
    revisadasAbiertas = 0;
    segundos = 0;

    qzTitulo.textContent = `Quiz: ${material.nombre}`;
    origenSeccion.classList.add("oculto");
    tomarSeccion.classList.remove("oculto");
    resultadoFinal.classList.add("oculto");

    detenerTimer();
    actualizarTimer();
    timerId = setInterval(() => {
      segundos++;
      actualizarTimer();
    }, 1000);

    mostrarPregunta();
  }

  function actualizarTimer() {
    const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
    const ss = String(segundos % 60).padStart(2, "0");
    qzTimer.textContent = `⏱ ${mm}:${ss}`;
  }

  function mostrarPregunta() {
    const total = materialActual.quiz.length;
    const pregunta = materialActual.quiz[indiceActual];
    const numero = indiceActual + 1;
    const tipo = tipoDe(pregunta);

    respuestaSeleccionada = null;
    fase = "responder";

    qzSubtitulo.textContent = `Pregunta ${numero} de ${total}`;
    qzBadge.textContent = `PREGUNTA ${numero}`;
    qzEnunciado.textContent = pregunta.question;

    const pct = Math.round((numero / total) * 100);
    qzProgresoPct.textContent = `${pct}% completado`;
    qzProgresoRelleno.style.width = `${pct}%`;

    ocultar(qzOpciones);
    ocultar(qzCortaWrap);
    ocultar(qzDesarrolloWrap);
    ocultar(qzRevelado);

    qzSiguienteBtn.disabled = true;
    qzSiguienteTexto.textContent = "Siguiente";

    if (tipo === "respuesta_corta") {
      qzInputCorta.value = "";
      qzInputCorta.disabled = false;
      qzContadorCorta.textContent = "0 / 50 caracteres";
      mostrar(qzCortaWrap);
      qzSiguienteTexto.textContent = "Siguiente";
    } else if (tipo === "desarrollo") {
      qzEditor.innerHTML = "";
      qzEditor.contentEditable = "true";
      qzContadorDesarrollo.textContent = "0 palabras";
      mostrar(qzDesarrolloWrap);
      qzSiguienteTexto.textContent = "Enviar respuesta";
    } else {
      renderizarOpciones(pregunta);
      mostrar(qzOpciones);
    }
  }

  function renderizarOpciones(pregunta) {
    qzOpciones.innerHTML = (pregunta.options || [])
      .map(
        (op, j) => `
        <button type="button" class="qz-opcion" data-opcion="${j}">
          <span class="qz-opcion-letra">${LETRAS[j] || j + 1}</span>
          <span class="qz-opcion-texto">${escaparHtml(op)}</span>
          <span class="qz-opcion-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
        </button>`
      )
      .join("");

    qzOpciones.querySelectorAll(".qz-opcion").forEach((btn) => {
      btn.addEventListener("click", () => {
        respuestaSeleccionada = Number(btn.dataset.opcion);
        qzOpciones.querySelectorAll(".qz-opcion").forEach((b) => {
          b.classList.toggle("seleccionada", Number(b.dataset.opcion) === respuestaSeleccionada);
        });
        qzSiguienteBtn.disabled = false;
      });
    });
  }

  qzInputCorta.addEventListener("input", () => {
    const len = qzInputCorta.value.length;
    qzContadorCorta.textContent = `${len} / 50 caracteres`;
    qzSiguienteBtn.disabled = qzInputCorta.value.trim().length === 0;
  });

  function contarPalabras(texto) {
    return texto.trim() ? texto.trim().split(/\s+/).length : 0;
  }

  qzEditor.addEventListener("input", () => {
    const texto = qzEditor.textContent || "";
    qzContadorDesarrollo.textContent = `${contarPalabras(texto)} palabras`;
    qzSiguienteBtn.disabled = texto.trim().length === 0;
  });

  document.querySelectorAll(".qz-tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      qzEditor.focus();
      document.execCommand(btn.dataset.cmd, false, null);
    });
  });

  qzSiguienteBtn.addEventListener("click", () => {
    const pregunta = materialActual.quiz[indiceActual];
    const tipo = tipoDe(pregunta);

    if (tipo === "opcion_multiple") {
      if (respuestaSeleccionada === pregunta.correctIndex) correctasMC++;
      avanzar();
      return;
    }

    // respuesta_corta / desarrollo: primero revelamos la respuesta modelo, luego avanzamos
    if (fase === "responder") {
      revisadasAbiertas++;
      qzRespuestaModelo.textContent = pregunta.modelAnswer || "No hay respuesta modelo para esta pregunta.";
      mostrar(qzRevelado);
      if (tipo === "respuesta_corta") qzInputCorta.disabled = true;
      else qzEditor.contentEditable = "false";
      qzSiguienteTexto.textContent = "Siguiente pregunta";
      fase = "revelado";
      return;
    }

    avanzar();
  });

  function avanzar() {
    indiceActual++;
    if (indiceActual >= materialActual.quiz.length) {
      mostrarResultadoFinal();
    } else {
      mostrarPregunta();
    }
  }

  async function mostrarResultadoFinal() {
    detenerTimer();
    tomarSeccion.querySelectorAll(":scope > *:not(#resultadoFinal)").forEach((el) => el.classList.add("oculto"));
    resultadoFinal.classList.remove("oculto");

    if (totalMC > 0) {
      const porcentaje = Math.round((correctasMC / totalMC) * 100);
      resultadoPuntaje.textContent = `${porcentaje}%`;
      resultadoTexto.textContent = `Obtuviste ${correctasMC} de ${totalMC} correctas en opción múltiple.`;

      materialActual.intentos = (materialActual.intentos || 0) + 1;
      materialActual.mejorPuntaje =
        materialActual.mejorPuntaje == null ? porcentaje : Math.max(materialActual.mejorPuntaje, porcentaje);
      await persistirMaterial(materialActual);
    } else {
      resultadoPuntaje.textContent = "✓";
      resultadoTexto.textContent = "Este quiz no tenía preguntas de opción múltiple para calificar.";
    }

    if (revisadasAbiertas > 0) {
      resultadoDesarrolloTexto.textContent = `Además revisaste ${revisadasAbiertas} pregunta${revisadasAbiertas === 1 ? "" : "s"} de desarrollo/respuesta corta comparando con la respuesta modelo.`;
      resultadoDesarrolloTexto.classList.remove("oculto");
    } else {
      resultadoDesarrolloTexto.classList.add("oculto");
    }
  }

  reintentarBtn.addEventListener("click", () => {
    tomarSeccion.querySelectorAll(":scope > *").forEach((el) => el.classList.remove("oculto"));
    resultadoFinal.classList.add("oculto");
    iniciarQuiz(materialActual);
  });
  terminarBtn.addEventListener("click", () => {
    tomarSeccion.querySelectorAll(":scope > *").forEach((el) => el.classList.remove("oculto"));
    volverALista();
  });

  // ---------- Arranque ----------
  cargarMateriales();
})();
