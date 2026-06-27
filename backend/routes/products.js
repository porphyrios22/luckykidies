const requireAdmin = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../db/luckykidies.db'));

// GET /api/products?category=childrens-thrift
router.get('/', (req, res) => {
  try {
    const { category } = req.query;

    let products;
    if (category) {
      products = db.prepare(`
        SELECT p.*, c.name as category_name, c.slug, c.tag
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE c.slug = ?
      `).all(category);
    } else {
      products = db.prepare(`
        SELECT p.*, c.name as category_name, c.slug, c.tag
        FROM products p
        JOIN categories c ON p.category_id = c.id
      `).all();
    }

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/categories/all
router.get('/categories/all', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories').all();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug, c.tag
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── ADMIN ROUTES ──────────────────────────────────────

// POST /api/admin/products — add new product
router.post('/products', requireAdmin, (req, res) => {
  try {
    const { name, description, price, stock, image_url, condition, status, category_id } = req.body;
    const result = db.prepare(`
      INSERT INTO products (name, description, price, stock, image_url, condition, status, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, description, price, stock, image_url, condition, status || 'active', category_id);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/products/:id — update product
router.put('/products/:id', requireAdmin, (req, res) => {
  try {
    const { name, description, price, stock, image_url, condition, status, category_id } = req.body;
    db.prepare(`
      UPDATE products SET name=?, description=?, price=?, stock=?, image_url=?, condition=?, status=?, category_id=?
      WHERE id=?
    `).run(name, description, price, stock, image_url, condition, status, category_id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;