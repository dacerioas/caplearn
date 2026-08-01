const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const { extractText } = require("../utils/extractText");
const { generateFromText } = require("../utils/ai");

const router = express.Router();

const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".md"]);
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return cb(new Error(`Formato no soportado: ${ext || "desconocido"}`));
    }
    cb(null, true);
  },
});

router.post("/extract", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se recibió ningún archivo." });
  }

  const tempPath = path.join(req.file.destination, req.file.filename);
  const renamedPath = `${tempPath}${path.extname(req.file.originalname).toLowerCase()}`;

  try {
    await fs.rename(tempPath, renamedPath);
    const text = await extractText(renamedPath);

    if (!text || !text.trim()) {
      return res.status(422).json({ error: "No se pudo extraer texto del archivo." });
    }

    res.json({ text, fileName: req.file.originalname, charCount: text.length });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al procesar el archivo." });
  } finally {
    await fs.unlink(renamedPath).catch(() => {});
  }
});

router.post("/generate", async (req, res) => {
  const { text, type } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Falta el texto del material." });
  }
  if (!type) {
    return res.status(400).json({ error: "Falta el tipo de generación." });
  }

  try {
    const result = await generateFromText(text, type);
    res.json({ type, result });
  } catch (err) {
    if (err.code === "MISSING_API_KEY" || err.code === "INVALID_API_KEY") {
      return res.status(503).json({ error: err.message, code: err.code });
    }
    if (err.code === "RATE_LIMITED") {
      return res.status(429).json({ error: err.message, code: err.code });
    }
    if (err.code === "SERVICE_OVERLOADED") {
      return res.status(503).json({ error: err.message, code: err.code });
    }
    if (err.code === "BAD_AI_RESPONSE") {
      return res.status(502).json({ error: err.message, code: err.code, raw: err.raw });
    }
    res.status(500).json({ error: err.message || "Error al generar contenido con IA." });
  }
});

module.exports = router;
