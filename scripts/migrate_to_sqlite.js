const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const MOCK_DB_PATH = path.join(__dirname, '../data/mock_db.json');
const SQLITE_DB_PATH = path.join(__dirname, '../data/vellprint.sqlite');

function migrate() {
  console.log('Starting migration to SQLite...');
  
  if (!fs.existsSync(MOCK_DB_PATH)) {
    console.error('Mock JSON DB not found.');
    return;
  }
  
  const mockData = JSON.parse(fs.readFileSync(MOCK_DB_PATH, 'utf-8'));
  
  // Remove existing sqlite db if exists for clean migration
  if (fs.existsSync(SQLITE_DB_PATH)) {
    fs.unlinkSync(SQLITE_DB_PATH);
  }

  const db = new Database(SQLITE_DB_PATH);
  db.pragma('journal_mode = WAL');

  // 1. Create Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (username TEXT PRIMARY KEY, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS offers (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, image_path TEXT, discount TEXT, start_date TEXT, end_date TEXT, is_active INTEGER DEFAULT 1);
    CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, image_path TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS brands (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, logo_path TEXT);
    CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, parent_id INTEGER, seo_url TEXT UNIQUE NOT NULL);
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, brand_id INTEGER, part_number TEXT, oem_part_number TEXT, alternate_part_number TEXT,
      hsn_code TEXT, sku TEXT, category_id INTEGER, short_description TEXT, long_description TEXT, tech_specifications TEXT, warranty TEXT,
      moq INTEGER DEFAULT 1, unit TEXT DEFAULT 'PCS', weight REAL, availability TEXT DEFAULT 'In Stock', stock_status TEXT DEFAULT 'Available',
      image_path TEXT, datasheet_path TEXT, is_featured INTEGER DEFAULT 0, is_popular INTEGER DEFAULT 0, is_new_arrival INTEGER DEFAULT 0,
      meta_title TEXT, meta_description TEXT, seo_url TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS product_compatibilities (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, printer_brand TEXT NOT NULL, printer_model TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS dealer_registrations (id INTEGER PRIMARY KEY AUTOINCREMENT, business_name TEXT, dealer_name TEXT, gst TEXT, pan TEXT, address TEXT, phone TEXT, email TEXT, city TEXT, state TEXT, pincode TEXT, business_type TEXT, status TEXT DEFAULT 'PENDING', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS cart_enquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, business_name TEXT, dealer_name TEXT, gst TEXT, phone TEXT, delivery_location TEXT, items_summary TEXT, remarks TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS callbacks (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS service_tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT, company TEXT, phone TEXT, email TEXT, equipment_type TEXT, brand TEXT, model_number TEXT, issue_category TEXT, priority TEXT, preferred_date TEXT, description TEXT, status TEXT DEFAULT 'Open', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS blog_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, slug TEXT UNIQUE NOT NULL, category TEXT, excerpt TEXT, content TEXT, image_path TEXT, author TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS testimonials (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, company TEXT, content TEXT, rating INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  `);
  console.log('Tables created.');

  // 2. Insert Data
  const insertMany = (tableName, dataArray, columns) => {
    if (!dataArray || dataArray.length === 0) return;
    const placeholders = columns.map(() => '?').join(', ');
    const stmt = db.prepare(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`);
    
    const insert = db.transaction((items) => {
      for (const item of items) {
        const values = columns.map(col => item[col] !== undefined ? item[col] : null);
        try {
          stmt.run(values);
        } catch (err) {
          console.error(`Error inserting into ${tableName}:`, item, err.message);
        }
      }
    });
    insert(dataArray);
    console.log(`Inserted ${dataArray.length} records into ${tableName}`);
  };

  insertMany('admin_users', mockData.admin_users, ['username', 'password_hash']);
  insertMany('offers', mockData.offers, ['id', 'title', 'description', 'image_path', 'discount', 'start_date', 'end_date', 'is_active']);
  insertMany('gallery', mockData.gallery, ['id', 'title', 'image_path', 'created_at']);
  insertMany('brands', mockData.brands, ['id', 'name', 'logo_path']);
  insertMany('categories', mockData.categories, ['id', 'name', 'parent_id', 'seo_url']);
  insertMany('products', mockData.products, ['id', 'name', 'brand_id', 'part_number', 'oem_part_number', 'alternate_part_number', 'hsn_code', 'sku', 'category_id', 'short_description', 'long_description', 'tech_specifications', 'warranty', 'moq', 'unit', 'weight', 'availability', 'stock_status', 'image_path', 'datasheet_path', 'is_featured', 'is_popular', 'is_new_arrival', 'meta_title', 'meta_description', 'seo_url']);
  insertMany('product_compatibilities', mockData.product_compatibilities, ['id', 'product_id', 'printer_brand', 'printer_model']);
  insertMany('dealer_registrations', mockData.dealer_registrations, ['id', 'business_name', 'dealer_name', 'gst', 'pan', 'address', 'phone', 'email', 'city', 'state', 'pincode', 'business_type', 'status', 'created_at']);
  insertMany('cart_enquiries', mockData.cart_enquiries, ['id', 'business_name', 'dealer_name', 'gst', 'phone', 'delivery_location', 'items_summary', 'remarks', 'created_at']);
  insertMany('callbacks', mockData.callbacks, ['id', 'name', 'phone', 'created_at']);
  insertMany('service_tickets', mockData.service_tickets, ['id', 'customer_name', 'company', 'phone', 'email', 'equipment_type', 'brand', 'model_number', 'issue_category', 'priority', 'preferred_date', 'description', 'status', 'created_at']);
  insertMany('blog_posts', mockData.blog_posts, ['id', 'title', 'slug', 'category', 'excerpt', 'content', 'image_path', 'author', 'created_at']);
  insertMany('testimonials', mockData.testimonials, ['id', 'name', 'company', 'content', 'rating', 'created_at']);

  db.close();
  console.log('Migration to SQLite complete successfully!');
}

migrate();
