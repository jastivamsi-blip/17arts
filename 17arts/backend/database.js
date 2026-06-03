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
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, role TEXT DEFAULT 'user', phone TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS artworks (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, artist TEXT NOT NULL,
    category TEXT NOT NULL, medium TEXT, price REAL NOT NULL, mrp REAL,
    description TEXT, dimensions TEXT,
    image_color TEXT DEFAULT '#C4A882', image_color2 TEXT DEFAULT '#8B6E4E',
    stock INTEGER DEFAULT 1, rating REAL DEFAULT 4.5, reviews INTEGER DEFAULT 0,
    badge TEXT, created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS cart (
    id TEXT PRIMARY KEY, user_id TEXT, artwork_id TEXT, quantity INTEGER DEFAULT 1
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS wishlist (
    id TEXT PRIMARY KEY, user_id TEXT, artwork_id TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY, user_id TEXT, name TEXT, phone TEXT,
    line1 TEXT, line2 TEXT, city TEXT, state TEXT, pincode TEXT,
    is_default INTEGER DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, user_id TEXT, total REAL,
    status TEXT DEFAULT 'Processing', payment_method TEXT, address_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY, order_id TEXT, artwork_id TEXT, quantity INTEGER, price REAL
  )`);

  // Seed artworks
  const arts = [
    ['a1','Morning Raga','Meena Sharma','Traditional','Watercolour',25200,42000,'A serene depiction of dawn through classical Indian musical imagery. Painted with natural pigments on handmade paper.','24" x 18"','#C4A882','#8B6E4E',1,4.8,1240,'Bestseller'],
    ['a2','Urban Drift No. 7','Arjun Pillai','Contemporary','Acrylic on Canvas',48000,68500,'A bold exploration of city movement and modern Indian life. Vibrant acrylic layers on stretched canvas.','36" x 24"','#7B9EA6','#3D6B76',1,4.6,883,'New'],
    ['a3','Varanasi Ghat','Priya Nair','Heritage','Oil on Canvas',41250,55000,'Timeless ghats of Varanasi captured at golden hour. Rich oil textures evoke the spiritual essence of the city.','30" x 20"','#B5936B','#6B4423',1,4.9,2104,'Top Rated'],
    ['a4','Chromatic Sutras','Vivek Rao','Abstract','Mixed Media',84000,120000,'A meditation on colour, form and ancient scripture. Layered mixed media on board with gold leaf accents.','48" x 36"','#9B8EC4','#5A4B99',1,4.7,562,''],
    ['a5','Madhubani Garden','Sunita Devi','Folk','Natural Pigments',11700,18000,'Traditional Madhubani art from Bihar with intricate floral motifs and mythological narratives.','20" x 16"','#5DCAA5','#0F6E56',3,4.9,3467,'Folk'],
    ['a6','Rajput Procession','Ramesh Jangid','Traditional','Watercolour on Paper',18500,26000,'A detailed miniature painting depicting a royal Rajput procession with exquisite fine brushwork.','18" x 12"','#D4A882','#9B5E3E',2,4.9,1872,'Top Pick'],
    ['a7','Court of Akbar','Kavita Meena','Traditional','Gouache on Board',32000,45000,'A faithful recreation of Mughal court life, rendered in traditional gouache with fine gold detailing.','24" x 18"','#C4A060','#7B4020',1,4.7,943,''],
    ['a8','Kerala Backwaters','Thomas Varghese','Contemporary','Oil on Canvas',22000,40000,'Atmospheric dusk over the Kerala backwaters. Soft palette knife work captures the still, golden light.','30" x 20"','#7B9EA6','#2D5C6B',1,4.6,671,'Sale'],
    ['a9','Geometric Mandala III','Aditi Shah','Abstract','Acrylic on Canvas',8800,22000,'Precision geometric mandala drawn with ruler and compass, then filled with vibrant acrylics.','20" x 20"','#9B8EC4','#5A4B99',5,4.8,2310,'60% Off'],
    ['a10','Phad Scroll Painting','Shanti Lal','Folk','Mineral Pigments',12800,16000,'A traditional Phad scroll from Rajasthan depicting the tale of Pabuji. Hand-painted on cotton cloth.','72" x 24"','#B5936B','#7B3A10',2,4.8,674,'Heritage'],
    ['a11','Monsoon Blues','Riya Desai','Contemporary','Watercolour',15000,20000,'The first rains of monsoon captured in flowing watercolour washes. Evocative and atmospheric.','22" x 16"','#5A8EC4','#2D5B99',1,4.5,428,''],
    ['a12','Warli Village Scene','Mangesh Warli','Folk','Natural Pigments on Cloth',6750,15000,'Authentic Warli tribal art from Maharashtra depicting daily village life and community celebrations.','18" x 18"','#8B7355','#5A4A30',4,4.9,1893,'Folk'],
  ];
  const stmt = db.prepare('INSERT OR IGNORE INTO artworks (id,title,artist,category,medium,price,mrp,description,dimensions,image_color,image_color2,stock,rating,reviews,badge) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  arts.forEach(a => stmt.run(a));
  stmt.free();

  // Admin user
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('admin123', 10);
  db.run("INSERT OR IGNORE INTO users (id,name,email,password,role) VALUES ('admin1','Admin User','admin@17arts.in','" + hash + "','admin')");
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
