const express = require("express");
const { chatReply } = require("../utils/ai");

const router = express.Router();

router.post("/", async (req, res) => {
  const { historial } = req.body || {};

  if (!Array.isArray(historial) || !historial.length) {
    return res.status(400).json({ error: "Falta el historial de la conversación." });
  }

  try {
    const reply = await chatReply(historial);
    res.json({ reply });
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
    res.status(500).json({ error: err.message || "Error al generar la respuesta." });
  }
});

module.exports = router;
