const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function ensureTables(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS products (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      brand       TEXT NOT NULL,
      cat         TEXT NOT NULL,
      description TEXT NOT NULL,
      info        TEXT DEFAULT '',
      badge       TEXT DEFAULT '',
      emoji       TEXT DEFAULT '💄',
      image_url   TEXT DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS variants (
      id         SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      tone       TEXT NOT NULL,
      price      INTEGER NOT NULL,
      stock      INTEGER NOT NULL DEFAULT 0,
      image_url  TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    INSERT INTO settings (key, value) VALUES ('whatsapp', '56912345678')
    ON CONFLICT (key) DO NOTHING
  `);
  await client.query(`
    INSERT INTO settings (key, value) VALUES ('logo_url', '')
    ON CONFLICT (key) DO NOTHING
  `);
}

module.exports = { pool, ensureTables };
