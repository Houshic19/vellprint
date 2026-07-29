const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'vellprint.sqlite');
const db = new Database(dbPath);

console.log('Starting migration...');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION;');

  // 1. Add subcategory_id to products
  try {
    db.exec('ALTER TABLE products ADD COLUMN subcategory_id INTEGER;');
    console.log('Added subcategory_id to products');
  } catch (e) {
    if (e.message.includes('duplicate column name')) {
      console.log('subcategory_id already exists in products');
    } else {
      throw e;
    }
  }

  // 2. Recreate categories table
  db.exec('ALTER TABLE categories RENAME TO categories_old;');
  console.log('Renamed categories to categories_old');

  db.exec(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT NOT NULL, 
      parent_id INTEGER, 
      brand_id INTEGER,
      seo_url TEXT UNIQUE NOT NULL,
      UNIQUE(name, brand_id, parent_id)
    );
  `);
  console.log('Created new categories table');

  // 3. Copy data
  db.exec(`
    INSERT INTO categories (id, name, parent_id, seo_url)
    SELECT id, name, parent_id, seo_url FROM categories_old;
  `);
  console.log('Copied data to new categories table');

  // 4. Drop old table
  db.exec('DROP TABLE categories_old;');
  console.log('Dropped categories_old');

  db.exec('COMMIT;');
  console.log('Migration successful!');
} catch (err) {
  db.exec('ROLLBACK;');
  console.error('Migration failed:', err);
}
