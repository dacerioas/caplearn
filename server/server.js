const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const session = require("express-session");
const SqliteSessionStore = require("./utils/sessionStore");

const materialRoutes = require("./routes/material");
const chatRoutes = require("./routes/chat");
const authRoutes = require("./routes/auth");
const dataRoutes = require("./routes/data");
const imagesRoutes = require("./routes/images");
const requireAuth = require("./middleware/requireAuth");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "GEMINI_API_KEY no configurada. La generación con IA devolverá error 503 hasta que la agregues en server/.env"
  );
}
if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET no configurada en server/.env. Usando un valor por defecto solo para desarrollo.");
}

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use(
  session({
    store: new SqliteSessionStore(),
    name: "caplearn.sid",
    secret: process.env.SESSION_SECRET || "caplearn-dev-secret-inseguro",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
    },
  })
);

// Páginas de la app que requieren haber iniciado sesión
const PAGINAS_PROTEGIDAS = new Set([
  "/dashboard.html",
  "/material.html",
  "/flashcards.html",
  "/chatbot.html",
  "/quiz.html",
]);

app.use((req, res, next) => {
  if (PAGINAS_PROTEGIDAS.has(req.path) && !req.session.userId) {
    return res.redirect("/index.html");
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/material", requireAuth, materialRoutes);
app.use("/api/chat", requireAuth, chatRoutes);
app.use("/api/images", requireAuth, imagesRoutes);

app.use(express.static(path.join(__dirname, "..")));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Error al subir archivo: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message || "Solicitud inválida." });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`CapLearn server escuchando en http://localhost:${PORT}`);
});
