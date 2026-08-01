const express = require("express");
const db = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/:clave", requireAuth, (req, res) => {
  const fila = db
    .prepare("SELECT valor FROM datos_usuario WHERE usuario_id = ? AND clave = ?")
    .get(req.session.userId, req.params.clave);
  res.json({ valor: fila ? JSON.parse(fila.valor) : null });
});

router.put("/:clave", requireAuth, (req, res) => {
  const valor = JSON.stringify(req.body.valor ?? null);
  db.prepare(
    `INSERT INTO datos_usuario (usuario_id, clave, valor) VALUES (?, ?, ?)
     ON CONFLICT(usuario_id, clave) DO UPDATE SET valor = excluded.valor`
  ).run(req.session.userId, req.params.clave, valor);
  res.json({ ok: true });
});

module.exports = router;
