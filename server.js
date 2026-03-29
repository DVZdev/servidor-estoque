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

// --- FUNÇÃO DE AUTO-UPDATE DO BANCO ---
// Esta função verifica se a coluna qtd_sistema existe, se não existir, ela cria.
const atualizarBanco = async () => {
  try {
    await pool.query(`
      ALTER TABLE estoque 
      ADD COLUMN IF NOT EXISTS qtd_sistema INTEGER DEFAULT 0;
    `);
    console.log("✅ Coluna 'qtd_sistema' verificada/criada com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao atualizar tabela de estoque:", err);
  }
};
atualizarBanco();

// --- ROTAS DE ESTOQUE ---
app.get('/estoque', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estoque ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/estoque', async (req, res) => {
  const { cod, nome, qtd, qtd_sistema, tipo, min } = req.body;
  try {
    await pool.query(
      `INSERT INTO estoque (cod, nome, qtd, qtd_sistema, tipo, min) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (cod) 
       DO UPDATE SET nome=$2, qtd=$3, qtd_sistema=$4, tipo=$5, min=$6`,
      [cod, nome, qtd, qtd_sistema || 0, tipo || 'un', min || 5]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/estoque/:cod', async (req, res) => {
  try {
    await pool.query('DELETE FROM estoque WHERE cod = $1', [req.params.cod]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS DE HISTÓRICO ---
app.post('/historico', async (req, res) => {
  const { cod, nome, qtd, tipo_mov, usuario } = req.body;
  try {
    await pool.query(
      'INSERT INTO historico (cod, nome, qtd, tipo_mov, usuario) VALUES ($1, $2, $3, $4, $5)',
      [cod, nome, qtd, tipo_mov, usuario]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/historico', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM historico ORDER BY data DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/auth/login', async (req, res) => {
  const { u, p } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE u = $1 AND p = $2', [u, p]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(401).send('Erro');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/register', async (req, res) => {
  const { u, p } = req.body;
  try {
    await pool.query('INSERT INTO usuarios (u, p, isadmin) VALUES ($1, $2, false)', [u, p]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Servidor rodando na porta ${process.env.PORT || 3000}`);
});
