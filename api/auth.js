// POST /api/auth  → login admin, devuelve JWT
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body || {};
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassHash = process.env.ADMIN_PASSWORD_HASH;
  const jwtSecret     = process.env.JWT_SECRET;

  if (!adminEmail || !adminPassHash || !jwtSecret) {
    return res.status(500).json({ error: 'Admin no configurado en variables de entorno' });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const valid = await bcrypt.compare(password, adminPassHash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '8h' });
  return res.status(200).json({ token });
};
