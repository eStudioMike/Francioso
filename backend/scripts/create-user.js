// scripts/create-user.js
require("dotenv").config();
const bcrypt = require("bcrypt");
const { Client } = require("pg");

(async () => {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    const email = process.argv[2] || "mario.rossi@example.com";
    const password = process.argv[3] || "Password123";
    const name = process.argv[4] || "Mario Rossi";

    const hash = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, created_at
    `;

    const res = await client.query(query, [email.toLowerCase(), hash, name]);
    console.log("✅ Utente creato con successo:", res.rows[0]);

    await client.end();
  } catch (err) {
    console.error("❌ Errore durante la creazione utente:", err.message);
    process.exit(1);
  }
})();
