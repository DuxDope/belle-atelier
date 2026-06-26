// DELETE /api/products/:id
const { pool } = require('../db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Método no permitido' });

  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No autorizado' });
  try {
    const jwt = require('jsonwebtoken');
    jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const { id } = req.query;
  const client = await pool.connect();
  try {
    const { rowCount } = await client.query('DELETE FROM products WHERE id=$1', [Number(id)]);
    if (rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
