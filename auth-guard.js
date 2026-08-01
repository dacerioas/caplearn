(() => {
  function iniciales(nombre) {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join("");
  }

  async function cargarPerfil() {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        window.location.href = "index.html";
        return;
      }
      const usuario = await res.json();

      const nombreEl = document.getElementById("perfilNombre");
      const avatarEl = document.getElementById("perfilAvatar");
      const saludoEl = document.getElementById("saludoNombre");
      if (nombreEl) nombreEl.textContent = usuario.nombre;
      if (avatarEl) avatarEl.textContent = iniciales(usuario.nombre);
      if (saludoEl) saludoEl.textContent = usuario.nombre.trim().split(/\s+/)[0];
    } catch {
      window.location.href = "index.html";
    }
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "index.html";
    });
  }

  cargarPerfil();
})();
