// backend/migrate-images.js
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'db/luckykidies.db'));

try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `).run();
  console.log('✅ product_images table created!');
} catch (e) {
  console.log('msg:', e.message);
}

db.close();