(() => {
  const STORAGE_SRS = "caplearn_srs";
  const STORAGE_STATS = "caplearn_stats";

  const STATS_POR_DEFECTO = {
    respuestasCorrectas: 0,
    respuestasIncorrectas: 0,
    rachaDias: 0,
    ultimoDiaEstudio: null,
  };

  const ICONO_LAPIZ = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`;
  const ICONO_LIBRO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;

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
  const crearManualBtn = document.getElementById("crearManualBtn");
  const origenVacio = document.getElementById("origenVacio");
  const temasLista = document.getElementById("temasLista");
  const categoriaFiltros = document.getElementById("categoriaFiltros");
  const temasBuscador = document.getElementById("temasBuscador");

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
  let srsCache = {};
  let categoriaActiva = "Todos";

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

  function normalizar(texto) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  function mostrar(el) {
    el.classList.remove("oculto");
  }

  function ocultar(el) {
    el.classList.add("oculto");
  }

  function claveTarjetaLista(materialId, indice, pregunta) {
    return `${materialId}:${indice}:${(pregunta || "").slice(0, 30)}`;
  }

  function contarCompletadasLista(material) {
    return (material.flashcards || []).filter((t, i) => {
      const registro = srsCache[claveTarjetaLista(material.id, i, t.question)];
      return registro && registro.correcta === true;
    }).length;
  }

  // ---------- Lista de temas ----------
  async function cargarMateriales() {
    materialesCache = await obtenerMateriales();
    srsCache = await obtenerDato(STORAGE_SRS, {});
    renderizarFiltros();
    renderizarMateriales();
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
        renderizarMateriales();
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
    const totalFlashcards = (material.flashcards || []).length;
    const completadas = totalFlashcards ? contarCompletadasLista(material) : 0;
    const porcentaje = totalFlashcards ? Math.round((completadas / totalFlashcards) * 100) : 0;
    const meta =
      material.origen === "manual"
        ? `${totalFlashcards} tarjetas · Manual`
        : material.flashcards
        ? `${totalFlashcards} tarjetas`
        : "Clic para generar flashcards";

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
        <span>Progreso del tema</span>
        <span>${totalFlashcards ? porcentaje + "%" : "—"}</span>
      </div>
      <div class="tema-card-barra"><div class="tema-card-barra-relleno" style="width:${porcentaje}%"></div></div>
      <div class="tema-card-footer">${ICONO_LIBRO} ${meta}</div>
    </div>`;
  }

  function renderizarMateriales() {
    if (!materialesCache.length) {
      temasLista.innerHTML = "";
      origenVacio.textContent = "Todavía no tienes ningún tema. Sube material o crea uno manualmente.";
      origenVacio.classList.remove("oculto");
      return;
    }

    const filtrados = materialesFiltrados();

    if (!filtrados.length) {
      temasLista.innerHTML = "";
      origenVacio.textContent = "Ningún tema coincide con tu búsqueda.";
      origenVacio.classList.remove("oculto");
      return;
    }

    origenVacio.classList.add("oculto");
    temasLista.innerHTML = filtrados.map(tarjetaMaterialHtml).join("");

    temasLista.querySelectorAll(".tema-card").forEach((card) => {
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

    temasLista.querySelectorAll(".tema-card-editar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const material = materialesCache.find((m) => m.id === btn.dataset.id);
        if (!material) return;
        const nuevoNombre = prompt("Nuevo nombre para el tema:", material.nombre);
        if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === material.nombre) return;

        material.nombre = nuevoNombre.trim();
        await guardarMateriales(materialesCache);
        renderizarMateriales();
      });
    });
  }

  temasBuscador.addEventListener("input", renderizarMateriales);

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

  let categoriaSugerida = "Otro";

  crearManualBtn.addEventListener("click", () => {
    tarjetasManualNuevas = [];
    categoriaSugerida = "Otro";
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
        if (CATEGORIAS_VALIDAS.has(data.result.categoria)) categoriaSugerida = data.result.categoria;
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
      categoria: categoriaSugerida,
      descripcion: "",
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
