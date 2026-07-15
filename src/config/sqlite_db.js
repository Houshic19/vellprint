const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, '../../data/vellprint.sqlite'));
db.pragma('journal_mode = WAL');

module.exports = {
  initDB: async () => { console.log('SQLite DB initialized'); },
  getAdminUser: async (username) => db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username),
  
  getOffers: async () => db.prepare('SELECT * FROM offers ORDER BY id DESC').all(),
  addOffer: async (offer) => {
    const info = db.prepare('INSERT INTO offers (title, description, image_path, discount, start_date, end_date) VALUES (@title, @description, @image_path, @discount, @start_date, @end_date)').run(offer);
    return info.lastInsertRowid;
  },
  deleteOffer: async (id) => db.prepare('DELETE FROM offers WHERE id = ?').run(id),
  
  getGallery: async () => db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all(),
  addGalleryItem: async (item) => db.prepare('INSERT INTO gallery (title, image_path) VALUES (@title, @image_path)').run(item).lastInsertRowid,
  deleteGalleryItem: async (id) => db.prepare('DELETE FROM gallery WHERE id = ?').run(id),
  
  getBrands: async () => db.prepare('SELECT id, name, logo_path FROM brands ORDER BY name').all(),
  addBrand: async (brand) => db.prepare('INSERT INTO brands (name, logo_path) VALUES (@name, @logo_path)').run(brand).lastInsertRowid,
  
  getCategories: async () => db.prepare('SELECT id, name, parent_id, seo_url FROM categories ORDER BY id').all(),
  addCategory: async (cat) => db.prepare('INSERT INTO categories (name, parent_id, seo_url) VALUES (@name, @parent_id, @seo_url)').run(cat).lastInsertRowid,
  
  getProducts: async (filters = {}) => {
    let sql = `
      SELECT p.id, p.name, p.brand_id, b.name as brand_name, p.part_number, p.oem_part_number, 
             p.alternate_part_number, p.hsn_code, p.sku, p.category_id, c.name as category_name,
             p.short_description, p.long_description, p.tech_specifications, p.warranty,
             p.moq, p.unit, p.weight, p.availability, p.stock_status, p.image_path, p.datasheet_path,
             p.is_featured, p.is_popular, p.is_new_arrival, p.meta_title, p.meta_description, p.seo_url
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1 `;
    
    const params = {};
    if (filters.brand_id) {
      const brands = Array.isArray(filters.brand_id) ? filters.brand_id : [filters.brand_id];
      if (brands.length > 0) {
        sql += ` AND p.brand_id IN (${brands.map(() => '?').join(', ')})`;
        brands.forEach((b, i) => params[`brand_${i}`] = b); // Hack: better-sqlite3 doesn't easily mix named and positional if not careful.
        // Actually, let's just use named parameters dynamically
        sql = sql.replace(`IN (${brands.map(() => '?').join(', ')})`, `IN (${brands.map((_, i) => `@brand_${i}`).join(', ')})`);
      }
    }
    if (filters.category_id) {
      const cats = Array.isArray(filters.category_id) ? filters.category_id : [filters.category_id];
      if (cats.length > 0) {
        sql += ` AND p.category_id IN (${cats.map((_, i) => `@cat_${i}`).join(', ')})`;
        cats.forEach((c, i) => params[`cat_${i}`] = c);
      }
    }
    if (filters.in_stock) {
      sql += ` AND p.availability = 'In Stock'`;
    }
    
    // Add product badges filtering
    if (filters.is_featured) { sql += ` AND p.is_featured = 1`; }
    if (filters.is_popular) { sql += ` AND p.is_popular = 1`; }
    if (filters.is_new_arrival) { sql += ` AND p.is_new_arrival = 1`; }

    if (filters.search) { 
      sql += ' AND (LOWER(p.name) LIKE @search OR LOWER(p.part_number) LIKE @search OR LOWER(p.oem_part_number) LIKE @search OR LOWER(p.alternate_part_number) LIKE @search)';
      params.search = `%${filters.search.toLowerCase()}%`;
    }
    
    sql += ' ORDER BY p.id DESC';
    return db.prepare(sql).all(params);
  },
  
  getProductBySeoUrl: async (seoUrl) => {
    const product = db.prepare(`
      SELECT p.*, b.name as brand_name, c.name as category_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.seo_url = ?`).get(seoUrl);
      
    if (product) {
      product.compatibilities = db.prepare('SELECT printer_brand, printer_model FROM product_compatibilities WHERE product_id = ?').all(product.id);
    }
    return product;
  },
  
  addProduct: async (product) => {
    const cols = ['name', 'brand_id', 'part_number', 'oem_part_number', 'alternate_part_number', 'hsn_code', 'sku', 'category_id', 'short_description', 'long_description', 'tech_specifications', 'warranty', 'moq', 'unit', 'weight', 'availability', 'stock_status', 'image_path', 'datasheet_path', 'is_featured', 'is_popular', 'is_new_arrival', 'meta_title', 'meta_description', 'seo_url'];
    const safeProd = {};
    cols.forEach(c => safeProd[c] = product[c] !== undefined ? product[c] : null);
    
    const info = db.prepare(`INSERT INTO products (${cols.join(', ')}) VALUES (${cols.map(c => '@'+c).join(', ')})`).run(safeProd);
    return info.lastInsertRowid;
  },
  
  addProductCompatibility: async (productId, brand, model) => {
    db.prepare('INSERT INTO product_compatibilities (product_id, printer_brand, printer_model) VALUES (?, ?, ?)').run(productId, brand, model);
  },
  
  deleteProduct: async (id) => db.prepare('DELETE FROM products WHERE id = ?').run(id),
  
  getDealerRegistrations: async () => db.prepare('SELECT * FROM dealer_registrations ORDER BY id DESC').all(),
  addDealerRegistration: async (data) => db.prepare('INSERT INTO dealer_registrations (business_name, dealer_name, gst, pan, address, phone, email, city, state, pincode, business_type) VALUES (@business_name, @dealer_name, @gst, @pan, @address, @phone, @email, @city, @state, @pincode, @business_type)').run(data).lastInsertRowid,
  updateDealerStatus: async (id, status) => db.prepare('UPDATE dealer_registrations SET status = ? WHERE id = ?').run(status, id),
  
  getCartEnquiries: async () => db.prepare('SELECT * FROM cart_enquiries ORDER BY id DESC').all(),
  addCartEnquiry: async (data) => db.prepare('INSERT INTO cart_enquiries (business_name, dealer_name, gst, phone, delivery_location, items_summary, remarks) VALUES (@business_name, @dealer_name, @gst, @phone, @delivery_location, @items_summary, @remarks)').run(data).lastInsertRowid,
  
  getCallbacks: async () => db.prepare('SELECT * FROM callbacks ORDER BY created_at DESC').all(),
  addCallback: async (cb) => db.prepare('INSERT INTO callbacks (name, phone) VALUES (@name, @phone)').run(cb).lastInsertRowid,
  
  getServiceTickets: async () => db.prepare('SELECT * FROM service_tickets ORDER BY created_at DESC').all(),
  addServiceTicket: async (t) => {
    const cols = ['customer_name', 'company', 'phone', 'email', 'equipment_type', 'brand', 'model_number', 'issue_category', 'priority', 'preferred_date', 'description'];
    const safeT = {};
    cols.forEach(c => safeT[c] = t[c] !== undefined ? t[c] : null);
    const info = db.prepare(`INSERT INTO service_tickets (${cols.join(', ')}) VALUES (${cols.map(c => '@'+c).join(', ')})`).run(safeT);
    return info.lastInsertRowid;
  },
  updateServiceTicketStatus: async (id, status) => db.prepare('UPDATE service_tickets SET status = ? WHERE id = ?').run(status, id),
  
  getBlogPosts: async (category) => {
    let sql = 'SELECT * FROM blog_posts';
    if (category) return db.prepare(sql + ' WHERE category = ? ORDER BY created_at DESC').all(category);
    return db.prepare(sql + ' ORDER BY created_at DESC').all();
  },
  getBlogPostBySlug: async (slug) => db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(slug),
  addBlogPost: async (post) => db.prepare('INSERT INTO blog_posts (title, slug, category, excerpt, content, image_path, author) VALUES (@title, @slug, @category, @excerpt, @content, @image_path, @author)').run(post).lastInsertRowid,
  deleteBlogPost: async (id) => db.prepare('DELETE FROM blog_posts WHERE id = ?').run(id),
  
  getTestimonials: async () => db.prepare('SELECT * FROM testimonials ORDER BY created_at DESC').all(),
  addTestimonial: async (t) => db.prepare('INSERT INTO testimonials (name, company, content, rating) VALUES (@name, @company, @content, @rating)').run(t).lastInsertRowid,
  deleteTestimonial: async (id) => db.prepare('DELETE FROM testimonials WHERE id = ?').run(id)
};