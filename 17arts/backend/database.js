const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'arts.db');
let db;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
    initSchema();
    saveDb();
  }
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function initSchema() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    phone TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS artworks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    category TEXT NOT NULL,
    medium TEXT,
    price REAL NOT NULL,
    mrp REAL,
    description TEXT,
    dimensions TEXT,
    image_url TEXT DEFAULT '',
    image_color TEXT DEFAULT '#C4A882',
    image_color2 TEXT DEFAULT '#8B6E4E',
    stock INTEGER DEFAULT 1,
    rating REAL DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    badge TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cart (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    artwork_id TEXT,
    quantity INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS wishlist (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    artwork_id TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    phone TEXT,
    line1 TEXT,
    line2 TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    is_default INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    total REAL,
    status TEXT DEFAULT 'Processing',
    payment_method TEXT,
    address_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    artwork_id TEXT,
    quantity INTEGER,
    price REAL
  )`);

  // Seed artworks — 16 values per row matching 16 columns
  const arts = [
    ['a1', 'Morning Raga', 'Meena Sharma', 'Traditional', 'Watercolour', 25200, 42000,
     'A serene depiction of dawn through classical Indian musical imagery.',
     '24" x 18"',
     'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80',
     '#C4A882', '#8B6E4E', 1, 4.8, 1240, 'Bestseller'],

    ['a2', 'Urban Drift No. 7', 'Arjun Pillai', 'Contemporary', 'Acrylic on Canvas', 48000, 68500,
     'A bold exploration of city movement and modern Indian life.',
     '36" x 24"',
     'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80',
     '#7B9EA6', '#3D6B76', 1, 4.6, 883, 'New'],

    ['a3', 'Varanasi Ghat', 'Priya Nair', 'Heritage', 'Oil on Canvas', 41250, 55000,
     'Timeless ghats of Varanasi captured at golden hour.',
     '30" x 20"',
     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
     '#B5936B', '#6B4423', 1, 4.9, 2104, 'Top Rated'],

    ['a4', 'Chromatic Sutras', 'Vivek Rao', 'Abstract', 'Mixed Media', 84000, 120000,
     'A meditation on colour, form and ancient scripture.',
     '48" x 36"',
     'https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&q=80',
     '#9B8EC4', '#5A4B99', 1, 4.7, 562, ''],

    ['a5', 'Madhubani Garden', 'Sunita Devi', 'Folk', 'Natural Pigments', 11700, 18000,
     'Traditional Madhubani art from Bihar with intricate floral motifs.',
     '20" x 16"',
     'https://images.unsplash.com/photo-1578926375605-eaf7559b1458?w=600&q=80',
     '#5DCAA5', '#0F6E56', 3, 4.9, 3467, 'Folk'],

    ['a6', 'Rajput Procession', 'Ramesh Jangid', 'Traditional', 'Watercolour on Paper', 18500, 26000,
     'A detailed miniature painting depicting a royal Rajput procession.',
     '18" x 12"',
     'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=600&q=80',
     '#D4A882', '#9B5E3E', 2, 4.9, 1872, 'Top Pick'],

    ['a7', 'Court of Akbar', 'Kavita Meena', 'Traditional', 'Gouache on Board', 32000, 45000,
     'A faithful recreation of Mughal court life with fine gold detailing.',
     '24" x 18"',
     'https://images.unsplash.com/photo-1596548438137-d51ea5c83ca5?w=600&q=80',
     '#C4A060', '#7B4020', 1, 4.7, 943, ''],

    ['a8', 'Kerala Backwaters', 'Thomas Varghese', 'Contemporary', 'Oil on Canvas', 22000, 40000,
     'Atmospheric dusk over the Kerala backwaters.',
     '30" x 20"',
     'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80',
     '#7B9EA6', '#2D5C6B', 1, 4.6, 671, 'Sale'],

    ['a9', 'Geometric Mandala III', 'Aditi Shah', 'Abstract', 'Acrylic on Canvas', 8800, 22000,
     'Precision geometric mandala filled with vibrant acrylics.',
     '20" x 20"',
     'https://images.unsplash.com/photo-1615639164213-aab04da9b38e?w=600&q=80',
     '#9B8EC4', '#5A4B99', 5, 4.8, 2310, '60% Off'],

    ['a10', 'Phad Scroll Painting', 'Shanti Lal', 'Folk', 'Mineral Pigments', 12800, 16000,
     'A traditional Phad scroll from Rajasthan. Hand-painted on cotton cloth.',
     '72" x 24"',
     'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&q=80',
     '#B5936B', '#7B3A10', 2, 4.8, 674, 'Heritage'],

    ['a11', 'Monsoon Blues', 'Riya Desai', 'Contemporary', 'Watercolour', 15000, 20000,
     'The first rains of monsoon captured in flowing watercolour washes.',
     '22" x 16"',
     'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=600&q=80',
     '#5A8EC4', '#2D5B99', 1, 4.5, 428, ''],

    ['a12', 'Warli Village Scene', 'Mangesh Warli', 'Folk', 'Natural Pigments on Cloth', 6750, 15000,
     'Authentic Warli tribal art from Maharashtra.',
     '18" x 18"',
     'https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=600&q=80',
     '#8B7355', '#5A4A30', 4, 4.9, 1893, 'Folk'],
  ];

  const stmt = db.prepare(
    'INSERT OR IGNORE INTO artworks (id,title,artist,category,medium,price,mrp,description,dimensions,image_url,image_color,image_color2,stock,rating,reviews,badge) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  );
  arts.forEach(a => stmt.run(a));
  stmt.free();

  // Seed admin user
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('admin123', 10);
  db.run(
    "INSERT OR IGNORE INTO users (id,name,email,password,role) VALUES ('admin1','Admin User','admin@17arts.in','" + hash + "','admin')"
  );
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

module.exports = { getDb, query, run, saveDb };
