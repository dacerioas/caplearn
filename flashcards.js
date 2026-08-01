(() => {
  const STORAGE_SRS = "caplearn_srs";
  const STORAGE_STATS = "caplearn_stats";

  const STATS_POR_DEFECTO = {
    respuestasCorrectas: 0,
    respuestasIncorrectas: 0,
    rachaDias: 0,
    ultimoDiaEstudio: null,
  };

  const ICONO_ARCHIVO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13v8"/><path d="m8 17 4-4 4 4"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`;
  const ICONO_MANUAL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`;
  const ICONO_LAPIZ = ICONO_MANUAL;

  const origenSeccion = document.getElementById("origenSeccion");
  const crearManualBtn = document.getElementById("crearManualBtn");
  const origenVacio = document.getElementById("origenVacio");
  const temasLista = document.getElementById("temasLista");

  const generandoCard = document.getElementById("generandoCard");
  const generandoError = document.getElementById("generandoError");

  const manualSeccion = document.getElementById("manualSeccion");
  const manualNombreTema = document.getElementById("manualNombreTema");
  const sugerirNombreBtn = document.getElementById("sugerirNombreBtn");
  const manualPregunta = document.getElementById("manualPregunta");
  const manualRespuesta = document.getElementById("manualRespuesta");
  const manualAgregarBtn = document.getElementById("manualAgregarBtn");
  const manualLista = document.getElementById("manualLista");
  const manualError = document.getElementById("manualError");
  const manualVolverBtn = document.getElementById("manualVolverBtn");
  const manualEmpezarBtn = document.getElementById("manualEmpezarBtn");

  const reviewSeccion = document.getElementById("reviewSeccion");
  const reviewNombreTema = document.getElementById("reviewNombreTema");
  const reviewContadorActual = document.getElementById("reviewContadorActual");
  const reviewContadorTotal = document.getElementById("reviewContadorTotal");
  const reviewCard = document.getElementById("reviewCard");
  const reviewCardInner = document.getElementById("reviewCardInner");
  const reviewTextoPregunta = document.getElementById("reviewTextoPregunta");
  const reviewTextoRespuesta = document.getElementById("reviewTextoRespuesta");
  const reviewAudioBtn = document.getElementById("reviewAudioBtn");
  const reviewAcciones = document.getElementById("reviewAcciones");
  const reviewDots = document.getElementById("reviewDots");
  const reviewCompleto = document.getElementById("reviewCompleto");
  const cambiarOrigenBtn = document.getElementById("cambiarOrigenBtn");
  const reiniciarBtn = document.getElementById("reiniciarBtn");
  const reiniciarIconoBtn = document.getElementById("reiniciarIconoBtn");

  let materialesCache = [];
  let tarjetasManualNuevas = [];

  let materialActual = null;
  let cola = [];
  let mostrandoRespuesta = false;
  let totalInicial = 0;
  let completados = 0;

  function hoyISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function sumarDias(dias) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
  }

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
    materialesCache = await obtenerMateriales();
    renderizarMateriales();
  }

  function renderizarMateriales() {
    if (!materialesCache.length) {
      temasLista.innerHTML = "";
      origenVacio.classList.remove("oculto");
      return;
    }

    origenVacio.classList.add("oculto");
    temasLista.innerHTML = materialesCache
      .map((material, i) => {
        const meta =
          material.origen === "manual"
            ? `${material.flashcards.length} tarjetas · Manual`
            : material.flashcards
            ? `${material.flashcards.length} tarjetas listas`
            : "Clic para generar flashcards";
        return `
        <div class="tema-item">
          <button type="button" class="tema-item-click" data-indice="${i}">
            <div class="tema-item-icono">${material.origen === "manual" ? ICONO_MANUAL : ICONO_ARCHIVO}</div>
            <div class="tema-item-info">
              <p class="tema-item-nombre">${escaparHtml(material.nombre)}</p>
              <p class="tema-item-meta">${meta}</p>
            </div>
          </button>
          <button type="button" class="tema-item-editar" data-indice="${i}" title="Renombrar tema" aria-label="Renombrar tema">${ICONO_LAPIZ}</button>
        </div>`;
      })
      .join("");

    temasLista.querySelectorAll(".tema-item-click").forEach((btn) => {
      btn.addEventListener("click", () => seleccionarMaterial(materialesCache[Number(btn.dataset.indice)]));
    });

    temasLista.querySelectorAll(".tema-item-editar").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const material = materialesCache[Number(btn.dataset.indice)];
        const nuevoNombre = prompt("Nuevo nombre para el tema:", material.nombre);
        if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === material.nombre) return;

        material.nombre = nuevoNombre.trim();
        await guardarMateriales(materialesCache);
        renderizarMateriales();
      });
    });
  }

  // ---------- Generar flashcards al vuelo si el tema no las tiene ----------
  async function seleccionarMaterial(material) {
    if (material.flashcards && material.flashcards.length) {
      iniciarRepaso(material);
      return;
    }

    if (!material.texto) {
      generandoError.textContent = "Este tema no tiene material de origen para generar flashcards.";
      generandoError.classList.remove("oculto");
      return;
    }

    generandoError.classList.add("oculto");
    mostrar(generandoCard);

    try {
      const res = await fetch("/api/material/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: material.texto, type: "flashcards" }),
      });
      const data = await res.json();

      if (!res.ok || !data.result || !data.result.flashcards) {
        throw new Error(data.error || "No se pudieron generar las flashcards.");
      }

      material.flashcards = data.result.flashcards;
      await guardarMateriales(materialesCache);

      iniciarRepaso(material);
    } catch (err) {
      generandoError.textContent = err.message;
      generandoError.classList.remove("oculto");
    } finally {
      ocultar(generandoCard);
    }
  }

  crearManualBtn.addEventListener("click", () => {
    tarjetasManualNuevas = [];
    manualNombreTema.value = "";
    manualPregunta.value = "";
    manualRespuesta.value = "";
    manualError.classList.add("oculto");
    origenSeccion.classList.add("oculto");
    manualSeccion.classList.remove("oculto");
    renderizarListaManual();
  });

  manualVolverBtn.addEventListener("click", () => {
    manualSeccion.classList.add("oculto");
    origenSeccion.classList.remove("oculto");
  });

  manualAgregarBtn.addEventListener("click", () => {
    const pregunta = manualPregunta.value.trim();
    const respuesta = manualRespuesta.value.trim();
    if (!pregunta || !respuesta) return;

    tarjetasManualNuevas.push({ question: pregunta, answer: respuesta });

    manualPregunta.value = "";
    manualRespuesta.value = "";
    manualPregunta.focus();
    renderizarListaManual();
  });

  function renderizarListaManual() {
    manualLista.innerHTML = tarjetasManualNuevas
      .map(
        (t, i) => `
      <div class="manual-item">
        <span class="manual-item-texto"><strong>${escaparHtml(t.question)}</strong> — ${escaparHtml(t.answer)}</span>
        <button type="button" class="manual-item-borrar" data-i="${i}">Eliminar</button>
      </div>`
      )
      .join("");

    manualLista.querySelectorAll(".manual-item-borrar").forEach((btn) => {
      btn.addEventListener("click", () => {
        tarjetasManualNuevas.splice(Number(btn.dataset.i), 1);
        renderizarListaManual();
      });
    });

    manualEmpezarBtn.disabled = tarjetasManualNuevas.length === 0;
    sugerirNombreBtn.disabled = tarjetasManualNuevas.length === 0;
  }

  sugerirNombreBtn.addEventListener("click", async () => {
    if (!tarjetasManualNuevas.length) return;

    sugerirNombreBtn.disabled = true;
    const textoOriginal = sugerirNombreBtn.textContent;
    sugerirNombreBtn.textContent = "Pensando...";

    const texto = tarjetasManualNuevas.map((t) => `${t.question} ${t.answer}`).join(" ");
    try {
      const res = await fetch("/api/material/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: texto, type: "topic-title" }),
      });
      const data = await res.json();
      if (res.ok && data.result && data.result.titulo) {
        manualNombreTema.value = data.result.titulo;
        manualError.classList.add("oculto");
      }
    } catch {
      // si falla, el usuario puede escribir el nombre a mano
    } finally {
      sugerirNombreBtn.disabled = false;
      sugerirNombreBtn.textContent = textoOriginal;
    }
  });

  manualEmpezarBtn.addEventListener("click", async () => {
    const nombre = manualNombreTema.value.trim();
    if (!nombre) {
      manualError.textContent = "Ponle un nombre al tema antes de guardarlo.";
      manualError.classList.remove("oculto");
      return;
    }
    if (!tarjetasManualNuevas.length) return;

    const nuevoMaterial = {
      id: generarIdTema(),
      nombre,
      texto: null,
      origen: "manual",
      creadoEn: new Date().toISOString(),
      flashcards: tarjetasManualNuevas,
      quiz: null,
      mejorPuntaje: null,
      intentos: 0,
    };

    manualEmpezarBtn.disabled = true;
    materialesCache = await agregarMaterial(nuevoMaterial);
    manualEmpezarBtn.disabled = false;

    iniciarRepaso(nuevoMaterial);
  });

  // ---------- Repaso ----------
  async function iniciarRepaso(material) {
    materialActual = material;

    const srs = await obtenerDato(STORAGE_SRS, {});
    const hoy = hoyISO();

    const conKey = material.flashcards.map((t, i) => ({
      ...t,
      key: `${material.id}:${i}:${(t.question || "").slice(0, 30)}`,
    }));

    let pendientes = conKey.filter((t) => {
      const registro = srs[t.key];
      return !registro || registro.dueDate <= hoy;
    });

    if (!pendientes.length) {
      pendientes = conKey;
    }

    cola = pendientes;
    totalInicial = pendientes.length;
    completados = 0;

    origenSeccion.classList.add("oculto");
    manualSeccion.classList.add("oculto");
    reviewSeccion.classList.remove("oculto");
    reviewCompleto.classList.add("oculto");
    reviewCard.classList.remove("oculto");
    reviewNombreTema.textContent = material.nombre;
    reviewContadorTotal.textContent = totalInicial;

    mostrarTarjetaActual();
  }

  function renderizarDots() {
    reviewDots.innerHTML = "";
    for (let i = 0; i < totalInicial; i++) {
      const dot = document.createElement("span");
      dot.className = "review-dot";
      if (i < completados) dot.classList.add("completado");
      else if (i === completados) dot.classList.add("activo");
      reviewDots.appendChild(dot);
    }
  }

  function mostrarTarjetaActual() {
    if (!cola.length) {
      terminarRepaso();
      return;
    }
    mostrandoRespuesta = false;
    const tarjeta = cola[0];
    reviewTextoPregunta.textContent = tarjeta.question;
    reviewTextoRespuesta.textContent = tarjeta.answer;
    reviewCardInner.classList.remove("volteada");
    reviewAcciones.classList.add("oculto");
    reviewContadorActual.textContent = Math.min(completados + 1, totalInicial);
    renderizarDots();
  }

  function voltearTarjeta() {
    if (!cola.length) return;
    mostrandoRespuesta = !mostrandoRespuesta;
    reviewCardInner.classList.toggle("volteada", mostrandoRespuesta);
    reviewAcciones.classList.toggle("oculto", !mostrandoRespuesta);
  }

  reviewCard.addEventListener("click", voltearTarjeta);
  reviewCard.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      voltearTarjeta();
    }
  });

  reviewAudioBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!("speechSynthesis" in window) || !cola.length) return;
    const texto = mostrandoRespuesta ? cola[0].answer : cola[0].question;
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "es-ES";
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  });

  function actualizarRacha(stats) {
    const hoy = hoyISO();
    if (stats.ultimoDiaEstudio === hoy) return;
    const ayer = sumarDias(-1);
    stats.rachaDias = stats.ultimoDiaEstudio === ayer ? stats.rachaDias + 1 : 1;
    stats.ultimoDiaEstudio = hoy;
  }

  reviewAcciones.querySelectorAll(".review-pill").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!cola.length) return;
      const tarjeta = cola.shift();
      const srs = await obtenerDato(STORAGE_SRS, {});
      const stats = await obtenerDato(STORAGE_STATS, STATS_POR_DEFECTO);
      const nivel = btn.dataset.nivel;

      if (nivel === "nose") {
        srs[tarjeta.key] = { dueDate: hoyISO(), correcta: false };
        cola.push(tarjeta);
        stats.respuestasIncorrectas++;
      } else if (nivel === "dificil") {
        srs[tarjeta.key] = { dueDate: sumarDias(1), correcta: true };
        completados++;
        stats.respuestasCorrectas++;
      } else if (nivel === "normal") {
        srs[tarjeta.key] = { dueDate: sumarDias(2), correcta: true };
        completados++;
        stats.respuestasCorrectas++;
      } else if (nivel === "facil") {
        srs[tarjeta.key] = { dueDate: sumarDias(7), correcta: true };
        completados++;
        stats.respuestasCorrectas++;
      }

      actualizarRacha(stats);

      await guardarDato(STORAGE_SRS, srs);
      await guardarDato(STORAGE_STATS, stats);
      mostrarTarjetaActual();
    });
  });

  function terminarRepaso() {
    reviewCard.classList.add("oculto");
    reviewAcciones.classList.add("oculto");
    reviewDots.innerHTML = "";
    reviewCompleto.classList.remove("oculto");
  }

  cambiarOrigenBtn.addEventListener("click", volverAOrigen);

  function reiniciarRepasoActual() {
    if (materialActual) {
      iniciarRepaso(materialActual);
    } else {
      volverAOrigen();
    }
  }

  reiniciarBtn.addEventListener("click", reiniciarRepasoActual);
  reiniciarIconoBtn.addEventListener("click", reiniciarRepasoActual);

  function volverAOrigen() {
    reviewSeccion.classList.add("oculto");
    origenSeccion.classList.remove("oculto");
    cargarMateriales();
  }

  // ---------- Arranque ----------
  (async () => {
    await cargarMateriales();

    const idDesdeUrl = new URLSearchParams(window.location.search).get("tema");
    if (idDesdeUrl) {
      const material = materialesCache.find((m) => m.id === idDesdeUrl);
      if (material) seleccionarMaterial(material);
    }
  })();
})();
