const express = require("express");
const db = require("../db");
const { hashPassword, verifyPassword } = require("../utils/passwords");

const router = express.Router();

router.post("/register", (req, res) => {
  const { nombre, email, password } = req.body || {};

  if (!nombre || !nombre.trim() || !email || !password) {
    return res.status(400).json({ error: "Faltan datos: nombre, correo y contraseña son obligatorios." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
  }

  const emailNormalizado = email.trim().toLowerCase();
  const existente = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(emailNormalizado);
  if (existente) {
    return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
  }

  const { hash, salt } = hashPassword(password);
  const resultado = db
    .prepare("INSERT INTO usuarios (nombre, email, password_hash, password_salt) VALUES (?, ?, ?, ?)")
    .run(nombre.trim(), emailNormalizado, hash, salt);

  req.session.userId = Number(resultado.lastInsertRowid);
  res.json({ id: req.session.userId, nombre: nombre.trim(), email: emailNormalizado });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Falta correo o contraseña." });
  }

  const emailNormalizado = email.trim().toLowerCase();
  const usuario = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(emailNormalizado);

  if (!usuario || !verifyPassword(password, usuario.password_hash, usuario.password_salt)) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  }

  req.session.userId = usuario.id;
  res.json({ id: usuario.id, nombre: usuario.nombre, email: usuario.email });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No hay sesión activa." });
  }
  const usuario = db.prepare("SELECT id, nombre, email FROM usuarios WHERE id = ?").get(req.session.userId);
  if (!usuario) {
    return res.status(401).json({ error: "No hay sesión activa." });
  }
  res.json(usuario);
});

module.exports = router;
