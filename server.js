const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_j1YPIZWsV0QJ@ep-rough-flower-anc5yngz-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require', 
  ssl: { rejectUnauthorized: false }
});

const initDB = async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS estoque (cod TEXT PRIMARY KEY, nome TEXT NOT NULL, qtd INTEGER DEFAULT 0, tipo TEXT, min INTEGER DEFAULT 5)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (u TEXT PRIMARY KEY, p TEXT NOT NULL, isadmin BOOLEAN DEFAULT false)`);
    console.log("✅ Banco de dados e tabelas prontos!");
  } catch (err) { console.error("❌ Erro ao iniciar banco:", err.message); }
};
initDB();

app.post('/auth/register', async (req, res) => {
  const { u, p, isadmin } = req.body;
  try {
    await pool.query('INSERT INTO usuarios (u, p, isadmin) VALUES ($1, $2, $3)', [u, p, isadmin || false]);
    res.sendStatus(201);
  } catch (err) { res.status(400).json({ error: "Usuário já existe" }); }
});

app.post('/auth/login', async (req, res) => {
  const { u, p } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE u = $1 AND p = $2', [u, p]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(401).json({ error: "Login incorreto" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/estoque', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estoque ORDER BY (qtd <= min) DESC, nome ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/estoque', async (req, res) => {
  const { cod, nome, qtd, tipo, min } = req.body;
  try {
    await pool.query('INSERT INTO estoque (cod, nome, qtd, tipo, min) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cod) DO UPDATE SET qtd = $3, nome = $2, min = $5', [cod, nome, qtd, tipo, min]);
    res.sendStatus(200);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/estoque/:cod', async (req, res) => {
  try {
    await pool.query('DELETE FROM estoque WHERE cod = $1', [req.params.cod]);
    res.sendStatus(200);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));
