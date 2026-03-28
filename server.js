const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Conexão com o Banco de Dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Teste de conexão inicial
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error("Erro ao conectar no Banco:", err);
  else console.log("Banco de Dados Conectado com Sucesso!");
});

// --- ROTAS ---

app.get('/estoque', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estoque ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json(err); }
});

app.post('/estoque', async (req, res) => {
  try {
    const { cod, nome, qtd, tipo, min } = req.body;
    await pool.query(
      'INSERT INTO estoque (cod, nome, qtd, tipo, min) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cod) DO UPDATE SET nome=$2, qtd=$3, tipo=$4, min=$5',
      [cod, nome, qtd, tipo, min || 5]
    );
    res.sendStatus(200);
  } catch (err) { res.status(500).json(err); }
});

app.post('/historico', async (req, res) => {
  try {
    const { cod, nome, qtd, tipo_mov, usuario, destino } = req.body;
    await pool.query(
      'INSERT INTO historico (cod, nome, qtd, tipo_mov, usuario, destino) VALUES ($1, $2, $3, $4, $5, $6)',
      [cod, nome, qtd, tipo_mov, usuario, destino || 'ESTOQUE']
    );
    res.sendStatus(200);
  } catch (err) { res.status(500).json(err); }
});

app.get('/historico', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM historico ORDER BY data DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) { res.status(500).json(err); }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { u, p } = req.body;
    const result = await pool.query('SELECT * FROM usuarios WHERE u = $1 AND p = $2', [u, p]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(401).send('Incorreto');
  } catch (err) { res.status(500).json(err); }
});

app.post('/auth/register', async (req, res) => {
  try {
    const { u, p } = req.body;
    await pool.query('INSERT INTO usuarios (u, p, isadmin) VALUES ($1, $2, false)', [u, p]);
    res.sendStatus(200);
  } catch (err) { res.status(500).json(err); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
