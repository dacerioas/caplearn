(() => {
  const loginForm = document.getElementById("loginForm");
  const registroForm = document.getElementById("registroForm");
  const loginError = document.getElementById("loginError");
  const registroError = document.getElementById("registroError");
  const loginBtn = document.getElementById("loginBtn");
  const registroBtn = document.getElementById("registroBtn");

  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("activo"));
      tab.classList.add("activo");
      const destino = tab.dataset.tab;
      loginForm.classList.toggle("oculto", destino !== "login");
      registroForm.classList.toggle("oculto", destino !== "registro");
    });
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.classList.add("oculto");
    loginBtn.disabled = true;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: document.getElementById("loginEmail").value,
          password: document.getElementById("loginPassword").value,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "No se pudo iniciar sesión.");

      window.location.href = "dashboard.html";
    } catch (err) {
      loginError.textContent = err.message;
      loginError.classList.remove("oculto");
    } finally {
      loginBtn.disabled = false;
    }
  });

  registroForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    registroError.classList.add("oculto");
    registroBtn.disabled = true;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: document.getElementById("registroNombre").value,
          email: document.getElementById("registroEmail").value,
          password: document.getElementById("registroPassword").value,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "No se pudo crear la cuenta.");

      window.location.href = "dashboard.html";
    } catch (err) {
      registroError.textContent = err.message;
      registroError.classList.remove("oculto");
    } finally {
      registroBtn.disabled = false;
    }
  });
})();
