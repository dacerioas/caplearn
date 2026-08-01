const session = require("express-session");
const db = require("../db");

const UNA_SEMANA_MS = 1000 * 60 * 60 * 24 * 7;
const LIMPIEZA_INTERVALO_MS = 1000 * 60 * 60;

class SqliteSessionStore extends session.Store {
  get(sid, callback) {
    try {
      const fila = db.prepare("SELECT datos, expira_en FROM sesiones WHERE sid = ?").get(sid);
      if (!fila) return callback(null, null);
      if (fila.expira_en < Date.now()) {
        db.prepare("DELETE FROM sesiones WHERE sid = ?").run(sid);
        return callback(null, null);
      }
      callback(null, JSON.parse(fila.datos));
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sessionData, callback) {
    try {
      const expiraEn = sessionData.cookie && sessionData.cookie.expires
        ? new Date(sessionData.cookie.expires).getTime()
        : Date.now() + UNA_SEMANA_MS;
      db.prepare(
        `INSERT INTO sesiones (sid, datos, expira_en) VALUES (?, ?, ?)
         ON CONFLICT(sid) DO UPDATE SET datos = excluded.datos, expira_en = excluded.expira_en`
      ).run(sid, JSON.stringify(sessionData), expiraEn);
      callback && callback(null);
    } catch (err) {
      callback && callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      db.prepare("DELETE FROM sesiones WHERE sid = ?").run(sid);
      callback && callback(null);
    } catch (err) {
      callback && callback(err);
    }
  }

  touch(sid, sessionData, callback) {
    this.set(sid, sessionData, callback);
  }
}

setInterval(() => {
  try {
    db.prepare("DELETE FROM sesiones WHERE expira_en < ?").run(Date.now());
  } catch {
    // limpieza best-effort: si falla, las filas vencidas se borran igual al leerlas
  }
}, LIMPIEZA_INTERVALO_MS).unref();

module.exports = SqliteSessionStore;
