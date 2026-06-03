// ── API BASE ──────────────────────────────────────────────────
const API = '/api';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(API + endpoint, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── AUTH ──────────────────────────────────────────────────────
const Auth = {
  getUser() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } },
  getToken() { return localStorage.getItem('token'); },
  isLoggedIn() { return !!this.getToken(); },
  isAdmin() { const u = this.getUser(); return u && u.role === 'admin'; },
  setSession(token, user) { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); },
  logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/signin'; },
};

// ── TOAST ─────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const el = document.getElementById('toast') || createToast();
  el.textContent = msg;
  el.style.display = 'block';
  el.style.borderLeftColor = type === 'error' ? '#E24B4A' : type === 'info' ? '#3B82F6' : '#B8972A';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.display = 'none', 3000);
}
function createToast() {
  const el = document.createElement('div');
  el.id = 'toast';
  el.style.cssText = 'position:fixed;bottom:80px;right:20px;background:#0E1B2E;color:#fff;padding:12px 18px;border-radius:8px;font-size:13px;z-index:9999;border-left:3px solid #B8972A;max-width:300px;box-shadow:0 8px 32px rgba(0,0,0,0.12);font-family:Inter,sans-serif';
  document.body.appendChild(el);
  return el;
}

// ── CART COUNT ────────────────────────────────────────────────
async function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (!el) return;
  if (!Auth.isLoggedIn()) { el.textContent = '0'; return; }
  try {
    const items = await apiFetch('/cart');
    const count = items.reduce((s, i) => s + i.quantity, 0);
    el.textContent = count;
    el.style.display = count > 0 ? 'block' : 'none';
  } catch {}
}

async function updateWishCount() {
  const el = document.getElementById('wish-count');
  if (!el) return;
  if (!Auth.isLoggedIn()) { el.style.display = 'none'; return; }
  try {
    const items = await apiFetch('/wishlist');
    el.textContent = items.length;
    el.style.display = items.length > 0 ? 'block' : 'none';
  } catch {}
}

// ── ADD TO CART ───────────────────────────────────────────────
async function addToCart(artwork_id, qty = 1) {
  if (!Auth.isLoggedIn()) { toast('Please sign in to add to cart', 'info'); setTimeout(() => window.location.href = '/signin', 1000); return; }
  try {
    await apiFetch('/cart', { method: 'POST', body: { artwork_id, quantity: qty } });
    toast('Added to cart!');
    updateCartCount();
  } catch (e) { toast(e.message, 'error'); }
}

// ── WISHLIST ─────────────────────────────────────────────────
async function toggleWishlist(artwork_id, btn) {
  if (!Auth.isLoggedIn()) { toast('Please sign in', 'info'); return; }
  try {
    const r = await apiFetch(`/wishlist/${artwork_id}`, { method: 'POST' });
    if (btn) { btn.classList.toggle('liked', r.wishlisted); }
    toast(r.wishlisted ? 'Added to wishlist' : 'Removed from wishlist');
    updateWishCount();
  } catch (e) { toast(e.message, 'error'); }
}

// ── ART THUMB ─────────────────────────────────────────────────
function artThumb(a, size = 90) {
  return `<div style="width:${size}px;height:${size}px;border-radius:6px;background:linear-gradient(135deg,${a.image_color},${a.image_color2});flex-shrink:0"></div>`;
}

function artThumbLg(a) {
  return `<div style="width:100%;padding-bottom:100%;position:relative;border-radius:8px;overflow:hidden"><div style="position:absolute;inset:0;background:linear-gradient(135deg,${a.image_color},${a.image_color2})"></div></div>`;
}

// ── PRODUCT CARD ─────────────────────────────────────────────
function prodCard(a, wishSet = new Set()) {
  const disc = a.mrp > a.price ? Math.round((1 - a.price / a.mrp) * 100) : 0;
  const liked = wishSet.has(a.id);
  return `
  <div class="prod-card" onclick="window.location.href='/product?id=${a.id}'">
    <div class="prod-img">
      <div class="art-thumb" style="background:linear-gradient(135deg,${a.image_color},${a.image_color2})"></div>
      ${a.badge ? `<div class="prod-badge ${a.badge.includes('off')||a.badge==='Sale'?'badge-deal':a.badge==='New'?'badge-new':'badge-top'}">${a.badge}</div>` : ''}
      <button class="wish-btn ${liked ? 'liked' : ''}" onclick="event.stopPropagation();toggleWishlist('${a.id}',this)" aria-label="Wishlist">
        <i class="ti ti-heart" aria-hidden="true"></i>
      </button>
    </div>
    <div class="prod-body">
      <div class="prod-cat">${a.category}</div>
      <div class="prod-name">${a.title}</div>
      <div class="prod-artist">by ${a.artist}</div>
      <div class="stars-row">
        <span class="star-badge"><i class="ti ti-star" style="font-size:9px" aria-hidden="true"></i> ${a.rating}</span>
        <span class="review-ct">(${Number(a.reviews).toLocaleString()})</span>
      </div>
      <div class="price-row">
        <span class="price">₹${Number(a.price).toLocaleString()}</span>
        ${disc > 0 ? `<span class="mrp">₹${Number(a.mrp).toLocaleString()}</span><span class="off">${disc}% off</span>` : ''}
      </div>
      <div class="delivery"><i class="ti ti-truck" style="font-size:11px;vertical-align:-1px" aria-hidden="true"></i> Free delivery</div>
      <button class="btn-cart" onclick="event.stopPropagation();addToCart('${a.id}')">Add to Cart</button>
    </div>
  </div>`;
}

// ── NAVBAR HTML ───────────────────────────────────────────────
function renderNavbar(activePage = '') {
  const user = Auth.getUser();
  return `
  <nav class="topbar">
    <div class="logo" onclick="window.location.href='/'">
      <svg viewBox="0 0 30 30" fill="none">
        <path d="M15 1.5L26 6.5L29 17L23 27L15 29L7 27L1 17L4 6.5Z" stroke="#B8972A" stroke-width="1" fill="none" opacity="0.6"/>
        <path d="M15 8L20.5 15L15 22L9.5 15Z" stroke="#D4AF5A" stroke-width="0.8" fill="none"/>
        <circle cx="15" cy="15" r="2" fill="#D4AF5A"/>
      </svg>
      <div class="logo-text"><span class="n">17ARTS</span><span class="a">India's Art Store</span></div>
    </div>
    <div class="searchbar">
      <select id="search-cat"><option value="">All Categories</option><option>Traditional</option><option>Contemporary</option><option>Heritage</option><option>Abstract</option><option>Folk</option></select>
      <input type="text" id="search-input" placeholder="Search artworks, artists, styles…" onkeydown="if(event.key==='Enter')doSearch()">
      <button onclick="doSearch()" aria-label="Search"><i class="ti ti-search" aria-hidden="true"></i></button>
    </div>
    <div class="top-actions">
      ${user ? `
      <button class="top-btn" onclick="window.location.href='/profile'">
        <i class="ti ti-user" style="font-size:18px;color:rgba(255,255,255,0.7)" aria-hidden="true"></i>
        <span class="lbl">Hello, ${user.name.split(' ')[0]}</span>
        <span class="val">Account</span>
      </button>` : `
      <button class="top-btn" onclick="window.location.href='/signin'">
        <i class="ti ti-user" style="font-size:18px;color:rgba(255,255,255,0.7)" aria-hidden="true"></i>
        <span class="lbl">Hello, Guest</span>
        <span class="val">Sign In</span>
      </button>`}
      <button class="top-btn" onclick="window.location.href='/wishlist'" style="position:relative">
        <i class="ti ti-heart" style="font-size:18px;color:rgba(255,255,255,0.7)" aria-hidden="true"></i>
        <span id="wish-count" class="badge" style="display:none">0</span>
        <span class="lbl">Wishlist</span>
      </button>
      <button class="top-btn" onclick="window.location.href='/cart'" style="position:relative">
        <i class="ti ti-shopping-cart" style="font-size:20px;color:#D4AF5A" aria-hidden="true"></i>
        <span id="cart-count" class="badge" style="display:none">0</span>
        <span class="lbl">Cart</span>
      </button>
    </div>
  </nav>
  <div class="navstrip">
    <div class="nav-item all" onclick="window.location.href='/collection'"><i class="ti ti-menu-2" style="font-size:13px;margin-right:4px" aria-hidden="true"></i> All</div>
    <div class="nav-item ${activePage==='deals'?'active':''}" onclick="">Today's Deals</div>
    <div class="nav-item" onclick="window.location.href='/collection?cat=Traditional'">Traditional Art</div>
    <div class="nav-item" onclick="window.location.href='/collection?cat=Contemporary'">Contemporary</div>
    <div class="nav-item" onclick="window.location.href='/collection?cat=Heritage'">Heritage & Folk</div>
    <div class="nav-item" onclick="window.location.href='/collection?cat=Abstract'">Abstract</div>
    <div class="nav-item" onclick="window.location.href='/commission'">Commission</div>
    <div class="nav-item" onclick="window.location.href='/artists'">Artists</div>
    <div class="nav-item" onclick="window.location.href='/about'">About</div>
    <div class="nav-item" onclick="window.location.href='/contact'">Contact</div>
    ${Auth.isAdmin() ? `<div class="nav-item" style="color:#D4AF5A;font-weight:600" onclick="window.location.href='/admin'"><i class="ti ti-shield" style="font-size:12px;margin-right:3px" aria-hidden="true"></i> Admin</div>` : ''}
  </div>`;
}

function doSearch() {
  const q = document.getElementById('search-input')?.value || '';
  const cat = document.getElementById('search-cat')?.value || '';
  let url = '/collection?';
  if (q) url += `search=${encodeURIComponent(q)}&`;
  if (cat) url += `cat=${encodeURIComponent(cat)}`;
  window.location.href = url;
}

// ── FOOTER HTML ───────────────────────────────────────────────
function renderFooter() {
  return `
  <footer class="footer">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="ft">17ARTS</div>
        <p>India's premier art marketplace. Connecting collectors with extraordinary artworks from celebrated Indian artists since 2020.<br><br>📞 +91 9014422656<br>✉ support@17arts.in<br>📍 Hyderabad, Telangana</p>
      </div>
      <div class="footer-col"><h4>Shop</h4>
        <a onclick="window.location.href='/collection?cat=Traditional'">Traditional Art</a>
        <a onclick="window.location.href='/collection?cat=Contemporary'">Contemporary</a>
        <a onclick="window.location.href='/collection?cat=Heritage'">Heritage & Folk</a>
        <a onclick="window.location.href='/collection?cat=Abstract'">Abstract</a>
        <a onclick="window.location.href='/commission'">Commission Art</a>
      </div>
      <div class="footer-col"><h4>Account</h4>
        <a onclick="window.location.href='/signin'">Sign In / Register</a>
        <a onclick="window.location.href='/orders'">My Orders</a>
        <a onclick="window.location.href='/wishlist'">Wishlist</a>
        <a onclick="window.location.href='/addresses'">Saved Addresses</a>
        <a onclick="window.location.href='/profile'">My Profile</a>
      </div>
      <div class="footer-col"><h4>Company</h4>
        <a onclick="window.location.href='/about'">About 17ARTS</a>
        <a onclick="window.location.href='/artists'">Featured Artists</a>
        <a onclick="window.location.href='/contact'">Contact Us</a>
        <a>Privacy Policy</a>
        <a>Terms of Service</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">© 2026 17ARTS. All rights reserved. Hyderabad, India.</div>
      <div class="trust-row">
        <div class="trust-badge"><i class="ti ti-lock" style="font-size:11px" aria-hidden="true"></i> SSL Secured</div>
        <div class="trust-badge"><i class="ti ti-shield-check" style="font-size:11px" aria-hidden="true"></i> Authentic Art</div>
        <div class="trust-badge"><i class="ti ti-credit-card" style="font-size:11px" aria-hidden="true"></i> Safe Pay</div>
      </div>
    </div>
  </footer>`;
}

// init navbar counters
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  updateWishCount();
});
