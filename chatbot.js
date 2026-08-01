(() => {
  const STORAGE_HISTORIAL = "caplearn_chat_historial";
  const SALUDO_INICIAL = "¡Hola! Soy FlashBot 👋 ¿En qué te puedo ayudar hoy? Puedo explicarte conceptos, ayudarte a repasar o darte técnicas de estudio.";

  const chatMensajes = document.getElementById("chatMensajes");
  const chatEscribiendo = document.getElementById("chatEscribiendo");
  const chatError = document.getElementById("chatError");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatEnviarBtn = document.getElementById("chatEnviarBtn");
  const nuevaConversacionBtn = document.getElementById("nuevaConversacionBtn");

  function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
  }

  function agregarBurbuja(role, texto) {
    const burbuja = document.createElement("div");
    if (role === "user") {
      burbuja.className = "mensaje mensaje-usuario";
      burbuja.textContent = texto;
    } else {
      burbuja.className = "mensaje mensaje-bot";
      burbuja.innerHTML = `
        <img src="fllashbot_logo_white.PNG" alt="FlashBot" class="chat-avatar">
        <span class="mensaje-bot-texto">${escaparHtml(texto)}</span>`;
    }
    chatMensajes.appendChild(burbuja);
    chatMensajes.scrollTop = chatMensajes.scrollHeight;
  }

  async function renderizarHistorial() {
    chatMensajes.innerHTML = "";
    agregarBurbuja("model", SALUDO_INICIAL);
    const historial = await obtenerDato(STORAGE_HISTORIAL, []);
    historial.forEach((turno) => agregarBurbuja(turno.role, turno.text));
  }

  async function enviarMensaje(texto) {
    const historial = await obtenerDato(STORAGE_HISTORIAL, []);
    historial.push({ role: "user", text: texto });
    await guardarDato(STORAGE_HISTORIAL, historial);
    agregarBurbuja("user", texto);

    chatInput.value = "";
    chatEnviarBtn.disabled = true;
    chatError.classList.add("oculto");
    chatEscribiendo.classList.remove("oculto");
    chatMensajes.scrollTop = chatMensajes.scrollHeight;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historial }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "No se pudo obtener respuesta de FlashBot.");

      historial.push({ role: "model", text: data.reply });
      await guardarDato(STORAGE_HISTORIAL, historial);
      agregarBurbuja("model", data.reply);
    } catch (err) {
      chatError.textContent = err.message;
      chatError.classList.remove("oculto");
    } finally {
      chatEscribiendo.classList.add("oculto");
      chatEnviarBtn.disabled = false;
      chatInput.focus();
    }
  }

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = chatInput.value.trim();
    if (!texto) return;
    enviarMensaje(texto);
  });

  nuevaConversacionBtn.addEventListener("click", async () => {
    await guardarDato(STORAGE_HISTORIAL, []);
    chatError.classList.add("oculto");
    renderizarHistorial();
  });

  renderizarHistorial();
})();
