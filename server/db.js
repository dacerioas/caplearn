const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync(path.join(__dirname, "caplearn.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS datos_usuario (
    usuario_id INTEGER NOT NULL,
    clave TEXT NOT NULL,
    valor TEXT NOT NULL,
    PRIMARY KEY (usuario_id, clave),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  );

  CREATE TABLE IF NOT EXISTS sesiones (
    sid TEXT PRIMARY KEY,
    datos TEXT NOT NULL,
    expira_en INTEGER NOT NULL
  );
`);

module.exports = db;
