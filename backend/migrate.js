const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'db/luckykidies.db'));

try {
  db.prepare("ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active'").run();
  console.log('✅ Column added!');
} catch (e) {
  console.log('msg:', e.message);
}

db.close();