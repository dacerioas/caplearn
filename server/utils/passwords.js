const crypto = require("crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const hashIntentado = crypto.scryptSync(password, salt, 64).toString("hex");
  const bufferGuardado = Buffer.from(hash, "hex");
  const bufferIntentado = Buffer.from(hashIntentado, "hex");
  if (bufferGuardado.length !== bufferIntentado.length) return false;
  return crypto.timingSafeEqual(bufferGuardado, bufferIntentado);
}

module.exports = { hashPassword, verifyPassword };
