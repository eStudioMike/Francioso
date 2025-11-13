// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Assicurati di avere process.env.JWT_SECRET impostato (.env in locale o env var su Render)
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXP = process.env.JWT_EXP || "8h"; // es. 8 ore

// login: { email, password }
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: "Email e password richieste" });

  try {
    const q =
      "SELECT id, email, password_hash, name FROM users WHERE email = $1";
    const r = await req.app.get("dbClient").query(q, [email.toLowerCase()]);
    if (r.rows.length === 0) {
      // per sicurezza, non rivelare se l'email non esiste
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const user = r.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ message: "Credenziali non valide" });

    // recupera ruoli utente (opzionale)
    const rolesQ = `
      SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1
    `;
    const rolesRes = await req.app.get("dbClient").query(rolesQ, [user.id]);
    const roles = rolesRes.rows.map((r) => r.name);

    // crea JWT (payload minimale)
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXP });

    // Log dell'azione (usa la funzione che hai definito, qui un inserto diretto per esempio)
    try {
      const ip = req.ip || req.headers["x-forwarded-for"] || null;
      const ua = req.headers["user-agent"] || null;
      const lq = `INSERT INTO action_logs (user_id, action, details, ip_addr, user_agent) VALUES ($1,$2,$3,$4,$5)`;
      await req.app
        .get("dbClient")
        .query(lq, [user.id, "login_success", { userAgent: ua }, ip, ua]);
    } catch (e) {
      console.warn("Log fallito", e.message || e);
    }

    // invia token + user (non inviare password_hash)
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, roles },
    });
  } catch (err) {
    console.error("Errore login:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

module.exports = router;
