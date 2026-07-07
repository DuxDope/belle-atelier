// GET    /api/products/:id  → obtiene un producto con sus variantes
// PUT    /api/products/:id  → actualiza producto y reemplaza variantes
// DELETE /api/products/:id  → elimina producto
const { pool } = require('../db');
const jwt = require('jsonwebtoken');

function checkAuth(req) {
  const auth = req.headers.authorization;
  if (!auth) return false;
  try {
    jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
    return true;
  } catch { return false; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  const productId = Number(id);
  if (!productId) return res.status(400).json({ error: 'ID inválido' });

  const client = await pool.connect();
  try {

    // ── GET: traer producto + variantes ──────
    if (req.method === 'GET') {
      const { rows: prods } = await client.query('SELECT * FROM products WHERE id=$1', [productId]);
      if (!prods.length) return res.status(404).json({ error: 'No encontrado' });
      const { rows: variants } = await client.query('SELECT * FROM variants WHERE product_id=$1 ORDER BY created_at ASC', [productId]);
      return res.status(200).json({ ...prods[0], desc: prods[0].description, variants });
    }

    // ── PUT: actualizar producto + variantes ─
    if (req.method === 'PUT') {
      if (!checkAuth(req)) return res.status(401).json({ error: 'No autorizado' });

      const { name, brand, cat, desc, info, badge, emoji, image_url, variants } = req.body;
      if (!name || !brand || !cat || !desc) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }
      if (!variants || !variants.length) {
        return res.status(400).json({ error: 'Agrega al menos un tono' });
      }

      await client.query('BEGIN');

      await client.query(
        `UPDATE products SET name=$1, brand=$2, cat=$3, description=$4, info=$5, badge=$6, emoji=$7, image_url=$8
         WHERE id=$9`,
        [name, brand, cat, desc, info||'', badge||'', emoji||'💄', image_url||'', productId]
      );

      // Variantes existentes en BD
      const { rows: existing } = await client.query('SELECT id FROM variants WHERE product_id=$1', [productId]);
      const existingIds = existing.map(v => v.id);
      const incomingIds = variants.filter(v => v.id).map(v => Number(v.id));

      // Eliminar las que ya no vienen
      const toDelete = existingIds.filter(eid => !incomingIds.includes(eid));
      if (toDelete.length) {
        await client.query('DELETE FROM variants WHERE id = ANY($1::int[])', [toDelete]);
      }

      // Actualizar o insertar
      for (const v of variants) {
        if (v.id && existingIds.includes(Number(v.id))) {
          await client.query(
            `UPDATE variants SET tone=$1, price=$2, stock=$3, image_url=$4 WHERE id=$5`,
            [v.tone, Number(v.price)||0, Number(v.stock)||0, v.image_url||'', Number(v.id)]
          );
        } else {
          await client.query(
            `INSERT INTO variants (product_id, tone, price, stock, image_url) VALUES ($1,$2,$3,$4,$5)`,
            [productId, v.tone, Number(v.price)||0, Number(v.stock)||0, v.image_url||'']
          );
        }
      }

      await client.query('COMMIT');

      const { rows: prods } = await client.query('SELECT * FROM products WHERE id=$1', [productId]);
      const { rows: newVariants } = await client.query('SELECT * FROM variants WHERE product_id=$1 ORDER BY created_at ASC', [productId]);
      return res.status(200).json({ ...prods[0], desc: prods[0].description, variants: newVariants });
    }

    // ── DELETE ────────────────────────────────
    if (req.method === 'DELETE') {
      if (!checkAuth(req)) return res.status(401).json({ error: 'No autorizado' });
      const { rowCount } = await client.query('DELETE FROM products WHERE id=$1', [productId]);
      if (rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error('DB error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
