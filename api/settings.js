const { pool, ensureTables } = require('./db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const client = await pool.connect();
  try {
    await ensureTables(client);

    if (req.method === 'GET') {
      const { rows } = await client.query('SELECT key, value FROM settings');
      const result = {};
      rows.forEach(r => result[r.key] = r.value);
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ error: 'No autorizado' });
      try {
        const jwt = require('jsonwebtoken');
        jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Token inválido' });
      }

      const { whatsapp, logo_url } = req.body;
      if (whatsapp !== undefined) {
        await client.query(`INSERT INTO settings (key,value) VALUES ('whatsapp',$1) ON CONFLICT (key) DO UPDATE SET value=$1`, [whatsapp]);
      }
      if (logo_url !== undefined) {
        await client.query(`INSERT INTO settings (key,value) VALUES ('logo_url',$1) ON CONFLICT (key) DO UPDATE SET value=$1`, [logo_url]);
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
