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
      const { rows: products } = await client.query('SELECT * FROM products ORDER BY created_at DESC');
      const { rows: variants } = await client.query('SELECT * FROM variants ORDER BY created_at ASC');
      const result = products.map(p => ({
        ...p, desc: p.description,
        variants: variants.filter(v => v.product_id === p.id)
      }));
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ error: 'No autorizado' });
      try {
        const jwt = require('jsonwebtoken');
        jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
      } catch { return res.status(401).json({ error: 'Token inválido' }); }

      const { name, brand, cat, desc, info, badge, emoji, image_url, variants } = req.body;
      if (!name || !brand || !cat || !desc) return res.status(400).json({ error: 'Faltan campos obligatorios' });
      if (!variants || !variants.length) return res.status(400).json({ error: 'Agrega al menos un tono' });

      const { rows: [product] } = await client.query(
        `INSERT INTO products (name, brand, cat, description, info, badge, emoji, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [name, brand, cat, desc, info||'', badge||'', emoji||'💄', image_url||'']
      );

      const insertedVariants = [];
      for (const v of variants) {
        const { rows: [variant] } = await client.query(
          `INSERT INTO variants (product_id, tone, price, stock, image_url, image_url2, image_url3)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
          [product.id, v.tone, Number(v.price)||0, Number(v.stock)||0,
           v.image_url||'', v.image_url2||'', v.image_url3||'']
        );
        insertedVariants.push(variant);
      }
      return res.status(201).json({ ...product, desc: product.description, variants: insertedVariants });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
