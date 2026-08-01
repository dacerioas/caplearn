const express = require("express");
const { buscarImagenTema } = require("../utils/images");

const router = express.Router();

router.get("/tema", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ url: null });

  const url = await buscarImagenTema(q);
  res.json({ url });
});

module.exports = router;
