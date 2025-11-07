// index.js
require("dotenv").config();
const express = require("express");
const { Client } = require("pg");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());

// Se usi un frontend separato su Render, imposta FRONTEND_URL in .env o env var su Render.
// In locale puoi usare http://localhost:5173 o l'URL del tuo frontend.
const FRONTEND_URL = process.env.FRONTEND_URL || "*";
app.use(cors({ origin: FRONTEND_URL }));

// Serve frontend static (opzionale). Se non hai file statici, non fa nulla.
// Assumiamo che la cartella frontend contenga index.html se vuoi servire il sito con Express.
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath, { extensions: ["html"] }));

// Connessione al DB
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

client
  .connect()
  .then(() => console.log("✅ Database connesso con successo"))
  .catch((err) => {
    console.error("❌ Errore di connessione al database:", err.message || err);
    // non exit, così puoi comunque testare le rotte che non usano DB
  });

// Root (ora risponde)
app.get("/", (req, res) => {
  // Se esiste un index.html nella cartella frontend verrà servito automaticamente.
  // Altrimenti rispondiamo con un semplice HTML
  const indexFile = path.join(frontendPath, "index.html");
  res.sendFile(indexFile, (err) => {
    if (err) {
      return res.send(`
        <h1>Francioso CRM - Backend</h1>
        <p>Server attivo. Usa <a href="/health">/health</a> e <a href="/users">/users</a></p>
      `);
    }
  });
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/users", async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, name, email FROM users ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Errore durante la query:", err.message || err);
    res.status(500).json({ error: "Errore nel server" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🚀 Server avviato su http://localhost:${port}`);
});
