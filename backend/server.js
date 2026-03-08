const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'avalia_ninho_secret_2024';

app.use(cors());
app.use(express.json());

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { phone, residence, password } = req.body;
  if (!phone || !residence || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  const residenceUpper = residence.toUpperCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE residence = ?').get(residenceUpper);
  if (existing) {
    return res.status(409).json({ error: 'Esta residência já está cadastrada' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (phone, residence, password_hash) VALUES (?, ?, ?)');
  const result = stmt.run(phone, residenceUpper, hash);
  const token = jwt.sign({ id: result.lastInsertRowid, residence: residenceUpper }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, residence: residenceUpper });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { phone, residence, password } = req.body;
  if (!phone || !residence || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  const residenceUpper = residence.toUpperCase().trim();
  const user = db.prepare('SELECT * FROM users WHERE phone = ? AND residence = ?').get(phone, residenceUpper);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  const token = jwt.sign({ id: user.id, residence: user.residence }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, residence: user.residence });
});

// GET /api/evaluations/mine
app.get('/api/evaluations/mine', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.name, p.phone, p.specialty,
      e.stars as my_stars, e.comment as my_comment,
      COALESCE(AVG(e2.stars), 0) as avg_stars,
      COUNT(e2.id) as total_evaluations
    FROM evaluations e
    JOIN providers p ON e.provider_id = p.id
    LEFT JOIN evaluations e2 ON p.id = e2.provider_id
    WHERE e.user_id = ?
    GROUP BY p.id
    ORDER BY p.name ASC
  `).all(req.user.id);
  res.json(rows);
});

// GET /api/providers - lista todos com minha nota
app.get('/api/providers', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.name, p.phone, p.specialty,
      COALESCE(AVG(e.stars), 0) as avg_stars,
      COUNT(e.id) as total_evaluations,
      me.stars as my_stars
    FROM providers p
    LEFT JOIN evaluations e ON p.id = e.provider_id
    LEFT JOIN evaluations me ON p.id = me.provider_id AND me.user_id = ?
    GROUP BY p.id
    ORDER BY p.name ASC
  `).all(req.user.id);
  res.json(rows);
});

// GET /api/providers/search?q=
app.get('/api/providers/search', authMiddleware, (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const providers = db.prepare(`
    SELECT p.id, p.name, p.phone, p.specialty,
      COALESCE(AVG(e.stars), 0) as avg_stars,
      COUNT(e.id) as total_evaluations
    FROM providers p
    LEFT JOIN evaluations e ON p.id = e.provider_id
    WHERE p.name LIKE ? OR p.phone LIKE ?
    GROUP BY p.id
    ORDER BY avg_stars DESC
    LIMIT 20
  `).all(`%${q}%`, `%${q}%`);
  res.json(providers);
});

// GET /api/providers/:id
app.get('/api/providers/:id', authMiddleware, (req, res) => {
  const provider = db.prepare(`
    SELECT p.id, p.name, p.phone, p.specialty,
      COALESCE(AVG(e.stars), 0) as avg_stars,
      COUNT(e.id) as total_evaluations
    FROM providers p
    LEFT JOIN evaluations e ON p.id = e.provider_id
    WHERE p.id = ?
    GROUP BY p.id
  `).get(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Prestador não encontrado' });

  const reviews = db.prepare(`
    SELECT e.stars, e.comment, e.created_at, u.residence
    FROM evaluations e
    JOIN users u ON e.user_id = u.id
    WHERE e.provider_id = ?
    ORDER BY e.created_at DESC
  `).all(req.params.id);

  res.json({ ...provider, reviews });
});

// GET /api/providers/:id/my-evaluation
app.get('/api/providers/:id/my-evaluation', authMiddleware, (req, res) => {
  const evaluation = db.prepare(
    'SELECT * FROM evaluations WHERE user_id = ? AND provider_id = ?'
  ).get(req.user.id, req.params.id);
  res.json(evaluation || null);
});

// POST /api/providers - create provider
app.post('/api/providers', authMiddleware, (req, res) => {
  const { name, phone, specialty } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
  const existing = db.prepare('SELECT id FROM providers WHERE phone = ?').get(phone);
  if (existing) return res.status(409).json({ error: 'Prestador com este telefone já cadastrado', id: existing.id });
  const result = db.prepare('INSERT INTO providers (name, phone, specialty) VALUES (?, ?, ?)').run(name, phone, specialty || null);
  res.json({ id: result.lastInsertRowid, name, phone, specialty });
});

// POST /api/evaluations - create or update evaluation
app.post('/api/evaluations', authMiddleware, (req, res) => {
  const { provider_id, stars, comment } = req.body;
  if (!provider_id || !stars) return res.status(400).json({ error: 'Dados inválidos' });
  if (stars < 1 || stars > 5) return res.status(400).json({ error: 'Estrelas devem ser entre 1 e 5' });

  const existing = db.prepare(
    'SELECT id FROM evaluations WHERE user_id = ? AND provider_id = ?'
  ).get(req.user.id, provider_id);

  if (existing) {
    db.prepare('UPDATE evaluations SET stars = ?, comment = ? WHERE id = ?').run(stars, comment || null, existing.id);
  } else {
    db.prepare('INSERT INTO evaluations (user_id, provider_id, stars, comment) VALUES (?, ?, ?, ?)').run(req.user.id, provider_id, stars, comment || null);
  }

  const updated = db.prepare(`
    SELECT COALESCE(AVG(e.stars), 0) as avg_stars, COUNT(e.id) as total_evaluations
    FROM evaluations e WHERE e.provider_id = ?
  `).get(provider_id);

  res.json({ success: true, ...updated });
});

app.listen(PORT, () => console.log(`Avalia Ninho API rodando em http://localhost:${PORT}`));
