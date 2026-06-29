const requireAdmin = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../db/luckykidies.db'));

const MAX_IMAGES = 5;

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

    const imageRows = db.prepare(`
      SELECT url FROM product_images WHERE product_id = ? ORDER BY position ASC
    `).all(product.id);

    product.images = imageRows.length
      ? imageRows.map(r => r.url)
      : (product.image_url ? [product.image_url] : []);

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── helper: replace a product's images ──────────────────
function saveProductImages(productId, images) {
  const clean = (images || []).filter(Boolean).slice(0, MAX_IMAGES);
  db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId);
  const insert = db.prepare(`
    INSERT INTO product_images (product_id, url, position) VALUES (?, ?, ?)
  `);
  clean.forEach((url, i) => insert.run(productId, url, i));
  return clean[0] || null; // primary image, for products.image_url
}

// ── ADMIN ROUTES ──────────────────────────────────────

// POST /api/admin/products — add new product
router.post('/products', requireAdmin, (req, res) => {
  try {
    const { name, description, price, stock, images, condition, status, category_id } = req.body;
    const primaryImage = (images && images[0]) || req.body.image_url || null;

    const result = db.prepare(`
      INSERT INTO products (name, description, price, stock, image_url, condition, status, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, description, price, stock, primaryImage, condition, status || 'active', category_id);

    const productId = result.lastInsertRowid;
    if (images && images.length) saveProductImages(productId, images);

    res.json({ success: true, id: productId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/products/:id — update product
router.put('/products/:id', requireAdmin, (req, res) => {
  try {
    const { name, description, price, stock, images, condition, status, category_id } = req.body;
    const primaryImage = (images && images[0]) || req.body.image_url || null;

    db.prepare(`
      UPDATE products SET name=?, description=?, price=?, stock=?, image_url=?, condition=?, status=?, category_id=?
      WHERE id=?
    `).run(name, description, price, stock, primaryImage, condition, status, category_id, req.params.id);

    if (images) saveProductImages(req.params.id, images);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM product_images WHERE product_id=?').run(req.params.id);
    db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;