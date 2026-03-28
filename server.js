const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURAÇÃO DO ELEFANTE (PostgreSQL)
// Substitua o texto abaixo pela sua Connection String do Neon.tech
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_j1YPIZWsV0QJ@ep-rough-flower-anc5yngz-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require', 
  ssl: { rejectUnauthorized: false }
});

// Criar a tabela automaticamente ao ligar o servidor para evitar erros
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS estoque (
        cod TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        qtd INTEGER DEFAULT 0,
        tipo TEXT,
        min INTEGER DEFAULT 5
      )
    `);
    console.log("✅ Banco de dados pronto para uso!");
  } catch (err) {
    console.error("❌ Erro ao iniciar banco:", err.message);
  }
};
initDB();

// ROTA: Buscar todo o estoque
app.get('/estoque', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estoque ORDER BY (qtd <= min) DESC, nome ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ROTA: Salvar ou Atualizar produto
app.post('/estoque', async (req, res) => {
  const { cod, nome, qtd, tipo, min } = req.body;
  try {
    await pool.query(
      `INSERT INTO estoque (cod, nome, qtd, tipo, min) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (cod) DO UPDATE SET qtd = $3, nome = $2, min = $5`,
      [cod, nome, qtd, tipo, min]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ROTA: Deletar produto
app.delete('/estoque/:cod', async (req, res) => {
  try {
    await pool.query('DELETE FROM estoque WHERE cod = $1', [req.params.cod]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor voando na porta ${PORT}`));
