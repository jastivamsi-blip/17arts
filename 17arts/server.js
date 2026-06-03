require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { getDb, query, run } = require('./backend/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || '17arts_secret_key_2024';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/public')));

// ─── AUTH MIDDLEWARE ───────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  });
}

// ─── AUTH ROUTES ───────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const existing = query('SELECT id FROM users WHERE email=?', [email]);
  if (existing.length) return res.status(400).json({ error: 'Email already registered' });
  const hash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  run('INSERT INTO users (id,name,email,password,phone) VALUES (?,?,?,?,?)', [id, name, email, hash, phone || '']);
  const token = jwt.sign({ id, name, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id, name, email, role: 'user' } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const users = query('SELECT * FROM users WHERE email=?', [email]);
  if (!users.length) return res.status(401).json({ error: 'Invalid email or password' });
  const user = users[0];
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const users = query('SELECT id,name,email,role,phone,created_at FROM users WHERE id=?', [req.user.id]);
  res.json(users[0]);
});

app.put('/api/auth/profile', auth, (req, res) => {
  const { name, phone } = req.body;
  run('UPDATE users SET name=?,phone=? WHERE id=?', [name, phone, req.user.id]);
  res.json({ success: true });
});

// ─── ARTWORKS ─────────────────────────────────────────────────
app.get('/api/artworks', (req, res) => {
  const { category, search, sort, limit, offset } = req.query;
  let sql = 'SELECT * FROM artworks WHERE 1=1';
  const params = [];
  if (category && category !== 'All') { sql += ' AND category=?'; params.push(category); }
  if (search) { sql += ' AND (title LIKE ? OR artist LIKE ? OR category LIKE ?)'; const s = `%${search}%`; params.push(s, s, s); }
  if (sort === 'price_asc') sql += ' ORDER BY price ASC';
  else if (sort === 'price_desc') sql += ' ORDER BY price DESC';
  else if (sort === 'rating') sql += ' ORDER BY rating DESC';
  else if (sort === 'newest') sql += ' ORDER BY created_at DESC';
  else sql += ' ORDER BY reviews DESC';
  if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit)); }
  if (offset) { sql += ' OFFSET ?'; params.push(parseInt(offset)); }
  res.json(query(sql, params));
});

app.get('/api/artworks/:id', (req, res) => {
  const rows = query('SELECT * FROM artworks WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

app.post('/api/artworks', adminAuth, (req, res) => {
  const { title, artist, category, medium, price, mrp, description, dimensions, image_color, image_color2, stock, badge } = req.body;
  const id = uuidv4();
  run('INSERT INTO artworks (id,title,artist,category,medium,price,mrp,description,dimensions,image_color,image_color2,stock,badge) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [id, title, artist, category, medium, price, mrp||price, description||'', dimensions||'', image_color||'#C4A882', image_color2||'#8B6E4E', stock||1, badge||'']);
  res.json({ id, success: true });
});

app.put('/api/artworks/:id', adminAuth, (req, res) => {
  const { title, artist, category, medium, price, mrp, description, dimensions, stock, badge } = req.body;
  run('UPDATE artworks SET title=?,artist=?,category=?,medium=?,price=?,mrp=?,description=?,dimensions=?,stock=?,badge=? WHERE id=?',
    [title, artist, category, medium, price, mrp, description, dimensions, stock, badge, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/artworks/:id', adminAuth, (req, res) => {
  run('DELETE FROM artworks WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// ─── CART ──────────────────────────────────────────────────────
app.get('/api/cart', auth, (req, res) => {
  const rows = query(`SELECT c.id, c.quantity, a.* FROM cart c JOIN artworks a ON c.artwork_id=a.id WHERE c.user_id=?`, [req.user.id]);
  res.json(rows);
});

app.post('/api/cart', auth, (req, res) => {
  const { artwork_id, quantity = 1 } = req.body;
  const existing = query('SELECT id,quantity FROM cart WHERE user_id=? AND artwork_id=?', [req.user.id, artwork_id]);
  if (existing.length) {
    run('UPDATE cart SET quantity=? WHERE id=?', [existing[0].quantity + quantity, existing[0].id]);
  } else {
    run('INSERT INTO cart (id,user_id,artwork_id,quantity) VALUES (?,?,?,?)', [uuidv4(), req.user.id, artwork_id, quantity]);
  }
  res.json({ success: true });
});

app.put('/api/cart/:id', auth, (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) { run('DELETE FROM cart WHERE id=? AND user_id=?', [req.params.id, req.user.id]); }
  else { run('UPDATE cart SET quantity=? WHERE id=? AND user_id=?', [quantity, req.params.id, req.user.id]); }
  res.json({ success: true });
});

app.delete('/api/cart/:id', auth, (req, res) => {
  run('DELETE FROM cart WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── WISHLIST ─────────────────────────────────────────────────
app.get('/api/wishlist', auth, (req, res) => {
  const rows = query(`SELECT w.id, a.* FROM wishlist w JOIN artworks a ON w.artwork_id=a.id WHERE w.user_id=?`, [req.user.id]);
  res.json(rows);
});

app.post('/api/wishlist/:artwork_id', auth, (req, res) => {
  const existing = query('SELECT id FROM wishlist WHERE user_id=? AND artwork_id=?', [req.user.id, req.params.artwork_id]);
  if (existing.length) {
    run('DELETE FROM wishlist WHERE id=?', [existing[0].id]);
    res.json({ wishlisted: false });
  } else {
    run('INSERT INTO wishlist (id,user_id,artwork_id) VALUES (?,?,?)', [uuidv4(), req.user.id, req.params.artwork_id]);
    res.json({ wishlisted: true });
  }
});

// ─── ADDRESSES ────────────────────────────────────────────────
app.get('/api/addresses', auth, (req, res) => {
  res.json(query('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC', [req.user.id]));
});

app.post('/api/addresses', auth, (req, res) => {
  const { name, phone, line1, line2, city, state, pincode, is_default } = req.body;
  if (is_default) run('UPDATE addresses SET is_default=0 WHERE user_id=?', [req.user.id]);
  const id = uuidv4();
  run('INSERT INTO addresses (id,user_id,name,phone,line1,line2,city,state,pincode,is_default) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [id, req.user.id, name, phone, line1, line2||'', city, state, pincode, is_default ? 1 : 0]);
  res.json({ id, success: true });
});

app.delete('/api/addresses/:id', auth, (req, res) => {
  run('DELETE FROM addresses WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ─── ORDERS ───────────────────────────────────────────────────
app.get('/api/orders', auth, (req, res) => {
  const orders = query('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
  const result = orders.map(o => {
    const items = query(`SELECT oi.*, a.title, a.artist, a.image_color, a.image_color2 FROM order_items oi JOIN artworks a ON oi.artwork_id=a.id WHERE oi.order_id=?`, [o.id]);
    return { ...o, items };
  });
  res.json(result);
});

app.post('/api/orders', auth, (req, res) => {
  const { address_id, payment_method, items } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'No items' });
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const oid = uuidv4();
  run('INSERT INTO orders (id,user_id,total,status,payment_method,address_id) VALUES (?,?,?,?,?,?)',
    [oid, req.user.id, total, 'Processing', payment_method, address_id]);
  items.forEach(item => {
    run('INSERT INTO order_items (id,order_id,artwork_id,quantity,price) VALUES (?,?,?,?,?)',
      [uuidv4(), oid, item.artwork_id, item.quantity, item.price]);
  });
  run('DELETE FROM cart WHERE user_id=?', [req.user.id]);
  res.json({ order_id: oid, total, success: true });
});

// ─── ADMIN ────────────────────────────────────────────────────
app.get('/api/admin/orders', adminAuth, (req, res) => {
  const orders = query('SELECT o.*, u.name as user_name, u.email FROM orders o JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC');
  const result = orders.map(o => {
    const items = query(`SELECT oi.*, a.title FROM order_items oi JOIN artworks a ON oi.artwork_id=a.id WHERE oi.order_id=?`, [o.id]);
    return { ...o, items };
  });
  res.json(result);
});

app.put('/api/admin/orders/:id', adminAuth, (req, res) => {
  run('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id]);
  res.json({ success: true });
});

app.get('/api/admin/users', adminAuth, (req, res) => {
  res.json(query('SELECT id,name,email,role,phone,created_at FROM users ORDER BY created_at DESC'));
});

app.get('/api/admin/stats', adminAuth, (req, res) => {
  const artworks = query('SELECT COUNT(*) as count FROM artworks')[0].count;
  const users = query('SELECT COUNT(*) as count FROM users')[0].count;
  const orders = query('SELECT COUNT(*) as count FROM orders')[0].count;
  const revenue = query('SELECT COALESCE(SUM(total),0) as total FROM orders')[0].total;
  res.json({ artworks, users, orders, revenue });
});

// ─── PAGE ROUTES ──────────────────────────────────────────────
const pages = ['', 'collection', 'product', 'cart', 'checkout', 'signin', 'register',
  'profile', 'orders', 'wishlist', 'addresses', 'artists', 'about', 'contact', 'commission', 'admin'];

pages.forEach(p => {
  app.get(`/${p}`, (req, res) => res.sendFile(path.join(__dirname, 'frontend/public', p ? `${p}.html` : 'index.html')));
  app.get(`/${p}/*`, (req, res) => res.sendFile(path.join(__dirname, 'frontend/public', p ? `${p}.html` : 'index.html')));
});

// ─── START ────────────────────────────────────────────────────
async function start() {
  await getDb();
  app.listen(PORT, () => console.log(`17ARTS running at http://localhost:${PORT}`));
}
start();
