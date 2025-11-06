// server.js
require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// health
app.get("/health", (req, res) => res.json({ ok: true }));

// === Companies ===
// lista companies
app.get("/api/companies", async (req, res) => {
  try {
    const companies = await prisma.company.findMany();
    res.json({ ok: true, companies });
  } catch (err) {
    console.error("ERR /api/companies", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// crea company
app.post("/api/companies", async (req, res) => {
  try {
    const { name, vatNumber } = req.body;
    const company = await prisma.company.create({ data: { name, vatNumber } });
    res.status(201).json({ ok: true, company });
  } catch (err) {
    console.error("ERR POST /api/companies", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// === Contacts ===
// lista contacts
app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      include: { company: true },
    });
    res.json({ ok: true, contacts });
  } catch (err) {
    console.error("ERR /api/contacts", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// crea contact
app.post("/api/contacts", async (req, res) => {
  try {
    const { name, email, phone, companyId } = req.body;
    const contact = await prisma.contact.create({
      data: { name, email, phone, companyId: companyId || null },
    });
    res.status(201).json({ ok: true, contact });
  } catch (err) {
    console.error("ERR POST /api/contacts", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// chiudi connection prisma on exit
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server avviato su porta ${PORT}`));
