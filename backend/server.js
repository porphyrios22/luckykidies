require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Auto-migrate: add status column if missing
try {
  const _db = new Database(path.join(__dirname, 'db/luckykidies.db'));
  _db.prepare("ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active'").run();
  _db.close();
  console.log('✅ Migration: status column added');
} catch(e) {
  // Column already exists or table doesn't exist yet — both are fine
}

try {
  const _db = new Database(path.join(__dirname, 'db/luckykidies.db'));
  try { _db.prepare("ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active'").run(); } catch(e) {}
  try { _db.prepare("ALTER TABLE orders ADD COLUMN screenshot_url TEXT").run(); } catch(e) {}
  _db.close();
  console.log('✅ Migrations done');
} catch(e) {
  console.error('Migration error:', e.message);
}

// Middleware
app.use(cors());
app.use((req, res, next) => {
  if (req.originalUrl === '/api/orders/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

const jwt = require('jsonwebtoken');

// Admin login — returns a signed token
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Incorrect password' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.ADMIN_SECRET, { expiresIn: '8h' });
  res.json({ success: true, token });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', productsRouter);

// Catch-all
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Lucky Kidies server running on http://localhost:${PORT}`);
});

