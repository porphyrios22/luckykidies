const requireAdmin = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const { sendOwnerAlert, sendOrderReceived } = require('../services/notify');

const db = new Database(path.join(__dirname, '../db/luckykidies.db'));

// ── POST /api/orders — create order ─────────────────────
router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, customer_address, total, items, screenshot_url, payment_ref } = req.body;

    if (!customer_name || !customer_email || !customer_phone || !customer_address || !total || !items?.length) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    // screenshot_url is now optional — orders placed via the WhatsApp checkout
    // won't have one yet; it can be attached later if needed.

    const orderRef = payment_ref || ('LK-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase());

    const orderResult = db.prepare(`
      INSERT INTO orders (customer_name, customer_email, customer_phone, customer_address, total, status, payment_ref, screenshot_url)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(customer_name, customer_email, customer_phone, customer_address, total, orderRef, screenshot_url || null);

    const orderId = orderResult.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `);
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertItem.run(orderId, item.id, item.quantity, item.price);
      }
    });
    insertMany(items);

    const orderForEmail = {
      id: orderId,
      payment_ref: orderRef,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      total,
      screenshot_url,
      items
    };

    sendOwnerAlert(orderForEmail).catch(e => console.error('Owner alert error:', e));
    sendOrderReceived(orderForEmail).catch(e => console.error('Order received email error:', e));

    res.json({ success: true, orderId, orderRef });

  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/orders/:id/confirm — mark as paid ─────────
router.post('/:id/confirm', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(id);

    // Reduce stock
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    for (const item of items) {
      db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?').run(item.quantity, item.product_id);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/orders/all — list every order (admin) ──────
router.get('/all', requireAdmin, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/orders/:id/status — move order through stages ──
router.post('/:id/status', requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'paid', 'processing', 'dispatched', 'delivered'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/orders/track ────────────────────────────────
router.get('/track', (req, res) => {
  try {
    const { ref, email } = req.query;
    if (!ref) return res.status(400).json({ success: false, error: 'Missing order reference' });

    let order;
    if (email) {
      // Public lookup: ref + email required
      order = db.prepare(`
        SELECT * FROM orders
        WHERE payment_ref = ? AND LOWER(customer_email) = LOWER(?)
      `).get(ref, email);
    } else {
      // Ref-only: admin token required
      const token = req.headers['x-admin-token'];
      if (!token) return res.status(401).json({ success: false, error: 'Email required' });
      try {
        const jwt = require('jsonwebtoken');
        jwt.verify(token, process.env.ADMIN_SECRET);
      } catch(e) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
      order = db.prepare(`
        SELECT * FROM orders WHERE payment_ref = ?
      `).get(ref);
    }

    if (!order) return res.json({ success: false });

    const items = db.prepare(`
      SELECT oi.*, p.name FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);

    res.json({ success: true, order: { ...order, items } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;