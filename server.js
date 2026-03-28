const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Rotas de Estoque
app.get('/estoque', async (req, res) => {
  const result = await pool.query('SELECT * FROM estoque ORDER BY nome ASC');
  res.json(result.rows);
});

app.post('/estoque', async (req, res) => {
  const { cod, nome, qtd, tipo, min } = req.body;
  await pool.query(
    'INSERT INTO estoque (cod, nome, qtd, tipo, min) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cod) DO UPDATE SET nome=$2, qtd=$3, tipo=$4, min=$5',
    [cod, nome, qtd, tipo || 'un', min || 5]
  );
  res.sendStatus(200);
});

app.delete('/estoque/:cod', async (req, res) => {
  await pool.query('DELETE FROM estoque WHERE cod = $1', [req.params.cod]);
  res.sendStatus(200);
});

// Rotas de Histórico
app.post('/historico', async (req, res) => {
  const { cod, nome, qtd, tipo_mov, usuario } = req.body;
  await pool.query(
    'INSERT INTO historico (cod, nome, qtd, tipo_mov, usuario) VALUES ($1, $2, $3, $4, $5)',
    [cod, nome, qtd, tipo_mov, usuario]
  );
  res.sendStatus(200);
});

app.get('/historico', async (req, res) => {
  const result = await pool.query('SELECT * FROM historico ORDER BY data DESC LIMIT 100');
  res.json(result.rows);
});

// Rotas de Autenticação
app.post('/auth/login', async (req, res) => {
  const { u, p } = req.body;
  const result = await pool.query('SELECT * FROM usuarios WHERE u = $1 AND p = $2', [u, p]);
  if (result.rows.length > 0) res.json(result.rows[0]);
  else res.status(401).send('Erro');
});

app.post('/auth/register', async (req, res) => {
  const { u, p } = req.body;
  await pool.query('INSERT INTO usuarios (u, p, isadmin) VALUES ($1, $2, false)', [u, p]);
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000);
