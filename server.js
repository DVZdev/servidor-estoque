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

// --- NOVAS ROTAS DE ADMIN ---

// Listar usuários
app.get('/auth/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT u, isadmin FROM usuarios ORDER BY u ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Excluir usuário
app.delete('/auth/users/:username', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE u = $1', [req.params.username]);
    res.sendStatus(200);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Alterar senha
app.put('/auth/users/password', async (req, res) => {
  const { u, newPassword } = req.body;
  try {
    await pool.query('UPDATE usuarios SET p = $1 WHERE u = $2', [newPassword, u]);
    res.sendStatus(200);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- MANTENDO AS ROTAS ANTERIORES ---
app.post('/auth/register', async (req, res) => {
  const { u, p } = req.body;
  try {
    const count = await pool.query('SELECT COUNT(*) FROM usuarios');
    const isFirst = parseInt(count.rows[0].count) === 0;
    await pool.query('INSERT INTO usuarios (u, p, isadmin) VALUES ($1, $2, $3)', [u, p, isFirst]);
    res.sendStatus(201);
  } catch (err) { res.status(400).json({ error: "Erro ao registrar" }); }
});

app.post('/auth/login', async (req, res) => {
  const { u, p } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE u = $1 AND p = $2', [u, p]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(401).json({ error: "Incorreto" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rotas de estoque (Mantidas iguais ao que você já tem)
app.get('/estoque', async (req, res) => {
  const r = await pool.query('SELECT * FROM estoque ORDER BY nome ASC');
  res.json(r.rows);
});
app.post('/estoque', async (req, res) => {
  const { cod, nome, qtd, tipo, min } = req.body;
  await pool.query('INSERT INTO estoque (cod, nome, qtd, tipo, min) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cod) DO UPDATE SET qtd = $3, nome = $2, min = $5', [cod, nome, qtd, tipo, min]);
  res.sendStatus(200);
});
app.delete('/estoque/:cod', async (req, res) => {
  await pool.query('DELETE FROM estoque WHERE cod = $1', [req.params.cod]);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));
