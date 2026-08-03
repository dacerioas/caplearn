(() => {
  const bibliotecaSeccion = document.getElementById("bibliotecaSeccion");
  const materialesLista = document.getElementById("materialesLista");
  const bibliotecaVacia = document.getElementById("bibliotecaVacia");
  const agregarMaterialBtn = document.getElementById("agregarMaterialBtn");
  const volverBibliotecaDesdeUploadBtn = document.getElementById("volverBibliotecaDesdeUploadBtn");

  const uploadCard = document.getElementById("uploadCard");
  const loadingCard = document.getElementById("loadingCard");
  const loadingTexto = document.getElementById("loadingTexto");
  const resultadoSeccion = document.getElementById("resultadoSeccion");

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const fileError = document.getElementById("fileError");

  const textInput = document.getElementById("textInput");
  const submitTextBtn = document.getElementById("submitTextBtn");

  const nombreArchivo = document.getElementById("nombreArchivo");
  const conteoTexto = document.getElementById("conteoTexto");
  const nuevoMaterialBtn = document.getElementById("nuevoMaterialBtn");

  const sinTextoAviso = document.getElementById("sinTextoAviso");
  const generarSeccionCard = document.getElementById("generarSeccionCard");
  const aiLoadingCard = document.getElementById("aiLoadingCard");
  const aiErrorCard = document.getElementById("aiErrorCard");
  const aiErrorText = document.getElementById("aiErrorText");
  const aiResultCard = document.getElementById("aiResultCard");
  const resultadoTitulo = document.getElementById("resultadoTitulo");
  const resultadoContenido = document.getElementById("resultadoContenido");
  const regenerarBtn = document.getElementById("regenerarBtn");

  const ICONO_ARCHIVO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13v8"/><path d="m8 17 4-4 4 4"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`;
  const ICONO_LAPIZ = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`;

  const TIPO_LABELS = {
    flashcards: "Flashcards",
    summary: "Resumen",
    quiz: "Quiz",
    "key-concepts": "Conceptos clave",
    "practice-questions": "Preguntas de práctica",
  };

  let materialesCache = [];
  let materialActual = null;
  let ultimoTipoGenerado = null;

  // ---------- Biblioteca ----------
  async function cargarBiblioteca() {
    materialesCache = await obtenerMateriales();
    renderizarBiblioteca();
  }

  function renderizarBiblioteca() {
    const visibles = materialesCache
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.origen !== "manual");

    if (!visibles.length) {
      materialesLista.innerHTML = "";
      bibliotecaVacia.classList.remove("oculto");
      return;
    }

    bibliotecaVacia.classList.add("oculto");
    materialesLista.innerHTML = visibles
      .map(({ m, i }) => {
        const partes = [];
        if (m.flashcards) partes.push("Flashcards");
        if (m.quiz) partes.push("Quiz");
        const meta = partes.length ? partes.join(" · ") : "Sin generar todavía";
        return `
        <div class="tema-item">
          <button type="button" class="tema-item-click" data-indice="${i}">
            <div class="tema-item-icono">${ICONO_ARCHIVO}</div>
            <div class="tema-item-info">
              <p class="tema-item-nombre">${escaparHtml(m.nombre)}</p>
              <p class="tema-item-meta">${meta}</p>
            </div>
          </button>
          <button type="button" class="tema-item-editar" data-indice="${i}" title="Renombrar material" aria-label="Renombrar material">${ICONO_LAPIZ}</button>
        </div>`;
      })
      .join("");

    materialesLista.querySelectorAll(".tema-item-click").forEach((btn) => {
      btn.addEventListener("click", () => abrirMaterialExistente(materialesCache[Number(btn.dataset.indice)]));
    });

    materialesLista.querySelectorAll(".tema-item-editar").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const material = materialesCache[Number(btn.dataset.indice)];
        const nuevoNombre = prompt("Nuevo nombre para el material:", material.nombre);
        if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === material.nombre) return;

        material.nombre = nuevoNombre.trim();
        await guardarMateriales(materialesCache);
        renderizarBiblioteca();
      });
    });
  }

  agregarMaterialBtn.addEventListener("click", () => {
    fileError.classList.add("oculto");
    fileInput.value = "";
    textInput.value = "";
    ocultar(bibliotecaSeccion);
    mostrar(uploadCard);
  });

  volverBibliotecaDesdeUploadBtn.addEventListener("click", () => {
    ocultar(uploadCard);
    mostrar(bibliotecaSeccion);
  });

  function abrirMaterialExistente(material) {
    materialActual = material;
    mostrarResultadoMaterial(material.nombre, material.texto ? material.texto.length : 0, Boolean(material.texto));
  }

  // ---------- Tabs (archivo / texto) ----------
  document.querySelectorAll(".upload-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".upload-tab").forEach((t) => t.classList.remove("activo"));
      tab.classList.add("activo");
      const targetTab = tab.dataset.tab;
      document.querySelectorAll(".upload-panel").forEach((panel) => {
        panel.classList.toggle("oculto", panel.dataset.panel !== targetTab);
      });
    });
  });

  // ---------- Drag & drop ----------
  ["dragenter", "dragover"].forEach((evento) => {
    dropzone.addEventListener(evento, (e) => {
      e.preventDefault();
      dropzone.classList.add("arrastrando");
    });
  });

  ["dragleave", "drop"].forEach((evento) => {
    dropzone.addEventListener(evento, (e) => {
      e.preventDefault();
      dropzone.classList.remove("arrastrando");
    });
  });

  dropzone.addEventListener("drop", (e) => {
    const archivo = e.dataTransfer.files[0];
    if (archivo) subirArchivo(archivo);
  });

  fileInput.addEventListener("change", () => {
    const archivo = fileInput.files[0];
    if (archivo) subirArchivo(archivo);
  });

  const EXTENSIONES_VALIDAS = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".md"];

  const CATEGORIAS_VALIDAS = new Set(["Ciencias", "Historia", "Geografía", "Matemáticas", "Literatura", "Tecnología", "Otro"]);

  async function generarMetadatosTema(texto, tituloPorDefecto, intentos = 2) {
    for (let intento = 1; intento <= intentos; intento++) {
      try {
        const res = await fetch("/api/material/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: texto, type: "topic-title" }),
        });
        const data = await res.json();
        if (res.ok && data.result && data.result.titulo) {
          const categoria = CATEGORIAS_VALIDAS.has(data.result.categoria) ? data.result.categoria : "Otro";
          return { titulo: data.result.titulo, categoria, descripcion: data.result.descripcion || "" };
        }
      } catch {
        // si falla, probamos de nuevo mientras queden intentos
      }
    }
    return { titulo: tituloPorDefecto, categoria: "Otro", descripcion: "" };
  }

  function formatearNombreArchivo(nombreArchivo) {
    const sinExtension = nombreArchivo.replace(/\.[^/.]+$/, "");
    const conEspacios = sinExtension.replace(/[_-]+/g, " ").trim();
    return conEspacios.replace(/\b\w/g, (letra) => letra.toUpperCase());
  }

  async function crearMaterialNuevo(nombre, texto, origen, categoria = "Otro", descripcion = "") {
    materialActual = {
      id: generarIdTema(),
      nombre,
      texto,
      origen,
      categoria,
      descripcion,
      creadoEn: new Date().toISOString(),
      flashcards: null,
      quiz: null,
      mejorPuntaje: null,
      intentos: 0,
    };
    materialesCache = await agregarMaterial(materialActual);
    mostrarResultadoMaterial(nombre, texto.length);
  }

  async function subirArchivo(archivo) {
    fileError.classList.add("oculto");

    const ext = "." + archivo.name.split(".").pop().toLowerCase();
    if (!EXTENSIONES_VALIDAS.includes(ext)) {
      fileError.textContent = `Formato no soportado: ${ext}. Usa PDF, Word, PowerPoint o TXT.`;
      fileError.classList.remove("oculto");
      return;
    }
    if (archivo.size > 20 * 1024 * 1024) {
      fileError.textContent = "El archivo supera el límite de 20MB.";
      fileError.classList.remove("oculto");
      return;
    }

    const formData = new FormData();
    formData.append("file", archivo);

    loadingTexto.textContent = "Extrayendo el contenido de tu archivo...";
    mostrar(loadingCard);
    ocultar(uploadCard);

    try {
      const res = await fetch("/api/material/extract", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "No se pudo procesar el archivo.");

      loadingTexto.textContent = "Analizando el tema de tu archivo...";
      const { titulo, categoria, descripcion } = await generarMetadatosTema(
        data.text,
        formatearNombreArchivo(data.fileName)
      );

      await crearMaterialNuevo(titulo, data.text, "archivo", categoria, descripcion);
    } catch (err) {
      fileError.textContent = err.message;
      fileError.classList.remove("oculto");
      mostrar(uploadCard);
    } finally {
      ocultar(loadingCard);
    }
  }

  submitTextBtn.addEventListener("click", async () => {
    const texto = textInput.value.trim();
    if (!texto) return;

    loadingTexto.textContent = "Analizando el tema de tu texto...";
    mostrar(loadingCard);
    ocultar(uploadCard);

    const { titulo, categoria, descripcion } = await generarMetadatosTema(texto, "Texto pegado");
    await crearMaterialNuevo(titulo, texto, "texto", categoria, descripcion);

    ocultar(loadingCard);
  });

  async function persistirMaterialActual() {
    const indice = materialesCache.findIndex((m) => m.id === materialActual.id);
    if (indice === -1) {
      materialesCache.push(materialActual);
    } else {
      materialesCache[indice] = materialActual;
    }
    await guardarMateriales(materialesCache);
  }

  async function guardarFlashcardsImportadas(flashcards) {
    materialActual.flashcards = flashcards;
    await persistirMaterialActual();
  }

  async function guardarQuizImportado(preguntas) {
    materialActual.quiz = preguntas;
    await persistirMaterialActual();
  }

  function mostrarResultadoMaterial(nombre, chars, tieneTexto = true) {
    nombreArchivo.textContent = nombre;
    conteoTexto.textContent = tieneTexto
      ? `${chars.toLocaleString("es")} caracteres listos para analizar`
      : "Sin texto de origen guardado";
    ocultar(bibliotecaSeccion);
    ocultar(uploadCard);
    mostrar(resultadoSeccion);
    ocultar(aiResultCard);
    ocultar(aiErrorCard);
    sinTextoAviso.classList.toggle("oculto", tieneTexto);
    generarSeccionCard.classList.toggle("oculto", !tieneTexto);
  }

  nuevoMaterialBtn.addEventListener("click", () => {
    materialActual = null;
    ultimoTipoGenerado = null;
    ocultar(resultadoSeccion);
    mostrar(bibliotecaSeccion);
    cargarBiblioteca();
  });

  // ---------- Generación con IA ----------
  document.querySelectorAll(".accion-ia").forEach((boton) => {
    boton.addEventListener("click", () => generarContenido(boton.dataset.type));
  });

  regenerarBtn.addEventListener("click", () => {
    if (ultimoTipoGenerado) generarContenido(ultimoTipoGenerado);
  });

  async function generarContenido(tipo) {
    ultimoTipoGenerado = tipo;
    mostrar(aiLoadingCard);
    ocultar(aiErrorCard);
    ocultar(aiResultCard);

    try {
      const res = await fetch("/api/material/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: materialActual.texto, type: tipo }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "No se pudo generar el contenido.");

      resultadoTitulo.textContent = TIPO_LABELS[tipo] || "Resultado";
      resultadoContenido.innerHTML = renderizarResultado(tipo, data.result);
      adjuntarListenersResultado(tipo);
      mostrar(aiResultCard);

      if (tipo === "flashcards" && data.result && data.result.flashcards) {
        await guardarFlashcardsImportadas(data.result.flashcards);
      }
      if (tipo === "quiz" && data.result && data.result.questions) {
        await guardarQuizImportado(data.result.questions);
      }
    } catch (err) {
      aiErrorText.textContent = err.message;
      mostrar(aiErrorCard);
    } finally {
      ocultar(aiLoadingCard);
    }
  }

  function renderizarResultado(tipo, data) {
    switch (tipo) {
      case "flashcards":
        return renderFlashcards(data);
      case "summary":
        return renderResumen(data);
      case "quiz":
        return renderQuiz(data);
      case "key-concepts":
        return renderConceptos(data);
      case "practice-questions":
        return renderPreguntasPractica(data);
      default:
        return "<p>Tipo de resultado no soportado.</p>";
    }
  }

  function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
  }

  function renderFlashcards(data) {
    const tarjetas = data.flashcards || [];
    const items = tarjetas
      .map(
        (fc) => `
      <div class="flashcard">
        <p class="fc-pregunta">${escaparHtml(fc.question)}</p>
        <p class="fc-respuesta">${escaparHtml(fc.answer)}</p>
        <div class="fc-footer">
          <span class="fc-materia">${escaparHtml(fc.subject || "")}</span>
          <span class="fc-dificultad ${escaparHtml(fc.difficulty || "facil")}">${escaparHtml(fc.difficulty || "")}</span>
        </div>
      </div>`
      )
      .join("");
    return `<div class="flashcards-grid">${items}</div>`;
  }

  function renderResumen(data) {
    const puntos = (data.keyPoints || []).map((p) => `<li>${escaparHtml(p)}</li>`).join("");
    return `
      <p class="resumen-texto">${escaparHtml(data.summary)}</p>
      <ul class="resumen-puntos">${puntos}</ul>`;
  }

  function renderConceptos(data) {
    return (data.concepts || [])
      .map(
        (c) => `
      <div class="concepto">
        <p class="concepto-termino">${escaparHtml(c.term)}</p>
        <p class="concepto-definicion">${escaparHtml(c.definition)}</p>
      </div>`
      )
      .join("");
  }

  function renderPreguntasPractica(data) {
    return (data.questions || [])
      .map(
        (q) => `
      <details class="pregunta-practica">
        <summary>${escaparHtml(q.question)}</summary>
        <p>${escaparHtml(q.answer)}</p>
      </details>`
      )
      .join("");
  }

  function renderQuiz(data) {
    return (data.questions || [])
      .map((q, i) => {
        const tipo = q.type || "opcion_multiple";

        if (tipo !== "opcion_multiple") {
          return `
          <details class="pregunta-practica">
            <summary>${i + 1}. ${escaparHtml(q.question)}</summary>
            <p>${escaparHtml(q.modelAnswer || "No hay respuesta modelo para esta pregunta.")}</p>
          </details>`;
        }

        const opciones = (q.options || [])
          .map(
            (op, j) =>
              `<button type="button" class="quiz-opcion" data-pregunta="${i}" data-opcion="${j}">${escaparHtml(op)}</button>`
          )
          .join("");
        return `
        <div class="quiz-pregunta" data-correcta="${q.correctIndex}">
          <p class="quiz-enunciado">${i + 1}. ${escaparHtml(q.question)}</p>
          <div class="quiz-opciones">${opciones}</div>
          <p class="quiz-explicacion oculto">${escaparHtml(q.explanation || "")}</p>
        </div>`;
      })
      .join("");
  }

  function adjuntarListenersResultado(tipo) {
    if (tipo !== "quiz") return;

    resultadoContenido.querySelectorAll(".quiz-pregunta").forEach((bloque) => {
      const correcta = Number(bloque.dataset.correcta);
      const explicacion = bloque.querySelector(".quiz-explicacion");

      bloque.querySelectorAll(".quiz-opcion").forEach((opcionBtn) => {
        opcionBtn.addEventListener("click", () => {
          const elegida = Number(opcionBtn.dataset.opcion);
          bloque.querySelectorAll(".quiz-opcion").forEach((b) => {
            b.disabled = true;
            const suOpcion = Number(b.dataset.opcion);
            if (suOpcion === correcta) b.classList.add("correcta");
            else if (suOpcion === elegida) b.classList.add("incorrecta");
          });
          explicacion.classList.remove("oculto");
        });
      });
    });
  }

  function mostrar(el) {
    el.classList.remove("oculto");
  }

  function ocultar(el) {
    el.classList.add("oculto");
  }

  cargarBiblioteca();
})();
