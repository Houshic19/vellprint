const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const db = process.env.DB_TYPE === 'sqlite' ? require('./config/sqlite_db') : require('./config/db');
const auth = require('./middleware/auth');
const mailer = require('./utils/mailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xssClean = require('xss-clean');
const cors = require('cors');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP temporarily to avoid breaking inline scripts/styles until properly configured
}));
const allowedOrigins = [
  "https://vellprint.in",
  "https://www.vellprint.in",
  "https://admin.vellprint.in",
  "https://vellprint-admin.workers.dev",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://admin.localhost:3000",
  "http://localhost:8788"
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".pages.dev")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(xssClean());

// Rate Limiting
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, message: { success: false, message: 'Too many requests, please try again later.' } });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Too many login attempts, please try again later.' } });
const formLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { success: false, message: 'Too many form submissions, please try again later.' } });

app.use('/api/', globalLimiter);

// Cache-Control Middleware to prevent browser caching of HTML pages
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html') || !path.extname(req.path)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

// Configure Multer Storage for Uploaded Images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'upload-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image files and PDFs are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize Database & Server
async function startServer() {
  try {
    await db.initDB();
    
    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(` Vell Print Technology Server Running on Port ${PORT}`);
      console.log(` Local URL: http://localhost:${PORT}`);
      console.log(` Database Mode: ${process.env.DB_TYPE || 'mock'}`);
      console.log(`===================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

// --- ADMIN AUTH & OPERATIONAL ENDPOINTS ---

// Admin Login
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }
  try {
    const admin = await db.getAdminUser(username);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }
    const token = jwt.sign(
      { username: admin.username },
      process.env.JWT_SECRET || 'vell_print_tech_secure_jwt_secret_key_2026',
      { expiresIn: '24h' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      
      secure: true, sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 // 24h
    });
    return res.json({ success: true, message: 'Authentication successful.', username: admin.username });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// GET Active Offers
app.get('/api/offers', async (req, res) => {
  try {
    const offers = await db.getOffers();
    return res.json({ success: true, offers });
  } catch (err) {
    console.error('Fetch offers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve offers.' });
  }
});

// POST Create Offer (Protected)
app.post('/api/admin/offers', auth, upload.single('image'), async (req, res) => {
  const { title, description, discount, start_date, end_date } = req.body;
  if (!title || !discount) {
    return res.status(400).json({ success: false, message: 'Title and discount are required.' });
  }
  try {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '/uploads/placeholder.jpg';
    const offerId = await db.addOffer({ title, description, image_path: imagePath, discount, start_date, end_date });
    return res.json({ success: true, message: 'Offer created successfully.', offerId });
  } catch (err) {
    console.error('Create offer error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create offer.' });
  }
});

// DELETE Offer (Protected)
app.delete('/api/admin/offers/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const success = await db.deleteOffer(id);
    if (success) return res.json({ success: true, message: 'Offer deleted successfully.' });
    return res.status(404).json({ success: false, message: 'Offer not found.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete offer.' });
  }
});

// GET Gallery items
app.get('/api/gallery', async (req, res) => {
  try {
    const items = await db.getGallery();
    return res.json({ success: true, items });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve gallery.' });
  }
});

// POST Add to Gallery (Protected)
app.post('/api/admin/gallery', auth, upload.single('image'), async (req, res) => {
  const { title } = req.body;
  if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required.' });
  try {
    const imagePath = `/uploads/${req.file.filename}`;
    const itemId = await db.addGalleryItem({ title: title || 'Gallery Image', image_path: imagePath });
    return res.json({ success: true, message: 'Gallery item uploaded successfully.', itemId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to upload gallery item.' });
  }
});

// DELETE Gallery Item (Protected)
app.delete('/api/admin/gallery/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const success = await db.deleteGalleryItem(id);
    if (success) return res.json({ success: true, message: 'Gallery item deleted.' });
    return res.status(404).json({ success: false, message: 'Gallery item not found.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete gallery item.' });
  }
});


// --- PUBLIC SHOP APIs ---

// GET Brands & Categories Metadata
app.get('/api/store/metadata', async (req, res) => {
  try {
    const brands = await db.getBrands();
    const categories = await db.getCategories();
    return res.json({ success: true, brands, categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch catalog filters.' });
  }
});

// GET Product Catalog List
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getProducts(req.query);
    return res.json({ success: true, products });
  } catch (err) {
    console.error('Fetch products API error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve products.' });
  }
});

// GET Single Product Details
app.get('/api/products/:seo_url', async (req, res) => {
  const { seo_url } = req.params;
  try {
    const product = await db.getProductBySeoUrl(seo_url);
    if (product) return res.json({ success: true, product });
    return res.status(404).json({ success: false, message: 'Product not found.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch product details.' });
  }
});

// POST Submit B2B Cart Enquiry
app.post('/api/enquiries', async (req, res) => {
  const { business_name, dealer_name, gst, phone, delivery_location, items_summary, remarks } = req.body;
  if (!business_name || !dealer_name || !phone || !delivery_location || !items_summary) {
    return res.status(400).json({ success: false, message: 'Required fields missing from checkout data.' });
  }
  try {
    const enquiryId = await db.addCartEnquiry({
      business_name, dealer_name, gst, phone, delivery_location, items_summary, remarks
    });
    return res.json({ success: true, message: 'Enquiry logged successfully.', enquiryId });
  } catch (err) {
    console.error('Submit enquiry error:', err);
    return res.status(500).json({ success: false, message: 'Failed to log enquiry.' });
  }
});

// POST Dealer Registration Application
app.post('/api/dealers/register', async (req, res) => {
  const { business_name, dealer_name, gst, pan, address, phone, email, city, state, pincode, business_type } = req.body;
  if (!business_name || !dealer_name || !address || !phone || !email || !city || !state || !pincode) {
    return res.status(400).json({ success: false, message: 'Required registration fields are missing.' });
  }
  try {
    const registrationId = await db.addDealerRegistration({
      business_name, dealer_name, gst, pan, address, phone, email, city, state, pincode, business_type
    });
    return res.json({ success: true, message: 'Dealer application submitted successfully.', registrationId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to log registration.' });
  }
});


// --- ADMIN SHOP MANAGEMENT APIs (Protected) ---

// GET Admin Dashboard Statistics
app.get('/api/admin/dashboard/stats', auth, async (req, res) => {
  try {
    const products = await db.getProducts();
    const registrations = await db.getDealerRegistrations();
    const enquiries = await db.getCartEnquiries();
    const offers = await db.getOffers();
    const callbacks = await db.getCallbacks();
    const tickets = await db.getServiceTickets();
    const blogPosts = await db.getBlogPosts();

    return res.json({
      success: true,
      stats: {
        totalProducts: products.length,
        totalDealers: registrations.length,
        pendingDealers: registrations.filter(r => r.status === 'PENDING').length,
        totalEnquiries: enquiries.length,
        activeOffers: offers.length,
        totalCallbacks: callbacks.length,
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'Open').length,
        totalBlogPosts: blogPosts.length
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load stats.' });
  }
});

// GET Registrations list
app.get('/api/admin/dealers', auth, async (req, res) => {
  try {
    const dealers = await db.getDealerRegistrations();
    return res.json({ success: true, dealers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve registrations.' });
  }
});

// PUT Approve/Reject Dealer Registration
app.put('/api/admin/dealers/:id/status', auth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'APPROVED' or 'REJECTED'
  try {
    await db.updateDealerRegistrationStatus(id, status);
    return res.json({ success: true, message: `Dealer status changed to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// GET Enquiries List
app.get('/api/admin/enquiries', auth, async (req, res) => {
  try {
    const enquiries = await db.getCartEnquiries();
    return res.json({ success: true, enquiries });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve enquiries.' });
  }
});

// POST Create Brand
app.post('/api/admin/brands', auth, upload.single('image'), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Brand name is required.' });
  try {
    const logoPath = req.file ? `/uploads/${req.file.filename}` : '';
    const brandId = await db.addBrand({ name, logo_path: logoPath });
    return res.json({ success: true, message: 'Brand added successfully.', brandId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add brand.' });
  }
});

// POST Create Category
app.post('/api/admin/categories', auth, async (req, res) => {
  const { name, parent_id, seo_url } = req.body;
  if (!name || !seo_url) return res.status(400).json({ success: false, message: 'Name and SEO URL are required.' });
  try {
    const categoryId = await db.addCategory({ name, parent_id, seo_url });
    return res.json({ success: true, message: 'Category added successfully.', categoryId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add category.' });
  }
});

// POST Create Product
app.post('/api/admin/products', auth, upload.single('image'), async (req, res) => {
  const { 
    name, brand_id, part_number, oem_part_number, alternate_part_number,
    hsn_code, sku, category_id, short_description, long_description,
    tech_specifications, warranty, moq, unit, weight, availability,
    stock_status, is_featured, is_popular, is_new_arrival, meta_title,
    meta_description, seo_url, compatibilities
  } = req.body;

  if (!name || !seo_url) {
    return res.status(400).json({ success: false, message: 'Product name and SEO URL are required.' });
  }

  try {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '/uploads/placeholder.jpg';
    
    const productId = await db.addProduct({
      name, brand_id, part_number, oem_part_number, alternate_part_number,
      hsn_code, sku, category_id, short_description, long_description,
      tech_specifications, warranty, moq, unit, weight, availability,
      stock_status, image_path: imagePath, is_featured, is_popular,
      is_new_arrival, meta_title, meta_description, seo_url
    });

    // Handle printer compatibilities if provided (expects a comma-separated list of models, e.g. "HP:Ink Tank 410, Canon:iP2870")
    if (compatibilities && compatibilities.trim()) {
      const parts = compatibilities.split(',');
      for (const part of parts) {
        const item = part.trim().split(':');
        if (item.length === 2) {
          await db.addProductCompatibility(productId, {
            printer_brand: item[0].trim(),
            printer_model: item[1].trim()
          });
        }
      }
    }

    return res.json({ success: true, message: 'Product added successfully.', productId });
  } catch (err) {
    console.error('Add product error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add product.' });
  }
});

// DELETE Product
app.delete('/api/admin/products/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await db.deleteProduct(id);
    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});



// Vanilla CSV Parser Helper (Handles quotes and commas)
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse line, respecting quoted commas
    const values = [];
    let inQuotes = false;
    let currentVal = '';
    
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^"|"$/g, ''));
    
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    result.push(row);
  }
  return result;
}

// POST Bulk Upload Spares CSV (Protected)
app.post('/api/admin/products/bulk', auth, upload.single('csvFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'CSV file is required.' });
  }
  try {
    const csvPath = req.file.path;
    const text = fs.readFileSync(csvPath, 'utf8');
    const parsedProducts = parseCSV(text);
    
    let successCount = 0;
    
    for (const p of parsedProducts) {
      if (!p.name || !p.seo_url) continue; // skip invalid rows
      
      const productId = await db.addProduct({
        name: p.name,
        brand_id: p.brand_id ? parseInt(p.brand_id) : null,
        part_number: p.part_number || '',
        oem_part_number: p.oem_part_number || '',
        alternate_part_number: p.alternate_part_number || '',
        hsn_code: p.hsn_code || '',
        sku: p.sku || '',
        category_id: p.category_id ? parseInt(p.category_id) : null,
        short_description: p.short_description || '',
        long_description: p.long_description || '',
        tech_specifications: p.tech_specifications || '',
        warranty: p.warranty || '',
        moq: p.moq ? parseInt(p.moq) : 1,
        unit: p.unit || 'PCS',
        weight: p.weight ? parseFloat(p.weight) : null,
        availability: p.availability || 'In Stock',
        stock_status: p.stock_status || 'Available',
        image_path: p.image_path || '/uploads/placeholder.jpg',
        is_featured: p.is_featured === '1' ? 1 : 0,
        is_popular: p.is_popular === '1' ? 1 : 0,
        is_new_arrival: p.is_new_arrival === '1' ? 1 : 0,
        meta_title: p.meta_title || '',
        meta_description: p.meta_description || '',
        seo_url: p.seo_url
      });
      
      // If compatibilities specified in CSV (colon/comma syntax, e.g. "HP:LaserJet 1020,HP:Ink Tank 410")
      if (p.compatibilities && p.compatibilities.trim()) {
        const parts = p.compatibilities.split(';');
        for (const part of parts) {
          const item = part.trim().split(':');
          if (item.length === 2) {
            await db.addProductCompatibility(productId, {
              printer_brand: item[0].trim(),
              printer_model: item[1].trim()
            });
          }
        }
      }
      successCount++;
    }
    
    // Remove temporary CSV file
    fs.unlinkSync(csvPath);
    
    return res.json({ success: true, message: `Successfully imported ${successCount} products from CSV.` });
  } catch (err) {
    console.error('CSV import API error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process CSV file.' });
  }
});
// ============================================================
// CALLBACK REQUESTS
// ============================================================
app.post('/api/callbacks', formLimiter, async (req, res) => {
  const { name, phone, email, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone are required.' });
  }
  try {
    const id = await db.addCallback({
      name,
      phone,
      email: email || '',
      message: message || ''
    });
    
    // Send Automated Email Alert
    mailer.sendEmail({
      to: 'admin@vellprint.in',
      subject: `New Callback Request from ${name}`,
      html: `<h3>New Callback Request</h3>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Phone:</strong> ${phone}</p>
             <p><strong>Email:</strong> ${email || 'N/A'}</p>
             <p><strong>Message:</strong> ${message || 'N/A'}</p>`
    });

    return res.json({ success: true, message: 'Callback request received.', id });
  } catch (err) {
    console.error('Callback API error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit callback request.' });
  }
});

app.get('/api/admin/callbacks', auth, async (req, res) => {
  try {
    const callbacks = await db.getCallbacks();
    return res.json({ success: true, callbacks });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load callbacks.' });
  }
});

// ============================================================
// SERVICE TICKETS
// ============================================================
app.post('/api/service-tickets', formLimiter, async (req, res) => {
  const { customer_name, phone, equipment_type, issue_category, description } = req.body;
  if (!customer_name || !phone || !equipment_type || !issue_category || !description) {
    return res.status(400).json({ success: false, message: 'Required fields are missing.' });
  }
  try {
    const id = await db.addServiceTicket({
      customer_name: req.body.customer_name,
      company: req.body.company || '',
      phone: req.body.phone,
      email: req.body.email || '',
      equipment_type: req.body.equipment_type,
      brand: req.body.brand || '',
      model_number: req.body.model_number || '',
      issue_category: req.body.issue_category,
      priority: req.body.priority || 'Normal',
      preferred_date: req.body.preferred_date || '',
      description: req.body.description
    });

    // Send Automated Email Alert
    mailer.sendEmail({
      to: 'admin@vellprint.in',
      subject: `[VPT-${id}] New Service Ticket: ${req.body.equipment_type}`,
      html: `<h3>New Service Ticket: #VPT-${id}</h3>
             <p><strong>Customer:</strong> ${req.body.customer_name}</p>
             <p><strong>Phone:</strong> ${req.body.phone}</p>
             <p><strong>Equipment:</strong> ${req.body.equipment_type} (${req.body.brand || ''} ${req.body.model_number || ''})</p>
             <p><strong>Issue:</strong> ${req.body.issue_category}</p>
             <p><strong>Priority:</strong> ${req.body.priority || 'Normal'}</p>
             <p><strong>Description:</strong> ${req.body.description}</p>`
    });

    return res.json({ success: true, message: 'Service ticket submitted!', ticketId: id });
  } catch (err) {
    console.error('Service ticket API error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit service ticket.' });
  }
});

app.get('/api/admin/service-tickets', auth, async (req, res) => {
  try {
    const tickets = await db.getServiceTickets();
    return res.json({ success: true, tickets });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load service tickets.' });
  }
});

app.put('/api/admin/service-tickets/:id/status', auth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  try {
    await db.updateServiceTicketStatus(id, status);
    return res.json({ success: true, message: 'Ticket status updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update ticket status.' });
  }
});

// ============================================================
// BLOG POSTS
// ============================================================
app.get('/api/blog', async (req, res) => {
  try {
    const category = req.query.category || null;
    const posts = await db.getBlogPosts(category);
    return res.json({ success: true, posts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load blog posts.' });
  }
});

app.get('/api/blog/:slug', async (req, res) => {
  try {
    const post = await db.getBlogPostBySlug(req.params.slug);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    return res.json({ success: true, post });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load blog post.' });
  }
});

app.post('/api/admin/blog', auth, upload.single('thumbnail'), async (req, res) => {
  const { title, slug, category, excerpt, content, author } = req.body;
  if (!title || !slug || !category || !content) {
    return res.status(400).json({ success: false, message: 'Title, slug, category, and content are required.' });
  }
  try {
    const image_path = req.file ? '/uploads/' + req.file.filename : '/uploads/mock-offer1.jpg';
    const id = await db.addBlogPost({
      title, slug, category,
      excerpt: excerpt || title,
      content, image_path,
      author: author || 'Vell Print Technology'
    });
    return res.json({ success: true, message: 'Blog post created!', id });
  } catch (err) {
    console.error('Blog post API error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create blog post.' });
  }
});

app.delete('/api/admin/blog/:id', auth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await db.deleteBlogPost(id);
    return res.json({ success: true, message: 'Blog post deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete blog post.' });
  }
});


// ============================================================
// TESTIMONIALS
// ============================================================

app.get('/api/testimonials', async (req, res) => {
  try {
    const data = await db.getTestimonials();
    return res.json({ success: true, testimonials: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load testimonials.' });
  }
});

app.post('/api/admin/testimonials', auth, async (req, res) => {
  const { name, company, content, rating } = req.body;
  if (!name || !content) {
    return res.status(400).json({ success: false, message: 'Name and content are required.' });
  }
  try {
    const id = await db.addTestimonial({ name, company, content, rating: parseInt(rating) || 5 });
    return res.json({ success: true, message: 'Testimonial added!', id });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add testimonial.' });
  }
});

app.delete('/api/admin/testimonials/:id', auth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await db.deleteTestimonial(id);
    return res.json({ success: true, message: 'Testimonial deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete testimonial.' });
  }
});

// Start the server
startServer();
